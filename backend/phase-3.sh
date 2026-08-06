#!/usr/bin/env bash
# ==============================================================================
# Glitz Holidays CRM — Backend  |  PHASE 3: Leads (attribution + scoring)
# ------------------------------------------------------------------------------
# Adds:
#   * Lead + Activity tables (Prisma migration)
#   * PUBLIC  POST /api/leads/capture   <- landing pages / ads / WhatsApp hit this
#       - stores full UTM + gclid + fbclid + landing page + device + IP
#       - transparent rule-based lead scoring (with a stored breakdown)
#       - 30-day phone dedupe (re-enquiry logged, no duplicate lead)
#       - rate limited (10/min per IP) because it is unauthenticated
#   * GET    /api/leads          list + filters (status, source, assigned, search, dates)
#   * GET    /api/leads/stats    pipeline counts + source breakdown
#   * GET    /api/leads/:id      lead + full activity timeline
#   * PATCH  /api/leads/:id      status / assign / edit
#   * POST   /api/leads/:id/activities   log call, whatsapp, email, note
#
# RUN FROM INSIDE YOUR BACKEND FOLDER:
#   cd glitz/backend      (or  cd glitz-backend)
#   bash phase-3.sh
#
# Installs ONE new package: @nestjs/throttler
# Type-checks before committing. Runs the DB migration.
#
# Options: SKIP_BUILD=1  SKIP_MIGRATE=1  SKIP_INSTALL=1
# ==============================================================================
set -euo pipefail

say()  { printf "\n\033[1;36m==>\033[0m %s\n" "$1"; }
ok()   { printf "\033[1;32m  ok\033[0m %s\n" "$1"; }
warn() { printf "\033[1;33m  ! \033[0m %s\n" "$1"; }
die()  { printf "\033[1;31m  x \033[0m %s\n" "$1"; exit 1; }

say "Checking this is the backend folder"
[ -f package.json ] || die "No package.json here. cd into glitz/backend and re-run."
[ -f prisma/schema.prisma ] || die "No prisma/schema.prisma here."
[ -d src/auth ] || die "src/auth missing — run phase-2.sh first."
ok "backend confirmed ($(pwd))"

mkdir -p src/leads/dto

# ============================================================================
# 1. SCHEMA
# ============================================================================
say "Updating Prisma schema (Lead + Activity)"

cp prisma/schema.prisma "prisma/schema.prisma.bak.$(date +%s)"
ok "backed up existing schema"

cat > prisma/schema.prisma << 'EOF'
// Glitz Holidays CRM — Prisma schema
// Phase 1: User + Role.  Phase 3: Lead + Activity.

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

enum Role {
  SUPER_ADMIN
  OWNER
  SALES_MANAGER
  SALES_EXEC
  ACCOUNTS
  MARKETING
  OPERATIONS
  VENDOR
  AGENT
  GUEST
}

enum LeadStatus {
  NEW
  CONTACTED
  INTERESTED
  QUOTATION_SENT
  NEGOTIATION
  CONFIRMED
  CANCELLED
  LOST
  FUTURE_FOLLOWUP
}

enum LeadSource {
  GOOGLE_ADS
  META_ADS
  INSTAGRAM
  FACEBOOK
  LANDING_PAGE
  WEBSITE
  ORGANIC
  REFERRAL
  WALK_IN
  PHONE
  WHATSAPP
  TRADE_FAIR
  EMAIL
  B2B_AGENT
  OTHER
}

enum ActivityType {
  NOTE
  CALL
  WHATSAPP
  EMAIL
  MEETING
  STATUS_CHANGE
  ASSIGNMENT
  RE_ENQUIRY
  SYSTEM
}

model User {
  id           String   @id @default(cuid())
  email        String   @unique
  passwordHash String
  name         String
  role         Role     @default(SALES_EXEC)
  isActive     Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  assignedLeads Lead[]     @relation("LeadAssignee")
  activities    Activity[]

  @@index([role])
}

model Lead {
  id     String @id @default(cuid())

  // --- who ---
  name    String
  phone   String
  email   String?
  city    String?
  country String?

  // --- what they want ---
  destination String?
  travelDate  DateTime?
  nights      Int?
  adults      Int?
  children    Int?
  budget      Int?
  message     String?

  // --- pipeline ---
  status     LeadStatus @default(NEW)
  source     LeadSource @default(OTHER)
  score      Int        @default(0)
  scoreNotes String?
  lostReason String?

  assignedToId String?
  assignedTo   User?   @relation("LeadAssignee", fields: [assignedToId], references: [id], onDelete: SetNull)

  // --- attribution (this is what makes ROAS possible later) ---
  utmSource   String?
  utmMedium   String?
  utmCampaign String?
  utmTerm     String?
  utmContent  String?
  gclid       String?
  fbclid      String?
  landingPage String?
  referrer    String?
  keyword     String?

  // --- context ---
  device    String?
  userAgent String?
  ipAddress String?

  enquiryCount Int       @default(1)
  lastContact  DateTime?
  nextFollowUp DateTime?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  activities Activity[]

  @@index([status])
  @@index([source])
  @@index([phone])
  @@index([assignedToId])
  @@index([createdAt])
}

