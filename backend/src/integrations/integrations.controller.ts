import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { IntegrationCategory, Role } from '@prisma/client';
import { IntegrationsService } from './integrations.service';
import { UpsertIntegrationDto } from './dto/upsert-integration.dto';
import { Roles } from '../common/decorators/roles.decorator';

/**
 * Everything under /integrations is finance-and-config sensitive. Restrict
 * to owner + super-admin. Even the catalog endpoint is gated because it
 * enumerates every provider we support — no reason to leak that outside the
 * admin surface.
 */
@Roles(Role.SUPER_ADMIN, Role.OWNER)
@Controller('integrations')
export class IntegrationsController {
  constructor(private readonly svc: IntegrationsService) {}

  /** Provider metadata for the Add dialog (fields + labels + docs URLs). */
  @Get('catalog')
  catalog() {
    return this.svc.catalog();
  }

  @Get()
  list(@Query('category') category?: IntegrationCategory) {
    return this.svc.list(category);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.svc.findOne(id);
  }

  @Post()
  create(@Body() dto: UpsertIntegrationDto) {
    return this.svc.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: Partial<UpsertIntegrationDto>) {
    return this.svc.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.svc.remove(id);
  }

  @Post(':id/test')
  test(@Param('id') id: string) {
    return this.svc.test(id);
  }
}
