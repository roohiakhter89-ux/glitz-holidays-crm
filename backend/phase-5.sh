#!/usr/bin/env bash
# ==============================================================================
# Glitz Holidays CRM — Backend  |  PHASE 5: Pricing Settings + Quotations
# ------------------------------------------------------------------------------
# Adds:
#   * PricingSettings (singleton) — default markup, per-service-type markup,
#     minimum margin policy, monthly overhead + files/month (break-even),
#     GST %, rounding.
#   * Quote -> many QuoteOption (tiers: Budget / Standard / Deluxe / anything)
#           -> many QuoteLine  (hotel nights, transport days, activities...)
#   * Markup resolution chain (most specific wins):
#         line override -> option override -> per-service-type -> global default
#     A single global % behaves exactly like "flat markup on total"
#     (percentages are linear), so one mechanism covers both styles.
#   * Stores NET and SELL on every line -> real margin per line and per tier.
#   * Reports BOTH markup% (profit/cost) and margin% (profit/sell) — they are
#     different numbers and confusing them is how DMCs underprice.
#   * Margin advisory: warns when a tier is below your minimum margin or below
#     your break-even cost per file.
#
# RUN FROM INSIDE YOUR BACKEND FOLDER:
#   cd glitz/backend
#   bash phase-5.sh
#
# No new npm packages. Runs a migration. Type-checks before committing.
# Options: SKIP_BUILD=1  SKIP_MIGRATE=1
# ==============================================================================
set -euo pipefail

say()  { printf "\n\033[1;36m==>\033[0m %s\n" "$1"; }
ok()   { printf "\033[1;32m  ok\033[0m %s\n" "$1"; }
warn() { printf "\033[1;33m  ! \033[0m %s\n" "$1"; }
die()  { printf "\033[1;31m  x \033[0m %s\n" "$1"; exit 1; }

say "Checking this is the backend folder"
[ -f package.json ] || die "No package.json here. cd into glitz/backend and re-run."
[ -d src/vendors ] || die "src/vendors missing — run phase-4.sh first."
ok "backend confirmed ($(pwd))"

mkdir -p src/quotes/dto src/settings/dto

# ============================================================================
# 0. REPAIR PHASE 4 (its patches used python3, which Windows may not have)
# ============================================================================
say "Verifying Phase 4 patches actually applied"

NEED_REPAIR=0
grep -q "assertCanTouch" src/leads/leads.service.ts || NEED_REPAIR=1
grep -q "VendorsModule" src/app.module.ts || NEED_REPAIR=1

if [ "$NEED_REPAIR" = "1" ]; then
  warn "Phase 4 patches are MISSING (python3 was unavailable) — repairing now."

  cat > .glitz-repair.cjs << 'NODEEOF'
const fs = require('fs');

// ---- 1. leads.service.ts: role-scoped visibility -------------------------
const lp = 'src/leads/leads.service.ts';
let s = fs.readFileSync(lp, 'utf8');

if (!s.includes('assertCanTouch')) {
  s = s.replace(
    "import { Injectable, NotFoundException } from '@nestjs/common';",
    "import {\n  ForbiddenException,\n  Injectable,\n  NotFoundException,\n} from '@nestjs/common';"
  );
  s = s.replace(
    "import { scoreLead } from './lead-scoring';",
    "import { scoreLead } from './lead-scoring';\nimport { Actor, canSeeAllLeads } from '../common/access';"
  );
  s = s.replace(
    '  /** Normalise a phone to digits',
    "  /**\n   * Sales execs may only touch leads assigned to them.\n   * 404 (not 403) so they cannot probe which lead ids exist.\n   */\n  private assertCanTouch(lead: { assignedToId: string | null }, actor: Actor) {\n    if (canSeeAllLeads(actor.role)) return;\n    if (lead.assignedToId !== actor.id) {\n      throw new NotFoundException('Lead not found');\n    }\n  }\n\n  /** Normalise a phone to digits"
  );
  s = s.replace(
    '  async findAll(q: QueryLeadsDto) {',
    '  async findAll(q: QueryLeadsDto, actor: Actor) {'
  );
  s = s.replace(
    '    const where: Prisma.LeadWhereInput = {};\n    if (q.status) where.status = q.status;',
    '    const where: Prisma.LeadWhereInput = {};\n\n    // Sales execs are hard-scoped to their own leads — a query param\n    // cannot widen this.\n    if (!canSeeAllLeads(actor.role)) {\n      where.assignedToId = actor.id;\n    } else if (q.assignedToId) {\n      where.assignedToId = q.assignedToId;\n    }\n\n    if (q.status) where.status = q.status;'
  );
  s = s.replace('    if (q.assignedToId) where.assignedToId = q.assignedToId;\n', '');
  s = s.replace('  async findOne(id: string) {', '  async findOne(id: string, actor: Actor) {');
  s = s.replace(
    "    if (!lead) throw new NotFoundException('Lead not found');\n    return lead;",
    "    if (!lead) throw new NotFoundException('Lead not found');\n    this.assertCanTouch(lead, actor);\n    return lead;"
  );
  s = s.replace(
    "  async update(id: string, dto: UpdateLeadDto, actorId?: string) {\n    const lead = await this.prisma.lead.findUnique({ where: { id } });\n    if (!lead) throw new NotFoundException('Lead not found');",
    "  async update(id: string, dto: UpdateLeadDto, actor: Actor) {\n    const actorId = actor.id;\n    const lead = await this.prisma.lead.findUnique({ where: { id } });\n    if (!lead) throw new NotFoundException('Lead not found');\n    this.assertCanTouch(lead, actor);\n\n    // Execs must not reassign leads away from themselves.\n    if (!canSeeAllLeads(actor.role) && dto.assignedToId !== undefined) {\n      throw new ForbiddenException('You cannot reassign leads');\n    }"
  );
  s = s.replace(
    "  async addActivity(leadId: string, dto: CreateActivityDto, actorId?: string) {\n    const lead = await this.prisma.lead.findUnique({ where: { id: leadId } });\n    if (!lead) throw new NotFoundException('Lead not found');",
    "  async addActivity(leadId: string, dto: CreateActivityDto, actor: Actor) {\n    const actorId = actor.id;\n    const lead = await this.prisma.lead.findUnique({ where: { id: leadId } });\n    if (!lead) throw new NotFoundException('Lead not found');\n    this.assertCanTouch(lead, actor);"
  );
  s = s.replace(
    "  async stats() {\n    const [byStatus, bySource, total, unassigned] = await Promise.all([\n      this.prisma.lead.groupBy({ by: ['status'], _count: { _all: true } }),\n      this.prisma.lead.groupBy({ by: ['source'], _count: { _all: true } }),\n      this.prisma.lead.count(),\n      this.prisma.lead.count({ where: { assignedToId: null } }),\n    ]);",
    "  async stats(actor: Actor) {\n    const scope: Prisma.LeadWhereInput = canSeeAllLeads(actor.role)\n      ? {}\n      : { assignedToId: actor.id };\n\n    const [byStatus, bySource, total, unassigned] = await Promise.all([\n      this.prisma.lead.groupBy({\n        by: ['status'],\n        where: scope,\n        _count: { _all: true },\n      }),\n      this.prisma.lead.groupBy({\n        by: ['source'],\n        where: scope,\n        _count: { _all: true },\n      }),\n      this.prisma.lead.count({ where: scope }),\n      this.prisma.lead.count({ where: { ...scope, assignedToId: null } }),\n    ]);"
  );
  fs.writeFileSync(lp, s);
  console.log('  repaired leads.service.ts');
}

