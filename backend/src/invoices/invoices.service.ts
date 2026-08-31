import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { Actor } from '../common/access';
import { InvoiceStatus } from '@prisma/client';
import { gstBreakdown } from '../common/pricing';

@Injectable()
export class InvoicesService {
  constructor(private readonly prisma: PrismaService) {}

  private generateInvoiceNumber(): string {
    const random = Math.floor(1000 + Math.random() * 9000);
    const dateStr = new Date().toISOString().slice(2, 7).replace('-', ''); // YYMM
    return `INV-${dateStr}-${random}`;
  }

  async create(dto: CreateInvoiceDto, actor: Actor) {
    const lead = await this.prisma.lead.findUnique({
      where: { id: dto.leadId },
    });
    if (!lead) {
      throw new NotFoundException('Lead not found');
    }

    const settings = await this.prisma.pricingSettings.findFirst();
    const effectiveGstRate = dto.gstRate !== undefined ? dto.gstRate : (settings?.gstPercent ?? 5.0);

    let grossTotal = 0;
    const items = dto.lineItems.map(item => {
      const lineTotal = item.quantity * item.unitPrice;
      grossTotal += lineTotal;
      return {
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: lineTotal,
      };
    });

    // Tour totals are tax-inclusive: split total into base subtotal and GST portion
    const split = gstBreakdown(grossTotal, effectiveGstRate);
    const subtotal = split.baseAmount;
    const gstAmount = split.gstAmount;
    const total = split.total;

    return this.prisma.invoice.create({
      data: {
        invoiceNumber: this.generateInvoiceNumber(),
        leadId: dto.leadId,
        subtotal,
        gstRate: effectiveGstRate,
        gstAmount,
        total,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        notes: dto.notes,
        createdById: actor.id,
        lineItems: {
          create: items,
        },
      },
      include: {
        lineItems: true,
      }
    });
  }

  async findOne(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        lead: { select: { name: true, email: true } },
        lineItems: true,
      },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');
    return invoice;
  }

  async findAll() {
    return this.prisma.invoice.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        lead: { select: { name: true, email: true } },
      }
    });
  }

  async findByLead(leadId: string) {
    return this.prisma.invoice.findMany({
      where: { leadId },
      orderBy: { createdAt: 'desc' },
      include: {
        lineItems: true,
      }
    });
  }

  async markAsPaid(id: string) {
    const invoice = await this.prisma.invoice.findUnique({ where: { id } });
    if (!invoice) throw new NotFoundException('Invoice not found');

    return this.prisma.invoice.update({
      where: { id },
      data: { status: InvoiceStatus.PAID },
    });
  }
}
