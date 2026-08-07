#!/usr/bin/env bash
# ==============================================================================
# Glitz Holidays CRM — Backend  |  PHASE 6: Bookings + Payments
# ------------------------------------------------------------------------------
# Adds:
#   * Booking — created from an accepted quote tier. Pricing is FROZEN onto the
#     booking (a snapshot, not a live link) so editing a quote or a vendor rate
#     later can never rewrite the history of a confirmed sale.
#   * BookingPayment — money IN from the client (advance, balance, refunds).
#   * BookingCost    — money OUT to vendors (due vs actually paid).
#   * Auto status: PARTIALLY_PAID / PAID as receipts land.
#   * QUOTED margin vs ACTUAL margin per file — the number that tells you
#     whether your estimates are honest.
#   * Confirming a booking moves the lead to CONFIRMED and the quote to ACCEPTED.
#
# RUN FROM INSIDE YOUR BACKEND FOLDER:
#   cd glitz/backend
#   bash phase-6.sh
#
# No new npm packages. Idempotent: safe to re-run.
# Options: SKIP_BUILD=1  SKIP_MIGRATE=1
# ==============================================================================
set -euo pipefail

say()  { printf "\n\033[1;36m==>\033[0m %s\n" "$1"; }
ok()   { printf "\033[1;32m  ok\033[0m %s\n" "$1"; }
warn() { printf "\033[1;33m  ! \033[0m %s\n" "$1"; }
die()  { printf "\033[1;31m  x \033[0m %s\n" "$1"; exit 1; }

say "Checking prerequisites"
[ -f package.json ] || die "No package.json here. cd into glitz/backend and re-run."
[ -d src/quotes ] || die "src/quotes missing — run phase-5.sh first."
grep -q "model QuoteOption" prisma/schema.prisma || die "Quote tables missing from schema — finish phase-5 first."

if [ ! -d prisma/migrations ] || [ -z "$(ls -A prisma/migrations 2>/dev/null || true)" ]; then
  die "No migrations found. Run: npx prisma migrate dev --name quotes"
fi
if ! ls prisma/migrations | grep -qi "quotes"; then
  warn "No 'quotes' migration found in prisma/migrations."
  warn "If 'npx prisma migrate dev --name quotes' has not been run yet, stop and run it first."
  warn "Continuing in 5 seconds — Ctrl+C to abort."
  sleep 5
fi
ok "prerequisites look good ($(pwd))"

mkdir -p src/bookings/dto

# ============================================================================
# 1. SCHEMA (guarded append — safe to re-run)
# ============================================================================
say "Updating Prisma schema (Booking + BookingPayment + BookingCost)"

if grep -q "model Booking" prisma/schema.prisma; then
  warn "Booking models already present — skipping append."
else
cp prisma/schema.prisma "prisma/schema.prisma.bak.$(date +%s)"
cat >> prisma/schema.prisma << 'EOF'

// ============================================================================
// PHASE 6 — Bookings + Payments
// ============================================================================