// ---- 2. app.module.ts: VendorsModule -------------------------------------
const ap = 'src/app.module.ts';
let a = fs.readFileSync(ap, 'utf8');
if (!a.includes('VendorsModule')) {
  a = a.replace(
    "import { LeadsModule } from './leads/leads.module';",
    "import { LeadsModule } from './leads/leads.module';\nimport { VendorsModule } from './vendors/vendors.module';"
  );
  a = a.replace('    LeadsModule,\n', '    LeadsModule,\n    VendorsModule,\n');
  fs.writeFileSync(ap, a);
  console.log('  repaired app.module.ts (VendorsModule)');
}
NODEEOF
  node .glitz-repair.cjs || die "Phase 4 repair failed"
  rm -f .glitz-repair.cjs

  # Phase 4 aborted before rewriting the controller — write it now.
  cat > src/leads/leads.controller.ts << 'CTRLEOF'
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { LeadsService } from './leads.service';
import { CaptureLeadDto } from './dto/capture-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { CreateActivityDto } from './dto/create-activity.dto';
import { QueryLeadsDto } from './dto/query-leads.dto';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Actor, LEAD_MODULE_ROLES } from '../common/access';

function detectDevice(ua: string): string {
  const s = ua.toLowerCase();
  if (/ipad|tablet/.test(s)) return 'tablet';
  if (/mobi|android|iphone/.test(s)) return 'mobile';
  return 'desktop';
}

@Controller('leads')
export class LeadsController {
  constructor(private readonly leads: LeadsService) {}

  /** PUBLIC + rate limited. Landing pages / ads / WhatsApp post here. */
  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('capture')
  capture(@Body() dto: CaptureLeadDto, @Req() req: any) {
    const userAgent: string = req.headers['user-agent'] ?? '';
    const forwarded: string = req.headers['x-forwarded-for'] ?? '';
    const ipAddress =
      (typeof forwarded === 'string' && forwarded.split(',')[0].trim()) ||
      req.ip ||
      undefined;

    return this.leads.capture(dto, {
      ipAddress,
      userAgent,
      device: detectDevice(userAgent),
    });
  }

  @Roles(...LEAD_MODULE_ROLES)
  @Get()
  findAll(@Query() q: QueryLeadsDto, @CurrentUser() actor: Actor) {
    return this.leads.findAll(q, actor);
  }

  @Roles(...LEAD_MODULE_ROLES)
  @Get('stats')
  stats(@CurrentUser() actor: Actor) {
    return this.leads.stats(actor);
  }

  @Roles(...LEAD_MODULE_ROLES)
  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() actor: Actor) {
    return this.leads.findOne(id, actor);
  }

  @Roles(...LEAD_MODULE_ROLES)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateLeadDto,
    @CurrentUser() actor: Actor,
  ) {
    return this.leads.update(id, dto, actor);
  }

  @Roles(...LEAD_MODULE_ROLES)
  @Post(':id/activities')
  addActivity(
    @Param('id') id: string,
    @Body() dto: CreateActivityDto,
    @CurrentUser() actor: Actor,
  ) {
    return this.leads.addActivity(id, dto, actor);
  }
}
CTRLEOF
  ok "leads.controller.ts rewritten"
  ok "Phase 4 repaired"
else
  ok "Phase 4 patches present"
fi

# ============================================================================
# 1. SCHEMA
# ============================================================================
say "Updating Prisma schema (PricingSettings + Quote + QuoteOption + QuoteLine)"

if grep -q "model QuoteOption" prisma/schema.prisma; then
  warn "Phase 5 schema already present — skipping append (safe re-run)."
else
cp prisma/schema.prisma "prisma/schema.prisma.bak.$(date +%s)"

cat >> prisma/schema.prisma << 'EOF'

// ============================================================================
// PHASE 5 — Pricing + Quotations
// ============================================================================

enum ServiceType {
  HOTEL
  TRANSPORT
  ACTIVITY
  FLIGHT
  GUIDE
  MEAL
  PERMIT
  MISC
}

enum MarkupMode {
  /// Use the option / service-type / global default (the normal case).
  INHERIT
  /// Percentage on this line's net cost.
  PERCENT
  /// Flat amount added on top of this line's net cost.
  FIXED
  /// Operator types the sell price directly; margin is derived.
  MANUAL
}

enum QuoteStatus {
  DRAFT
  SENT
  ACCEPTED
  REJECTED
  EXPIRED
  REVISED
}

