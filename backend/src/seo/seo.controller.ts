import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { SeoService } from './seo.service';
import { CreateSiteDto } from './dto/create-site.dto';
import { UpdateSiteDto } from './dto/update-site.dto';
import { UpdateOffPageDto } from './dto/update-offpage.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { INTERNAL_STAFF } from '../common/access';

const SEO_WRITE: Role[] = [Role.SUPER_ADMIN, Role.OWNER, Role.MARKETING];

@Controller('seo')
export class SeoController {
  constructor(private readonly seo: SeoService) {}

  @Roles(...SEO_WRITE)
  @Post('refresh-all')
  refreshAll() {
    return this.seo.refreshAll();
  }

  @Roles(...INTERNAL_STAFF)
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

  @Roles(...INTERNAL_STAFF)
  @Get('sites/:id/audit')
  latestAudit(@Param('id') id: string) {
    return this.seo.latestAudit(id);
  }

  @Roles(...INTERNAL_STAFF)
  @Get('sites/:id/rankings')
  getPageRankings(@Param('id') id: string) {
    return this.seo.getPageRankings(id);
  }

  @Roles(...SEO_WRITE)
  @Put('sites/:id/off-page')
  updateOffPage(@Param('id') id: string, @Body() dto: UpdateOffPageDto) {
    return this.seo.updateOffPage(id, dto);
  }

  @Roles(...SEO_WRITE)
  @Post('sites/:id/audit-page')
  auditSinglePage(
    @Param('id') id: string,
    @Body() body: { url: string; keyword?: string },
  ) {
    return this.seo.auditSinglePage(id, body.url, body.keyword);
  }

  @Roles(...INTERNAL_STAFF)
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
