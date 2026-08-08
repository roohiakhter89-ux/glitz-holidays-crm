import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateItineraryDto } from './dto/create-itinerary.dto';
import { UpdateItineraryDto } from './dto/update-itinerary.dto';
import { UpsertDayDto } from './dto/upsert-day.dto';
import { UpsertItemDto } from './dto/upsert-item.dto';
import { ReorderDto } from './dto/reorder.dto';
import { Actor, canSeeAllLeads } from '../common/access';
import { toDateOrNull } from '../common/dates';
import { withNumberRetry } from '../common/sequence';

@Injectable()
export class ItinerariesService {
  constructor(private readonly prisma: PrismaService) {}

  // --- access scoping ------------------------------------------------------
  //
  // An itinerary is client-facing — it doesn't leak cost or margin, so the
  // scoping is looser than quotes/bookings. Still per-lead: a sales exec
  // should not read another exec's itineraries because they contain the
  // client's travel plans and identity.

  private leadScope(actor: Actor): Prisma.ItineraryWhereInput {
    return canSeeAllLeads(actor.role) ? {} : { lead: { assignedToId: actor.id } };
  }

  private async assertItineraryAccess(id: string, actor: Actor) {
    if (canSeeAllLeads(actor.role)) return;
    const it = await this.prisma.itinerary.findUnique({
      where: { id },
      select: { lead: { select: { assignedToId: true } } },
    });
    if (!it || it.lead.assignedToId !== actor.id) {
      throw new NotFoundException('Itinerary not found');
    }
  }

  private async assertLeadAccess(leadId: string, actor: Actor) {
    if (canSeeAllLeads(actor.role)) return;
    const lead = await this.prisma.lead.findUnique({
      where: { id: leadId },
      select: { assignedToId: true },
    });
    if (!lead || lead.assignedToId !== actor.id) {
      throw new NotFoundException('Lead not found');
    }
  }

  private async assertDayAccess(dayId: string, actor: Actor) {
    const day = await this.prisma.itineraryDay.findUnique({
      where: { id: dayId },
      select: { itineraryId: true },
    });
    if (!day) throw new NotFoundException('Day not found');
    await this.assertItineraryAccess(day.itineraryId, actor);
    return day.itineraryId;
  }

  private async assertItemAccess(itemId: string, actor: Actor) {
    const item = await this.prisma.itineraryItem.findUnique({
      where: { id: itemId },
      select: { day: { select: { itineraryId: true } } },
    });
    if (!item) throw new NotFoundException('Item not found');
    await this.assertItineraryAccess(item.day.itineraryId, actor);
    return item;
  }

  // --- code generation -----------------------------------------------------

  private async nextItineraryCode(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `GLZ-ITI-${year}-`;
    const last = await this.prisma.itinerary.findFirst({
      where: { code: { startsWith: prefix } },
      orderBy: { code: 'desc' },
      select: { code: true },
    });
    const n = last ? parseInt(last.code.slice(prefix.length), 10) + 1 : 1;
    return `${prefix}${String(n).padStart(4, '0')}`;
  }

  // --- itineraries ---------------------------------------------------------

  async create(dto: CreateItineraryDto, actor: Actor) {
    await this.assertLeadAccess(dto.leadId, actor);
    // Number + insert inside the retry loop — race-safe.
    return withNumberRetry(async () => {
      const code = await this.nextItineraryCode();
      return this.prisma.itinerary.create({
        data: {
          code,
          leadId: dto.leadId,
          title: dto.title,
          headline: dto.headline ?? null,
          intro: dto.intro ?? null,
          totalPax: dto.totalPax ?? 2,
          inclusions: dto.inclusions ?? null,
          exclusions: dto.exclusions ?? null,
          createdById: actor.id,
        },
      });
    });
  }

