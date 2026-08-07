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
import { QuotesService } from './quotes.service';
import { PdfService } from '../pdf/pdf.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { UpdateQuoteDto } from './dto/update-quote.dto';
import { CreateOptionDto } from './dto/create-option.dto';
import { UpdateOptionDto } from './dto/update-option.dto';
import { CreateLineDto } from './dto/create-line.dto';
import { UpdateLineDto } from './dto/update-line.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Actor, QUOTE_MODULE_ROLES } from '../common/access';

/**
 * Staff only — a quote exposes unitNet, lineNet and margin on every line.
 * Role is the outer gate; the service scopes every route to the leads the
 * caller owns, so a sales exec sees only their own files.
 */
@Roles(...QUOTE_MODULE_ROLES)
@Controller('quotes')
export class QuotesController {
  constructor(
    private readonly quotes: QuotesService,
    private readonly pdf: PdfService,
  ) {}

  @Post()
  create(@Body() dto: CreateQuoteDto, @CurrentUser() actor: Actor) {
    return this.quotes.create(dto, actor);
  }

  @Get()
  findAll(@CurrentUser() actor: Actor, @Query('leadId') leadId?: string) {
    return this.quotes.findAll(leadId, actor);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() actor: Actor) {
    return this.quotes.findOne(id, actor);
  }

  /**
   * Client-facing quotation PDF. Reuses the same access check as GET :id,
   * so a sales exec cannot download a quote they cannot read.
   * Streams the PDF straight to the response — no on-disk step.
   */
  @Get(':id/pdf')
  @Header('Content-Type', 'application/pdf')
  async downloadPdf(
    @Param('id') id: string,
    @CurrentUser() actor: Actor,
    @Res() res: Response,
  ) {
    const q = await this.quotes.findOne(id, actor);
    const buf = await this.pdf.renderQuotation({
      quoteNumber: q.quoteNumber,
      title: q.title,
      validUntil: q.validUntil,
      notes: q.notes,
      terms: q.terms,
      createdAt: q.createdAt,
      lead: {
        name: q.lead.name,
        phone: q.lead.phone,
        email: q.lead.email,
      },
      options: q.options.map((o: any) => ({
        id: o.id,
        name: o.name,
        isRecommended: o.isRecommended,
        adults: o.adults,
        children: o.children,
        nights: o.nights,
        totalSell: o.totalSell,
        perPersonSell: o.perPersonSell,
        lines: o.lines.map((l: any) => ({
          description: l.description,
          serviceType: l.serviceType,
          quantity: l.quantity,
          units: l.units,
          lineSell: l.lineSell,
        })),
      })),
    });
    res.setHeader(
      'Content-Disposition',
      `inline; filename="Quotation-${q.quoteNumber}.pdf"`,
    );
    res.send(buf);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateQuoteDto,
    @CurrentUser() actor: Actor,
  ) {
    return this.quotes.update(id, dto, actor);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() actor: Actor) {
    return this.quotes.remove(id, actor);
  }

  // --- tiers ---------------------------------------------------------------

  @Post(':id/options')
  addOption(
    @Param('id') id: string,
    @Body() dto: CreateOptionDto,
    @CurrentUser() actor: Actor,
  ) {
    return this.quotes.addOption(id, dto, actor);
  }

  @Patch('options/:optionId')
  updateOption(
    @Param('optionId') optionId: string,
    @Body() dto: UpdateOptionDto,
    @CurrentUser() actor: Actor,
  ) {
    return this.quotes.updateOption(optionId, dto, actor);
  }

  @Post('options/:optionId/duplicate')
  duplicateOption(
    @Param('optionId') optionId: string,
    @Body('name') name: string,
    @CurrentUser() actor: Actor,
  ) {
    return this.quotes.duplicateOption(optionId, name || 'Copy', actor);
  }

  @Delete('options/:optionId')
  removeOption(
    @Param('optionId') optionId: string,
    @CurrentUser() actor: Actor,
  ) {
    return this.quotes.removeOption(optionId, actor);
  }

  // --- lines ---------------------------------------------------------------

  @Post('options/:optionId/lines')
  addLine(
    @Param('optionId') optionId: string,
    @Body() dto: CreateLineDto,
    @CurrentUser() actor: Actor,
  ) {
    return this.quotes.addLine(optionId, dto, actor);
  }

  /** Pull a stored vendor rate in as a line. */
  @Post('options/:optionId/lines/from-rate')
  addLineFromRate(
    @Param('optionId') optionId: string,
    @Body('rateId') rateId: string,
    @Body('quantity') quantity: number,
    @Body('units') units: number,
    @CurrentUser() actor: Actor,
  ) {
    return this.quotes.addLineFromRate(
      optionId,
      rateId,
      quantity ?? 1,
      units ?? 1,
      actor,
    );
  }

  @Patch('lines/:lineId')
  updateLine(
    @Param('lineId') lineId: string,
    @Body() dto: UpdateLineDto,
    @CurrentUser() actor: Actor,
  ) {
    return this.quotes.updateLine(lineId, dto, actor);
  }

  @Delete('lines/:lineId')
  removeLine(@Param('lineId') lineId: string, @CurrentUser() actor: Actor) {
    return this.quotes.removeLine(lineId, actor);
  }
}
