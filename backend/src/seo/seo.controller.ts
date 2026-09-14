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
import { CreateSiteDto } from './dto/create-site.dto';
import { UpdateSiteDto } from './dto/update-site.dto';
import { UpdateOffPageDto } from './dto/update-offpage.dto';
import { UpdateDomainSignalsDto } from './dto/update-domain-signals.dto';
import { SyncSearchConsoleDto } from './dto/sync-search-console.dto';
import { SearchConsoleService } from './search-console.service';
import { Roles } from '../common/decorators/roles.decorator';
import { INTERNAL_STAFF } from '../common/access';

const SEO_WRITE: Role[] = [Role.SUPER_ADMIN, Role.OWNER, Role.MARKETING];

@Controller('seo')
export class SeoController {
  constructor(
    private readonly seo: SeoService,
    private readonly searchConsole: SearchConsoleService,
  ) {}

  @Roles(...SEO_WRITE)
  @Post('refresh-all')
  refreshAll() {
    return this.seo.refreshAll();
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

  @Roles(...INTERNAL_STAFF)
  @Get('sites/:id/rankings')
  getPageRankings(@Param('id') id: string) {
    return this.seo.getPageRankings(id);
  }

  @Roles(...SEO_WRITE)
  @Put('sites/:id/off-page')
  updateOffPage(@Param('id') id: string, @Body() dto: UpdateOffPageDto) {
    return this.seo.updateOffPage(id, dto);
  }

  /** Site-wide off-page signals: GBP, reviews, citations, referring domains. */
  @Roles(...INTERNAL_STAFF)
  @Get('sites/:id/domain-signals')
  getDomainSignals(@Param('id') id: string) {
    return this.seo.getDomainSignals(id);
  }

  /**
   * Update the site-wide signals. Rescores every audited page, since these
   * apply to the whole domain rather than one URL.
   */
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
    return this.seo.auditSinglePage(id, body.url, body.keyword);
  }

  @Roles(...INTERNAL_STAFF)
  @Get('sites/:id/history')
  history(@Param('id') id: string) {
    return this.seo.getHistory(id);
  }

  @Roles(...SEO_WRITE)
  @Post('sites/:id/audit')
  runAudit(@Param('id') id: string) {
    return this.seo.runAudit(id);
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
   * SeoOffPage. Idempotent: re-running a window updates rather than duplicates.
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
