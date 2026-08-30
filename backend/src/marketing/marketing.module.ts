import { Module } from '@nestjs/common';
import { MarketingController } from './marketing.controller';
import { MarketingService } from './marketing.service';
import { BrevoEmailService } from './brevo-email.service';
import { PrismaModule } from '../prisma/prisma.module';
import { IntegrationsModule } from '../integrations/integrations.module';

@Module({
  imports: [PrismaModule, IntegrationsModule],
  controllers: [MarketingController],
  providers: [MarketingService, BrevoEmailService],
  exports: [MarketingService],
})
export class MarketingModule {}
