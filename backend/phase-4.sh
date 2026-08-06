#!/usr/bin/env bash
# ==============================================================================
# Glitz Holidays CRM — Backend  |  PHASE 4: Vendors + Lead Visibility Rules
# ------------------------------------------------------------------------------
# Adds:
#   * Vendor + VendorRate tables
#       - net rate REQUIRED, rack rate optional
#       - split by season AND variant (room category / vehicle type)
#       - meal plan (EP/CP/MAP/AP) for hotels
#       - rate basis (per room-night / per person / per vehicle-day / transfer)
#       - GST, PAN, payment terms, bank details, union taxi zone
#   * SUPPLIER PROTECTION: vendor contact + bank details are REDACTED for
#     sales execs. Rates stay visible (they need them to quote); the hotelier's
#     direct number does not walk out the door with a departing employee.
#   * LEAD VISIBILITY: sales execs see only leads assigned to them.
#     Owner / Super Admin / Sales Manager / Marketing / Ops / Accounts see all.
#     Enforced on list, detail, update, activities AND stats.
#
# RUN FROM INSIDE YOUR BACKEND FOLDER:
#   cd glitz/backend
#   bash phase-4.sh
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
[ -d src/leads ] || die "src/leads missing — run phase-3.sh first."
ok "backend confirmed ($(pwd))"

mkdir -p src/vendors/dto

# ============================================================================
# 1. SCHEMA
# ============================================================================
say "Updating Prisma schema (Vendor + VendorRate)"
cp prisma/schema.prisma "prisma/schema.prisma.bak.$(date +%s)"

cat >> prisma/schema.prisma << 'EOF'

// ============================================================================
// PHASE 4 — Vendors
// ============================================================================

enum VendorType {
  HOTEL
  HOUSEBOAT
  TRANSPORT
  GUIDE
  ACTIVITY
  RESTAURANT
  PHOTOGRAPHER
  EVENT
  OTHER
}

enum Season {
  PEAK
  SHOULDER
  OFF
  FESTIVE
}

enum MealPlan {
  EP
  CP
  MAP
  AP
}

enum RateBasis {
  PER_ROOM_NIGHT
  PER_PERSON
  PER_PERSON_NIGHT
  PER_VEHICLE_DAY
  PER_TRANSFER
  PER_UNIT
}

model Vendor {
  id   String     @id @default(cuid())
  name String
  type VendorType @default(HOTEL)

  // where
  city    String?
  area    String?
  address String?

  // internal grading — your own quality call, not the star rating
  starRating    Int?
  falconGrade   String?

  // --- SENSITIVE: redacted for sales execs (supplier protection) ---
  contactPerson String?
  phone         String?
  altPhone      String?
  email         String?
  bankName      String?
  accountNumber String?
  ifsc          String?

  // commercial
  gstin        String?
  panNumber    String?
  paymentTerms String?

  // transport only — Kashmir union taxi zone constraints
  unionZone String?

  notes    String?
  isActive Boolean @default(true)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  rates VendorRate[]

  @@index([type])
  @@index([city])
  @@index([isActive])
}

model VendorRate {
  id       String @id @default(cuid())
  vendorId String
  vendor   Vendor @relation(fields: [vendorId], references: [id], onDelete: Cascade)

  /// Room category for hotels ("Deluxe"), vehicle type for transport ("Innova").
  variant   String
  season    Season    @default(PEAK)
  mealPlan  MealPlan?
  rateBasis RateBasis @default(PER_ROOM_NIGHT)

  /// REQUIRED. What you actually pay the supplier.
  netRate Int
  /// Optional. Published/rack rate for showing discount.
  rackRate Int?

  extraBedRate  Int?
  childRate     Int?
  maxOccupancy  Int?

  validFrom DateTime?
  validTo   DateTime?

  notes    String?
  isActive Boolean @default(true)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([vendorId])
  @@index([season])
  @@index([isActive])
}
EOF
ok "schema.prisma extended"

# ============================================================================
# 2. ACCESS RULES (single source of truth)
# ============================================================================
say "Writing access-control rules"

cat > src/common/access.ts << 'EOF'
import { Role } from '@prisma/client';

