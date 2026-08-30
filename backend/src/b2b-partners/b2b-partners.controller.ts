import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { B2bPartnersService } from './b2b-partners.service';
import { CreateB2bPartnerDto } from './dto/create-b2b-partner.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Actor } from '../common/access';

@Controller('b2b-partners')
export class B2bPartnersController {
  constructor(private readonly b2bPartnersService: B2bPartnersService) {}

  @Post()
  create(@Body() createB2bPartnerDto: CreateB2bPartnerDto, @CurrentUser() actor: Actor) {
    return this.b2bPartnersService.create(createB2bPartnerDto, actor);
  }

  @Get()
  findAll() {
    return this.b2bPartnersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.b2bPartnersService.findOne(id);
  }
}
