import { Body, Controller, Get, Patch } from '@nestjs/common';
import { Role } from '@prisma/client';
import { SettingsService } from './settings.service';
import { UpdatePricingDto } from './dto/update-pricing.dto';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  /** Staff need to read markup policy to understand quote prices. */
  @Get('pricing')
  getPricing() {
    return this.settings.getPricing();
  }

  /** Only the owner sets commercial policy. */
  @Roles(Role.OWNER, Role.SUPER_ADMIN)
  @Patch('pricing')
  updatePricing(@Body() dto: UpdatePricingDto) {
    return this.settings.updatePricing(dto);
  }
}