model Activity {
  id      String       @id @default(cuid())
  type    ActivityType @default(NOTE)
  content String

  leadId String
  lead   Lead   @relation(fields: [leadId], references: [id], onDelete: Cascade)

  userId String?
  user   User?   @relation(fields: [userId], references: [id], onDelete: SetNull)

  createdAt DateTime @default(now())

  @@index([leadId])
  @@index([createdAt])
}
EOF
ok "schema.prisma updated (old one backed up)"

# ============================================================================
# 2. SCORING (isolated so it is easy to tune later)
# ============================================================================
say "Writing lead scoring"

cat > src/leads/lead-scoring.ts << 'EOF'
import { LeadSource } from '@prisma/client';

/**
 * Transparent, rule-based lead scoring (0-100).
 *
 * Deliberately NOT a black box: every lead stores a `scoreNotes` breakdown so
 * you can see exactly why it scored what it did. Tune the weights here once
 * you have real conversion data — this is the only file you need to touch.
 */
export interface ScoreInput {
  source?: LeadSource;
  email?: string | null;
  message?: string | null;
  destination?: string | null;
  travelDate?: Date | null;
  budget?: number | null;
  adults?: number | null;
  gclid?: string | null;
  fbclid?: string | null;
  enquiryCount?: number;
}

const SOURCE_WEIGHT: Record<LeadSource, number> = {
  REFERRAL: 30,
  B2B_AGENT: 30,
  WALK_IN: 25,
  GOOGLE_ADS: 25,
  TRADE_FAIR: 22,
  META_ADS: 20,
  ORGANIC: 20,
  PHONE: 18,
  INSTAGRAM: 15,
  FACEBOOK: 15,
  WHATSAPP: 15,
  LANDING_PAGE: 15,
  WEBSITE: 12,
  EMAIL: 10,
  OTHER: 8,
};

export function scoreLead(input: ScoreInput): {
  score: number;
  notes: string;
} {
  const parts: string[] = [];
  let score = 10;
  parts.push('base 10');

  const src = input.source ?? LeadSource.OTHER;
  const srcPts = SOURCE_WEIGHT[src] ?? 8;
  score += srcPts;
  parts.push(`source:${src} +${srcPts}`);

  // A real paid click (has a click id) = measurable intent, not a bot.
  if (input.gclid || input.fbclid) {
    score += 10;
    parts.push('paid click id +10');
  }

  if (input.email) {
    score += 10;
    parts.push('email +10');
  }
  if (input.travelDate) {
    score += 15;
    parts.push('travel date +15');
  }
  if (input.budget && input.budget > 0) {
    score += 15;
    parts.push('budget +15');
  }
  if (input.destination) {
    score += 8;
    parts.push('destination +8');
  }
  if (input.message && input.message.trim().length > 20) {
    score += 10;
    parts.push('detailed message +10');
  }
  if (input.adults && input.adults > 0) {
    score += 5;
    parts.push('pax +5');
  }

  // Repeat enquiry = warm. Capped so it can't run away.
  const repeats = Math.max(0, (input.enquiryCount ?? 1) - 1);
  if (repeats > 0) {
    const pts = Math.min(15, repeats * 8);
    score += pts;
    parts.push(`re-enquiry x${repeats} +${pts}`);
  }

  score = Math.max(0, Math.min(100, score));
  return { score, notes: parts.join(', ') };
}
EOF
ok "lead-scoring.ts"

# ============================================================================
# 3. DTOs
# ============================================================================
say "Writing DTOs"

cat > src/leads/dto/capture-lead.dto.ts << 'EOF'
import {
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
  IsDateString,
} from 'class-validator';
import { LeadSource } from '@prisma/client';

/**
 * Public payload posted by landing pages / ads / WhatsApp bots.
 * Only name + phone are required — never lose a lead over validation.
 */
export class CaptureLeadDto {
  @IsString() @MinLength(2) @MaxLength(120)
  name: string;

  @IsString() @MinLength(6) @MaxLength(20)
  phone: string;

