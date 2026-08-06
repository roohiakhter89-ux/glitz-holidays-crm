import { Injectable, NotFoundException } from '@nestjs/common';
import { ActivityType, LeadStatus, MarkupMode } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { UpdateQuoteDto } from './dto/update-quote.dto';
import { CreateOptionDto } from './dto/create-option.dto';
import { UpdateOptionDto } from './dto/update-option.dto';
import { CreateLineDto } from './dto/create-line.dto';
import { UpdateLineDto } from './dto/update-line.dto';
import {
  advise,
  computeLine,
  computeOptionTotals,
  SettingsLike,
} from './pricing';

@Injectable()
export class QuotesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: SettingsService,
  ) {}

  /** GLZ-2026-0001 style, sequential per year. */
  private async nextQuoteNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `GLZ-${year}-`;
    const last = await this.prisma.quote.findFirst({
      where: { quoteNumber: { startsWith: prefix } },
      orderBy: { quoteNumber: 'desc' },
      select: { quoteNumber: true },
    });
    const n = last ? parseInt(last.quoteNumber.slice(prefix.length), 10) + 1 : 1;
    return `${prefix}${String(n).padStart(4, '0')}`;
  }

  /**
   * Recomputes every line and the option totals. Called after ANY change to
   * a line or option so stored numbers can never drift from the inputs.
   */
  private async recalcOption(optionId: string) {
    const option = await this.prisma.quoteOption.findUnique({
      where: { id: optionId },
      include: { lines: true },
    });
    if (!option) throw new NotFoundException('Option not found');

    const s = (await this.settings.getPricing()) as unknown as SettingsLike;

    for (const line of option.lines) {
      const { lineNet, lineSell } = computeLine(line, s, option.markupPercent);
      if (lineNet !== line.lineNet || lineSell !== line.lineSell) {
        await this.prisma.quoteLine.update({
          where: { id: line.id },
          data: { lineNet, lineSell },
        });
      }
    }

    const fresh = await this.prisma.quoteLine.findMany({
      where: { optionId },
      select: { lineNet: true, lineSell: true },
    });
    const pax = option.adults + option.children;
    const totals = computeOptionTotals(fresh, pax);

    return this.prisma.quoteOption.update({
      where: { id: optionId },
      data: totals,
    });
  }

  // --- quotes --------------------------------------------------------------

  async create(dto: CreateQuoteDto, userId?: string) {
    const lead = await this.prisma.lead.findUnique({
      where: { id: dto.leadId },
    });
    if (!lead) throw new NotFoundException('Lead not found');

    const quote = await this.prisma.quote.create({
      data: {
        quoteNumber: await this.nextQuoteNumber(),
        leadId: dto.leadId,
        title: dto.title ?? null,
        validUntil: dto.validUntil ? new Date(dto.validUntil) : null,
        notes: dto.notes ?? null,
        terms: dto.terms ?? null,
        createdById: userId ?? null,
      },
    });

    await this.prisma.activity.create({
      data: {
        leadId: dto.leadId,
        userId: userId ?? null,
        type: ActivityType.SYSTEM,
        content: `Quote ${quote.quoteNumber} created`,
      },
    });

    return quote;
  }

  findAll(leadId?: string) {
    return this.prisma.quote.findMany({
      where: leadId ? { leadId } : {},
      orderBy: { createdAt: 'desc' },
      include: {
        options: { orderBy: { sortOrder: 'asc' } },
        lead: { select: { id: true, name: true, phone: true } },
      },
    });
  }

  async findOne(id: string) {
    const quote = await this.prisma.quote.findUnique({
      where: { id },
      include: {
        lead: { select: { id: true, name: true, phone: true, email: true } },
        options: {
          orderBy: { sortOrder: 'asc' },
          include: { lines: { orderBy: { sortOrder: 'asc' } } },
        },
      },
    });
    if (!quote) throw new NotFoundException('Quote not found');

    const s = (await this.settings.getPricing()) as unknown as SettingsLike;

    return {
      ...quote,
      options: quote.options.map((o: any) => ({
        ...o,
        advisory: advise(o.totalNet, o.totalSell, s),
      })),
    };
  }

  async update(id: string, dto: UpdateQuoteDto, userId?: string) {
    const quote = await this.prisma.quote.findUnique({ where: { id } });
    if (!quote) throw new NotFoundException('Quote not found');

    const updated = await this.prisma.quote.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
        ...(dto.terms !== undefined ? { terms: dto.terms } : {}),
        ...(dto.validUntil !== undefined
          ? { validUntil: new Date(dto.validUntil) }
          : {}),
      },
    });

    // Sending a quote moves the lead down the pipeline automatically.
    if (dto.status && dto.status !== quote.status) {
      await this.prisma.activity.create({
        data: {
          leadId: quote.leadId,
          userId: userId ?? null,
          type: ActivityType.SYSTEM,
          content: `Quote ${quote.quoteNumber}: ${quote.status} -> ${dto.status}`,
        },
      });
      if (dto.status === 'SENT') {
        await this.prisma.lead.update({
          where: { id: quote.leadId },
          data: { status: LeadStatus.QUOTATION_SENT },
        });
      }
    }

    return updated;
  }

  async remove(id: string) {
    const quote = await this.prisma.quote.findUnique({ where: { id } });
    if (!quote) throw new NotFoundException('Quote not found');
    await this.prisma.quote.delete({ where: { id } });
    return { deleted: true, id };
  }

  // --- options (tiers) -----------------------------------------------------

  async addOption(quoteId: string, dto: CreateOptionDto) {
    const quote = await this.prisma.quote.findUnique({ where: { id: quoteId } });
    if (!quote) throw new NotFoundException('Quote not found');

    const option = await this.prisma.quoteOption.create({
      data: {
        quoteId,
        name: dto.name,
        sortOrder: dto.sortOrder ?? 0,
        isRecommended: dto.isRecommended ?? false,
        adults: dto.adults ?? 2,
        children: dto.children ?? 0,
        nights: dto.nights ?? 0,
        markupPercent: dto.markupPercent ?? null,
      },
    });
    return option;
  }

  async updateOption(optionId: string, dto: UpdateOptionDto) {
    const exists = await this.prisma.quoteOption.findUnique({
      where: { id: optionId },
    });
    if (!exists) throw new NotFoundException('Option not found');

    await this.prisma.quoteOption.update({
      where: { id: optionId },
      data: { ...dto },
    });
    // markup/pax may have changed -> everything downstream must be rebuilt
    return this.recalcOption(optionId);
  }

  async removeOption(optionId: string) {
    const exists = await this.prisma.quoteOption.findUnique({
      where: { id: optionId },
    });
    if (!exists) throw new NotFoundException('Option not found');
    await this.prisma.quoteOption.delete({ where: { id: optionId } });
    return { deleted: true, id: optionId };
  }

  /** Copy a tier (build "Deluxe" by duplicating "Standard" and editing). */
  async duplicateOption(optionId: string, newName: string) {
    const src = await this.prisma.quoteOption.findUnique({
      where: { id: optionId },
      include: { lines: true },
    });
    if (!src) throw new NotFoundException('Option not found');

    const copy = await this.prisma.quoteOption.create({
      data: {
        quoteId: src.quoteId,
        name: newName,
        sortOrder: src.sortOrder + 1,
        adults: src.adults,
        children: src.children,
        nights: src.nights,
        markupPercent: src.markupPercent,
      },
    });

    for (const l of src.lines) {
      await this.prisma.quoteLine.create({
        data: {
          optionId: copy.id,
          serviceType: l.serviceType,
          description: l.description,
          vendorId: l.vendorId,
          vendorRateId: l.vendorRateId,
          quantity: l.quantity,
          units: l.units,
          unitNet: l.unitNet,
          markupMode: l.markupMode,
          markupValue: l.markupValue,
          sortOrder: l.sortOrder,
          notes: l.notes,
        },
      });
    }

    return this.recalcOption(copy.id);
  }

  // --- lines ---------------------------------------------------------------

  async addLine(optionId: string, dto: CreateLineDto) {
    const option = await this.prisma.quoteOption.findUnique({
      where: { id: optionId },
    });
    if (!option) throw new NotFoundException('Option not found');

    await this.prisma.quoteLine.create({
      data: {
        optionId,
        serviceType: dto.serviceType,
        description: dto.description,
        vendorId: dto.vendorId ?? null,
        vendorRateId: dto.vendorRateId ?? null,
        quantity: dto.quantity ?? 1,
        units: dto.units ?? 1,
        unitNet: dto.unitNet,
        markupMode: dto.markupMode ?? MarkupMode.INHERIT,
        markupValue: dto.markupValue ?? null,
        sortOrder: dto.sortOrder ?? 0,
        notes: dto.notes ?? null,
      },
    });

    return this.recalcOption(optionId);
  }

  /** Pull a vendor rate straight in as a line — no retyping net costs. */
  async addLineFromRate(
    optionId: string,
    rateId: string,
    quantity: number,
    units: number,
  ) {
    const rate = await this.prisma.vendorRate.findUnique({
      where: { id: rateId },
      include: { vendor: true },
    });
    if (!rate) throw new NotFoundException('Vendor rate not found');

    const serviceType =
      rate.vendor.type === 'TRANSPORT'
        ? 'TRANSPORT'
        : rate.vendor.type === 'ACTIVITY'
          ? 'ACTIVITY'
          : rate.vendor.type === 'GUIDE'
            ? 'GUIDE'
            : 'HOTEL';

    await this.prisma.quoteLine.create({
      data: {
        optionId,
        serviceType: serviceType as any,
        description: `${rate.vendor.name} — ${rate.variant}${
          rate.mealPlan ? ` (${rate.mealPlan})` : ''
        }`,
        vendorId: rate.vendorId,
        vendorRateId: rate.id,
        quantity,
        units,
        unitNet: rate.netRate,
        markupMode: MarkupMode.INHERIT,
      },
    });

    return this.recalcOption(optionId);
  }

  async updateLine(lineId: string, dto: UpdateLineDto) {
    const line = await this.prisma.quoteLine.findUnique({
      where: { id: lineId },
    });
    if (!line) throw new NotFoundException('Line not found');

    await this.prisma.quoteLine.update({
      where: { id: lineId },
      data: { ...dto },
    });
    return this.recalcOption(line.optionId);
  }

  async removeLine(lineId: string) {
    const line = await this.prisma.quoteLine.findUnique({
      where: { id: lineId },
    });
    if (!line) throw new NotFoundException('Line not found');
    await this.prisma.quoteLine.delete({ where: { id: lineId } });
    return this.recalcOption(line.optionId);
  }
}
