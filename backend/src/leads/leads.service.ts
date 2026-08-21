import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ActivityType,
  LeadSource,
  LeadStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CaptureLeadDto } from './dto/capture-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { CreateActivityDto } from './dto/create-activity.dto';
import { QueryLeadsDto } from './dto/query-leads.dto';
import { scoreLead } from './lead-scoring';
import { Actor, canSeeAllLeads } from '../common/access';
import { toDateOrNull } from '../common/dates';
import { AttributionService } from '../attribution/attribution.service';

/** Extra request context the controller extracts (not client-supplied). */
export interface CaptureContext {
  ipAddress?: string;
  userAgent?: string;
  device?: string;
}

const DEDUPE_WINDOW_DAYS = 30;

@Injectable()
export class LeadsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly attribution: AttributionService,
  ) {}

  /**
   * Sales execs may only touch leads assigned to them.
   * 404 (not 403) so they cannot probe which lead ids exist.
   */
  private assertCanTouch(lead: { assignedToId: string | null }, actor: Actor) {
    if (canSeeAllLeads(actor.role)) return;
    if (lead.assignedToId !== actor.id) {
      throw new NotFoundException('Lead not found');
    }
  }

  /** Normalise a phone to digits so "+91 98184 34726" == "9818434726". */
  private normalisePhone(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    return digits.length > 10 ? digits.slice(-10) : digits;
  }

  async capture(dto: CaptureLeadDto, ctx: CaptureContext) {
    // Load the visit early so its stored attribution wins over anything the
    // form fields might carry — the URL had ground truth, form values can be
    // spoofed with copy-paste. `pick` is DTO-first, visit-fallback.
    const visit = dto.visitId
      ? await this.attribution.findVisit(dto.visitId)
      : null;
    // DTO-first, visit-fallback. Typed loose on purpose — both sides share the
    // same attribution field names, but they live on different types.
    const v = visit as any;
    const pick = (key: string): string | null | undefined =>
      (dto as any)[key] ?? (v ? v[key] : undefined);

    const phoneKey = this.normalisePhone(dto.phone);
    const since = new Date();
    since.setDate(since.getDate() - DEDUPE_WINDOW_DAYS);

    // --- dedupe: same phone inside the window is a RE-ENQUIRY, not a new lead
    const existing = await this.prisma.lead.findFirst({
      where: { phone: { endsWith: phoneKey }, createdAt: { gte: since } },
      orderBy: { createdAt: 'desc' },
    });

    if (existing) {
      const enquiryCount = existing.enquiryCount + 1;
      const { score, notes } = scoreLead({
        source: existing.source,
        email: dto.email ?? existing.email,
        message: dto.message ?? existing.message,
        destination: dto.destination ?? existing.destination,
        travelDate: existing.travelDate,
        budget: dto.budget ?? existing.budget,
        adults: dto.adults ?? existing.adults,
        gclid: dto.gclid ?? existing.gclid,
        fbclid: dto.fbclid ?? existing.fbclid,
        enquiryCount,
      });

      const updated = await this.prisma.lead.update({
        where: { id: existing.id },
        data: {
          enquiryCount,
          score,
          scoreNotes: notes,
          // fill blanks only — never overwrite what staff already corrected
          email: existing.email ?? dto.email ?? null,
          destination: existing.destination ?? dto.destination ?? null,
          message: existing.message ?? dto.message ?? null,
        },
      });

      await this.prisma.activity.create({
        data: {
          leadId: existing.id,
          type: ActivityType.RE_ENQUIRY,
          content:
            `Re-enquiry #${enquiryCount} from ${dto.source ?? 'unknown source'}` +
            (dto.landingPage ? ` via ${dto.landingPage}` : '') +
            (dto.message ? ` — "${dto.message.slice(0, 200)}"` : ''),
        },
      });

      return { duplicate: true, leadId: updated.id, score: updated.score };
    }

    // --- new lead
    const { score, notes } = scoreLead({
      source: dto.source,
      email: dto.email,
      message: dto.message,
      destination: dto.destination,
      travelDate: dto.travelDate ? new Date(dto.travelDate) : null,
      budget: dto.budget,
      adults: dto.adults,
      gclid: dto.gclid,
      fbclid: dto.fbclid,
      enquiryCount: 1,
    });

    const lead = await this.prisma.lead.create({
      data: {
        name: dto.name,
        phone: dto.phone,
        email: dto.email ?? null,
        city: dto.city ?? null,
        country: dto.country ?? null,
        destination: dto.destination ?? null,
        travelDate: dto.travelDate ? new Date(dto.travelDate) : null,
        nights: dto.nights ?? null,
        adults: dto.adults ?? null,
        children: dto.children ?? null,
        budget: dto.budget ?? null,
        message: dto.message ?? null,
        source: dto.source ?? LeadSource.OTHER,
        status: LeadStatus.NEW,
        score,
        scoreNotes: notes,
        utmSource: pick('utmSource') ?? null,
        utmMedium: pick('utmMedium') ?? null,
        utmCampaign: pick('utmCampaign') ?? null,
        utmTerm: pick('utmTerm') ?? null,
        utmContent: pick('utmContent') ?? null,
        gclid: pick('gclid') ?? null,
        fbclid: pick('fbclid') ?? null,
        landingPage: dto.landingPage ?? visit?.pagePath ?? null,
        referrer: pick('referrer') ?? null,
        keyword: pick('keyword') ?? null,
        device: ctx.device ?? visit?.device ?? null,
        userAgent: ctx.userAgent ?? visit?.userAgent ?? null,
        ipAddress: ctx.ipAddress ?? visit?.ipAddress ?? null,
        visitId: visit?.id ?? null,
      },
    });

    await this.prisma.activity.create({
      data: {
        leadId: lead.id,
        type: ActivityType.SYSTEM,
        content: `Lead captured from ${lead.source}${
          dto.landingPage ? ` (${dto.landingPage})` : ''
        }. Score ${score} [${notes}]`,
      },
    });

    return { duplicate: false, leadId: lead.id, score };
  }

  /**
   * Manual add by a logged-in operator (phone-in, walk-in, forwarded WhatsApp).
   * Runs through the same capture pipeline so dedupe, scoring and the timeline
   * work identically. Two differences from the public route:
   *   - defaults source to PHONE instead of OTHER (the common case)
   *   - assigns to the caller if the lead is brand new (not a re-enquiry),
   *     so it doesn't land in the unassigned bucket the operator will then
   *     have to claim in a second click.
   */
  async manualCreate(dto: CaptureLeadDto, actor: Actor) {
    const source = dto.source ?? ('PHONE' as any);
    const result = await this.capture({ ...dto, source }, {});

    if (!result.duplicate) {
      await this.prisma.lead.update({
        where: { id: result.leadId },
        data: { assignedToId: actor.id },
      });
      await this.prisma.activity.create({
        data: {
          leadId: result.leadId,
          userId: actor.id,
          type: 'SYSTEM' as any,
          content: `Added manually by ${actor.id}, auto-assigned`,
        },
      });
    }

    return result;
  }

  async findAll(q: QueryLeadsDto, actor: Actor) {
    const page = q.page ?? 1;
    const limit = q.limit ?? 25;

    const where: Prisma.LeadWhereInput = {};

    // Sales execs are hard-scoped to their own leads — a query param
    // cannot widen this.
    if (!canSeeAllLeads(actor.role)) {
      where.assignedToId = actor.id;
    } else if (q.assignedToId) {
      where.assignedToId = q.assignedToId;
    }

    if (q.status) where.status = q.status;
    if (q.source) where.source = q.source;
    if (q.from || q.to) {
      where.createdAt = {};
      if (q.from) where.createdAt.gte = new Date(q.from);
      if (q.to) where.createdAt.lte = new Date(q.to);
    }
    if (q.search) {
      where.OR = [
        { name: { contains: q.search, mode: 'insensitive' } },
        { phone: { contains: q.search } },
        { email: { contains: q.search, mode: 'insensitive' } },
        { destination: { contains: q.search, mode: 'insensitive' } },
      ];
    }

    const [total, data] = await Promise.all([
      this.prisma.lead.count({ where }),
      this.prisma.lead.findMany({
        where,
        orderBy: [{ score: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
        include: {
          assignedTo: { select: { id: true, name: true, email: true } },
        },
      }),
    ]);

    return { total, page, limit, pages: Math.ceil(total / limit), data };
  }

  async findOne(id: string, actor: Actor) {
    const lead = await this.prisma.lead.findUnique({
      where: { id },
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        activities: {
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { id: true, name: true } } },
        },
      },
    });
    if (!lead) throw new NotFoundException('Lead not found');
    this.assertCanTouch(lead, actor);
    return lead;
  }

  async update(id: string, dto: UpdateLeadDto, actor: Actor) {
    const actorId = actor.id;
    const lead = await this.prisma.lead.findUnique({ where: { id } });
    if (!lead) throw new NotFoundException('Lead not found');
    this.assertCanTouch(lead, actor);

    // Execs must not reassign leads away from themselves.
    if (!canSeeAllLeads(actor.role) && dto.assignedToId !== undefined) {
      throw new ForbiddenException('You cannot reassign leads');
    }

    const data: Prisma.LeadUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.phone !== undefined) data.phone = dto.phone;
    if (dto.email !== undefined) data.email = dto.email;
    if (dto.destination !== undefined) data.destination = dto.destination;
    if (dto.nights !== undefined) data.nights = dto.nights;
    if (dto.adults !== undefined) data.adults = dto.adults;
    if (dto.children !== undefined) data.children = dto.children;
    if (dto.budget !== undefined) data.budget = dto.budget;
    if (dto.lostReason !== undefined) data.lostReason = dto.lostReason;
    if (dto.travelDate !== undefined)
      data.travelDate = toDateOrNull(dto.travelDate);
    if (dto.nextFollowUp !== undefined)
      data.nextFollowUp = toDateOrNull(dto.nextFollowUp);
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.assignedToId !== undefined) {
      data.assignedTo = dto.assignedToId
        ? { connect: { id: dto.assignedToId } }
        : { disconnect: true };
    }

    const updated = await this.prisma.lead.update({ where: { id }, data });

    // audit trail: status + assignment changes are logged automatically
    if (dto.status !== undefined && dto.status !== lead.status) {
      await this.prisma.activity.create({
        data: {
          leadId: id,
          userId: actorId ?? null,
          type: ActivityType.STATUS_CHANGE,
          content: `Status ${lead.status} -> ${dto.status}${
            dto.lostReason ? ` (${dto.lostReason})` : ''
          }`,
        },
      });
    }
    if (
      dto.assignedToId !== undefined &&
      dto.assignedToId !== lead.assignedToId
    ) {
      await this.prisma.activity.create({
        data: {
          leadId: id,
          userId: actorId ?? null,
          type: ActivityType.ASSIGNMENT,
          content: dto.assignedToId
            ? `Assigned to user ${dto.assignedToId}`
            : 'Unassigned',
        },
      });
    }

    return updated;
  }

  /**
   * Soft-close a lead — status → LOST with a system reason. We never destroy
   * the row: it may have bookings, activities and attribution attached that
   * accountants and marketing still need.
   */
  async deactivate(id: string, actor: Actor, reason: string) {
    const lead = await this.prisma.lead.findUnique({ where: { id } });
    if (!lead) throw new NotFoundException('Lead not found');
    this.assertCanTouch(lead, actor);

    if (lead.status === LeadStatus.LOST) return { id, alreadyClosed: true };

    await this.prisma.lead.update({
      where: { id },
      data: {
        status: LeadStatus.LOST,
        lostReason: reason,
      },
    });
    await this.prisma.activity.create({
      data: {
        leadId: id,
        userId: actor.id ?? null,
        type: ActivityType.STATUS_CHANGE,
        content: `Status ${lead.status} -> LOST (Reason: ${reason})`,
      },
    });
    return { id, closed: true };
  }

  async addActivity(leadId: string, dto: CreateActivityDto, actor: Actor) {
    const actorId = actor.id;
    const lead = await this.prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) throw new NotFoundException('Lead not found');
    this.assertCanTouch(lead, actor);

    const contactTypes: ActivityType[] = [
      ActivityType.CALL,
      ActivityType.WHATSAPP,
      ActivityType.EMAIL,
      ActivityType.MEETING,
    ];
    const type = dto.type ?? ActivityType.NOTE;

    if (contactTypes.includes(type)) {
      await this.prisma.lead.update({
        where: { id: leadId },
        data: {
          lastContact: new Date(),
          ...(lead.firstContactAt ? {} : { firstContactAt: new Date() }),
        },
      });
    }

    return this.prisma.activity.create({
      data: { leadId, userId: actorId ?? null, type, content: dto.content },
      include: { user: { select: { id: true, name: true } } },
    });
  }

  async stats(actor: Actor) {
    const scope: Prisma.LeadWhereInput = canSeeAllLeads(actor.role)
      ? {}
      : { assignedToId: actor.id };

    const [byStatus, bySource, total, unassigned] = await Promise.all([
      this.prisma.lead.groupBy({
        by: ['status'],
        where: scope,
        _count: { _all: true },
      }),
      this.prisma.lead.groupBy({
        by: ['source'],
        where: scope,
        _count: { _all: true },
      }),
      this.prisma.lead.count({ where: scope }),
      this.prisma.lead.count({ where: { ...scope, assignedToId: null } }),
    ]);

    return {
      total,
      unassigned,
      byStatus: byStatus.map((r) => ({
        status: r.status,
        count: r._count._all,
      })),
      bySource: bySource.map((r) => ({
        source: r.source,
        count: r._count._all,
      })),
    };
  }

  /**
   * Bulk reassign N leads to one user (or unassign with null). Writes one
   * ASSIGNMENT activity per lead so the audit trail matches single-lead edits.
   * Idempotent — leads already on the target user are counted as skipped.
   */
  async bulkAssign(
    leadIds: string[],
    assignedToId: string | null,
    actor: Actor,
  ) {
    // Validate target exists (avoid setting to a stale user id)
    if (assignedToId) {
      const target = await this.prisma.user.findUnique({
        where: { id: assignedToId },
        select: { id: true, isActive: true, name: true },
      });
      if (!target || !target.isActive) {
        throw new NotFoundException('Target user not found or inactive');
      }
    }

    const before = await this.prisma.lead.findMany({
      where: { id: { in: leadIds } },
      select: { id: true, assignedToId: true },
    });
    const changed = before.filter((l) => l.assignedToId !== assignedToId);
    const skippedSameOwner = before.length - changed.length;
    const missing = leadIds.length - before.length;

    if (changed.length === 0) {
      return { updated: 0, skippedSameOwner, missing };
    }

    await this.prisma.lead.updateMany({
      where: { id: { in: changed.map((l) => l.id) } },
      data: { assignedToId },
    });

    // One activity per lead so the timeline reflects the reassignment.
    await this.prisma.activity.createMany({
      data: changed.map((l) => ({
        leadId: l.id,
        userId: actor.id ?? null,
        type: ActivityType.ASSIGNMENT,
        content: assignedToId
          ? `Bulk-assigned to user ${assignedToId}`
          : 'Bulk-unassigned',
      })),
    });

    return { updated: changed.length, skippedSameOwner, missing };
  }

  /**
   * Worklist for the /follow-ups page. Returns leads with `nextFollowUp`
   * set to today or earlier (so they must be actioned today) plus a small
   * "upcoming this week" bucket so ops can plan ahead.
   *
   * Scoped per role — sales execs only see their own queue.
   */
  async followUps(actor: Actor) {
    const scope: Prisma.LeadWhereInput = canSeeAllLeads(actor.role)
      ? {}
      : { assignedToId: actor.id };

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);
    const endOfWeek = new Date(startOfDay);
    endOfWeek.setDate(endOfWeek.getDate() + 7);

    const active = {
      status: {
        notIn: [
          LeadStatus.CONFIRMED,
          LeadStatus.LOST,
          LeadStatus.CANCELLED,
        ],
      },
    };

    const [overdue, dueToday, upcoming] = await Promise.all([
      this.prisma.lead.findMany({
        where: { ...scope, ...active, nextFollowUp: { lt: startOfDay } },
        orderBy: { nextFollowUp: 'asc' },
        include: { assignedTo: { select: { id: true, name: true } } },
        take: 200,
      }),
      this.prisma.lead.findMany({
        where: {
          ...scope, ...active,
          nextFollowUp: { gte: startOfDay, lt: endOfDay },
        },
        orderBy: { nextFollowUp: 'asc' },
        include: { assignedTo: { select: { id: true, name: true } } },
        take: 200,
      }),
      this.prisma.lead.findMany({
        where: {
          ...scope, ...active,
          nextFollowUp: { gte: endOfDay, lt: endOfWeek },
        },
        orderBy: { nextFollowUp: 'asc' },
        include: { assignedTo: { select: { id: true, name: true } } },
        take: 200,
      }),
    ]);

    return { overdue, dueToday, upcoming };
  }

  /**
   * Global search — leads only. Bookings/vendors/itineraries each have their
   * own search endpoints; the ⌘K palette calls them in parallel.
   */
  async searchLeads(actor: Actor, q: string) {
    const scope: Prisma.LeadWhereInput = canSeeAllLeads(actor.role)
      ? {}
      : { assignedToId: actor.id };
    return this.prisma.lead.findMany({
      where: {
        ...scope,
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { phone: { contains: q } },
          { email: { contains: q, mode: 'insensitive' } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 8,
      select: { id: true, name: true, phone: true, status: true },
    });
  }

  /**
   * Operational dashboard metrics — what the ops floor should see when they
   * log in. Deliberately distinct from `stats`, which is the pipeline shape
   * used on the finance page and lead-list header.
   *
   * Cost-per-lead uses today's AdSpend across all channels divided by today's
   * lead count. Zero-denominator returns null (not zero) so the UI can render
   * "—" instead of a misleading ₹0.
   */
  async opsStats(actor: Actor) {
    const scope: Prisma.LeadWhereInput = canSeeAllLeads(actor.role)
      ? {}
      : { assignedToId: actor.id };

    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const startOfYesterday = new Date(startOfDay);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);
    const endOfYesterday = new Date(startOfDay);

    // Week starts Monday (Indian workweek convention).
    const startOfWeek = new Date(startOfDay);
    const day = startOfWeek.getDay(); // 0=Sun, 1=Mon, ...
    const daysSinceMonday = (day + 6) % 7;
    startOfWeek.setDate(startOfWeek.getDate() - daysSinceMonday);

    const [
      leadsToday,
      leadsThisWeek,
      unassigned,
      overdueFollowUps,
      dueTodayFollowUps,
      yesterdaySpendRows,
      newLeadsYesterday,
      itinerariesAwaitingPricing,
    ] = await Promise.all([
      this.prisma.lead.count({
        where: { ...scope, createdAt: { gte: startOfDay, lt: endOfDay } },
      }),
      this.prisma.lead.count({
        where: { ...scope, createdAt: { gte: startOfWeek } },
      }),
      this.prisma.lead.count({ where: { ...scope, assignedToId: null } }),
      this.prisma.lead.count({
        where: {
          ...scope,
          nextFollowUp: { lt: startOfDay },
          status: {
            notIn: [
              LeadStatus.CONFIRMED,
              LeadStatus.LOST,
              LeadStatus.CANCELLED,
            ],
          },
        },
      }),
      this.prisma.lead.count({
        where: {
          ...scope,
          nextFollowUp: { gte: startOfDay, lt: endOfDay },
        },
      }),
      // AdSpend not scoped by actor — spend is agency-wide.
      this.prisma.adSpend.aggregate({
        where: { spendDate: { gte: startOfYesterday, lt: endOfYesterday } },
        _sum: { amount: true },
      }),
      this.prisma.lead.count({
        where: { createdAt: { gte: startOfYesterday, lt: endOfYesterday } },
      }),
      this.prisma.itinerary.count({
        where: {
          days: {
            some: {
              items: {
                some: { pricing: { none: {} } },
              },
            },
          },
        },
      }),
    ]);

    // AdSpend.amount is paise; divide by 100 to compare with lead-count in ₹.
    const spendYesterday = (yesterdaySpendRows._sum.amount ?? 0) / 100;
    const costPerLeadYesterday = newLeadsYesterday > 0 ? Math.round(spendYesterday / newLeadsYesterday) : null;

    return {
      leadsToday,
      leadsThisWeek,
      unassigned,
      overdueFollowUps,
      dueTodayFollowUps,
      itinerariesAwaitingPricing,
      spendYesterday: Math.round(spendYesterday),
      costPerLeadYesterday,
    };
  }
}