/// Singleton config row (id is always "default").
model PricingSettings {
  id String @id @default("default")

  /// Fallback markup % when nothing more specific is set.
  defaultMarkupPercent Float @default(20)

  /// Per-service-type overrides. Null = fall back to defaultMarkupPercent.
  hotelMarkupPercent     Float?
  transportMarkupPercent Float?
  activityMarkupPercent  Float?
  flightMarkupPercent    Float?
  guideMarkupPercent     Float?
  mealMarkupPercent      Float?
  permitMarkupPercent    Float?
  miscMarkupPercent      Float?

  /// Policy: minimum acceptable MARGIN % (profit / sell price).
  minMarginPercent Float @default(15)

  /// Break-even inputs. Without these the advisory can only check margin %.
  monthlyOverhead Int?
  filesPerMonth   Int?

  gstPercent Float @default(5)
  /// Round sell prices to the nearest N rupees (0 = no rounding).
  roundTo    Int   @default(10)

  currency  String   @default("INR")
  updatedAt DateTime @updatedAt
}

model Quote {
  id          String      @id @default(cuid())
  quoteNumber String      @unique
  title       String?
  status      QuoteStatus @default(DRAFT)

  leadId String
  lead   Lead   @relation(fields: [leadId], references: [id], onDelete: Cascade)

  createdById String?
  createdBy   User?   @relation("QuoteCreator", fields: [createdById], references: [id], onDelete: SetNull)

  validUntil DateTime?
  notes      String?
  terms      String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  options QuoteOption[]

  @@index([leadId])
  @@index([status])
}

/// A package tier the client can choose between (Budget / Standard / Deluxe...).
model QuoteOption {
  id      String @id @default(cuid())
  quoteId String
  quote   Quote  @relation(fields: [quoteId], references: [id], onDelete: Cascade)

  name          String
  sortOrder     Int     @default(0)
  isRecommended Boolean @default(false)

  adults   Int @default(2)
  children Int @default(0)
  nights   Int @default(0)

  /// Option-level markup override. Null = use service-type / global default.
  markupPercent Float?

  // --- computed on every save (denormalised so lists stay fast) ---
  totalNet      Int   @default(0)
  totalSell     Int   @default(0)
  totalMargin   Int   @default(0)
  /// profit / sell  * 100
  marginPercent Float @default(0)
  /// profit / cost  * 100  (NOT the same number as marginPercent)
  markupPercentEffective Float @default(0)
  perPersonSell Int   @default(0)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  lines QuoteLine[]

  @@index([quoteId])
}

model QuoteLine {
  id       String      @id @default(cuid())
  optionId String
  option   QuoteOption @relation(fields: [optionId], references: [id], onDelete: Cascade)

  serviceType ServiceType @default(HOTEL)
  description String

  vendorId     String?
  vendorRateId String?

  /// e.g. 2 rooms / 1 vehicle
  quantity Int @default(1)
  /// e.g. 3 nights / 4 days
  units    Int @default(1)
  /// net cost per unit per quantity
  unitNet  Int

  markupMode  MarkupMode @default(INHERIT)
  /// percent when PERCENT, rupees when FIXED, total sell when MANUAL
  markupValue Float?

  // --- computed ---
  lineNet  Int @default(0)
  lineSell Int @default(0)

  sortOrder Int     @default(0)
  notes     String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([optionId])
}
EOF

  ok "schema blocks appended"
fi