/**
 * Single source of truth for who sees what.
 * Change it here, it changes everywhere.
 */

/** Roles that see EVERY lead. Others see only leads assigned to them. */
export const FULL_LEAD_ACCESS: Role[] = [
  Role.SUPER_ADMIN,
  Role.OWNER,
  Role.SALES_MANAGER,
  Role.MARKETING,
  Role.OPERATIONS,
  Role.ACCOUNTS,
];

/** Roles allowed into the leads module at all. */
export const LEAD_MODULE_ROLES: Role[] = [
  ...FULL_LEAD_ACCESS,
  Role.SALES_EXEC,
  Role.AGENT,
];

/**
 * Roles that may see vendor CONTACT + BANK details.
 * This is the supplier-protection boundary: everyone can see rates (they need
 * them to quote), but only these roles get the hotelier's direct number.
 */
export const VENDOR_CONTACT_ACCESS: Role[] = [
  Role.SUPER_ADMIN,
  Role.OWNER,
  Role.OPERATIONS,
  Role.ACCOUNTS,
];

/** Roles that may create/edit vendors and rates. */
export const VENDOR_WRITE_ACCESS: Role[] = [
  Role.SUPER_ADMIN,
  Role.OWNER,
  Role.OPERATIONS,
];

export interface Actor {
  id: string;
  role: Role;
}

export const canSeeAllLeads = (role: Role): boolean =>
  FULL_LEAD_ACCESS.includes(role);

export const canSeeVendorContacts = (role: Role): boolean =>
  VENDOR_CONTACT_ACCESS.includes(role);
EOF
ok "common/access.ts"

# ============================================================================
# 3. VENDOR DTOs
# ============================================================================
say "Writing vendor DTOs"

cat > src/vendors/dto/create-vendor.dto.ts << 'EOF'
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { VendorType } from '@prisma/client';

export class CreateVendorDto {
  @IsString() @MinLength(2) @MaxLength(200)
  name: string;

  @IsEnum(VendorType)
  type: VendorType;

  @IsOptional() @IsString() @MaxLength(120) city?: string;
  @IsOptional() @IsString() @MaxLength(120) area?: string;
  @IsOptional() @IsString() @MaxLength(500) address?: string;

  @IsOptional() @IsInt() @Min(1) @Max(7) starRating?: number;
  @IsOptional() @IsString() @MaxLength(50) falconGrade?: string;

  @IsOptional() @IsString() @MaxLength(120) contactPerson?: string;
  @IsOptional() @IsString() @MaxLength(30) phone?: string;
  @IsOptional() @IsString() @MaxLength(30) altPhone?: string;
  @IsOptional() @IsEmail() email?: string;

  @IsOptional() @IsString() @MaxLength(120) bankName?: string;
  @IsOptional() @IsString() @MaxLength(50) accountNumber?: string;
  @IsOptional() @IsString() @MaxLength(20) ifsc?: string;

  @IsOptional() @IsString() @MaxLength(20) gstin?: string;
  @IsOptional() @IsString() @MaxLength(15) panNumber?: string;
  @IsOptional() @IsString() @MaxLength(300) paymentTerms?: string;

  @IsOptional() @IsString() @MaxLength(100) unionZone?: string;
  @IsOptional() @IsString() @MaxLength(2000) notes?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}
EOF

cat > src/vendors/dto/update-vendor.dto.ts << 'EOF'
import { PartialType } from '@nestjs/mapped-types';
import { CreateVendorDto } from './create-vendor.dto';

export class UpdateVendorDto extends PartialType(CreateVendorDto) {}
EOF

cat > src/vendors/dto/create-rate.dto.ts << 'EOF'
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { MealPlan, RateBasis, Season } from '@prisma/client';

export class CreateRateDto {
  /** "Deluxe Room" for a hotel, "Toyota Innova" for transport. */
  @IsString() @MinLength(1) @MaxLength(120)
  variant: string;

  @IsEnum(Season)
  season: Season;

  /** Hotels only. Leave out for transport/guides. */
  @IsOptional() @IsEnum(MealPlan)
  mealPlan?: MealPlan;

  @IsOptional() @IsEnum(RateBasis)
  rateBasis?: RateBasis;