enum BookingStatus {
  PENDING
  CONFIRMED
  PARTIALLY_PAID
  PAID
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

enum PaymentMode {
  CASH
  BANK_TRANSFER
  UPI
  CARD
  CHEQUE
  RAZORPAY
  OTHER
}

model Booking {
  id            String        @id @default(cuid())
  bookingNumber String        @unique
  status        BookingStatus @default(PENDING)

  leadId String
  lead   Lead   @relation(fields: [leadId], references: [id], onDelete: Cascade)

  /// Where it came from. Kept for traceability only — the numbers below are
  /// a frozen snapshot and do NOT follow later edits to the quote.
  quoteId       String?
  quoteOptionId String?

  createdById String?
  createdBy   User?   @relation("BookingCreator", fields: [createdById], references: [id], onDelete: SetNull)

  // --- trip ---
  packageName     String?
  travelStartDate DateTime?
  travelEndDate   DateTime?
  adults          Int       @default(2)
  children        Int       @default(0)
  nights          Int       @default(0)

  // --- FROZEN pricing snapshot (taken at confirmation) ---
  totalSell Int @default(0)
  /// Estimated cost from the quote at the time of booking.
  totalNet  Int @default(0)

  // --- running actuals ---
  totalReceived Int @default(0)
  totalCostPaid Int @default(0)

  notes      String?
  cancelledReason String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  payments BookingPayment[]
  costs    BookingCost[]

  @@index([leadId])
  @@index([status])
  @@index([travelStartDate])
}

/// Money IN from the client. Negative amounts represent refunds.
model BookingPayment {
  id        String  @id @default(cuid())
  bookingId String
  booking   Booking @relation(fields: [bookingId], references: [id], onDelete: Cascade)

  amount     Int
  mode       PaymentMode @default(BANK_TRANSFER)
  reference  String?
  receivedAt DateTime    @default(now())
  notes      String?
  isRefund   Boolean     @default(false)

  recordedById String?
  recordedBy   User?   @relation("PaymentRecorder", fields: [recordedById], references: [id], onDelete: SetNull)

  createdAt DateTime @default(now())

  @@index([bookingId])
  @@index([receivedAt])
}

/// Money OUT to vendors — what is owed vs what has actually been paid.
model BookingCost {
  id        String  @id @default(cuid())
  bookingId String
  booking   Booking @relation(fields: [bookingId], references: [id], onDelete: Cascade)

  vendorId    String?
  description String

  amountDue  Int
  amountPaid Int       @default(0)
  paidAt     DateTime?
  reference  String?
  notes      String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([bookingId])
  @@index([vendorId])
}
EOF
  ok "schema blocks appended"
fi

# back-relations (Node — Windows-safe, idempotent)
cat > .glitz-patch.cjs << 'NODEEOF'
const fs = require('fs');
const p = 'prisma/schema.prisma';
let s = fs.readFileSync(p, 'utf8');
let changed = false;

if (!s.includes('bookings   Booking[]')) {
  s = s.replace(
    '  activities Activity[]\n  quotes     Quote[]',
    '  activities Activity[]\n  quotes     Quote[]\n  bookings   Booking[]'
  );
  changed = true;
}
if (!s.includes('createdBookings')) {
  s = s.replace(
    '  createdQuotes Quote[]    @relation("QuoteCreator")',
    '  createdQuotes Quote[]    @relation("QuoteCreator")\n' +
    '  createdBookings Booking[]        @relation("BookingCreator")\n' +
    '  recordedPayments BookingPayment[] @relation("PaymentRecorder")'
  );
  changed = true;
}
fs.writeFileSync(p, s);
console.log(changed ? '  back-relations added' : '  back-relations already present');
NODEEOF
node .glitz-patch.cjs || die "failed to patch schema back-relations"
rm -f .glitz-patch.cjs
ok "schema.prisma extended"

# ============================================================================
# 2. BOOKING MATH (pure + testable)
# ============================================================================
say "Writing booking math"

cat > src/bookings/booking-math.ts << 'EOF'
/**
 * Pure booking arithmetic. No database, no Nest.
 *
 * The distinction that matters:
 *   QUOTED margin  = sell - estimated cost (what you thought you'd make)
 *   ACTUAL margin  = sell - real vendor costs (what you actually made)
 * A file quoted at 22% that lands at 14% is telling you your estimates are
 * optimistic. That gap is the most useful number in the system.
 */

export interface BookingFinancials {
  totalSell: number;
  totalNet: number;
  totalReceived: number;
  totalCostPaid: number;
  totalCostDue: number;

  /** client still owes you */
  balanceDue: number;
  /** you still owe vendors */
  vendorOutstanding: number;

  quotedProfit: number;
  quotedMarginPercent: number;

  /** based on costs actually recorded so far */
  actualProfit: number;
  actualMarginPercent: number;

  /** actual minus quoted — negative means the file is eroding */
  marginVariance: number;

  /** cash actually in hand on this file right now */
  netCashPosition: number;

