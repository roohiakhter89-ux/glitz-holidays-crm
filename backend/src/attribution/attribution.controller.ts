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
import { AdChannel, Role } from '@prisma/client';
import { AttributionService } from './attribution.service';
import { CreateLandingPageDto } from './dto/create-landing-page.dto';
import { UpdateLandingPageDto } from './dto/update-landing-page.dto';
import { TrackVisitDto } from './dto/track-visit.dto';
import { CreateAdSpendDto } from './dto/create-ad-spend.dto';
import { UpdateAdSpendDto } from './dto/update-ad-spend.dto';
import { SyncGoogleAdsDto } from './dto/sync-google-ads.dto';
import { GoogleAdsService } from './google-ads.service';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';

/**
 * Reads are open to any staff role — knowing the CPL should not require
 * finance clearance. WRITES on ad spend and landing pages are limited to
 * MARKETING + OWNER + ADMIN because they change the numbers on the dashboard
 * everyone else steers by.
 */
const ATTRIBUTION_WRITE: Role[] = [
  Role.SUPER_ADMIN,
  Role.OWNER,
  Role.MARKETING,
];

function detectDevice(ua: string): string {
  const s = ua.toLowerCase();
  if (/ipad|tablet/.test(s)) return 'tablet';
  if (/mobi|android|iphone/.test(s)) return 'mobile';
  return 'desktop';
}

@Controller()
export class AttributionController {
  constructor(
    private readonly svc: AttributionService,
    private readonly googleAds: GoogleAdsService,
  ) {}

  // ---- Visits — public beacon --------------------------------------------

  /**
   * Called from every landing page on load with the first-party visitor
   * cookie, the current UTMs, and the page slug. Returns { visitId } — the
   * page stashes that and includes it when the lead form submits.
   *
   * Rate-limited hard: a bad actor could easily flood /visits since it takes
   * no auth. The window is generous enough for real traffic and small enough
   * that a single IP cannot inflate a competitor's landing-page numbers.
   */
  @Public()
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @Post('visits')
  track(@Body() dto: TrackVisitDto, @Req() req: any) {
    const userAgent: string = req.headers['user-agent'] ?? '';
    const forwarded: string = req.headers['x-forwarded-for'] ?? '';
    const ipAddress =
      (typeof forwarded === 'string' && forwarded.split(',')[0].trim()) ||
      req.ip ||
      undefined;
    return this.svc.trackVisit(dto, {
      ipAddress,
      userAgent,
      device: detectDevice(userAgent),
    });
  }

  // ---- Landing pages ------------------------------------------------------

  @Get('landing-pages')
  listPages() {
    return this.svc.listLandingPages();
  }

  @Roles(...ATTRIBUTION_WRITE)
  @Post('landing-pages')
  createPage(@Body() dto: CreateLandingPageDto) {
    return this.svc.createLandingPage(dto);
  }

  @Roles(...ATTRIBUTION_WRITE)
  @Patch('landing-pages/:id')
  updatePage(@Param('id') id: string, @Body() dto: UpdateLandingPageDto) {
    return this.svc.updateLandingPage(id, dto);
  }

  // ---- Ad spend -----------------------------------------------------------

  @Get('ad-spend')
  listSpend(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('channel') channel?: string,
  ) {
    return this.svc.listAdSpend({
      from,
      to,
      channel: channel ? (channel as AdChannel) : undefined,
    });
  }

  @Roles(...ATTRIBUTION_WRITE)
  @Post('ad-spend')
  createSpend(@Body() dto: CreateAdSpendDto) {
    return this.svc.createAdSpend(dto);
  }

  @Roles(...ATTRIBUTION_WRITE)
  @Patch('ad-spend/:id')
  updateSpend(@Param('id') id: string, @Body() dto: UpdateAdSpendDto) {
    return this.svc.updateAdSpend(id, dto);
  }

  @Roles(...ATTRIBUTION_WRITE)
  @Delete('ad-spend/:id')
  removeSpend(@Param('id') id: string) {
    return this.svc.removeAdSpend(id);
  }

  // ---- Google Ads sync ----------------------------------------------------

  /**
   * Accounts the stored credentials can reach, so the operator picks an
   * account instead of typing a ten-digit customer ID.
   */
  @Roles(...ATTRIBUTION_WRITE)
  @Get('ad-spend/google-ads/accounts')
  googleAdsAccounts() {
    return this.googleAds.listAccessibleCustomers();
  }

  /**
   * Pull campaign spend into AdSpend. Idempotent — re-running a window updates
   * the rows it already wrote, which is required because Google restates
   * recent cost data.
   *
   * Throttled hard: this fans out to a paid third-party API, and a jumpy
   * operator clicking Sync repeatedly should not multiply the request volume.
   */
  @Roles(...ATTRIBUTION_WRITE)
  @Throttle({ default: { limit: 6, ttl: 60000 } })
  @Post('ad-spend/sync/google-ads')
  syncGoogleAds(@Body() dto: SyncGoogleAdsDto) {
    return this.svc.syncGoogleAds(dto);
  }

  // ---- Reports ------------------------------------------------------------

  @Get('attribution/pages')
  pagesReport(@Query('from') from?: string, @Query('to') to?: string) {
    return this.svc.landingPageReport(from, to);
  }

  @Get('attribution/daily')
  dailyReport(@Query('from') from?: string, @Query('to') to?: string) {
    return this.svc.dailyReport(from, to);
  }
}