  /** REQUIRED — what you pay the supplier. */
  @IsInt() @Min(0)
  netRate: number;

  /** Optional — published rate. */
  @IsOptional() @IsInt() @Min(0)
  rackRate?: number;

  @IsOptional() @IsInt() @Min(0) extraBedRate?: number;
  @IsOptional() @IsInt() @Min(0) childRate?: number;
  @IsOptional() @IsInt() @Min(1) maxOccupancy?: number;

  @IsOptional() @IsDateString() validFrom?: string;
  @IsOptional() @IsDateString() validTo?: string;

  @IsOptional() @IsString() @MaxLength(1000) notes?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}
EOF

cat > src/vendors/dto/update-rate.dto.ts << 'EOF'
import { PartialType } from '@nestjs/mapped-types';
import { CreateRateDto } from './create-rate.dto';

export class UpdateRateDto extends PartialType(CreateRateDto) {}
EOF

cat > src/vendors/dto/query-vendors.dto.ts << 'EOF'
import {
  IsBooleanString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Season, VendorType } from '@prisma/client';

export class QueryVendorsDto {
  @IsOptional() @IsEnum(VendorType) type?: VendorType;
  @IsOptional() @IsString() city?: string;
  /** matches name, area or contact person */
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsBooleanString() activeOnly?: string;
  @IsOptional() @IsEnum(Season) season?: Season;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit?: number;
}
EOF
ok "vendors/dto/*"

# ============================================================================
# 4. VENDOR SERVICE
# ============================================================================
say "Writing vendors service (with contact redaction)"

cat > src/vendors/vendors.service.ts << 'EOF'
import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { CreateRateDto } from './dto/create-rate.dto';
import { UpdateRateDto } from './dto/update-rate.dto';
import { QueryVendorsDto } from './dto/query-vendors.dto';
import { canSeeVendorContacts } from '../common/access';

/** Fields stripped from vendors for roles without contact access. */
const SENSITIVE_FIELDS = [
  'contactPerson',
  'phone',
  'altPhone',
  'email',
  'bankName',
  'accountNumber',
  'ifsc',
] as const;

