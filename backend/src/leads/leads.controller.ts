import {
  Body,
  Controller,
  Delete,
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

  /**
   * Manual add by a logged-in operator (phone-in, walk-in).
   * Same dedupe + scoring path as public capture, but auto-assigns to caller.
   */
  @Roles(...LEAD_MODULE_ROLES)
  @Post()
  manualCreate(@Body() dto: CaptureLeadDto, @CurrentUser() actor: Actor) {
    return this.leads.manualCreate(dto, actor);
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

  /** Operational tiles for the desk. Scoped per role like `stats`. */
  @Roles(...LEAD_MODULE_ROLES)
  @Get('stats/ops')
  opsStats(@CurrentUser() actor: Actor) {
    return this.leads.opsStats(actor);
  }

  /** Overdue + due-today + upcoming-this-week worklist for /follow-ups. */
  @Roles(...LEAD_MODULE_ROLES)
  @Get('follow-ups')
  followUps(@CurrentUser() actor: Actor) {
    return this.leads.followUps(actor);
  }

  /** Global search from the ⌘K palette. Free-text over name/phone/email. */
  @Roles(...LEAD_MODULE_ROLES)
  @Get('search')
  search(@Query('q') q: string, @CurrentUser() actor: Actor) {
    if (!q || q.trim().length < 2) return [];
    return this.leads.searchLeads(actor, q.trim());
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

  /**
   * Soft-delete: parks the lead in LOST with a system reason. History,
   * bookings and activities are preserved — we never destroy a client record.
   */
  @Roles(...LEAD_MODULE_ROLES)
  @Delete(':id')
  deactivate(@Param('id') id: string, @CurrentUser() actor: Actor) {
    return this.leads.deactivate(id, actor);
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
