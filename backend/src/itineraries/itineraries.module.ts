import { Module } from '@nestjs/common';
import { ItinerariesService } from './itineraries.service';
import { ItinerariesController } from './itineraries.controller';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [SettingsModule],
  providers: [ItinerariesService],
  controllers: [ItinerariesController],
  exports: [ItinerariesService],
})
export class ItinerariesModule {}