# add back-relations (Node — Windows has no python3)
cat > .glitz-patch.cjs << 'NODEEOF'
const fs = require('fs');
const p = 'prisma/schema.prisma';
let s = fs.readFileSync(p, 'utf8');
let changed = false;
if (!s.includes('quotes     Quote[]')) {
  s = s.replace(
    '  activities Activity[]\n\n  @@index([status])',
    '  activities Activity[]\n  quotes     Quote[]\n\n  @@index([status])'
  );
  changed = true;
}
if (!s.includes('createdQuotes')) {
  s = s.replace(
    '  assignedLeads Lead[]     @relation("LeadAssignee")',
    '  assignedLeads Lead[]     @relation("LeadAssignee")\n  createdQuotes Quote[]    @relation("QuoteCreator")'
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
# 2. PRICING ENGINE (isolated + pure, so it is testable and tunable)
# ============================================================================
say "Writing pricing engine"

cat > src/quotes/pricing.ts << 'EOF'
import { MarkupMode, ServiceType } from '@prisma/client';

/**
 * Pure pricing functions — no database, no Nest. Easy to reason about and
 * easy to change when your commercial policy changes.
 *
 * IMPORTANT VOCABULARY (these are different numbers):
 *   markup% = profit / COST   -> ₹10,000 cost + 20% markup = ₹12,000 sell
 *   margin% = profit / SELL   -> that same deal is a 16.7% margin
 * Treating them as interchangeable is how tour operators quietly underprice.
 */

export interface SettingsLike {
  defaultMarkupPercent: number;
  hotelMarkupPercent?: number | null;
  transportMarkupPercent?: number | null;
  activityMarkupPercent?: number | null;
  flightMarkupPercent?: number | null;
  guideMarkupPercent?: number | null;
  mealMarkupPercent?: number | null;
  permitMarkupPercent?: number | null;
  miscMarkupPercent?: number | null;
  minMarginPercent: number;
  monthlyOverhead?: number | null;
  filesPerMonth?: number | null;
  roundTo: number;
}

export interface LineLike {
  serviceType: ServiceType;
  quantity: number;
  units: number;
  unitNet: number;
  markupMode: MarkupMode;
  markupValue?: number | null;
}

/** Per-service-type default, falling back to the global default. */
export function serviceTypeMarkup(
  type: ServiceType,
  s: SettingsLike,
): number {
  const map: Record<ServiceType, number | null | undefined> = {
    HOTEL: s.hotelMarkupPercent,
    TRANSPORT: s.transportMarkupPercent,
    ACTIVITY: s.activityMarkupPercent,
    FLIGHT: s.flightMarkupPercent,
    GUIDE: s.guideMarkupPercent,
    MEAL: s.mealMarkupPercent,
    PERMIT: s.permitMarkupPercent,
    MISC: s.miscMarkupPercent,
  };
  const v = map[type];
  return v === null || v === undefined ? s.defaultMarkupPercent : v;
}

export function roundTo(value: number, nearest: number): number {
  if (!nearest || nearest <= 1) return Math.round(value);
  return Math.round(value / nearest) * nearest;
}

/**
 * Resolution chain, most specific wins:
 *   line override -> option override -> service-type default -> global default
 */
export function computeLine(
  line: LineLike,
  settings: SettingsLike,
  optionMarkupPercent?: number | null,
): { lineNet: number; lineSell: number; resolvedPercent: number } {
  const lineNet = Math.round(line.unitNet * line.quantity * line.units);

  if (line.markupMode === MarkupMode.MANUAL) {
    const lineSell = roundTo(line.markupValue ?? lineNet, settings.roundTo);
    return {
      lineNet,
      lineSell,
      resolvedPercent: lineNet > 0 ? ((lineSell - lineNet) / lineNet) * 100 : 0,
    };
  }

  if (line.markupMode === MarkupMode.FIXED) {
    const lineSell = roundTo(lineNet + (line.markupValue ?? 0), settings.roundTo);
    return {
      lineNet,
      lineSell,
      resolvedPercent: lineNet > 0 ? ((lineSell - lineNet) / lineNet) * 100 : 0,
    };
  }

  const pct =
    line.markupMode === MarkupMode.PERCENT && line.markupValue !== null && line.markupValue !== undefined
      ? line.markupValue
      : optionMarkupPercent !== null && optionMarkupPercent !== undefined
        ? optionMarkupPercent
        : serviceTypeMarkup(line.serviceType, settings);

  const lineSell = roundTo(lineNet * (1 + pct / 100), settings.roundTo);
  return { lineNet, lineSell, resolvedPercent: pct };
}

export interface OptionTotals {
  totalNet: number;
  totalSell: number;
  totalMargin: number;
  /** profit / sell */
  marginPercent: number;
  /** profit / cost */
  markupPercentEffective: number;
  perPersonSell: number;
}

export function computeOptionTotals(
  lines: { lineNet: number; lineSell: number }[],
  pax: number,
): OptionTotals {
  const totalNet = lines.reduce((a, l) => a + l.lineNet, 0);
  const totalSell = lines.reduce((a, l) => a + l.lineSell, 0);
  const totalMargin = totalSell - totalNet;

  return {
    totalNet,
    totalSell,
    totalMargin,
    marginPercent: totalSell > 0 ? (totalMargin / totalSell) * 100 : 0,
    markupPercentEffective: totalNet > 0 ? (totalMargin / totalNet) * 100 : 0,
    perPersonSell: pax > 0 ? Math.round(totalSell / pax) : totalSell,
  };
}

export interface Advisory {
  breakEvenPerFile: number | null;
  minSellForPolicy: number;
  minSellForBreakEven: number | null;
  suggestedMinSell: number;
  shortfall: number;
  ok: boolean;
  warnings: string[];
}

/**
 * "What is the least I can sell this at?"
 *
 * Two independent floors:
 *   1. Policy floor  — your minimum margin %.
 *   2. Break-even    — monthlyOverhead / filesPerMonth must be covered by
 *                      this file's gross profit, or the file loses money once
 *                      overheads are counted.
 * The suggestion is the higher of the two. Break-even is only computed if you
 * have entered real overhead numbers in settings — otherwise it is skipped
 * rather than invented.
 */
export function advise(
  totalNet: number,
  totalSell: number,
  s: SettingsLike,
): Advisory {
  const warnings: string[] = [];

  // sell such that (sell - net)/sell = minMargin  =>  sell = net / (1 - m)
  const m = Math.min(0.95, Math.max(0, s.minMarginPercent / 100));
  const minSellForPolicy = m > 0 ? roundTo(totalNet / (1 - m), s.roundTo) : totalNet;

  let breakEvenPerFile: number | null = null;
  let minSellForBreakEven: number | null = null;
  if (s.monthlyOverhead && s.filesPerMonth && s.filesPerMonth > 0) {
    breakEvenPerFile = Math.round(s.monthlyOverhead / s.filesPerMonth);
    minSellForBreakEven = roundTo(totalNet + breakEvenPerFile, s.roundTo);
  } else {
    warnings.push(
      'Break-even not calculated — set monthlyOverhead and filesPerMonth in pricing settings.',
    );
  }

  const suggestedMinSell = Math.max(
    minSellForPolicy,
    minSellForBreakEven ?? 0,
  );

  const marginPct = totalSell > 0 ? ((totalSell - totalNet) / totalSell) * 100 : 0;
  if (marginPct < s.minMarginPercent) {
    warnings.push(
      `Margin ${marginPct.toFixed(1)}% is below your minimum of ${s.minMarginPercent}%.`,
    );
  }
  if (breakEvenPerFile !== null && totalSell - totalNet < breakEvenPerFile) {
    warnings.push(
      `Gross profit does not cover your break-even of ${breakEvenPerFile} per file.`,
    );
  }

  const shortfall = Math.max(0, suggestedMinSell - totalSell);

  return {
    breakEvenPerFile,
    minSellForPolicy,
    minSellForBreakEven,
    suggestedMinSell,
    shortfall,
    ok: warnings.filter((w) => !w.startsWith('Break-even not')).length === 0,
    warnings,
  };
}
EOF
ok "pricing.ts"

# ============================================================================
# 3. SETTINGS module
# ============================================================================
say "Writing pricing settings module"

cat > src/settings/dto/update-pricing.dto.ts << 'EOF'
import { IsInt, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpdatePricingDto {
  @IsOptional() @IsNumber() @Min(0) @Max(500) defaultMarkupPercent?: number;

  @IsOptional() @IsNumber() @Min(0) @Max(500) hotelMarkupPercent?: number;
  @IsOptional() @IsNumber() @Min(0) @Max(500) transportMarkupPercent?: number;
  @IsOptional() @IsNumber() @Min(0) @Max(500) activityMarkupPercent?: number;
  @IsOptional() @IsNumber() @Min(0) @Max(500) flightMarkupPercent?: number;
  @IsOptional() @IsNumber() @Min(0) @Max(500) guideMarkupPercent?: number;
  @IsOptional() @IsNumber() @Min(0) @Max(500) mealMarkupPercent?: number;
  @IsOptional() @IsNumber() @Min(0) @Max(500) permitMarkupPercent?: number;
  @IsOptional() @IsNumber() @Min(0) @Max(500) miscMarkupPercent?: number;

  @IsOptional() @IsNumber() @Min(0) @Max(95) minMarginPercent?: number;

  @IsOptional() @IsInt() @Min(0) monthlyOverhead?: number;
  @IsOptional() @IsInt() @Min(1) filesPerMonth?: number;

  @IsOptional() @IsNumber() @Min(0) @Max(100) gstPercent?: number;
  @IsOptional() @IsInt() @Min(0) roundTo?: number;
  @IsOptional() @IsString() currency?: string;
}
EOF

cat > src/settings/settings.service.ts << 'EOF'
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdatePricingDto } from './dto/update-pricing.dto';

const SINGLETON_ID = 'default';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Always returns a row — creates defaults on first call. */
  async getPricing() {
    const existing = await this.prisma.pricingSettings.findUnique({
      where: { id: SINGLETON_ID },
    });
    if (existing) return existing;
    return this.prisma.pricingSettings.create({ data: { id: SINGLETON_ID } });
  }

  async updatePricing(dto: UpdatePricingDto) {
    await this.getPricing();
    return this.prisma.pricingSettings.update({
      where: { id: SINGLETON_ID },
      data: { ...dto },
    });
  }
}
EOF

cat > src/settings/settings.controller.ts << 'EOF'
import { Body, Controller, Get, Patch } from '@nestjs/common';
import { Role } from '@prisma/client';
import { SettingsService } from './settings.service';
import { UpdatePricingDto } from './dto/update-pricing.dto';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  /** Staff need to read markup policy to understand quote prices. */
  @Get('pricing')
  getPricing() {
    return this.settings.getPricing();
  }

  /** Only the owner sets commercial policy. */
  @Roles(Role.OWNER, Role.SUPER_ADMIN)
  @Patch('pricing')
  updatePricing(@Body() dto: UpdatePricingDto) {
    return this.settings.updatePricing(dto);
  }
}
EOF

