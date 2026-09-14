import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Role } from '@prisma/client';
import { SeoService } from './seo.service';
import { SeoAuditService } from './seo-audit.service';
import { CreateSiteDto } from './dto/create-site.dto';
import { UpdateSiteDto } from './dto/update-site.dto';
import { UpdateOffPageDto } from './dto/update-offpage.dto';
import { UpdateDomainSignalsDto } from './dto/update-domain-signals.dto';
import { SyncSearchConsoleDto } from './dto/sync-search-console.dto';
import { SearchConsoleService } from './search-console.service';
import { SearchInsightsService } from './search-insights.service';
import { attachSearchData } from './search-console-insights';
import { Roles } from '../common/decorators/roles.decorator';
import { INTERNAL_STAFF } from '../common/access';

const SEO_WRITE: Role[] = [Role.SUPER_ADMIN, Role.OWNER, Role.MARKETING];

@Controller('seo')
export class SeoController {
  constructor(
    private readonly seo: SeoService,
    private readonly audits: SeoAuditService,
    private readonly searchConsole: SearchConsoleService,
    private readonly insights: SearchInsightsService,
  ) {}

  /** Start a full audit of every active site. Returns immediately; poll each site's status. */
  @Roles(...SEO_WRITE)
  @Post('refresh-all')
  refreshAll() {
    return this.audits.startAll();
  }

  @Roles(...INTERNAL_STAFF)
  @Get('sites')
  listSites() {
    return this.seo.listSites();
  }

  @Roles(...SEO_WRITE)
  @Post('sites')
  createSite(@Body() dto: CreateSiteDto) {
    return this.seo.createSite(dto);
  }

  @Roles(...SEO_WRITE)
  @Patch('sites/:id')
  updateSite(@Param('id') id: string, @Body() dto: UpdateSiteDto) {
    return this.seo.updateSite(id, dto);
  }

  @Roles(...INTERNAL_STAFF)
  @Get('sites/:id/audit')
  latestAudit(@Param('id') id: string) {
    return this.seo.latestAudit(id);
  }

  /** Progress of the running or most recent full audit, or idle when none has run since start-up. */
  @Roles(...INTERNAL_STAFF)
  @Get('sites/:id/audit/status')
  auditStatus(@Param('id') id: string) {
    return this.audits.status(id) ?? { state: 'idle' };
  }

  @Roles(...INTERNAL_STAFF)
  @Get('sites/:id/rankings')
  async getPageRankings(@Param('id') id: string) {
    const rankings = await this.seo.getPageRankings(id);
    // Search Console figures are attached for display and added as tasks only.
    // They never change the score, so leaderboard scores stay stable while
    // Google's numbers move day to day. Without synced data this is a no-op.
    try {
      const report = await this.insights.report(id, 28);
      return attachSearchData(rankings as any, report);
    } catch {
      return rankings;
    }
  }

  @Roles(...SEO_WRITE)
  @Put('sites/:id/off-page')
  updateOffPage(@Param('id') id: string, @Body() dto: UpdateOffPageDto) {
    return this.seo.updateOffPage(id, dto);
  }

  /** Site-wide signals: referring domains, Business Profile, reviews, citations. */
  @Roles(...INTERNAL_STAFF)
  @Get('sites/:id/domain-signals')
  getDomainSignals(@Param('id') id: string) {
    return this.seo.getDomainSignals(id);
  }

  /** Update the site-wide signals and rescore pages; referring domains feed page authority. */
  @Roles(...SEO_WRITE)
  @Put('sites/:id/domain-signals')
  updateDomainSignals(
    @Param('id') id: string,
    @Body() dto: UpdateDomainSignalsDto,
  ) {
    return this.seo.updateDomainSignals(id, dto);
  }

  @Roles(...SEO_WRITE)
  @Post('sites/:id/audit-page')
  auditSinglePage(
    @Param('id') id: string,
    @Body() body: { url: string; keyword?: string },
  ) {
    return this.audits.auditPage(id, body.url, body.keyword);
  }

  @Roles(...INTERNAL_STAFF)
  @Get('sites/:id/history')
  history(@Param('id') id: string) {
    return this.seo.getHistory(id);
  }

  /** Start a full audit in the background. Returns the run status to poll. */
  @Roles(...SEO_WRITE)
  @Post('sites/:id/audit')
  runAudit(@Param('id') id: string) {
    return this.audits.start(id);
  }

  // ---- Google Search Console ------------------------------------------------

  /** Properties the stored credentials can reach. */
  @Roles(...SEO_WRITE)
  @Get('search-console/properties')
  searchConsoleProperties() {
    return this.searchConsole.listProperties();
  }

  /**
   * Pull performance data into SeoSearchAnalytics and write page CTR back to
   * SeoOffPage for display. Idempotent: re-running a window updates rather than
   * duplicates.
   *
   * Throttled because this fans out to a rate-limited third-party API with a
   * 50,000 row per day cap.
   */
  @Roles(...SEO_WRITE)
  @Throttle({ default: { limit: 6, ttl: 60000 } })
  @Post('sites/:id/search-console/sync')
  syncSearchConsole(@Param('id') id: string, @Body() dto: SyncSearchConsoleDto) {
    return this.searchConsole.sync(id, dto);
  }

  /** Queries ranking 11-20: already ranking, one nudge off page one. */
  @Roles(...INTERNAL_STAFF)
  @Get('sites/:id/search-console/striking-distance')
  strikingDistance(
    @Param('id') id: string,
    @Query('limit') limit?: string,
    @Query('minImpressions') minImpressions?: string,
  ) {
    return this.searchConsole.strikingDistanceReport(id, {
      limit: limit ? parseInt(limit, 10) : undefined,
      minImpressions: minImpressions ? parseInt(minImpressions, 10) : undefined,
    });
  }

  /**
   * Dashboard report: totals and trends against the previous period, top pages
   * and queries, devices, countries and diagnosed issues. Built from stored
   * rows, so it uses no Search Console quota.
   */
  @Roles(...INTERNAL_STAFF)
  @Get('sites/:id/search-console/report')
  searchConsoleReport(@Param('id') id: string, @Query('days') days?: string) {
    return this.insights.report(id, days ? parseInt(days, 10) : 28);
  }

  /** Stored Search Console performance for one page. */
  @Roles(...INTERNAL_STAFF)
  @Get('sites/:id/search-console/page')
  searchConsolePage(
    @Param('id') id: string,
    @Query('url') url: string,
    @Query('days') days?: string,
  ) {
    return this.searchConsole.pagePerformance(
      id,
      url,
      days ? parseInt(days, 10) : undefined,
    );
  }
}
