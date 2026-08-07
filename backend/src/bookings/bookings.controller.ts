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