cat > src/settings/settings.module.ts << 'EOF'
import { Module } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { SettingsController } from './settings.controller';

@Module({
  controllers: [SettingsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
EOF
ok "settings/*"

# ============================================================================
# 4. QUOTE DTOs
# ============================================================================
say "Writing quote DTOs"

cat > src/quotes/dto/create-quote.dto.ts << 'EOF'
import {
  IsDateString,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateQuoteDto {
  @IsString() leadId: string;

  @IsOptional() @IsString() @MinLength(2) @MaxLength(200) title?: string;
  @IsOptional() @IsDateString() validUntil?: string;
  @IsOptional() @IsString() @MaxLength(4000) notes?: string;
  @IsOptional() @IsString() @MaxLength(8000) terms?: string;
}
EOF

cat > src/quotes/dto/update-quote.dto.ts << 'EOF'
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { QuoteStatus } from '@prisma/client';

export class UpdateQuoteDto {
  @IsOptional() @IsString() @MaxLength(200) title?: string;
  @IsOptional() @IsEnum(QuoteStatus) status?: QuoteStatus;
  @IsOptional() @IsDateString() validUntil?: string;
  @IsOptional() @IsString() @MaxLength(4000) notes?: string;
  @IsOptional() @IsString() @MaxLength(8000) terms?: string;
}
EOF

cat > src/quotes/dto/create-option.dto.ts << 'EOF'
import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateOptionDto {
  /** "Budget", "Standard", "Deluxe" — free text, as many as you like. */
  @IsString() @MinLength(1) @MaxLength(80) name: string;

  @IsOptional() @IsInt() @Min(0) sortOrder?: number;
  @IsOptional() @IsBoolean() isRecommended?: boolean;

  @IsOptional() @IsInt() @Min(1) adults?: number;
  @IsOptional() @IsInt() @Min(0) children?: number;
  @IsOptional() @IsInt() @Min(0) nights?: number;

  /** Option-level markup override. Omit to inherit service-type/global. */
  @IsOptional() @IsNumber() @Min(0) @Max(500) markupPercent?: number;
}
EOF

cat > src/quotes/dto/update-option.dto.ts << 'EOF'
import { PartialType } from '@nestjs/mapped-types';
import { CreateOptionDto } from './create-option.dto';

export class UpdateOptionDto extends PartialType(CreateOptionDto) {}
EOF

cat > src/quotes/dto/create-line.dto.ts << 'EOF'
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { MarkupMode, ServiceType } from '@prisma/client';

export class CreateLineDto {
  @IsEnum(ServiceType) serviceType: ServiceType;

  @IsString() @MinLength(1) @MaxLength(300) description: string;

  @IsOptional() @IsString() vendorId?: string;
  @IsOptional() @IsString() vendorRateId?: string;

  /** rooms / vehicles */
  @IsOptional() @IsInt() @Min(1) quantity?: number;
  /** nights / days */
  @IsOptional() @IsInt() @Min(1) units?: number;

  /** net cost per unit per quantity */
  @IsInt() @Min(0) unitNet: number;

  @IsOptional() @IsEnum(MarkupMode) markupMode?: MarkupMode;
  /** percent when PERCENT, rupees when FIXED, total sell when MANUAL */
  @IsOptional() @IsNumber() @Min(0) markupValue?: number;

  @IsOptional() @IsInt() @Min(0) sortOrder?: number;
  @IsOptional() @IsString() @MaxLength(1000) notes?: string;
}
EOF

cat > src/quotes/dto/update-line.dto.ts << 'EOF'
import { PartialType } from '@nestjs/mapped-types';
import { CreateLineDto } from './create-line.dto';

export class UpdateLineDto extends PartialType(CreateLineDto) {}
EOF
ok "quotes/dto/*"

# ============================================================================
# 5. QUOTES SERVICE
# ============================================================================
say "Writing quotes service"

cat > src/quotes/quotes.service.ts << 'EOF'
import { Injectable, NotFoundException } from '@nestjs/common';
import { ActivityType, LeadStatus, MarkupMode } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { UpdateQuoteDto } from './dto/update-quote.dto';
import { CreateOptionDto } from './dto/create-option.dto';
import { UpdateOptionDto } from './dto/update-option.dto';
import { CreateLineDto } from './dto/create-line.dto';
import { UpdateLineDto } from './dto/update-line.dto';
import {
  advise,
  computeLine,
  computeOptionTotals,
  SettingsLike,
} from './pricing';

@Injectable()
export class QuotesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: SettingsService,
  ) {}

  /** GLZ-2026-0001 style, sequential per year. */
  private async nextQuoteNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `GLZ-${year}-`;
    const last = await this.prisma.quote.findFirst({
      where: { quoteNumber: { startsWith: prefix } },
      orderBy: { quoteNumber: 'desc' },
      select: { quoteNumber: true },
    });
    const n = last ? parseInt(last.quoteNumber.slice(prefix.length), 10) + 1 : 1;
    return `${prefix}${String(n).padStart(4, '0')}`;
  }

  /**
   * Recomputes every line and the option totals. Called after ANY change to
   * a line or option so stored numbers can never drift from the inputs.
   */
  private async recalcOption(optionId: string) {
    const option = await this.prisma.quoteOption.findUnique({
      where: { id: optionId },
      include: { lines: true },
    });
    if (!option) throw new NotFoundException('Option not found');

    const s = (await this.settings.getPricing()) as unknown as SettingsLike;

    for (const line of option.lines) {
      const { lineNet, lineSell } = computeLine(line, s, option.markupPercent);
      if (lineNet !== line.lineNet || lineSell !== line.lineSell) {
        await this.prisma.quoteLine.update({
          where: { id: line.id },
          data: { lineNet, lineSell },
        });
      }
    }

    const fresh = await this.prisma.quoteLine.findMany({
      where: { optionId },
      select: { lineNet: true, lineSell: true },
    });
    const pax = option.adults + option.children;
    const totals = computeOptionTotals(fresh, pax);

    return this.prisma.quoteOption.update({
      where: { id: optionId },
      data: totals,
    });
  }

  // --- quotes --------------------------------------------------------------

  async create(dto: CreateQuoteDto, userId?: string) {
    const lead = await this.prisma.lead.findUnique({
      where: { id: dto.leadId },
    });
    if (!lead) throw new NotFoundException('Lead not found');

    const quote = await this.prisma.quote.create({
      data: {
        quoteNumber: await this.nextQuoteNumber(),
        leadId: dto.leadId,
        title: dto.title ?? null,
        validUntil: dto.validUntil ? new Date(dto.validUntil) : null,
        notes: dto.notes ?? null,
        terms: dto.terms ?? null,
        createdById: userId ?? null,
      },
    });

    await this.prisma.activity.create({
      data: {
        leadId: dto.leadId,
        userId: userId ?? null,
        type: ActivityType.SYSTEM,
        content: `Quote ${quote.quoteNumber} created`,
      },
    });

    return quote;
  }

  findAll(leadId?: string) {
    return this.prisma.quote.findMany({
      where: leadId ? { leadId } : {},
      orderBy: { createdAt: 'desc' },
      include: {
        options: { orderBy: { sortOrder: 'asc' } },
        lead: { select: { id: true, name: true, phone: true } },
      },
    });
  }

  async findOne(id: string) {
    const quote = await this.prisma.quote.findUnique({
      where: { id },
      include: {
        lead: { select: { id: true, name: true, phone: true, email: true } },
        options: {
          orderBy: { sortOrder: 'asc' },
          include: { lines: { orderBy: { sortOrder: 'asc' } } },
        },
      },
    });
    if (!quote) throw new NotFoundException('Quote not found');

    const s = (await this.settings.getPricing()) as unknown as SettingsLike;

    return {
      ...quote,
      options: quote.options.map((o: any) => ({
        ...o,
        advisory: advise(o.totalNet, o.totalSell, s),
      })),
    };
  }

  async update(id: string, dto: UpdateQuoteDto, userId?: string) {
    const quote = await this.prisma.quote.findUnique({ where: { id } });
    if (!quote) throw new NotFoundException('Quote not found');

    const updated = await this.prisma.quote.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
        ...(dto.terms !== undefined ? { terms: dto.terms } : {}),
        ...(dto.validUntil !== undefined
          ? { validUntil: new Date(dto.validUntil) }
          : {}),
      },
    });

    // Sending a quote moves the lead down the pipeline automatically.
    if (dto.status && dto.status !== quote.status) {
      await this.prisma.activity.create({
        data: {
          leadId: quote.leadId,
          userId: userId ?? null,
          type: ActivityType.SYSTEM,
          content: `Quote ${quote.quoteNumber}: ${quote.status} -> ${dto.status}`,
        },
      });
      if (dto.status === 'SENT') {
        await this.prisma.lead.update({
          where: { id: quote.leadId },
          data: { status: LeadStatus.QUOTATION_SENT },
        });
      }
    }

    return updated;
  }

  async remove(id: string) {
    const quote = await this.prisma.quote.findUnique({ where: { id } });
    if (!quote) throw new NotFoundException('Quote not found');
    await this.prisma.quote.delete({ where: { id } });
    return { deleted: true, id };
  }

  // --- options (tiers) -----------------------------------------------------

  async addOption(quoteId: string, dto: CreateOptionDto) {
    const quote = await this.prisma.quote.findUnique({ where: { id: quoteId } });
    if (!quote) throw new NotFoundException('Quote not found');

    const option = await this.prisma.quoteOption.create({
      data: {
        quoteId,
        name: dto.name,
        sortOrder: dto.sortOrder ?? 0,
        isRecommended: dto.isRecommended ?? false,
        adults: dto.adults ?? 2,
        children: dto.children ?? 0,
        nights: dto.nights ?? 0,
        markupPercent: dto.markupPercent ?? null,
      },
    });
    return option;
  }

  async updateOption(optionId: string, dto: UpdateOptionDto) {
    const exists = await this.prisma.quoteOption.findUnique({
      where: { id: optionId },
    });
    if (!exists) throw new NotFoundException('Option not found');

    await this.prisma.quoteOption.update({
      where: { id: optionId },
      data: { ...dto },
    });
    // markup/pax may have changed -> everything downstream must be rebuilt
    return this.recalcOption(optionId);
  }

  async removeOption(optionId: string) {
    const exists = await this.prisma.quoteOption.findUnique({
      where: { id: optionId },
    });
    if (!exists) throw new NotFoundException('Option not found');
    await this.prisma.quoteOption.delete({ where: { id: optionId } });
    return { deleted: true, id: optionId };
  }

  /** Copy a tier (build "Deluxe" by duplicating "Standard" and editing). */
  async duplicateOption(optionId: string, newName: string) {
    const src = await this.prisma.quoteOption.findUnique({
      where: { id: optionId },
      include: { lines: true },
    });
    if (!src) throw new NotFoundException('Option not found');

    const copy = await this.prisma.quoteOption.create({
      data: {
        quoteId: src.quoteId,
        name: newName,
        sortOrder: src.sortOrder + 1,
        adults: src.adults,
        children: src.children,
        nights: src.nights,
        markupPercent: src.markupPercent,
      },
    });

    for (const l of src.lines) {
      await this.prisma.quoteLine.create({
        data: {
          optionId: copy.id,
          serviceType: l.serviceType,
          description: l.description,
          vendorId: l.vendorId,
          vendorRateId: l.vendorRateId,
          quantity: l.quantity,
          units: l.units,
          unitNet: l.unitNet,
          markupMode: l.markupMode,
          markupValue: l.markupValue,
          sortOrder: l.sortOrder,
          notes: l.notes,
        },
      });
    }

    return this.recalcOption(copy.id);
  }

  // --- lines ---------------------------------------------------------------

  async addLine(optionId: string, dto: CreateLineDto) {
    const option = await this.prisma.quoteOption.findUnique({
      where: { id: optionId },
    });
    if (!option) throw new NotFoundException('Option not found');

    await this.prisma.quoteLine.create({
      data: {
        optionId,
        serviceType: dto.serviceType,
        description: dto.description,
        vendorId: dto.vendorId ?? null,
        vendorRateId: dto.vendorRateId ?? null,
        quantity: dto.quantity ?? 1,
        units: dto.units ?? 1,
        unitNet: dto.unitNet,
        markupMode: dto.markupMode ?? MarkupMode.INHERIT,
        markupValue: dto.markupValue ?? null,
        sortOrder: dto.sortOrder ?? 0,
        notes: dto.notes ?? null,
      },
    });

    return this.recalcOption(optionId);
  }

  /** Pull a vendor rate straight in as a line — no retyping net costs. */
  async addLineFromRate(
    optionId: string,
    rateId: string,
    quantity: number,
    units: number,
  ) {
    const rate = await this.prisma.vendorRate.findUnique({
      where: { id: rateId },
      include: { vendor: true },
    });
    if (!rate) throw new NotFoundException('Vendor rate not found');

    const serviceType =
      rate.vendor.type === 'TRANSPORT'
        ? 'TRANSPORT'
        : rate.vendor.type === 'ACTIVITY'
          ? 'ACTIVITY'
          : rate.vendor.type === 'GUIDE'
            ? 'GUIDE'
            : 'HOTEL';

    await this.prisma.quoteLine.create({
      data: {
        optionId,
        serviceType: serviceType as any,
        description: `${rate.vendor.name} — ${rate.variant}${
          rate.mealPlan ? ` (${rate.mealPlan})` : ''
        }`,
        vendorId: rate.vendorId,
        vendorRateId: rate.id,
        quantity,
        units,
        unitNet: rate.netRate,
        markupMode: MarkupMode.INHERIT,
      },
    });

    return this.recalcOption(optionId);
  }

  async updateLine(lineId: string, dto: UpdateLineDto) {
    const line = await this.prisma.quoteLine.findUnique({
      where: { id: lineId },
    });
    if (!line) throw new NotFoundException('Line not found');

    await this.prisma.quoteLine.update({
      where: { id: lineId },
      data: { ...dto },
    });
    return this.recalcOption(line.optionId);
  }

  async removeLine(lineId: string) {
    const line = await this.prisma.quoteLine.findUnique({
      where: { id: lineId },
    });
    if (!line) throw new NotFoundException('Line not found');
    await this.prisma.quoteLine.delete({ where: { id: lineId } });
    return this.recalcOption(line.optionId);
  }
}
EOF
ok "quotes.service.ts"

