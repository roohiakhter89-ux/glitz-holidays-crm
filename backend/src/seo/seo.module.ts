import { Module } from '@nestjs/common';
import { SeoService } from './seo.service';
import { SeoController } from './seo.controller';
import { SearchConsoleService } from './search-console.service';
import { SearchConsoleSyncJob } from './search-console-sync.job';

@Module({
  providers: [SeoService, SearchConsoleService, SearchConsoleSyncJob],
  controllers: [SeoController],
  exports: [SeoService, SearchConsoleService],
})
export class SeoModule {}
