import { Module } from '@nestjs/common';
import { AttributionService } from './attribution.service';
import { AttributionController } from './attribution.controller';
import { GoogleAdsService } from './google-ads.service';
import { GoogleAdsSyncJob } from './google-ads-sync.job';
import { OfflineConversionsService } from './offline-conversions.service';

@Module({
  providers: [
    AttributionService,
    GoogleAdsService,
    GoogleAdsSyncJob,
    OfflineConversionsService,
  ],
  controllers: [AttributionController],
  exports: [AttributionService, GoogleAdsService, OfflineConversionsService],
})
export class AttributionModule {}
