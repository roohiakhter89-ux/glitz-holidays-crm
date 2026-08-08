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
import { VENDOR_READ_ACCESS, VENDOR_WRITE_ACCESS } from '../common/access';

/**
 * Every route here exposes netRate. VENDOR_READ_ACCESS is staff-only by
 * design; when a B2B partner portal is built it must NOT reuse this
 * controller — it needs its own read model that returns sell prices without
 * cost.
 */
@Roles(...VENDOR_READ_ACCESS)
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

  /** Rate lookup for building quotes. Only rates valid on `on` are returned. */
  @Get('rates/search')
  searchRates(
    @Query('city') city: string,
    @Query('type') type: string,
    @Query('season') season: string,
    @Query('variant') variant: string,
    @Query('maxNet') maxNet: string,
    @Query('on') on: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.vendors.searchRates(
      {
        city,
        type: type || undefined,
        season: season || undefined,
        variant,
        maxNet: maxNet ? parseInt(maxNet, 10) : undefined,
        on: on || undefined,
      },
      role,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser('role') role: Role) {
    return this.vendors.findOne(id, role);
  }

  /**
   * Supplier ledger — payables + payments history for one vendor. Gated on
   * VENDOR_WRITE_ACCESS (owner/ops/admin) rather than the read gate, because
   * it exposes cross-booking spend which is finance-sensitive.
   */
  @Roles(...VENDOR_WRITE_ACCESS)
  @Get(':id/ledger')
  ledger(
    @Param('id') id: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.vendors.ledger(id, { from, to });
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
