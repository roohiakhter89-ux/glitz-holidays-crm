import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { SocialService, CreateSocialPostDto, UpdateSocialPostDto } from './social.service';
import { GenerateCopyDto } from './ai-generator.service';
import { SocialPlatform, SocialPostStatus } from '@prisma/client';
import { Role } from '@prisma/client';

const SOCIAL_ROLES: Role[] = [Role.OWNER, Role.SUPER_ADMIN, Role.MARKETING, Role.SALES_MANAGER];

@UseGuards(JwtAuthGuard)
@Controller('social')
export class SocialController {
  constructor(private readonly socialService: SocialService) {}

  private assertRole(user: any) {
    if (!SOCIAL_ROLES.includes(user.role)) {
      const { ForbiddenException } = require('@nestjs/common');
      throw new ForbiddenException('Social Studio requires Marketing or Admin role');
    }
  }

  // ─── AI Copy Generator ──────────────────────────────────────────────────────

  @Post('generate')
  async generateCopy(@Body() dto: GenerateCopyDto, @Request() req: any) {
    this.assertRole(req.user);
    return this.socialService.generateCopy(dto);
  }

  // ─── Social Accounts ────────────────────────────────────────────────────────

  @Get('accounts')
  async listAccounts(@Request() req: any) {
    this.assertRole(req.user);
    return this.socialService.listAccounts();
  }

  @Post('accounts')
  async connectAccount(@Body() body: any, @Request() req: any) {
    this.assertRole(req.user);
    return this.socialService.connectAccount(body);
  }

  @Delete('accounts/:id')
  async disconnectAccount(@Param('id') id: string, @Request() req: any) {
    this.assertRole(req.user);
    return this.socialService.disconnectAccount(id);
  }

  // ─── Posts CRUD ─────────────────────────────────────────────────────────────

  @Post('posts')
  async createPost(@Body() dto: CreateSocialPostDto, @Request() req: any) {
    this.assertRole(req.user);
    return this.socialService.createPost(dto, req.user.id);
  }

  @Get('posts')
  async listPosts(
    @Request() req: any,
    @Query('platform') platform?: SocialPlatform,
    @Query('status') status?: SocialPostStatus,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('limit', new DefaultValuePipe(30), ParseIntPipe) limit = 30,
  ) {
    this.assertRole(req.user);
    return this.socialService.listPosts({ platform, status, page, limit });
  }

  @Get('posts/:id')
  async getPost(@Param('id') id: string, @Request() req: any) {
    this.assertRole(req.user);
    return this.socialService.getPost(id);
  }

  @Patch('posts/:id')
  async updatePost(
    @Param('id') id: string,
    @Body() dto: UpdateSocialPostDto,
    @Request() req: any,
  ) {
    this.assertRole(req.user);
    return this.socialService.updatePost(id, dto);
  }

  @Delete('posts/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePost(@Param('id') id: string, @Request() req: any) {
    this.assertRole(req.user);
    await this.socialService.deletePost(id);
  }

  @Post('posts/:id/publish')
  async publishNow(@Param('id') id: string, @Request() req: any) {
    this.assertRole(req.user);
    return this.socialService.publishNow(id);
  }

  // ─── Calendar ───────────────────────────────────────────────────────────────

  @Get('calendar')
  async getCalendar(
    @Request() req: any,
    @Query('month', new DefaultValuePipe(new Date().getMonth() + 1), ParseIntPipe) month = new Date().getMonth() + 1,
    @Query('year', new DefaultValuePipe(new Date().getFullYear()), ParseIntPipe) year = new Date().getFullYear(),
  ) {
    this.assertRole(req.user);
    return this.socialService.getCalendar(month, year);
  }

  // ─── Analytics ──────────────────────────────────────────────────────────────

  @Get('analytics')
  async getAnalytics(@Request() req: any) {
    this.assertRole(req.user);
    return this.socialService.getAnalytics();
  }

  // ─── Trends ─────────────────────────────────────────────────────────────────

  @Get('trends')
  async getTrends(@Request() req: any) {
    this.assertRole(req.user);
    return this.socialService.getTrends();
  }
}
