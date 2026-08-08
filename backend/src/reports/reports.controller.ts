import { Controller, Get, Query } from '@nestjs/common';
import { Role } from '@prisma/client';
import { ReportsService } from './reports.service';
import { Roles } from '../common/decorators/roles.decorator';

/**
 * Reports expose agency-wide totals — money, staff performance, supplier
 * spend. That's leadership data, not day-to-day operator data, so gated to
 * OWNER + SUPER_ADMIN + SALES_MANAGER + ACCOUNTS. A sales exec seeing another
 * exec's revenue would break the per-lead scoping we spent phase 10 fixing.
 */
const REPORT_ROLES: Role[] = [
  Role.SUPER_ADMIN,
  Role.OWNER,
  Role.SALES_MANAGER,
  Role.ACCOUNTS,
];

@Roles(...REPORT_ROLES)
@Controller('reports')
export class ReportsController {
  constructor(private readonly svc: ReportsService) {}

  @Get('revenue')
  revenue(@Query('from') from?: string, @Query('to') to?: string) {
    return this.svc.revenueTrend(from, to);
  }

  @Get('staff')
  staff(@Query('from') from?: string, @Query('to') to?: string) {
    return this.svc.topStaff(from, to);
  }

  @Get('vendors')
  vendors(@Query('from') from?: string, @Query('to') to?: string) {
    return this.svc.vendorSpend(from, to);
  }

  @Get('cancellations')
  cancellations(@Query('from') from?: string, @Query('to') to?: string) {
    return this.svc.cancellations(from, to);
  }

  @Get('sources')
  sources(@Query('from') from?: string, @Query('to') to?: string) {
    return this.svc.leadSources(from, to);
  }
}
