import { Module } from '@nestjs/common';
import { QuotesService } from './quotes.service';
import { QuotesController } from './quotes.controller';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [SettingsModule],
  controllers: [QuotesController],
  providers: [QuotesService],
  exports: [QuotesService],
})
export class QuotesModule {}
