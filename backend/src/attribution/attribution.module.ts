import { Module } from '@nestjs/common';
import { AttributionService } from './attribution.service';
import { AttributionController } from './attribution.controller';
import { GoogleAdsService } from './google-ads.service';
import { GoogleAdsSyncJob } from './google-ads-sync.job';

@Module({
  providers: [AttributionService, GoogleAdsService, GoogleAdsSyncJob],
  controllers: [AttributionController],
  exports: [AttributionService, GoogleAdsService],
})
export class AttributionModule {}
