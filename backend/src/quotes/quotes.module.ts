import { Module } from '@nestjs/common';
import { QuotesService } from './quotes.service';
import { QuotesController } from './quotes.controller';
import { SettingsModule } from '../settings/settings.module';
import { PdfModule } from '../pdf/pdf.module';

@Module({
  imports: [SettingsModule, PdfModule],
  controllers: [QuotesController],
  providers: [QuotesService],
  exports: [QuotesService],
})
export class QuotesModule {}
