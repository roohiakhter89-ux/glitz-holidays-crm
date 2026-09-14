import { Module } from '@nestjs/common';
import { SeoService } from './seo.service';
import { SeoController } from './seo.controller';
import { SearchConsoleService } from './search-console.service';
import { SearchConsoleSyncJob } from './search-console-sync.job';
import { SearchInsightsService } from './search-insights.service';

@Module({
  providers: [SeoService, SearchConsoleService, SearchInsightsService, SearchConsoleSyncJob],
  controllers: [SeoController],
  exports: [SeoService, SearchConsoleService, SearchInsightsService],
})
export class SeoModule {}
