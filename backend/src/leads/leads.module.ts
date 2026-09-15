import { Module, forwardRef } from '@nestjs/common';
import { LeadsService } from './leads.service';
import { LeadsController } from './leads.controller';
import { AssignmentService } from './assignment.service';
import { LeadNurturingService } from './lead-nurturing.service';
import { AttributionModule } from '../attribution/attribution.module';
import { IntegrationsModule } from '../integrations/integrations.module';

@Module({
  imports: [AttributionModule, forwardRef(() => IntegrationsModule)],
  controllers: [LeadsController],
  providers: [LeadsService, AssignmentService, LeadNurturingService],
  exports: [LeadsService, AssignmentService, LeadNurturingService],
})
export class LeadsModule {}