  fullyPaid: boolean;
  overpaid: boolean;
}

export function computeBookingFinancials(input: {
  totalSell: number;
  totalNet: number;
  payments: { amount: number }[];
  costs: { amountDue: number; amountPaid: number }[];
}): BookingFinancials {
  const totalReceived = input.payments.reduce((a, p) => a + p.amount, 0);
  const totalCostDue = input.costs.reduce((a, c) => a + c.amountDue, 0);
  const totalCostPaid = input.costs.reduce((a, c) => a + c.amountPaid, 0);

  // Once real costs exist, trust them over the quote estimate.
  const effectiveCost = totalCostDue > 0 ? totalCostDue : input.totalNet;

  const quotedProfit = input.totalSell - input.totalNet;
  const actualProfit = input.totalSell - effectiveCost;

  const pct = (profit: number) =>
    input.totalSell > 0 ? (profit / input.totalSell) * 100 : 0;

  return {
    totalSell: input.totalSell,
    totalNet: input.totalNet,
    totalReceived,
    totalCostPaid,
    totalCostDue,

    balanceDue: Math.max(0, input.totalSell - totalReceived),
    vendorOutstanding: Math.max(0, totalCostDue - totalCostPaid),

    quotedProfit,
    quotedMarginPercent: pct(quotedProfit),

    actualProfit,
    actualMarginPercent: pct(actualProfit),

    marginVariance: actualProfit - quotedProfit,

    netCashPosition: totalReceived - totalCostPaid,

    fullyPaid: totalReceived >= input.totalSell && input.totalSell > 0,
    overpaid: totalReceived > input.totalSell,
  };
}

/** Payment progress drives status, but never overrides a manual end state. */
export function deriveStatus(
  current: string,
  totalSell: number,
  totalReceived: number,
): string {
  const terminal = ['CANCELLED', 'COMPLETED', 'IN_PROGRESS'];
  if (terminal.includes(current)) return current;
  if (totalSell > 0 && totalReceived >= totalSell) return 'PAID';
  if (totalReceived > 0) return 'PARTIALLY_PAID';
  return current === 'PENDING' ? 'PENDING' : 'CONFIRMED';
}
EOF
ok "booking-math.ts"

# ============================================================================
# 3. DTOs
# ============================================================================
say "Writing booking DTOs"

cat > src/bookings/dto/create-booking.dto.ts << 'EOF'
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateBookingDto {
  /** Build from an accepted quote tier — pricing is snapshotted from it. */
  @IsOptional() @IsString() quoteOptionId?: string;

  /** Required only when NOT building from a quote option. */
  @IsOptional() @IsString() leadId?: string;

  @IsOptional() @IsString() @MaxLength(200) packageName?: string;
  @IsOptional() @IsDateString() travelStartDate?: string;
  @IsOptional() @IsDateString() travelEndDate?: string;

  @IsOptional() @IsInt() @Min(1) adults?: number;
  @IsOptional() @IsInt() @Min(0) children?: number;
  @IsOptional() @IsInt() @Min(0) nights?: number;

  /** Only used for a manual booking with no quote behind it. */
  @IsOptional() @IsInt() @Min(0) totalSell?: number;
  @IsOptional() @IsInt() @Min(0) totalNet?: number;

  @IsOptional() @IsString() @MaxLength(4000) notes?: string;
}
EOF

cat > src/bookings/dto/update-booking.dto.ts << 'EOF'
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { BookingStatus } from '@prisma/client';

export class UpdateBookingDto {
  @IsOptional() @IsEnum(BookingStatus) status?: BookingStatus;
  @IsOptional() @IsString() @MaxLength(200) packageName?: string;
  @IsOptional() @IsDateString() travelStartDate?: string;
  @IsOptional() @IsDateString() travelEndDate?: string;
  @IsOptional() @IsInt() @Min(1) adults?: number;
  @IsOptional() @IsInt() @Min(0) children?: number;
  @IsOptional() @IsInt() @Min(0) nights?: number;
  @IsOptional() @IsInt() @Min(0) totalSell?: number;
  @IsOptional() @IsString() @MaxLength(4000) notes?: string;
  @IsOptional() @IsString() @MaxLength(500) cancelledReason?: string;
}
EOF

cat > src/bookings/dto/create-payment.dto.ts << 'EOF'
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { PaymentMode } from '@prisma/client';

export class CreatePaymentDto {
  @IsInt() @Min(1) amount: number;

