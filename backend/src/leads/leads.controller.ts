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
