import { Injectable, NotFoundException } from '@nestjs/common';
import { AdChannel, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLandingPageDto } from './dto/create-landing-page.dto';
import { UpdateLandingPageDto } from './dto/update-landing-page.dto';
import { TrackVisitDto } from './dto/track-visit.dto';
import { CreateAdSpendDto } from './dto/create-ad-spend.dto';
import { UpdateAdSpendDto } from './dto/update-ad-spend.dto';
import { toDateOrNull } from '../common/dates';
import { SyncGoogleAdsDto } from './dto/sync-google-ads.dto';
import { GoogleAdsService, SyncResult } from './google-ads.service';
import { isoDay, lookbackWindow } from './google-ads-mapping';

/** Extra request context the controller extracts (never client-supplied). */
export interface VisitContext {
  ipAddress?: string;
  userAgent?: string;
  device?: string;
}

/** Midnight-UTC floor. Every AdSpend row keys on this to make aggregations sane. */
function dayKey(input: Date | string): Date {
  const d = input instanceof Date ? new Date(input.getTime()) : new Date(input);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

@Injectable()
export class AttributionService {
  /**
   * How many days back the scheduled sync re-pulls.
   *
   * Google restates cost and conversion figures for several days after the
   * fact, so pulling only yesterday would freeze in numbers that are still
   * moving. Seven days is comfortably past the restatement window and, because
   * the sync is keyed on (externalSource, externalId), re-pulling is an update
   * rather than a duplicate.
   */
  static readonly SYNC_LOOKBACK_DAYS = 7;

  constructor(
    private readonly prisma: PrismaService,
    private readonly googleAds: GoogleAdsService,
  ) {}

  // ==========================================================================
  // Landing pages
  // ==========================================================================

  createLandingPage(dto: CreateLandingPageDto) {
    return this.prisma.landingPage.create({ data: { ...dto } });
  }

  listLandingPages() {
    return this.prisma.landingPage.findMany({
      orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
    });
  }

  async findLandingPage(id: string) {
    const page = await this.prisma.landingPage.findUnique({ where: { id } });
    if (!page) throw new NotFoundException('Landing page not found');
    return page;
  }

  async updateLandingPage(id: string, dto: UpdateLandingPageDto) {
    await this.findLandingPage(id);
    return this.prisma.landingPage.update({ where: { id }, data: { ...dto } });
  }

  // ==========================================================================
  // Visits — public beacon, no auth
  // ==========================================================================

  /**
   * Record a visit. `pagePath` may be either a registered slug or a raw URL
   * path; we look up the LandingPage on slug and fall back to null so
   * unregistered pages still appear in the dashboard, just unattributed.
   */
  async trackVisit(dto: TrackVisitDto, ctx: VisitContext) {
    const slug = dto.pagePath.trim().replace(/^\/+|\/+$/g, '').toLowerCase();
    const page = slug
      ? await this.prisma.landingPage.findUnique({ where: { slug } })
      : null;

    const visit = await this.prisma.visit.create({
      data: {
        visitorId: dto.visitorId,
        sessionId: dto.sessionId,
        landingPageId: page?.id ?? null,
        pagePath: dto.pagePath.slice(0, 500),
        utmSource: dto.utmSource ?? null,
        utmMedium: dto.utmMedium ?? null,
        utmCampaign: dto.utmCampaign ?? null,
        utmTerm: dto.utmTerm ?? null,
        utmContent: dto.utmContent ?? null,
        gclid: dto.gclid ?? null,
        fbclid: dto.fbclid ?? null,
        referrer: dto.referrer ?? null,
        keyword: dto.keyword ?? null,
        country: dto.country ?? null,
        device: ctx.device ?? null,
        userAgent: ctx.userAgent ?? null,
        ipAddress: ctx.ipAddress ?? null,
      },
    });

    // Return only what the landing page needs to stash and forward with the
    // form submit. Never leak the IP back to the browser.
    return { visitId: visit.id };
  }

  /** Lookup used by LeadsService when a capture arrives carrying a visitId. */
  async findVisit(id: string) {
    return this.prisma.visit.findUnique({ where: { id } });
  }

  // ==========================================================================
  // Ad spend
  // ==========================================================================

  createAdSpend(dto: CreateAdSpendDto) {
    return this.prisma.adSpend.create({
      data: {
        spendDate: dayKey(dto.spendDate),
        channel: dto.channel,
        campaign: dto.campaign ?? null,
        adGroup: dto.adGroup ?? null,
        landingPageId: dto.landingPageId ?? null,
        amount: dto.amount,
        currency: dto.currency ?? 'INR',
        impressions: dto.impressions ?? null,
        clicks: dto.clicks ?? null,
        notes: dto.notes ?? null,
      },
    });
  }

  /**
   * Pull Google Ads spend into AdSpend.
   *
   * Defaults to the standard lookback so the common case is a bare POST. With
   * no customerId, every reachable account is synced — matching what the
   * scheduled job does.
   */
  async syncGoogleAds(dto: SyncGoogleAdsDto): Promise<SyncResult[]> {
    const fallback = lookbackWindow(AttributionService.SYNC_LOOKBACK_DAYS);
    const from = dto.from ?? fallback.from;
    const to = dto.to ?? isoDay(new Date());

    if (dto.customerId) {
      return [await this.googleAds.syncCampaignSpend(dto.customerId, from, to)];
    }

    const { customerIds } = await this.googleAds.listAccessibleCustomers();
    const results: SyncResult[] = [];
    for (const customerId of customerIds) {
      // One unreachable account must not abort the others — a manager account
      // routinely lists children these credentials cannot report on.
      try {
        results.push(await this.googleAds.syncCampaignSpend(customerId, from, to));
      } catch {
        continue;
      }
    }
    return results;
  }

  listAdSpend(params: { from?: string; to?: string; channel?: AdChannel }) {
    const where: Prisma.AdSpendWhereInput = {};
    if (params.from || params.to) {
      where.spendDate = {};
      if (params.from) where.spendDate.gte = dayKey(params.from);
      if (params.to) where.spendDate.lte = dayKey(params.to);
    }
    if (params.channel) where.channel = params.channel;

    return this.prisma.adSpend.findMany({
      where,
      orderBy: [{ spendDate: 'desc' }, { channel: 'asc' }],
      include: {
        landingPage: { select: { id: true, name: true, slug: true } },
      },
      take: 500,
    });
  }

  async updateAdSpend(id: string, dto: UpdateAdSpendDto) {
    const exists = await this.prisma.adSpend.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Ad spend row not found');

    const data: Prisma.AdSpendUpdateInput = { ...dto } as any;
    if (dto.spendDate !== undefined) data.spendDate = dayKey(dto.spendDate);
    // Explicit null clears the FK; toDateOrNull is not right here since it's a string.
    if (dto.landingPageId !== undefined)
      data.landingPage = dto.landingPageId
        ? { connect: { id: dto.landingPageId } }
        : { disconnect: true };
    delete (data as any).landingPageId;

    return this.prisma.adSpend.update({ where: { id }, data });
  }

  async removeAdSpend(id: string) {
    const exists = await this.prisma.adSpend.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Ad spend row not found');
    await this.prisma.adSpend.delete({ where: { id } });
    return { deleted: true, id };
  }

  // ==========================================================================
  // Reports
  // ==========================================================================

  /**
   * Per-landing-page funnel: visits, leads, bookings, revenue, spend, CPL, ROAS.
   *
   * "Leads" here counts only leads captured through a visit tied to that
   * landing page — manual adds and re-enquiries are deliberately excluded.
   * The paid-marketing question is "did this page turn traffic into leads",
   * and mixing in leads that never touched the funnel muddies the answer.
   */
  async landingPageReport(from?: string, to?: string) {
    const range: Prisma.DateTimeFilter = {};
    if (from) range.gte = dayKey(from);
    if (to) range.lte = dayKey(to);
    const hasRange = from !== undefined || to !== undefined;

    const [pages, visitsByPage, leadsByPage, spendByPage] = await Promise.all([
      this.prisma.landingPage.findMany({
        orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
      }),
      this.prisma.visit.groupBy({
        by: ['landingPageId'],
        where: hasRange ? { createdAt: range } : {},
        _count: { _all: true },
      }),
      this.prisma.lead.findMany({
        where: {
          ...(hasRange ? { createdAt: range } : {}),
          visit: { landingPageId: { not: null } },
        },
        select: {
          visit: { select: { landingPageId: true } },
          bookings: { select: { totalSell: true, status: true } },
        },
      }),
      this.prisma.adSpend.groupBy({
        by: ['landingPageId'],
        where: hasRange ? { spendDate: range } : {},
        _sum: { amount: true },
      }),
    ]);

    const visitByPage = new Map(
      visitsByPage.map((r: any) => [r.landingPageId, r._count._all as number]),
    );
    const spendByPageMap = new Map(
      spendByPage.map((r: any) => [r.landingPageId, r._sum.amount ?? 0]),
    );

    const leadCount = new Map<string, number>();
    const bookingCount = new Map<string, number>();
    const revenue = new Map<string, number>();
    for (const l of leadsByPage) {
      const pid = l.visit?.landingPageId;
      if (!pid) continue;
      leadCount.set(pid, (leadCount.get(pid) ?? 0) + 1);
      for (const b of l.bookings) {
        if (b.status === 'CANCELLED') continue;
        bookingCount.set(pid, (bookingCount.get(pid) ?? 0) + 1);
        revenue.set(pid, (revenue.get(pid) ?? 0) + b.totalSell);
      }
    }

    return pages.map((p: any) => {
      const visits = visitByPage.get(p.id) ?? 0;
      const leads = leadCount.get(p.id) ?? 0;
      const bookings = bookingCount.get(p.id) ?? 0;
      const rev = revenue.get(p.id) ?? 0;
      const spend = spendByPageMap.get(p.id) ?? 0;
      return {
        id: p.id,
        slug: p.slug,
        name: p.name,
        campaign: p.campaign,
        isActive: p.isActive,
        visits,
        leads,
        bookings,
        revenue: rev,
        spend,
        conversionPercent: visits > 0 ? (leads / visits) * 100 : 0,
        bookingRatePercent: leads > 0 ? (bookings / leads) * 100 : 0,
        costPerLead: leads > 0 ? Math.round(spend / leads) : null,
        costPerBooking: bookings > 0 ? Math.round(spend / bookings) : null,
        roas: spend > 0 ? rev / spend : null,
      };
    });
  }

  /**
   * Daily spend + leads rollup, aggregated across channels for a chart. The
   * per-channel breakdown lives in listAdSpend for the table view.
   */
  async dailyReport(from?: string, to?: string) {
    const range: Prisma.DateTimeFilter = {};
    if (from) range.gte = dayKey(from);
    if (to) range.lte = dayKey(to);
    const hasRange = from !== undefined || to !== undefined;

    const [spend, leads] = await Promise.all([
      this.prisma.adSpend.groupBy({
        by: ['spendDate'],
        where: hasRange ? { spendDate: range } : {},
        _sum: { amount: true },
      }),
      this.prisma.$queryRawUnsafe<{ day: Date; n: bigint }[]>(
        // Postgres date_trunc; groupBy on a computed date is not first-class in Prisma.
        `SELECT date_trunc('day', "createdAt") AS day, COUNT(*)::bigint AS n
         FROM "Lead"
         ${hasRange ? 'WHERE "createdAt" BETWEEN $1 AND $2' : ''}
         GROUP BY day ORDER BY day ASC`,
        ...(hasRange ? [range.gte ?? new Date(0), range.lte ?? new Date()] : []),
      ),
    ]);

    // Merge by day-key
    const days = new Map<
      string,
      { day: string; spend: number; leads: number }
    >();
    for (const s of spend) {
      const key = dayKey(s.spendDate).toISOString();
      const row = days.get(key) ?? { day: key, spend: 0, leads: 0 };
      row.spend += s._sum.amount ?? 0;
      days.set(key, row);
    }
    for (const l of leads) {
      const key = dayKey(l.day).toISOString();
      const row = days.get(key) ?? { day: key, spend: 0, leads: 0 };
      row.leads += Number(l.n);
      days.set(key, row);
    }

    return Array.from(days.values())
      .sort((a, b) => a.day.localeCompare(b.day))
      .map((r) => ({
        ...r,
        costPerLead: r.leads > 0 ? Math.round(r.spend / r.leads) : null,
      }));
  }
}