  @IsOptional() @IsEnum(PaymentMode) mode?: PaymentMode;
  @IsOptional() @IsString() @MaxLength(200) reference?: string;
  @IsOptional() @IsDateString() receivedAt?: string;
  @IsOptional() @IsString() @MaxLength(1000) notes?: string;
  /** Records the amount as money going back out to the client. */
  @IsOptional() @IsBoolean() isRefund?: boolean;
}
EOF

cat > src/bookings/dto/create-cost.dto.ts << 'EOF'
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateCostDto {
  @IsString() @MinLength(1) @MaxLength(300) description: string;

  @IsOptional() @IsString() vendorId?: string;

  @IsInt() @Min(0) amountDue: number;
  @IsOptional() @IsInt() @Min(0) amountPaid?: number;
  @IsOptional() @IsDateString() paidAt?: string;
  @IsOptional() @IsString() @MaxLength(200) reference?: string;
  @IsOptional() @IsString() @MaxLength(1000) notes?: string;
}
EOF

cat > src/bookings/dto/update-cost.dto.ts << 'EOF'
import { PartialType } from '@nestjs/mapped-types';
import { CreateCostDto } from './create-cost.dto';

export class UpdateCostDto extends PartialType(CreateCostDto) {}
EOF

cat > src/bookings/dto/query-bookings.dto.ts << 'EOF'
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { BookingStatus } from '@prisma/client';

export class QueryBookingsDto {
  @IsOptional() @IsEnum(BookingStatus) status?: BookingStatus;
  @IsOptional() @IsString() leadId?: string;
  /** matches booking number or package name */
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsDateString() from?: string;
  @IsOptional() @IsDateString() to?: string;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit?: number;
}
EOF
ok "bookings/dto/*"

# ============================================================================
# 4. SERVICE
# ============================================================================
say "Writing bookings service"

cat > src/bookings/bookings.service.ts << 'EOF'
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
  QuoteStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { CreateCostDto } from './dto/create-cost.dto';
import { UpdateCostDto } from './dto/update-cost.dto';
import { QueryBookingsDto } from './dto/query-bookings.dto';
import { computeBookingFinancials, deriveStatus } from './booking-math';

@Injectable()
export class BookingsService {
  constructor(private readonly prisma: PrismaService) {}

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

  async create(dto: CreateBookingDto, userId?: string) {
    let leadId = dto.leadId;
    let totalSell = dto.totalSell ?? 0;
    let totalNet = dto.totalNet ?? 0;
    let quoteId: string | null = null;
    let packageName = dto.packageName ?? null;
    let adults = dto.adults ?? 2;
    let children = dto.children ?? 0;
    let nights = dto.nights ?? 0;

    // --- build from a quote tier: snapshot its numbers ---
    if (dto.quoteOptionId) {
      const option = await this.prisma.quoteOption.findUnique({
        where: { id: dto.quoteOptionId },
        include: { quote: true },
      });
      if (!option) throw new NotFoundException('Quote option not found');

      leadId = option.quote.leadId;
      quoteId = option.quoteId;
      totalSell = option.totalSell;
      totalNet = option.totalNet;
      packageName =
        packageName ?? `${option.quote.title ?? 'Package'} — ${option.name}`;
      adults = dto.adults ?? option.adults;
      children = dto.children ?? option.children;
      nights = dto.nights ?? option.nights;

      if (totalSell <= 0) {
        throw new BadRequestException(
          'That quote tier has no priced lines yet — add lines before booking.',
        );
      }
    }

    if (!leadId) {
      throw new BadRequestException(
        'Provide either quoteOptionId or leadId.',
      );
    }

    const lead = await this.prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) throw new NotFoundException('Lead not found');

    const booking = await this.prisma.booking.create({
      data: {
        bookingNumber: await this.nextBookingNumber(),
        leadId,
        quoteId,
        quoteOptionId: dto.quoteOptionId ?? null,
        createdById: userId ?? null,
        status: BookingStatus.CONFIRMED,
        packageName,
        travelStartDate: dto.travelStartDate
          ? new Date(dto.travelStartDate)
          : null,
        travelEndDate: dto.travelEndDate ? new Date(dto.travelEndDate) : null,
        adults,
        children,
        nights,
        totalSell,
        totalNet,
        notes: dto.notes ?? null,
      },
    });

    // pipeline side-effects
    await this.prisma.lead.update({
      where: { id: leadId },
      data: { status: LeadStatus.CONFIRMED },
    });
    if (quoteId) {
      await this.prisma.quote.update({
        where: { id: quoteId },
        data: { status: QuoteStatus.ACCEPTED },
      });
    }
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