# ============================================================================
# 6. QUOTES CONTROLLER
# ============================================================================
say "Writing quotes controller"

cat > src/quotes/quotes.controller.ts << 'EOF'
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
import { QuotesService } from './quotes.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { UpdateQuoteDto } from './dto/update-quote.dto';
import { CreateOptionDto } from './dto/create-option.dto';
import { UpdateOptionDto } from './dto/update-option.dto';
import { CreateLineDto } from './dto/create-line.dto';
import { UpdateLineDto } from './dto/update-line.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { LEAD_MODULE_ROLES } from '../common/access';

@Roles(...LEAD_MODULE_ROLES)
@Controller('quotes')
export class QuotesController {
  constructor(private readonly quotes: QuotesService) {}

  @Post()
  create(@Body() dto: CreateQuoteDto, @CurrentUser('id') userId: string) {
    return this.quotes.create(dto, userId);
  }

  @Get()
  findAll(@Query('leadId') leadId?: string) {
    return this.quotes.findAll(leadId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.quotes.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateQuoteDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.quotes.update(id, dto, userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.quotes.remove(id);
  }

  // --- tiers ---------------------------------------------------------------

  @Post(':id/options')
  addOption(@Param('id') id: string, @Body() dto: CreateOptionDto) {
    return this.quotes.addOption(id, dto);
  }

  @Patch('options/:optionId')
  updateOption(
    @Param('optionId') optionId: string,
    @Body() dto: UpdateOptionDto,
  ) {
    return this.quotes.updateOption(optionId, dto);
  }

  @Post('options/:optionId/duplicate')
  duplicateOption(
    @Param('optionId') optionId: string,
    @Body('name') name: string,
  ) {
    return this.quotes.duplicateOption(optionId, name || 'Copy');
  }

  @Delete('options/:optionId')
  removeOption(@Param('optionId') optionId: string) {
    return this.quotes.removeOption(optionId);
  }

  // --- lines ---------------------------------------------------------------

  @Post('options/:optionId/lines')
  addLine(@Param('optionId') optionId: string, @Body() dto: CreateLineDto) {
    return this.quotes.addLine(optionId, dto);
  }

  /** Pull a stored vendor rate in as a line. */
  @Post('options/:optionId/lines/from-rate')
  addLineFromRate(
    @Param('optionId') optionId: string,
    @Body('rateId') rateId: string,
    @Body('quantity') quantity: number,
    @Body('units') units: number,
  ) {
    return this.quotes.addLineFromRate(
      optionId,
      rateId,
      quantity ?? 1,
      units ?? 1,
    );
  }

  @Patch('lines/:lineId')
  updateLine(@Param('lineId') lineId: string, @Body() dto: UpdateLineDto) {
    return this.quotes.updateLine(lineId, dto);
  }

  @Delete('lines/:lineId')
  removeLine(@Param('lineId') lineId: string) {
    return this.quotes.removeLine(lineId);
  }
}
EOF

cat > src/quotes/quotes.module.ts << 'EOF'
import { Module } from '@nestjs/common';
import { QuotesService } from './quotes.service';
import { QuotesController } from './quotes.controller';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [SettingsModule],
  controllers: [QuotesController],
  providers: [QuotesService],
  exports: [QuotesService],
})
export class QuotesModule {}
EOF
ok "quotes.controller.ts + module"

