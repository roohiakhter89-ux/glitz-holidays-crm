import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdatePricingDto } from './dto/update-pricing.dto';

const SINGLETON_ID = 'default';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Always returns a row — creates defaults on first call. */
  async getPricing() {
    const existing = await this.prisma.pricingSettings.findUnique({
      where: { id: SINGLETON_ID },
    });
    if (existing) return existing;
    return this.prisma.pricingSettings.create({ data: { id: SINGLETON_ID } });
  }

  async updatePricing(dto: UpdatePricingDto) {
    await this.getPricing();
    return this.prisma.pricingSettings.update({
      where: { id: SINGLETON_ID },
      data: { ...dto },
    });
  }
}
