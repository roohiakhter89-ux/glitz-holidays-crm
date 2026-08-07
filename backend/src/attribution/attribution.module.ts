import { Module } from '@nestjs/common';
import { AttributionService } from './attribution.service';
import { AttributionController } from './attribution.controller';

@Module({
  providers: [AttributionService],
  controllers: [AttributionController],
  exports: [AttributionService],
})
export class AttributionModule {}