# ============================================================================
# 7. WIRE UP
# ============================================================================
say "Registering SettingsModule + QuotesModule"
cat > .glitz-patch.cjs << 'NODEEOF'
const fs = require('fs');
const p = 'src/app.module.ts';
let s = fs.readFileSync(p, 'utf8');
if (s.includes('QuotesModule')) {
  console.log('  already registered');
} else {
  s = s.replace(
    "import { VendorsModule } from './vendors/vendors.module';",
    "import { VendorsModule } from './vendors/vendors.module';\n" +
    "import { SettingsModule } from './settings/settings.module';\n" +
    "import { QuotesModule } from './quotes/quotes.module';"
  );
  s = s.replace(
    '    VendorsModule,\n',
    '    VendorsModule,\n    SettingsModule,\n    QuotesModule,\n'
  );
  fs.writeFileSync(p, s);
  console.log('  registered');
}
NODEEOF
node .glitz-patch.cjs || die "failed to register modules"
rm -f .glitz-patch.cjs
ok "app.module.ts"

# ============================================================================
# 8. GENERATE -> MIGRATE -> BUILD -> COMMIT
# ============================================================================
say "Ensuring @nestjs/mapped-types is installed"
if [ -d node_modules/@nestjs/mapped-types ]; then
  ok "already installed"
