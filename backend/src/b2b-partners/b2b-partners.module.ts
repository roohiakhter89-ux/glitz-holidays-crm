import { Module } from '@nestjs/common';
import { B2bPartnersService } from './b2b-partners.service';
import { B2bPartnersController } from './b2b-partners.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [B2bPartnersController],
  providers: [B2bPartnersService],
})
export class B2bPartnersModule {}