  async findAll(q: QueryBookingsDto) {
    const page = q.page ?? 1;
    const limit = q.limit ?? 25;

    const where: Prisma.BookingWhereInput = {};
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

  async findOne(id: string) {
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

  async update(id: string, dto: UpdateBookingDto, userId?: string) {
    const booking = await this.prisma.booking.findUnique({ where: { id } });
    if (!booking) throw new NotFoundException('Booking not found');

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
      data.travelStartDate = new Date(dto.travelStartDate);
    if (dto.travelEndDate !== undefined)
      data.travelEndDate = new Date(dto.travelEndDate);

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

    return this.findOne(id);
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
    return this.findOne(bookingId);
  }

  async removePayment(paymentId: string) {
    const payment = await this.prisma.bookingPayment.findUnique({
      where: { id: paymentId },
    });
    if (!payment) throw new NotFoundException('Payment not found');
    await this.prisma.bookingPayment.delete({ where: { id: paymentId } });
    await this.refresh(payment.bookingId);
    return this.findOne(payment.bookingId);
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
    return this.findOne(bookingId);
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
    return this.findOne(cost.bookingId);
  }

  async removeCost(costId: string) {
    const cost = await this.prisma.bookingCost.findUnique({
      where: { id: costId },
    });
    if (!cost) throw new NotFoundException('Cost not found');
    await this.prisma.bookingCost.delete({ where: { id: costId } });
    await this.refresh(cost.bookingId);
    return this.findOne(cost.bookingId);
  }

  /** Copy the quote's lines in as expected vendor costs — no retyping. */
  async seedCostsFromQuote(bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { costs: true },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    if (!booking.quoteOptionId) {
      throw new BadRequestException('This booking was not created from a quote.');
    }
    if (booking.costs.length > 0) {
      throw new BadRequestException(
        'Costs already exist on this booking — add them individually instead.',
      );
    }

    const lines = await this.prisma.quoteLine.findMany({
      where: { optionId: booking.quoteOptionId },
      orderBy: { sortOrder: 'asc' },
    });

    for (const l of lines) {
      await this.prisma.bookingCost.create({
        data: {
          bookingId,
          vendorId: l.vendorId,
          description: l.description,
          amountDue: l.lineNet,
          amountPaid: 0,
        },
      });
    }

    await this.refresh(bookingId);
    return this.findOne(bookingId);
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
EOF
ok "bookings.service.ts"

# ============================================================================
# 5. CONTROLLER
# ============================================================================
say "Writing bookings controller"

cat > src/bookings/bookings.controller.ts << 'EOF'
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { CreateCostDto } from './dto/create-cost.dto';
import { UpdateCostDto } from './dto/update-cost.dto';
import { QueryBookingsDto } from './dto/query-bookings.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { LEAD_MODULE_ROLES } from '../common/access';

/** Money movements are restricted to finance-capable roles. */
const FINANCE_ROLES: Role[] = [
  Role.SUPER_ADMIN,
  Role.OWNER,
  Role.ACCOUNTS,
  Role.OPERATIONS,
];

@Roles(...LEAD_MODULE_ROLES)
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookings: BookingsService) {}

  @Post()
  create(@Body() dto: CreateBookingDto, @CurrentUser('id') userId: string) {
    return this.bookings.create(dto, userId);
  }

  @Get()
  findAll(@Query() q: QueryBookingsDto) {
    return this.bookings.findAll(q);
  }

  @Roles(...FINANCE_ROLES, Role.SALES_MANAGER)
  @Get('stats')
  stats(@Query('from') from?: string, @Query('to') to?: string) {
    return this.bookings.stats(from, to);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.bookings.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateBookingDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.bookings.update(id, dto, userId);
  }

  // --- payments ------------------------------------------------------------

  @Roles(...FINANCE_ROLES)
  @Post(':id/payments')
  addPayment(
    @Param('id') id: string,
    @Body() dto: CreatePaymentDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.bookings.addPayment(id, dto, userId);
  }

  @Roles(...FINANCE_ROLES)
  @Delete('payments/:paymentId')
  removePayment(@Param('paymentId') paymentId: string) {
    return this.bookings.removePayment(paymentId);
  }

  // --- vendor costs --------------------------------------------------------

  @Roles(...FINANCE_ROLES)
  @Post(':id/costs')
  addCost(@Param('id') id: string, @Body() dto: CreateCostDto) {
    return this.bookings.addCost(id, dto);
  }

  /** Pull the quote's lines in as expected vendor costs. */
  @Roles(...FINANCE_ROLES)
  @Post(':id/costs/from-quote')
  seedCosts(@Param('id') id: string) {
    return this.bookings.seedCostsFromQuote(id);
  }

  @Roles(...FINANCE_ROLES)
  @Patch('costs/:costId')
  updateCost(@Param('costId') costId: string, @Body() dto: UpdateCostDto) {
    return this.bookings.updateCost(costId, dto);
  }

  @Roles(...FINANCE_ROLES)
  @Delete('costs/:costId')
  removeCost(@Param('costId') costId: string) {
    return this.bookings.removeCost(costId);
  }
}
EOF

cat > src/bookings/bookings.module.ts << 'EOF'
import { Module } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';

@Module({
  controllers: [BookingsController],
  providers: [BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}
EOF
ok "bookings.controller.ts + module"

# ============================================================================
# 6. WIRE UP
# ============================================================================
say "Registering BookingsModule"
cat > .glitz-patch.cjs << 'NODEEOF'
const fs = require('fs');
const p = 'src/app.module.ts';
let s = fs.readFileSync(p, 'utf8');
if (s.includes('BookingsModule')) {
  console.log('  already registered');
} else {
  s = s.replace(
    "import { QuotesModule } from './quotes/quotes.module';",
    "import { QuotesModule } from './quotes/quotes.module';\n" +
    "import { BookingsModule } from './bookings/bookings.module';"
  );
  s = s.replace('    QuotesModule,\n', '    QuotesModule,\n    BookingsModule,\n');
  fs.writeFileSync(p, s);
  console.log('  registered');
}
NODEEOF
node .glitz-patch.cjs || die "failed to register BookingsModule"
rm -f .glitz-patch.cjs
ok "app.module.ts"

# ============================================================================
# 7. GENERATE -> MIGRATE -> BUILD -> COMMIT
# ============================================================================
say "Generating Prisma client"
npx prisma generate || die "prisma generate failed (is 'npm run start:dev' still running? stop it first)"

if [ "${SKIP_MIGRATE:-0}" != "1" ]; then
  say "Running migration (Booking + BookingPayment + BookingCost)"
  npx prisma migrate dev --name bookings || die "Migration failed. Check DIRECT_URL, then: npx prisma migrate dev --name bookings"
  ok "migration applied"
fi

if [ "${SKIP_BUILD:-0}" != "1" ]; then
  say "Type-checking (nest build)"
  npm run build || die "Build failed — nothing committed."
  ok "build passed"
fi

say "Committing"
if git rev-parse --git-dir >/dev/null 2>&1; then
  git add -A
  git commit -qm "Phase 6: bookings, payments, vendor costs, quoted vs actual margin" || warn "commit skipped"
  ok "committed"
fi

say "PHASE 6 COMPLETE"
cat << 'EOF'

Test it:

  npm run start:dev

  LOGIN=$(curl -s -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@glitz.local","password":"YOUR-PASSWORD"}')
  TOKEN=$(echo "$LOGIN" | sed -n 's/.*"access_token":"\([^"]*\)".*/\1/p')
  AUTH="Authorization: Bearer $TOKEN"
  JSON="Content-Type: application/json"

  # 1) Confirm a booking from a priced quote tier (snapshot is taken here)
  curl -X POST http://localhost:3000/api/bookings -H "$AUTH" -H "$JSON" \
    -d '{"quoteOptionId":"OPTION_ID","travelStartDate":"2026-10-12",
         "travelEndDate":"2026-10-17"}'
  # -> BOOKING_ID + GLZ-B-2026-0001; lead becomes CONFIRMED, quote ACCEPTED

  # 2) Pull the quote lines in as expected vendor costs
  curl -X POST http://localhost:3000/api/bookings/BOOKING_ID/costs/from-quote -H "$AUTH"

  # 3) Record the advance
  curl -X POST http://localhost:3000/api/bookings/BOOKING_ID/payments -H "$AUTH" -H "$JSON" \
    -d '{"amount":25000,"mode":"UPI","reference":"UPI-8891","notes":"Advance"}'
  # -> status becomes PARTIALLY_PAID, balanceDue drops

  # 4) A cost comes in higher than quoted (this is the interesting case)
  curl -X PATCH http://localhost:3000/api/bookings/costs/COST_ID -H "$AUTH" -H "$JSON" \
    -d '{"amountDue":41000,"amountPaid":41000,"paidAt":"2026-10-13"}'

  # 5) The payoff — quoted vs actual margin on this file
  curl http://localhost:3000/api/bookings/BOOKING_ID -H "$AUTH"

  # financials returns:
  #   balanceDue          client still owes you
  #   vendorOutstanding   you still owe vendors
  #   quotedProfit  / quotedMarginPercent   what you expected
  #   actualProfit  / actualMarginPercent   what you're actually making
  #   marginVariance      negative = the file is eroding
  #   netCashPosition     cash in hand on this file right now

  # 6) Business-wide view
  curl "http://localhost:3000/api/bookings/stats" -H "$AUTH"

Confirmed when: recording a payment flips status to PARTIALLY_PAID then PAID,
and raising a cost above quote pushes marginVariance negative.
EOF