else
  npm install @nestjs/mapped-types || die "npm install failed"
  ok "installed"
fi

say "Generating Prisma client"
npx prisma generate || die "prisma generate failed"

if [ "${SKIP_MIGRATE:-0}" != "1" ]; then
  say "Running migration (PricingSettings + Quote + QuoteOption + QuoteLine)"
  npx prisma migrate dev --name quotes || die "Migration failed. Check DIRECT_URL, then: npx prisma migrate dev --name quotes"
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
  git commit -qm "Phase 5: pricing settings + quotations (tiers, markup chain, margin advisory)" || warn "commit skipped"
  ok "committed"
fi

say "PHASE 5 COMPLETE"
cat << 'EOF'

Test it:

  npm run start:dev

  LOGIN=$(curl -s -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@glitz.local","password":"YOUR-PASSWORD"}')
  TOKEN=$(echo "$LOGIN" | sed -n 's/.*"access_token":"\([^"]*\)".*/\1/p')
  AUTH="Authorization: Bearer $TOKEN"
  JSON="Content-Type: application/json"

  # 1) Set YOUR commercial policy (these numbers drive the advisory)
  curl -X PATCH http://localhost:3000/api/settings/pricing -H "$AUTH" -H "$JSON" \
    -d '{"defaultMarkupPercent":20,"hotelMarkupPercent":18,
         "transportMarkupPercent":30,"minMarginPercent":15,
         "monthlyOverhead":120000,"filesPerMonth":25,"roundTo":50}'
  # -> break-even per file = 120000/25 = 4800

  # 2) Create a quote against an existing lead (use a real leadId)
  curl -X POST http://localhost:3000/api/quotes -H "$AUTH" -H "$JSON" \
    -d '{"leadId":"LEAD_ID","title":"Kashmir 5N/6D Family"}'
  # -> note the "id" (QUOTE_ID) and quoteNumber GLZ-2026-0001

  # 3) Add a tier
  curl -X POST http://localhost:3000/api/quotes/QUOTE_ID/options -H "$AUTH" -H "$JSON" \
    -d '{"name":"Standard","adults":2,"children":1,"nights":5,"sortOrder":1}'
  # -> OPTION_ID

  # 4) Add lines (hotel inherits 18%, transport inherits 30%)
  curl -X POST http://localhost:3000/api/quotes/options/OPTION_ID/lines -H "$AUTH" -H "$JSON" \
    -d '{"serviceType":"HOTEL","description":"Srinagar deluxe, MAP",
         "quantity":2,"units":3,"unitNet":6200}'

  curl -X POST http://localhost:3000/api/quotes/options/OPTION_ID/lines -H "$AUTH" -H "$JSON" \
    -d '{"serviceType":"TRANSPORT","description":"Innova 6 days",
         "quantity":1,"units":6,"unitNet":3500}'

  # override just one line at a fixed amount
  curl -X POST http://localhost:3000/api/quotes/options/OPTION_ID/lines -H "$AUTH" -H "$JSON" \
    -d '{"serviceType":"ACTIVITY","description":"Gondola Phase 2",
         "quantity":3,"units":1,"unitNet":1200,
         "markupMode":"FIXED","markupValue":900}'

  # or pull a stored vendor rate straight in
  curl -X POST http://localhost:3000/api/quotes/options/OPTION_ID/lines/from-rate \
    -H "$AUTH" -H "$JSON" -d '{"rateId":"RATE_ID","quantity":2,"units":3}'

  # 5) Duplicate the tier to build Deluxe, then edit its lines
  curl -X POST http://localhost:3000/api/quotes/options/OPTION_ID/duplicate \
    -H "$AUTH" -H "$JSON" -d '{"name":"Deluxe"}'

  # 6) THE PAYOFF — full quote with per-tier margin + advisory
  curl http://localhost:3000/api/quotes/QUOTE_ID -H "$AUTH"

  # Each option returns:
  #   totalNet, totalSell, totalMargin
  #   marginPercent           (profit / sell)
  #   markupPercentEffective  (profit / cost)  <- different number!
  #   perPersonSell
  #   advisory: { breakEvenPerFile, suggestedMinSell, shortfall, warnings[] }

Confirmed when: totals recompute after every line change, and dropping a
price below your policy produces a warning in advisory.warnings.
EOF
