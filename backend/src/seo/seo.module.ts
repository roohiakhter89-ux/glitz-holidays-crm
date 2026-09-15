import { Module } from '@nestjs/common';
import { SeoService } from './seo.service';
import { SeoAuditService } from './seo-audit.service';
import { SeoController } from './seo.controller';
import { SearchConsoleService } from './search-console.service';
import { SearchConsoleSyncJob } from './search-console-sync.job';
import { SearchInsightsService } from './search-insights.service';
import { IndexNowService } from './indexnow.service';

@Module({
  providers: [
    SeoService,
    SeoAuditService,
    SearchConsoleService,
    SearchInsightsService,
    SearchConsoleSyncJob,
    IndexNowService,
  ],
  controllers: [SeoController],
  exports: [SeoService, SearchConsoleService, SearchInsightsService, IndexNowService],
})
export class SeoModule {}
