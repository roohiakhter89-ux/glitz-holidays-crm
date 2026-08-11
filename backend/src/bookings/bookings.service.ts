import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ActivityType,
  BookingStatus,
  LeadStatus,
  PaymentMode,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { CreateCostDto } from './dto/create-cost.dto';
import { UpdateCostDto } from './dto/update-cost.dto';
import { QueryBookingsDto } from './dto/query-bookings.dto';
import { computeBookingFinancials, deriveStatus } from './booking-math';
import { Actor, canSeeAllLeads } from '../common/access';
import { toDateOrNull } from '../common/dates';
import { withNumberRetry } from '../common/sequence';

@Injectable()
export class BookingsService {
  constructor(private readonly prisma: PrismaService) {}

  // --- access scoping ------------------------------------------------------
  //
  // A booking exposes totalNet and actual margin, so it inherits the access
  // rules of its lead. 404 rather than 403, matching LeadsService.
  //
  // The money routes (payments, costs) are already restricted to finance
  // roles, all of which have full lead access — they use detail() directly.

  private leadScope(actor: Actor): Prisma.BookingWhereInput {
    return canSeeAllLeads(actor.role)
      ? {}
      : { lead: { assignedToId: actor.id } };
  }

  private async assertBookingAccess(bookingId: string, actor: Actor) {
    if (canSeeAllLeads(actor.role)) return;
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      select: { lead: { select: { assignedToId: true } } },
    });
    if (!booking || booking.lead.assignedToId !== actor.id) {
      throw new NotFoundException('Booking not found');
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

  private async nextBookingNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `GLZ-B-${year}-`;
    const last = await this.prisma.booking.findFirst({
      where: { bookingNumber: { startsWith: prefix } },
      orderBy: { bookingNumber: 'desc' },
      select: { bookingNumber: true },
    });
    const n = last
      ? parseInt(last.bookingNumber.slice(prefix.length), 10) + 1
      : 1;
    return `${prefix}${String(n).padStart(4, '0')}`;
  }

  /** Recompute stored totals from the child rows, then re-derive status. */
  private async refresh(bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { payments: true, costs: true },
    });
    if (!booking) throw new NotFoundException('Booking not found');

    const fin = computeBookingFinancials({
      totalSell: booking.totalSell,
      totalNet: booking.totalNet,
      payments: booking.payments,
      costs: booking.costs,
    });

    const status = deriveStatus(
      booking.status,
      booking.totalSell,
      fin.totalReceived,
    ) as BookingStatus;

    return this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        totalReceived: fin.totalReceived,
        totalCostPaid: fin.totalCostPaid,
        status,
      },
    });
  }

  async create(dto: CreateBookingDto, actor: Actor) {
    const userId = actor.id;
    let leadId = dto.leadId;
    let totalSell = dto.totalSell ?? 0;
    let totalNet = dto.totalNet ?? 0;
    let itineraryId: string | null = null;
    let packageName = dto.packageName ?? null;
    let adults = dto.adults ?? 2;
    let children = dto.children ?? 0;
    let nights = dto.nights ?? 0;

    // --- build from an itinerary tier: snapshot its numbers ---
    if (dto.itineraryOptionId) {
      const option = await this.prisma.itineraryOption.findUnique({
        where: { id: dto.itineraryOptionId },
        include: {
          itinerary: {
            include: {
              days: { select: { dayNumber: true } },
            },
          },
        },
      });
      if (!option) throw new NotFoundException('Itinerary option not found');

      leadId = option.itinerary.leadId;
      itineraryId = option.itineraryId;
      totalSell = option.totalSell;
      totalNet = option.totalNet;
      packageName =
        packageName ?? `${option.itinerary.title} — ${option.name}`;
      adults = dto.adults ?? option.itinerary.totalPax;
      children = dto.children ?? 0;
      // Infer nights from the number of days if the operator didn't override.
      // Standard convention: N days = N-1 nights (arrival + last day travel).
      const dayCount = option.itinerary.days.length;
      nights = dto.nights ?? Math.max(0, dayCount - 1);

      if (totalSell <= 0) {
        throw new BadRequestException(
          'That itinerary tier has no pricing yet — set rates on the priceable items first.',
        );
      }
    }

    if (!leadId) {
      throw new BadRequestException(
        'Provide either itineraryOptionId or leadId.',
      );
    }

    const lead = await this.prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) throw new NotFoundException('Lead not found');
    await this.assertLeadAccess(leadId, actor);

    // Race-safe number + insert. See src/common/sequence.ts.
    const booking = await withNumberRetry(async () => {
      const bookingNumber = await this.nextBookingNumber();
      return this.prisma.booking.create({
        data: {
          bookingNumber,
          leadId,
          itineraryId,
          itineraryOptionId: dto.itineraryOptionId ?? null,
          createdById: userId ?? null,
          status: BookingStatus.CONFIRMED,
          packageName,
          travelStartDate: toDateOrNull(dto.travelStartDate),
          travelEndDate: toDateOrNull(dto.travelEndDate),
          adults,
          children,
          nights,
          totalSell,
          totalNet,
          notes: dto.notes ?? null,
        },
      });
    });

    // pipeline side-effects
    await this.prisma.lead.update({
      where: { id: leadId },
      data: { status: LeadStatus.CONFIRMED },
    });
    await this.prisma.activity.create({
      data: {
        leadId,
        userId: userId ?? null,
        type: ActivityType.SYSTEM,
        content: `Booking ${booking.bookingNumber} confirmed — sell ${totalSell}, est. cost ${totalNet}`,
      },
    });

    return booking;
  }

  async findAll(q: QueryBookingsDto, actor: Actor) {
    const page = q.page ?? 1;
    const limit = q.limit ?? 25;

    const where: Prisma.BookingWhereInput = { ...this.leadScope(actor) };
    if (q.status) where.status = q.status;
    if (q.leadId) where.leadId = q.leadId;
    if (q.from || q.to) {
      where.travelStartDate = {};
      if (q.from) where.travelStartDate.gte = new Date(q.from);
      if (q.to) where.travelStartDate.lte = new Date(q.to);
    }
    if (q.search) {
      where.OR = [
        { bookingNumber: { contains: q.search, mode: 'insensitive' } },
        { packageName: { contains: q.search, mode: 'insensitive' } },
      ];
    }

    const [total, rows] = await Promise.all([
      this.prisma.booking.count({ where }),
      this.prisma.booking.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          lead: { select: { id: true, name: true, phone: true } },
          payments: { select: { amount: true } },
          costs: { select: { amountDue: true, amountPaid: true } },
        },
      }),
    ]);

    return {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
      data: rows.map((b: any) => ({
        ...b,
        payments: undefined,
        costs: undefined,
        financials: computeBookingFinancials({
          totalSell: b.totalSell,
          totalNet: b.totalNet,
          payments: b.payments,
          costs: b.costs,
        }),
      })),
    };
  }

  async findOne(id: string, actor: Actor) {
    await this.assertBookingAccess(id, actor);
    return this.detail(id);
  }

  /** Unscoped read — callers must have checked access first. */
  private async detail(id: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        lead: { select: { id: true, name: true, phone: true, email: true } },
        payments: { orderBy: { receivedAt: 'desc' } },
        costs: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!booking) throw new NotFoundException('Booking not found');

    return {
      ...booking,
      financials: computeBookingFinancials({
        totalSell: booking.totalSell,
        totalNet: booking.totalNet,
        payments: booking.payments,
        costs: booking.costs,
      }),
    };
  }

  async update(id: string, dto: UpdateBookingDto, actor: Actor) {
    const userId = actor.id;
    const booking = await this.prisma.booking.findUnique({ where: { id } });
    if (!booking) throw new NotFoundException('Booking not found');
    await this.assertBookingAccess(id, actor);

    const data: Prisma.BookingUpdateInput = {};
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.packageName !== undefined) data.packageName = dto.packageName;
    if (dto.adults !== undefined) data.adults = dto.adults;
    if (dto.children !== undefined) data.children = dto.children;
    if (dto.nights !== undefined) data.nights = dto.nights;
    if (dto.totalSell !== undefined) data.totalSell = dto.totalSell;
    if (dto.notes !== undefined) data.notes = dto.notes;
    if (dto.cancelledReason !== undefined)
      data.cancelledReason = dto.cancelledReason;
    if (dto.travelStartDate !== undefined)
      data.travelStartDate = toDateOrNull(dto.travelStartDate);
    if (dto.travelEndDate !== undefined)
      data.travelEndDate = toDateOrNull(dto.travelEndDate);

    await this.prisma.booking.update({ where: { id }, data });

    if (dto.status && dto.status !== booking.status) {
      await this.prisma.activity.create({
        data: {
          leadId: booking.leadId,
          userId: userId ?? null,
          type: ActivityType.SYSTEM,
          content: `Booking ${booking.bookingNumber}: ${booking.status} -> ${dto.status}`,
        },
      });
      if (dto.status === BookingStatus.CANCELLED) {
        await this.prisma.lead.update({
          where: { id: booking.leadId },
          data: { status: LeadStatus.CANCELLED },
        });
      }
    }

    return this.detail(id);
  }

  /**
   * Cancel a booking. Thin wrapper over `update` so the CANCELLED transition
   * writes the audit activity and cascades to the parent lead. Idempotent —
   * cancelling an already-cancelled booking is a no-op.
   */
  async cancel(id: string, reason: string | undefined, actor: Actor) {
    const booking = await this.prisma.booking.findUnique({ where: { id } });
    if (!booking) throw new NotFoundException('Booking not found');
    await this.assertBookingAccess(id, actor);

    if (booking.status === BookingStatus.CANCELLED) {
      return { id, alreadyCancelled: true };
    }
    await this.update(
      id,
      {
        status: BookingStatus.CANCELLED,
        cancelledReason: reason?.trim() || 'Cancelled by operator',
      } as any,
      actor,
    );
    return { id, cancelled: true };
  }

  // --- payments (money in) -------------------------------------------------

  async addPayment(
    bookingId: string,
    dto: CreatePaymentDto,
    userId?: string,
  ) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });
    if (!booking) throw new NotFoundException('Booking not found');

    // a refund is stored as a negative amount so totals stay a simple sum
    const signed = dto.isRefund ? -Math.abs(dto.amount) : Math.abs(dto.amount);

    await this.prisma.bookingPayment.create({
      data: {
        bookingId,
        amount: signed,
        mode: dto.mode ?? PaymentMode.BANK_TRANSFER,
        reference: dto.reference ?? null,
        receivedAt: dto.receivedAt ? new Date(dto.receivedAt) : new Date(),
        notes: dto.notes ?? null,
        isRefund: dto.isRefund ?? false,
        recordedById: userId ?? null,
      },
    });

    await this.prisma.activity.create({
      data: {
        leadId: booking.leadId,
        userId: userId ?? null,
        type: ActivityType.SYSTEM,
        content: `${dto.isRefund ? 'Refund' : 'Payment'} ${Math.abs(
          dto.amount,
        )} recorded on ${booking.bookingNumber}`,
      },
    });

    await this.refresh(bookingId);
    return this.detail(bookingId);
  }

  async removePayment(paymentId: string) {
    const payment = await this.prisma.bookingPayment.findUnique({
      where: { id: paymentId },
    });
    if (!payment) throw new NotFoundException('Payment not found');
    await this.prisma.bookingPayment.delete({ where: { id: paymentId } });
    await this.refresh(payment.bookingId);
    return this.detail(payment.bookingId);
  }

  // --- costs (money out) ---------------------------------------------------

  async addCost(bookingId: string, dto: CreateCostDto) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });
    if (!booking) throw new NotFoundException('Booking not found');

    await this.prisma.bookingCost.create({
      data: {
        bookingId,
        vendorId: dto.vendorId ?? null,
        description: dto.description,
        amountDue: dto.amountDue,
        amountPaid: dto.amountPaid ?? 0,
        paidAt: dto.paidAt ? new Date(dto.paidAt) : null,
        reference: dto.reference ?? null,
        notes: dto.notes ?? null,
      },
    });

    await this.refresh(bookingId);
    return this.detail(bookingId);
  }

  async updateCost(costId: string, dto: UpdateCostDto) {
    const cost = await this.prisma.bookingCost.findUnique({
      where: { id: costId },
    });
    if (!cost) throw new NotFoundException('Cost not found');

    const data: Record<string, any> = { ...dto };
    if (dto.paidAt !== undefined)
      data.paidAt = dto.paidAt ? new Date(dto.paidAt) : null;

    await this.prisma.bookingCost.update({ where: { id: costId }, data });
    await this.refresh(cost.bookingId);
    return this.detail(cost.bookingId);
  }

  async removeCost(costId: string) {
    const cost = await this.prisma.bookingCost.findUnique({
      where: { id: costId },
    });
    if (!cost) throw new NotFoundException('Cost not found');
    await this.prisma.bookingCost.delete({ where: { id: costId } });
    await this.refresh(cost.bookingId);
    return this.detail(cost.bookingId);
  }

  /**
   * Copy the itinerary tier's priced items in as expected vendor costs.
   *
   * Deduplicated by vendor. A hotel that appears on multiple items — same
   * supplier billed under two meal plans, or a stay + a transfer both keyed
   * to the same vendor — collapses into one payable row with amounts
   * summed. That matches how invoices actually arrive: the hotel sends one
   * bill for the whole stay, not one per row.
   *
   * Items without a linked vendor (manually-priced lines) stay individual —
   * we don't know they're the same supplier, so combining them silently
   * would be wrong.
   */
  async seedCostsFromItinerary(bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { costs: true },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    if (!booking.itineraryOptionId) {
      throw new BadRequestException(
        'This booking was not created from an itinerary tier.',
      );
    }
    if (booking.costs.length > 0) {
      throw new BadRequestException(
        'Costs already exist on this booking — add them individually instead.',
      );
    }

    const pricings = await this.prisma.itineraryItemPricing.findMany({
      where: { optionId: booking.itineraryOptionId },
      include: {
        item: { select: { title: true } },
      },
    });

    // Group by vendorId. Rows with a null vendor go into their own bucket
    // each so they're never accidentally merged with each other.
    const grouped = new Map<
      string,
      { vendorId: string | null; titles: string[]; amountDue: number }
    >();
    for (const p of pricings) {
      const key = p.vendorId ?? `__null_${p.id}`;
      const bucket = grouped.get(key) ?? {
        vendorId: p.vendorId,
        titles: [],
        amountDue: 0,
      };
      bucket.titles.push(p.item.title);
      bucket.amountDue += p.lineNet;
      grouped.set(key, bucket);
    }

    // Look up vendor names for the grouped rows so the payable description
    // reads "Grand Mumtaz Deluxe (2 items)" instead of "Item 1 + Item 2".
    const vendorIds = Array.from(grouped.values())
      .map((b) => b.vendorId)
      .filter((v): v is string => v !== null);
    const vendors = vendorIds.length
      ? await this.prisma.vendor.findMany({
          where: { id: { in: vendorIds } },
          select: { id: true, name: true },
        })
      : [];
    const vendorName = new Map(vendors.map((v: any) => [v.id, v.name]));

    for (const bucket of grouped.values()) {
      const label = bucket.vendorId
        ? vendorName.get(bucket.vendorId) ?? bucket.titles[0]
        : bucket.titles[0];
      const description =
        bucket.titles.length === 1
          ? label
          : `${label} (${bucket.titles.length} items)`;
      await this.prisma.bookingCost.create({
        data: {
          bookingId,
          vendorId: bucket.vendorId,
          description,
          amountDue: bucket.amountDue,
          amountPaid: 0,
        },
      });
    }

    await this.refresh(bookingId);
    return this.detail(bookingId);
  }

  // --- reporting -----------------------------------------------------------

  async stats(from?: string, to?: string) {
    const where: Prisma.BookingWhereInput = {};
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
    }

    const bookings = await this.prisma.booking.findMany({
      where,
      include: {
        payments: { select: { amount: true } },
        costs: { select: { amountDue: true, amountPaid: true } },
      },
    });

    let totalSell = 0;
    let totalQuotedProfit = 0;
    let totalActualProfit = 0;
    let totalReceived = 0;
    let totalOutstanding = 0;
    let vendorOutstanding = 0;

    for (const b of bookings as any[]) {
      const f = computeBookingFinancials({
        totalSell: b.totalSell,
        totalNet: b.totalNet,
        payments: b.payments,
        costs: b.costs,
      });
      if (b.status === BookingStatus.CANCELLED) continue;
      totalSell += f.totalSell;
      totalQuotedProfit += f.quotedProfit;
      totalActualProfit += f.actualProfit;
      totalReceived += f.totalReceived;
      totalOutstanding += f.balanceDue;
      vendorOutstanding += f.vendorOutstanding;
    }

    const byStatus = await this.prisma.booking.groupBy({
      by: ['status'],
      where,
      _count: { _all: true },
    });

    return {
      bookings: bookings.length,
      totalSell,
      totalReceived,
      totalOutstanding,
      vendorOutstanding,
      totalQuotedProfit,
      totalActualProfit,
      profitVariance: totalActualProfit - totalQuotedProfit,
      averageMarginPercent:
        totalSell > 0 ? (totalActualProfit / totalSell) * 100 : 0,
      byStatus: byStatus.map((r: any) => ({
        status: r.status,
        count: r._count._all,
      })),
    };
  }
}
