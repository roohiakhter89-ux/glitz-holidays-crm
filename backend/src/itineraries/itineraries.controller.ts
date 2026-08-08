import * as React from 'react';
import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  Patch,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { renderToBuffer } from '@react-pdf/renderer';
import { ItinerariesService } from './itineraries.service';
import { CreateItineraryDto } from './dto/create-itinerary.dto';
import { UpdateItineraryDto } from './dto/update-itinerary.dto';
import { UpsertDayDto } from './dto/upsert-day.dto';
import { UpsertItemDto } from './dto/upsert-item.dto';
import { ReorderDto } from './dto/reorder.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Actor, LEAD_MODULE_ROLES } from '../common/access';
import { ItineraryDocument } from './templates/itinerary';

/**
 * Itineraries are client-facing (no cost/margin leaked) — safe to open to
 * every staff role that can touch leads. Per-lead scoping enforced in the
 * service.
 */
@Roles(...LEAD_MODULE_ROLES)
@Controller('itineraries')
export class ItinerariesController {
  constructor(private readonly svc: ItinerariesService) {}

  // ---- itineraries -------------------------------------------------------

  @Post()
  create(@Body() dto: CreateItineraryDto, @CurrentUser() actor: Actor) {
    return this.svc.create(dto, actor);
  }

  @Get()
  findAll(@CurrentUser() actor: Actor, @Query('leadId') leadId?: string) {
    return this.svc.findAll(leadId, actor);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() actor: Actor) {
    return this.svc.findOne(id, actor);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateItineraryDto,
    @CurrentUser() actor: Actor,
  ) {
    return this.svc.update(id, dto, actor);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() actor: Actor) {
    return this.svc.remove(id, actor);
  }

  @Get(':id/pdf')
  @Header('Content-Type', 'application/pdf')
  async downloadPdf(
    @Param('id') id: string,
    @CurrentUser() actor: Actor,
    @Res() res: Response,
  ) {
    const i = await this.svc.findOne(id, actor);
    const buf = await renderToBuffer(
      React.createElement(ItineraryDocument, {
        i: {
          code: i.code,
          title: i.title,
          headline: i.headline,
          intro: i.intro,
          totalPax: i.totalPax,
          inclusions: i.inclusions,
          exclusions: i.exclusions,
          createdAt: i.createdAt,
          lead: {
            name: i.lead.name,
            phone: i.lead.phone,
            email: i.lead.email,
          },
          days: i.days.map((d: any) => ({
            id: d.id,
            dayNumber: d.dayNumber,
            date: d.date,
            city: d.city,
            headline: d.headline,
            summary: d.summary,
            items: d.items.map((it: any) => ({
              kind: it.kind,
              time: it.time,
              title: it.title,
              description: it.description,
              location: it.location,
            })),
          })),
        },
      }) as any,
    );
    res.setHeader(
      'Content-Disposition',
      `inline; filename="Itinerary-${i.code}.pdf"`,
    );
    res.send(buf);
  }

  // ---- days --------------------------------------------------------------

  @Post(':id/days')
  addDay(
    @Param('id') id: string,
    @Body() dto: UpsertDayDto,
    @CurrentUser() actor: Actor,
  ) {
    return this.svc.addDay(id, dto, actor);
  }

  @Patch('days/:dayId')
  updateDay(
    @Param('dayId') dayId: string,
    @Body() dto: UpsertDayDto,
    @CurrentUser() actor: Actor,
  ) {
    return this.svc.updateDay(dayId, dto, actor);
  }

  @Delete('days/:dayId')
  removeDay(@Param('dayId') dayId: string, @CurrentUser() actor: Actor) {
    return this.svc.removeDay(dayId, actor);
  }

  @Post(':id/days/reorder')
  reorderDays(
    @Param('id') id: string,
    @Body() dto: ReorderDto,
    @CurrentUser() actor: Actor,
  ) {
    return this.svc.reorderDays(id, dto, actor);
  }

  // ---- items -------------------------------------------------------------

  @Post('days/:dayId/items')
  addItem(
    @Param('dayId') dayId: string,
    @Body() dto: UpsertItemDto,
    @CurrentUser() actor: Actor,
  ) {
    return this.svc.addItem(dayId, dto, actor);
  }

  @Patch('items/:itemId')
  updateItem(
    @Param('itemId') itemId: string,
    @Body() dto: UpsertItemDto,
    @CurrentUser() actor: Actor,
  ) {
    return this.svc.updateItem(itemId, dto, actor);
  }

  @Delete('items/:itemId')
  removeItem(
    @Param('itemId') itemId: string,
    @CurrentUser() actor: Actor,
  ) {
    return this.svc.removeItem(itemId, actor);
  }

  @Post('days/:dayId/items/reorder')
  reorderItems(
    @Param('dayId') dayId: string,
    @Body() dto: ReorderDto,
    @CurrentUser() actor: Actor,
  ) {
    return this.svc.reorderItems(dayId, dto, actor);
  }
}
