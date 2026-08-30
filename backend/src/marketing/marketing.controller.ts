import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { Role, CampaignChannel } from '@prisma/client';
import { MarketingService } from './marketing.service';
import { WhatsAppService } from '../integrations/whatsapp.service';
import { AudienceFilterDto } from './dto/audience-filter.dto';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { QueryCampaignsDto } from './dto/query-campaigns.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Actor } from '../common/access';

const MARKETING_ROLES = [Role.SUPER_ADMIN, Role.OWNER, Role.MARKETING];

@Controller('marketing')
export class MarketingController {
  constructor(
    private readonly marketing: MarketingService,
    private readonly whatsapp: WhatsAppService,
  ) {}

  @Roles(...MARKETING_ROLES)
  @Post('audience/preview')
  previewAudience(
    @Body() filter: AudienceFilterDto,
    @Query('channel') channel?: CampaignChannel,
  ) {
    return this.marketing.previewAudience(filter, channel);
  }

  @Roles(...MARKETING_ROLES)
  @Get('templates/whatsapp')
  listWhatsAppTemplates() {
    return this.whatsapp.listTemplates();
  }

  @Roles(...MARKETING_ROLES)
  @Get('campaigns')
  findAll(@Query() query: QueryCampaignsDto) {
    return this.marketing.findAll(query);
  }

  @Roles(...MARKETING_ROLES)
  @Post('campaigns')
  create(@Body() dto: CreateCampaignDto, @CurrentUser() actor: Actor) {
    return this.marketing.createCampaign(dto, actor);
  }

  @Roles(...MARKETING_ROLES)
  @Get('campaigns/:id')
  findOne(@Param('id') id: string) {
    return this.marketing.findOne(id);
  }

  @Roles(...MARKETING_ROLES)
  @Post('campaigns/:id/send')
  send(@Param('id') id: string, @CurrentUser() actor: Actor) {
    return this.marketing.sendCampaign(id, actor);
  }

  @Roles(...MARKETING_ROLES)
  @Post('campaigns/:id/cancel')
  cancel(@Param('id') id: string) {
    return this.marketing.cancelCampaign(id);
  }

  @Public()
  @Get('unsubscribe/:token')
  unsubscribe(@Param('token') token: string) {
    return this.marketing.handleUnsubscribe(token);
  }
}
