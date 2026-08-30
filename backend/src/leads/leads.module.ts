import { Module, forwardRef } from '@nestjs/common';
import { LeadsService } from './leads.service';
import { LeadsController } from './leads.controller';
import { AssignmentService } from './assignment.service';
import { AttributionModule } from '../attribution/attribution.module';
import { IntegrationsModule } from '../integrations/integrations.module';

@Module({
  imports: [AttributionModule, forwardRef(() => IntegrationsModule)],
  controllers: [LeadsController],
  providers: [LeadsService, AssignmentService],
  exports: [LeadsService, AssignmentService],
})
export class LeadsModule {}