  @IsOptional() @IsEmail()
  email?: string;

  @IsOptional() @IsString() @MaxLength(120)
  city?: string;

  @IsOptional() @IsString() @MaxLength(120)
  country?: string;

  @IsOptional() @IsString() @MaxLength(200)
  destination?: string;

  @IsOptional() @IsDateString()
  travelDate?: string;

  @IsOptional() @IsInt() @Min(0)
  nights?: number;

  @IsOptional() @IsInt() @Min(0)
  adults?: number;

  @IsOptional() @IsInt() @Min(0)
  children?: number;

  @IsOptional() @IsInt() @Min(0)
  budget?: number;

  @IsOptional() @IsString() @MaxLength(2000)
  message?: string;

  @IsOptional() @IsEnum(LeadSource)
  source?: LeadSource;

  // --- attribution: pass these straight through from the landing page ---
  @IsOptional() @IsString() @MaxLength(200) utmSource?: string;
  @IsOptional() @IsString() @MaxLength(200) utmMedium?: string;
  @IsOptional() @IsString() @MaxLength(200) utmCampaign?: string;
  @IsOptional() @IsString() @MaxLength(200) utmTerm?: string;
  @IsOptional() @IsString() @MaxLength(200) utmContent?: string;
  @IsOptional() @IsString() @MaxLength(300) gclid?: string;
  @IsOptional() @IsString() @MaxLength(300) fbclid?: string;
  @IsOptional() @IsString() @MaxLength(500) landingPage?: string;
  @IsOptional() @IsString() @MaxLength(500) referrer?: string;
  @IsOptional() @IsString() @MaxLength(200) keyword?: string;
}
EOF

cat > src/leads/dto/update-lead.dto.ts << 'EOF'
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { LeadStatus } from '@prisma/client';

export class UpdateLeadDto {
  @IsOptional() @IsEnum(LeadStatus)
  status?: LeadStatus;

  @IsOptional() @IsString()
  assignedToId?: string | null;

  @IsOptional() @IsString() @MaxLength(300)
  lostReason?: string;

  @IsOptional() @IsDateString()
  nextFollowUp?: string;

  @IsOptional() @IsString() @MaxLength(200)
  destination?: string;

  @IsOptional() @IsDateString()
  travelDate?: string;

  @IsOptional() @IsInt() @Min(0)
  nights?: number;

  @IsOptional() @IsInt() @Min(0)
  adults?: number;

  @IsOptional() @IsInt() @Min(0)
  children?: number;

  @IsOptional() @IsInt() @Min(0)
  budget?: number;

  @IsOptional() @IsString() @MaxLength(120)
  name?: string;

  @IsOptional() @IsString() @MaxLength(20)
  phone?: string;

  @IsOptional() @IsString() @MaxLength(200)
  email?: string;
}
EOF

cat > src/leads/dto/create-activity.dto.ts << 'EOF'
import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { ActivityType } from '@prisma/client';

export class CreateActivityDto {
  @IsOptional() @IsEnum(ActivityType)
  type?: ActivityType;

  @IsString() @MinLength(1) @MaxLength(4000)
  content: string;
}
EOF

cat > src/leads/dto/query-leads.dto.ts << 'EOF'
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
import { LeadSource, LeadStatus } from '@prisma/client';

export class QueryLeadsDto {
  @IsOptional() @IsEnum(LeadStatus)
  status?: LeadStatus;

  @IsOptional() @IsEnum(LeadSource)
  source?: LeadSource;

  @IsOptional() @IsString()
  assignedToId?: string;

  /** matches name, phone, email or destination */
  @IsOptional() @IsString()
  search?: string;

  @IsOptional() @IsDateString()
  from?: string;

  @IsOptional() @IsDateString()
  to?: string;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page?: number;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100)
  limit?: number;
}
EOF
ok "dto/*"

# ============================================================================
# 4. SERVICE
# ============================================================================
say "Writing leads service"

cat > src/leads/leads.service.ts << 'EOF'
import { Injectable, NotFoundException } from '@nestjs/common';
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

/** Extra request context the controller extracts (not client-supplied). */
export interface CaptureContext {
  ipAddress?: string;
  userAgent?: string;
  device?: string;
}

const DEDUPE_WINDOW_DAYS = 30;

