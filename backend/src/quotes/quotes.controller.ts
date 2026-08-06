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
import { QuotesService } from './quotes.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { UpdateQuoteDto } from './dto/update-quote.dto';
import { CreateOptionDto } from './dto/create-option.dto';
import { UpdateOptionDto } from './dto/update-option.dto';
import { CreateLineDto } from './dto/create-line.dto';
import { UpdateLineDto } from './dto/update-line.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { LEAD_MODULE_ROLES } from '../common/access';

@Roles(...LEAD_MODULE_ROLES)
@Controller('quotes')
export class QuotesController {
  constructor(private readonly quotes: QuotesService) {}

  @Post()
  create(@Body() dto: CreateQuoteDto, @CurrentUser('id') userId: string) {
    return this.quotes.create(dto, userId);
  }

  @Get()
  findAll(@Query('leadId') leadId?: string) {
    return this.quotes.findAll(leadId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.quotes.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateQuoteDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.quotes.update(id, dto, userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.quotes.remove(id);
  }

  // --- tiers ---------------------------------------------------------------

  @Post(':id/options')
  addOption(@Param('id') id: string, @Body() dto: CreateOptionDto) {
    return this.quotes.addOption(id, dto);
  }

  @Patch('options/:optionId')
  updateOption(
    @Param('optionId') optionId: string,
    @Body() dto: UpdateOptionDto,
  ) {
    return this.quotes.updateOption(optionId, dto);
  }

  @Post('options/:optionId/duplicate')
  duplicateOption(
    @Param('optionId') optionId: string,
    @Body('name') name: string,
  ) {
    return this.quotes.duplicateOption(optionId, name || 'Copy');
  }

  @Delete('options/:optionId')
  removeOption(@Param('optionId') optionId: string) {
    return this.quotes.removeOption(optionId);
  }

  // --- lines ---------------------------------------------------------------

  @Post('options/:optionId/lines')
  addLine(@Param('optionId') optionId: string, @Body() dto: CreateLineDto) {
    return this.quotes.addLine(optionId, dto);
  }

  /** Pull a stored vendor rate in as a line. */
  @Post('options/:optionId/lines/from-rate')
  addLineFromRate(
    @Param('optionId') optionId: string,
    @Body('rateId') rateId: string,
    @Body('quantity') quantity: number,
    @Body('units') units: number,
  ) {
    return this.quotes.addLineFromRate(
      optionId,
      rateId,
      quantity ?? 1,
      units ?? 1,
    );
  }

  @Patch('lines/:lineId')
  updateLine(@Param('lineId') lineId: string, @Body() dto: UpdateLineDto) {
    return this.quotes.updateLine(lineId, dto);
  }

  @Delete('lines/:lineId')
  removeLine(@Param('lineId') lineId: string) {
    return this.quotes.removeLine(lineId);
  }
}