  findAll(leadId: string | undefined, actor: Actor) {
    return this.prisma.itinerary.findMany({
      where: {
        ...(leadId ? { leadId } : {}),
        ...this.leadScope(actor),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        lead: { select: { id: true, name: true, phone: true } },
        _count: { select: { days: true } },
      },
    });
  }

  async findOne(id: string, actor: Actor) {
    await this.assertItineraryAccess(id, actor);
    const it = await this.prisma.itinerary.findUnique({
      where: { id },
      include: {
        lead: { select: { id: true, name: true, phone: true, email: true } },
        days: {
          orderBy: { dayNumber: 'asc' },
          include: {
            items: {
              orderBy: { sortOrder: 'asc' },
              include: {
                vendor: { select: { id: true, name: true, type: true } },
              },
            },
          },
        },
      },
    });
    if (!it) throw new NotFoundException('Itinerary not found');
    return it;
  }

  async update(id: string, dto: UpdateItineraryDto, actor: Actor) {
    await this.assertItineraryAccess(id, actor);
    return this.prisma.itinerary.update({
      where: { id },
      data: {
        ...(dto.title !== undefined      ? { title: dto.title } : {}),
        ...(dto.headline !== undefined   ? { headline: dto.headline } : {}),
        ...(dto.intro !== undefined      ? { intro: dto.intro } : {}),
        ...(dto.totalPax !== undefined   ? { totalPax: dto.totalPax } : {}),
        ...(dto.inclusions !== undefined ? { inclusions: dto.inclusions } : {}),
        ...(dto.exclusions !== undefined ? { exclusions: dto.exclusions } : {}),
      },
    });
  }

  async remove(id: string, actor: Actor) {
    await this.assertItineraryAccess(id, actor);
    await this.prisma.itinerary.delete({ where: { id } });
    return { deleted: true, id };
  }

  // --- days ----------------------------------------------------------------

  async addDay(itineraryId: string, dto: UpsertDayDto, actor: Actor) {
    await this.assertItineraryAccess(itineraryId, actor);
    // Append at the end unless a specific dayNumber was requested.
    const last = await this.prisma.itineraryDay.findFirst({
      where: { itineraryId },
      orderBy: { dayNumber: 'desc' },
      select: { dayNumber: true },
    });
    const dayNumber = dto.dayNumber ?? (last?.dayNumber ?? 0) + 1;
    return this.prisma.itineraryDay.create({
      data: {
        itineraryId,
        dayNumber,
        date: toDateOrNull(dto.date),
        city: dto.city ?? null,
        headline: dto.headline ?? null,
        summary: dto.summary ?? null,
      },
    });
  }

  async updateDay(dayId: string, dto: UpsertDayDto, actor: Actor) {
    await this.assertDayAccess(dayId, actor);
    return this.prisma.itineraryDay.update({
      where: { id: dayId },
      data: {
        ...(dto.city !== undefined     ? { city: dto.city } : {}),
        ...(dto.headline !== undefined ? { headline: dto.headline } : {}),
        ...(dto.summary !== undefined  ? { summary: dto.summary } : {}),
        ...(dto.date !== undefined     ? { date: toDateOrNull(dto.date) } : {}),
      },
    });
  }

  async removeDay(dayId: string, actor: Actor) {
    const itineraryId = await this.assertDayAccess(dayId, actor);
    await this.prisma.itineraryDay.delete({ where: { id: dayId } });
    // Re-sequence remaining days so numbering stays 1..N. If we skip this,
    // the client sees "Day 1, Day 3" after deleting the middle one, and the
    // unique (itineraryId, dayNumber) index keeps working, but the PDF
    // looks broken.
    await this.renumberDays(itineraryId);
    return { deleted: true, id: dayId };
  }