@Injectable()
export class LeadsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Normalise a phone to digits so "+91 98184 34726" == "9818434726". */
  private normalisePhone(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    return digits.length > 10 ? digits.slice(-10) : digits;
  }

  async capture(dto: CaptureLeadDto, ctx: CaptureContext) {
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
        utmSource: dto.utmSource ?? null,
        utmMedium: dto.utmMedium ?? null,
        utmCampaign: dto.utmCampaign ?? null,
        utmTerm: dto.utmTerm ?? null,
        utmContent: dto.utmContent ?? null,
        gclid: dto.gclid ?? null,
        fbclid: dto.fbclid ?? null,
        landingPage: dto.landingPage ?? null,
        referrer: dto.referrer ?? null,
        keyword: dto.keyword ?? null,
        device: ctx.device ?? null,
        userAgent: ctx.userAgent ?? null,
        ipAddress: ctx.ipAddress ?? null,
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

  async findAll(q: QueryLeadsDto) {
    const page = q.page ?? 1;
    const limit = q.limit ?? 25;

    const where: Prisma.LeadWhereInput = {};
    if (q.status) where.status = q.status;
    if (q.source) where.source = q.source;
    if (q.assignedToId) where.assignedToId = q.assignedToId;
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

  async findOne(id: string) {
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
    return lead;
  }

  async update(id: string, dto: UpdateLeadDto, actorId?: string) {
    const lead = await this.prisma.lead.findUnique({ where: { id } });
    if (!lead) throw new NotFoundException('Lead not found');

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
    if (dto.travelDate !== undefined) data.travelDate = new Date(dto.travelDate);
    if (dto.nextFollowUp !== undefined)
      data.nextFollowUp = new Date(dto.nextFollowUp);
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

  async addActivity(leadId: string, dto: CreateActivityDto, actorId?: string) {
    const lead = await this.prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) throw new NotFoundException('Lead not found');

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
        data: { lastContact: new Date() },
      });
    }

    return this.prisma.activity.create({
      data: { leadId, userId: actorId ?? null, type, content: dto.content },
      include: { user: { select: { id: true, name: true } } },
    });
  }

  async stats() {
    const [byStatus, bySource, total, unassigned] = await Promise.all([
      this.prisma.lead.groupBy({ by: ['status'], _count: { _all: true } }),
      this.prisma.lead.groupBy({ by: ['source'], _count: { _all: true } }),
      this.prisma.lead.count(),
      this.prisma.lead.count({ where: { assignedToId: null } }),
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
}
EOF
ok "leads.service.ts"

# ============================================================================
# 5. CONTROLLER
# ============================================================================
say "Writing leads controller"

cat > src/leads/leads.controller.ts << 'EOF'
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
import { Role } from '@prisma/client';
import { LeadsService } from './leads.service';
import { CaptureLeadDto } from './dto/capture-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { CreateActivityDto } from './dto/create-activity.dto';
import { QueryLeadsDto } from './dto/query-leads.dto';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

function detectDevice(ua: string): string {
  const s = ua.toLowerCase();
  if (/ipad|tablet/.test(s)) return 'tablet';
  if (/mobi|android|iphone/.test(s)) return 'mobile';
  return 'desktop';
}

@Controller('leads')
export class LeadsController {
  constructor(private readonly leads: LeadsService) {}

  /**
   * PUBLIC + rate limited (10/min per IP).
   * Landing pages, Google Ads forms, WhatsApp bots post here.
   */
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

  @Get()
  findAll(@Query() q: QueryLeadsDto) {
    return this.leads.findAll(q);
  }

  @Get('stats')
  stats() {
    return this.leads.stats();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.leads.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateLeadDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.leads.update(id, dto, userId);
  }

  @Post(':id/activities')
  addActivity(
    @Param('id') id: string,
    @Body() dto: CreateActivityDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.leads.addActivity(id, dto, userId);
  }
}
EOF

cat > src/leads/leads.module.ts << 'EOF'
import { Module } from '@nestjs/common';
import { LeadsService } from './leads.service';
import { LeadsController } from './leads.controller';

@Module({
  controllers: [LeadsController],
  providers: [LeadsService],
  exports: [LeadsService],
})
export class LeadsModule {}
EOF
ok "leads.controller.ts + module"

# ============================================================================
# 6. WIRE UP app.module.ts (adds throttler + leads)
# ============================================================================
say "Wiring LeadsModule + rate limiting into app.module.ts"

cat > src/app.module.ts << 'EOF'
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { LeadsModule } from './leads/leads.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Global default: 60 requests / minute / IP.
    // The public capture endpoint tightens this to 10/min via @Throttle.
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }]),
    PrismaModule,
    HealthModule,
    AuthModule,
    UsersModule,
    LeadsModule,
  ],
  providers: [
    // Order: rate limit -> authenticate -> authorize.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
EOF
ok "app.module.ts"

# main.ts needs trust proxy so real client IPs survive Render's load balancer
if ! grep -q "trust proxy" src/main.ts; then
  say "Enabling trust proxy in main.ts (real client IPs behind Render)"
  cat > src/main.ts << 'EOF'
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Render/Vercel sit behind a proxy — without this every lead records the
  // load balancer's IP and rate limiting would throttle all users as one.
  app.set('trust proxy', 1);

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const origins = (process.env.CORS_ORIGIN ?? '*')
    .split(',')
    .map((s) => s.trim());
  app.enableCors({ origin: origins.includes('*') ? true : origins });

  const port = parseInt(process.env.PORT ?? '3000', 10);
  await app.listen(port, '0.0.0.0');
  // eslint-disable-next-line no-console
  console.log(`Glitz backend listening on :${port} (prefix /api)`);
}
bootstrap();
EOF
  ok "main.ts"