@Injectable()
export class VendorsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Supplier protection: strip direct contact + bank details unless the
   * viewer's role is allowed them. Rates are never stripped — staff need
   * them to quote.
   */
  private redact<T extends Record<string, any>>(vendor: T, role: Role): T {
    if (canSeeVendorContacts(role)) return vendor;
    const copy: Record<string, any> = { ...vendor };
    for (const f of SENSITIVE_FIELDS) copy[f] = null;
    copy.contactRedacted = true;
    return copy as T;
  }

  create(dto: CreateVendorDto) {
    return this.prisma.vendor.create({ data: { ...dto } });
  }

  async findAll(q: QueryVendorsDto, role: Role) {
    const page = q.page ?? 1;
    const limit = q.limit ?? 25;

    const where: Prisma.VendorWhereInput = {};
    if (q.type) where.type = q.type;
    if (q.city) where.city = { contains: q.city, mode: 'insensitive' };
    if (q.activeOnly !== 'false') where.isActive = true;
    if (q.search) {
      where.OR = [
        { name: { contains: q.search, mode: 'insensitive' } },
        { area: { contains: q.search, mode: 'insensitive' } },
        { contactPerson: { contains: q.search, mode: 'insensitive' } },
      ];
    }

    const [total, rows] = await Promise.all([
      this.prisma.vendor.count({ where }),
      this.prisma.vendor.findMany({
        where,
        orderBy: [{ name: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
        include: {
          rates: {
            where: {
              isActive: true,
              ...(q.season ? { season: q.season } : {}),
            },
            orderBy: [{ season: 'asc' }, { netRate: 'asc' }],
          },
        },
      }),
    ]);

    return {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
      data: rows.map((v) => this.redact(v, role)),
    };
  }

  async findOne(id: string, role: Role) {
    const vendor = await this.prisma.vendor.findUnique({
      where: { id },
      include: {
        rates: { orderBy: [{ season: 'asc' }, { variant: 'asc' }] },
      },
    });
    if (!vendor) throw new NotFoundException('Vendor not found');
    return this.redact(vendor, role);
  }

  async update(id: string, dto: UpdateVendorDto) {
    const exists = await this.prisma.vendor.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Vendor not found');
    return this.prisma.vendor.update({ where: { id }, data: { ...dto } });
  }

  async deactivate(id: string) {
    const exists = await this.prisma.vendor.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Vendor not found');
    return this.prisma.vendor.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // --- rates ---------------------------------------------------------------

  async addRate(vendorId: string, dto: CreateRateDto) {
    const vendor = await this.prisma.vendor.findUnique({
      where: { id: vendorId },
    });
    if (!vendor) throw new NotFoundException('Vendor not found');

    return this.prisma.vendorRate.create({
      data: {
        vendorId,
        variant: dto.variant,
        season: dto.season,
        mealPlan: dto.mealPlan ?? null,
        rateBasis: dto.rateBasis ?? undefined,
        netRate: dto.netRate,
        rackRate: dto.rackRate ?? null,
        extraBedRate: dto.extraBedRate ?? null,
        childRate: dto.childRate ?? null,
        maxOccupancy: dto.maxOccupancy ?? null,
        validFrom: dto.validFrom ? new Date(dto.validFrom) : null,
        validTo: dto.validTo ? new Date(dto.validTo) : null,
        notes: dto.notes ?? null,
        isActive: dto.isActive ?? true,
      },
    });
  }

  listRates(vendorId: string) {
    return this.prisma.vendorRate.findMany({
      where: { vendorId },
      orderBy: [{ season: 'asc' }, { variant: 'asc' }, { netRate: 'asc' }],
    });
  }

  async updateRate(rateId: string, dto: UpdateRateDto) {
    const exists = await this.prisma.vendorRate.findUnique({
      where: { id: rateId },
    });
    if (!exists) throw new NotFoundException('Rate not found');

    const data: Record<string, any> = { ...dto };
    if (dto.validFrom !== undefined)
      data.validFrom = dto.validFrom ? new Date(dto.validFrom) : null;
    if (dto.validTo !== undefined)
      data.validTo = dto.validTo ? new Date(dto.validTo) : null;

    return this.prisma.vendorRate.update({ where: { id: rateId }, data });
  }

  async removeRate(rateId: string) {
    const exists = await this.prisma.vendorRate.findUnique({
      where: { id: rateId },
    });
    if (!exists) throw new NotFoundException('Rate not found');
    await this.prisma.vendorRate.delete({ where: { id: rateId } });
    return { deleted: true, id: rateId };
  }

  /**
   * Rate lookup for quoting: "Deluxe hotels in Gulmarg, peak season, MAP".
   * Returns rates with their vendor (redacted per role).
   */
  async searchRates(
    params: {
      city?: string;
      type?: any;
      season?: any;
      variant?: string;
      maxNet?: number;
    },
    role: Role,
  ) {
    const rates = await this.prisma.vendorRate.findMany({
      where: {
        isActive: true,
        ...(params.season ? { season: params.season } : {}),
        ...(params.variant
          ? { variant: { contains: params.variant, mode: 'insensitive' } }
          : {}),
        ...(params.maxNet ? { netRate: { lte: params.maxNet } } : {}),
        vendor: {
          isActive: true,
          ...(params.city
            ? { city: { contains: params.city, mode: 'insensitive' } }
            : {}),
          ...(params.type ? { type: params.type } : {}),
        },
      },
      orderBy: [{ netRate: 'asc' }],
      take: 100,
      include: { vendor: true },
    });

    return rates.map((r: any) => ({
      ...r,
      vendor: this.redact(r.vendor, role),
    }));
  }
}
EOF
ok "vendors.service.ts"

# ============================================================================
# 5. VENDOR CONTROLLER
# ============================================================================
say "Writing vendors controller"

cat > src/vendors/vendors.controller.ts << 'EOF'
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
import { VendorsService } from './vendors.service';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { CreateRateDto } from './dto/create-rate.dto';
import { UpdateRateDto } from './dto/update-rate.dto';
import { QueryVendorsDto } from './dto/query-vendors.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { VENDOR_WRITE_ACCESS } from '../common/access';

@Controller('vendors')
export class VendorsController {
  constructor(private readonly vendors: VendorsService) {}

  @Roles(...VENDOR_WRITE_ACCESS)
  @Post()
  create(@Body() dto: CreateVendorDto) {
    return this.vendors.create(dto);
  }

  /** All staff can browse vendors — contacts are redacted by role. */
  @Get()
  findAll(@Query() q: QueryVendorsDto, @CurrentUser('role') role: Role) {
    return this.vendors.findAll(q, role);
  }

  /** Rate lookup for building quotes. */
  @Get('rates/search')
  searchRates(
    @Query('city') city: string,
    @Query('type') type: string,
    @Query('season') season: string,
    @Query('variant') variant: string,
    @Query('maxNet') maxNet: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.vendors.searchRates(
      {
        city,
        type: type || undefined,
        season: season || undefined,
        variant,
        maxNet: maxNet ? parseInt(maxNet, 10) : undefined,
      },
      role,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser('role') role: Role) {
    return this.vendors.findOne(id, role);
  }

  @Roles(...VENDOR_WRITE_ACCESS)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateVendorDto) {
    return this.vendors.update(id, dto);
  }

  @Roles(...VENDOR_WRITE_ACCESS)
  @Delete(':id')
  deactivate(@Param('id') id: string) {
    return this.vendors.deactivate(id);
  }

  // --- rates ---------------------------------------------------------------

  @Roles(...VENDOR_WRITE_ACCESS)
  @Post(':id/rates')
  addRate(@Param('id') id: string, @Body() dto: CreateRateDto) {
    return this.vendors.addRate(id, dto);
  }

  @Get(':id/rates')
  listRates(@Param('id') id: string) {
    return this.vendors.listRates(id);
  }

  @Roles(...VENDOR_WRITE_ACCESS)
  @Patch('rates/:rateId')
  updateRate(@Param('rateId') rateId: string, @Body() dto: UpdateRateDto) {
    return this.vendors.updateRate(rateId, dto);
  }

  @Roles(...VENDOR_WRITE_ACCESS)
  @Delete('rates/:rateId')
  removeRate(@Param('rateId') rateId: string) {
    return this.vendors.removeRate(rateId);
  }
}
EOF

cat > src/vendors/vendors.module.ts << 'EOF'
import { Module } from '@nestjs/common';
import { VendorsService } from './vendors.service';
import { VendorsController } from './vendors.controller';

@Module({
  controllers: [VendorsController],
  providers: [VendorsService],
  exports: [VendorsService],
})
export class VendorsModule {}
EOF
ok "vendors.controller.ts + module"

# ============================================================================
# 6. LEAD VISIBILITY — patch the leads service + controller
# ============================================================================
say "Applying lead visibility rules (execs see only their own)"

python3 - << 'PYEOF'
import re, io, sys

path = 'src/leads/leads.service.ts'
s = io.open(path, encoding='utf-8').read()

# import Actor helpers
s = s.replace(
    "import { scoreLead } from './lead-scoring';",
    "import { scoreLead } from './lead-scoring';\nimport { Actor, canSeeAllLeads } from '../common/access';"
)

# findAll: accept actor and force scope
s = s.replace(
    "  async findAll(q: QueryLeadsDto) {",
    "  async findAll(q: QueryLeadsDto, actor: Actor) {"
)
s = s.replace(
    "    const where: Prisma.LeadWhereInput = {};\n    if (q.status) where.status = q.status;",
    "    const where: Prisma.LeadWhereInput = {};\n\n    // Sales execs are hard-scoped to their own leads — a query param\n    // cannot widen this.\n    if (!canSeeAllLeads(actor.role)) {\n      where.assignedToId = actor.id;\n    } else if (q.assignedToId) {\n      where.assignedToId = q.assignedToId;\n    }\n\n    if (q.status) where.status = q.status;"
)
s = s.replace(
    "    if (q.assignedToId) where.assignedToId = q.assignedToId;\n", ""
)

# findOne: enforce ownership
s = s.replace(
    "  async findOne(id: string) {",
    "  async findOne(id: string, actor: Actor) {"
)
s = s.replace(
    "    if (!lead) throw new NotFoundException('Lead not found');\n    return lead;",
    "    if (!lead) throw new NotFoundException('Lead not found');\n    this.assertCanTouch(lead, actor);\n    return lead;"
)

# update: enforce ownership
s = s.replace(
    "  async update(id: string, dto: UpdateLeadDto, actorId?: string) {\n    const lead = await this.prisma.lead.findUnique({ where: { id } });\n    if (!lead) throw new NotFoundException('Lead not found');",
    "  async update(id: string, dto: UpdateLeadDto, actor: Actor) {\n    const actorId = actor.id;\n    const lead = await this.prisma.lead.findUnique({ where: { id } });\n    if (!lead) throw new NotFoundException('Lead not found');\n    this.assertCanTouch(lead, actor);\n\n    // Execs must not reassign leads away from themselves.\n    if (!canSeeAllLeads(actor.role) && dto.assignedToId !== undefined) {\n      throw new ForbiddenException('You cannot reassign leads');\n    }"
)

# addActivity: enforce ownership
s = s.replace(
    "  async addActivity(leadId: string, dto: CreateActivityDto, actorId?: string) {\n    const lead = await this.prisma.lead.findUnique({ where: { id: leadId } });\n    if (!lead) throw new NotFoundException('Lead not found');",
    "  async addActivity(leadId: string, dto: CreateActivityDto, actor: Actor) {\n    const actorId = actor.id;\n    const lead = await this.prisma.lead.findUnique({ where: { id: leadId } });\n    if (!lead) throw new NotFoundException('Lead not found');\n    this.assertCanTouch(lead, actor);"
)

# stats: scope
s = s.replace(
    "  async stats() {\n    const [byStatus, bySource, total, unassigned] = await Promise.all([\n      this.prisma.lead.groupBy({ by: ['status'], _count: { _all: true } }),\n      this.prisma.lead.groupBy({ by: ['source'], _count: { _all: true } }),\n      this.prisma.lead.count(),\n      this.prisma.lead.count({ where: { assignedToId: null } }),\n    ]);",
    "  async stats(actor: Actor) {\n    const scope: Prisma.LeadWhereInput = canSeeAllLeads(actor.role)\n      ? {}\n      : { assignedToId: actor.id };\n\n    const [byStatus, bySource, total, unassigned] = await Promise.all([\n      this.prisma.lead.groupBy({\n        by: ['status'],\n        where: scope,\n        _count: { _all: true },\n      }),\n      this.prisma.lead.groupBy({\n        by: ['source'],\n        where: scope,\n        _count: { _all: true },\n      }),\n      this.prisma.lead.count({ where: scope }),\n      this.prisma.lead.count({ where: { ...scope, assignedToId: null } }),\n    ]);"
)

# add the guard helper + ForbiddenException import
s = s.replace(
    "import { Injectable, NotFoundException } from '@nestjs/common';",
    "import {\n  ForbiddenException,\n  Injectable,\n  NotFoundException,\n} from '@nestjs/common';"
)
s = s.replace(
    "  /** Normalise a phone to digits",
    "  /**\n   * Sales execs may only touch leads assigned to them.\n   * 404 (not 403) so they cannot probe which lead ids exist.\n   */\n  private assertCanTouch(lead: { assignedToId: string | null }, actor: Actor) {\n    if (canSeeAllLeads(actor.role)) return;\n    if (lead.assignedToId !== actor.id) {\n      throw new NotFoundException('Lead not found');\n    }\n  }\n\n  /** Normalise a phone to digits"
)

io.open(path, 'w', encoding='utf-8').write(s)
print("patched leads.service.ts")
PYEOF
ok "leads.service.ts patched"

# controller: pass the whole actor + gate roles
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
EOF
ok "leads.controller.ts rewritten"

# ============================================================================
# 7. WIRE UP
# ============================================================================
say "Registering VendorsModule"
python3 - << 'PYEOF'
import io
p='src/app.module.ts'
s=io.open(p,encoding='utf-8').read()
if 'VendorsModule' not in s:
    s=s.replace("import { LeadsModule } from './leads/leads.module';",
                "import { LeadsModule } from './leads/leads.module';\nimport { VendorsModule } from './vendors/vendors.module';")
    s=s.replace("    LeadsModule,\n","    LeadsModule,\n    VendorsModule,\n")
    io.open(p,'w',encoding='utf-8').write(s)
    print("registered VendorsModule")
else:
    print("VendorsModule already registered")
PYEOF
ok "app.module.ts"

say "Installing @nestjs/mapped-types (for PartialType DTOs)"
npm install @nestjs/mapped-types || die "npm install failed"
ok "installed"

# ============================================================================
# 8. GENERATE -> MIGRATE -> BUILD -> COMMIT
# ============================================================================
say "Generating Prisma client"
npx prisma generate || die "prisma generate failed"

if [ "${SKIP_MIGRATE:-0}" != "1" ]; then
  say "Running migration (Vendor + VendorRate)"
  npx prisma migrate dev --name vendors || die "Migration failed. Check DIRECT_URL, then: npx prisma migrate dev --name vendors"
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
  git commit -qm "Phase 4: vendors (seasonal rates, contact redaction) + role-scoped lead visibility" || warn "commit skipped"
  ok "committed"
fi

say "PHASE 4 COMPLETE"
cat << 'EOF'

Test it:

  npm run start:dev

  LOGIN=$(curl -s -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@glitz.local","password":"YOUR-PASSWORD"}')
  TOKEN=$(echo "$LOGIN" | sed -n 's/.*"access_token":"\([^"]*\)".*/\1/p')

  # 1) Create a hotel
  curl -X POST http://localhost:3000/api/vendors \
    -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
    -d '{"name":"Hotel Dar-Es-Salam","type":"HOTEL","city":"Srinagar",
         "area":"Nigeen Lake","starRating":4,"falconGrade":"A",
         "contactPerson":"Mr Bhat","phone":"+91 9999900000",
         "gstin":"01ABCDE1234F1Z5","paymentTerms":"50% advance, balance on checkout"}'
  # -> copy the returned "id" as VENDOR_ID

  # 2) Add seasonal rates — net required, rack optional, per category + meal plan
  curl -X POST http://localhost:3000/api/vendors/VENDOR_ID/rates \
    -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
    -d '{"variant":"Deluxe Room","season":"PEAK","mealPlan":"MAP",
         "rateBasis":"PER_ROOM_NIGHT","netRate":6200,"rackRate":9500,
         "extraBedRate":1800,"maxOccupancy":3}'

  curl -X POST http://localhost:3000/api/vendors/VENDOR_ID/rates \
    -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
    -d '{"variant":"Deluxe Room","season":"OFF","mealPlan":"MAP","netRate":3800}'

  # 3) A transport vendor — same table, different shape
  curl -X POST http://localhost:3000/api/vendors \
    -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
    -d '{"name":"Kashmir Cabs","type":"TRANSPORT","city":"Srinagar","unionZone":"Zone 1"}'
  # then add: {"variant":"Toyota Innova","season":"PEAK",
  #            "rateBasis":"PER_VEHICLE_DAY","netRate":3500}

  # 4) Rate lookup for quoting
  curl "http://localhost:3000/api/vendors/rates/search?city=Srinagar&season=PEAK&variant=Deluxe" \
    -H "Authorization: Bearer $TOKEN"

  # 5) PROVE THE SUPPLIER PROTECTION WORKS
  #    Create a sales exec, log in as them, and look at the same vendor.
  curl -X POST http://localhost:3000/api/users \
    -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
    -d '{"name":"Junior Exec","email":"exec@glitz.local","password":"secret123","role":"SALES_EXEC"}'

  EXEC=$(curl -s -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"exec@glitz.local","password":"secret123"}')
  EXEC_TOKEN=$(echo "$EXEC" | sed -n 's/.*"access_token":"\([^"]*\)".*/\1/p')

  curl "http://localhost:3000/api/vendors" -H "Authorization: Bearer $EXEC_TOKEN"
  # -> rates are FULL, but contactPerson/phone/email/bank are null
  #    and "contactRedacted": true

  curl "http://localhost:3000/api/leads" -H "Authorization: Bearer $EXEC_TOKEN"
  # -> empty (no leads assigned to them) while the owner sees all

Confirmed when: the exec sees rates but null contacts, and sees no leads
that aren't assigned to them.
EOF
