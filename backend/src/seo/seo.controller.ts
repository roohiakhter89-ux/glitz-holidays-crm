import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { SeoService } from './seo.service';
import { CreateSiteDto } from './dto/create-site.dto';
import { UpdateSiteDto } from './dto/update-site.dto';
import { Roles } from '../common/decorators/roles.decorator';

/**
 * SEO controls the numbers that decide where marketing budget goes, so gate
 * mutations to OWNER + SUPER_ADMIN + MARKETING. Reads are open to any staff
 * role so a sales exec can check the health of the page a lead landed on.
 */
const SEO_WRITE: Role[] = [Role.SUPER_ADMIN, Role.OWNER, Role.MARKETING];

@Controller('seo')
export class SeoController {
  constructor(private readonly seo: SeoService) {}

  @Roles(...SEO_WRITE)
  @Post('refresh-all')
  refreshAll() {
    return this.seo.refreshAll();
  }

  @Get('sites')
  listSites() {
    return this.seo.listSites();
  }

  @Roles(...SEO_WRITE)
  @Post('sites')
  createSite(@Body() dto: CreateSiteDto) {
    return this.seo.createSite(dto);
  }

  @Roles(...SEO_WRITE)
  @Patch('sites/:id')
  updateSite(@Param('id') id: string, @Body() dto: UpdateSiteDto) {
    return this.seo.updateSite(id, dto);
  }

  @Get('sites/:id/audit')
  latestAudit(@Param('id') id: string) {
    return this.seo.latestAudit(id);
  }

  @Get('sites/:id/history')
  history(@Param('id') id: string) {
    return this.seo.getHistory(id);
  }

  @Roles(...SEO_WRITE)
  @Post('sites/:id/audit')
  runAudit(@Param('id') id: string) {
    return this.seo.runAudit(id);
  }
}