fi

# ============================================================================
# 7. INSTALL -> MIGRATE -> BUILD -> COMMIT
# ============================================================================
if [ "${SKIP_INSTALL:-0}" != "1" ]; then
  say "Installing @nestjs/throttler"
  npm install @nestjs/throttler || die "npm install failed"
  ok "installed"
fi

say "Generating Prisma client"
npx prisma generate || die "prisma generate failed"

if [ "${SKIP_MIGRATE:-0}" != "1" ]; then
  say "Running migration (creates Lead + Activity tables)"
  npx prisma migrate dev --name leads || die "Migration failed. Check DIRECT_URL in .env, then re-run: npx prisma migrate dev --name leads"
  ok "migration applied"
fi

if [ "${SKIP_BUILD:-0}" != "1" ]; then
  say "Type-checking (nest build)"
  npm run build || die "Build failed — see errors above. Nothing committed."
  ok "build passed"
fi

say "Committing"
if git rev-parse --git-dir >/dev/null 2>&1; then
  git add -A
  git commit -qm "Phase 3: leads (attribution, scoring, dedupe, pipeline, activity timeline)" || warn "commit skipped"
  ok "committed"
else
  warn "no git repo here — skipping commit"
fi

say "PHASE 3 COMPLETE"
cat << 'EOF'

Test it:

  npm run start:dev

  # 1) PUBLIC capture — exactly what a Google Ads landing page would post.
  curl -X POST http://localhost:3000/api/leads/capture \
    -H "Content-Type: application/json" \
    -d '{
      "name":"Rahul Sharma","phone":"+91 98100 11223","email":"rahul@example.com",
      "destination":"Kashmir","nights":5,"adults":2,"budget":45000,
      "message":"Looking for a Srinagar Gulmarg Pahalgam package in October, family trip.",
      "source":"GOOGLE_ADS","utmSource":"google","utmMedium":"cpc",
      "utmCampaign":"kashmir-family","utmTerm":"kashmir tour package",
      "gclid":"TEST-GCLID-123","landingPage":"go.falcontrails.in/kashmir"
    }'
  # -> {"duplicate":false,"leadId":"...","score":93}

  # 2) Same phone again = re-enquiry, NOT a duplicate lead
  curl -X POST http://localhost:3000/api/leads/capture \
    -H "Content-Type: application/json" \
    -d '{"name":"Rahul Sharma","phone":"9810011223","source":"WHATSAPP"}'
  # -> {"duplicate":true,...}

  # 3) Log in, then list leads (needs a token)
  LOGIN=$(curl -s -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@glitz.local","password":"YOUR-PASSWORD"}')
  TOKEN=$(echo "$LOGIN" | sed -n 's/.*"access_token":"\([^"]*\)".*/\1/p')

  curl "http://localhost:3000/api/leads" -H "Authorization: Bearer $TOKEN"
  curl "http://localhost:3000/api/leads/stats" -H "Authorization: Bearer $TOKEN"

  # 4) Move it down the pipeline + log a call (use the leadId from step 1)
  curl -X PATCH http://localhost:3000/api/leads/LEAD_ID \
    -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
    -d '{"status":"CONTACTED"}'

  curl -X POST http://localhost:3000/api/leads/LEAD_ID/activities \
    -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
    -d '{"type":"CALL","content":"Called, wants October dates, sending quote."}'

  # 5) Full lead + timeline
  curl http://localhost:3000/api/leads/LEAD_ID -H "Authorization: Bearer $TOKEN"

Confirmed when: capture returns a score, the 2nd capture says duplicate:true,
and the timeline shows SYSTEM + RE_ENQUIRY + STATUS_CHANGE + CALL entries.
EOF
