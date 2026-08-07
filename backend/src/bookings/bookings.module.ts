import { Module } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { PdfModule } from '../pdf/pdf.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [PdfModule, SettingsModule],
  controllers: [BookingsController],
  providers: [BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}
