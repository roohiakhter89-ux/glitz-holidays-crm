import { Module, forwardRef } from '@nestjs/common';
import { IntegrationsService } from './integrations.service';
import { IntegrationsController } from './integrations.controller';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';
import { WhatsAppService } from './whatsapp.service';
import { LeadsModule } from '../leads/leads.module';

@Module({
  imports: [forwardRef(() => LeadsModule)],
  controllers: [IntegrationsController, WebhooksController],
  providers: [IntegrationsService, WebhooksService, WhatsAppService],
  exports: [IntegrationsService, WhatsAppService],
})
export class IntegrationsModule {}