  /**
   * Re-sequence days 1..N in current dayNumber order. Runs in a transaction
   * to keep the unique constraint from tripping during the intermediate state
   * — we bump every day into the 9000+ range first, then back down. Ugly
   * but the standard trick for unique-column reordering.
   */
  private async renumberDays(itineraryId: string) {
    const days = await this.prisma.itineraryDay.findMany({
      where: { itineraryId },
      orderBy: { dayNumber: 'asc' },
      select: { id: true },
    });
    await this.prisma.$transaction([
      ...days.map((d, i) =>
        this.prisma.itineraryDay.update({
          where: { id: d.id },
          data: { dayNumber: 9000 + i },
        }),
      ),
      ...days.map((d, i) =>
        this.prisma.itineraryDay.update({
          where: { id: d.id },
          data: { dayNumber: i + 1 },
        }),
      ),
    ]);
  }

  async reorderDays(itineraryId: string, dto: ReorderDto, actor: Actor) {
    await this.assertItineraryAccess(itineraryId, actor);
    // Verify every id belongs to this itinerary — a maliciously-crafted
    // reorder must not touch someone else's days.
    const owned = await this.prisma.itineraryDay.findMany({
      where: { itineraryId, id: { in: dto.ids } },
      select: { id: true },
    });
    if (owned.length !== dto.ids.length) {
      throw new NotFoundException('One or more days do not belong to this itinerary');
    }
    // Same two-phase trick as renumberDays.
    await this.prisma.$transaction([
      ...dto.ids.map((id, i) =>
        this.prisma.itineraryDay.update({ where: { id }, data: { dayNumber: 9000 + i } }),
      ),
      ...dto.ids.map((id, i) =>
        this.prisma.itineraryDay.update({ where: { id }, data: { dayNumber: i + 1 } }),
      ),
    ]);
    return { reordered: dto.ids.length };
  }

  // --- items ---------------------------------------------------------------

  async addItem(dayId: string, dto: UpsertItemDto, actor: Actor) {
    await this.assertDayAccess(dayId, actor);
    const last = await this.prisma.itineraryItem.findFirst({
      where: { dayId },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });
    return this.prisma.itineraryItem.create({
      data: {
        dayId,
        kind: dto.kind,
        title: dto.title,
        time: dto.time ?? null,
        description: dto.description ?? null,
        location: dto.location ?? null,
        vendorId: dto.vendorId ?? null,
        sortOrder: dto.sortOrder ?? (last?.sortOrder ?? -1) + 1,
      },
    });
  }

  async updateItem(itemId: string, dto: UpsertItemDto, actor: Actor) {
    await this.assertItemAccess(itemId, actor);
    return this.prisma.itineraryItem.update({
      where: { id: itemId },
      data: {
        ...(dto.kind !== undefined        ? { kind: dto.kind } : {}),
        ...(dto.title !== undefined       ? { title: dto.title } : {}),
        ...(dto.time !== undefined        ? { time: dto.time } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.location !== undefined    ? { location: dto.location } : {}),
        ...(dto.vendorId !== undefined
          ? {
              vendor: dto.vendorId
                ? { connect: { id: dto.vendorId } }
                : { disconnect: true },
            }
          : {}),
      },
    });
  }

  async removeItem(itemId: string, actor: Actor) {
    await this.assertItemAccess(itemId, actor);
    await this.prisma.itineraryItem.delete({ where: { id: itemId } });
    return { deleted: true, id: itemId };
  }

  async reorderItems(dayId: string, dto: ReorderDto, actor: Actor) {
    await this.assertDayAccess(dayId, actor);
    const owned = await this.prisma.itineraryItem.findMany({
      where: { dayId, id: { in: dto.ids } },
      select: { id: true },
    });
    if (owned.length !== dto.ids.length) {
      throw new NotFoundException('One or more items do not belong to this day');
    }
    // sortOrder isn't unique, so a single pass is safe.
    await this.prisma.$transaction(
      dto.ids.map((id, i) =>
        this.prisma.itineraryItem.update({ where: { id }, data: { sortOrder: i } }),
      ),
    );
    return { reordered: dto.ids.length };
  }
}
