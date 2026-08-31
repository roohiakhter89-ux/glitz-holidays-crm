import {
  IsString,
  IsNumber,
  IsArray,
  ValidateNested,
  IsOptional,
  IsDateString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateInvoiceLineItemDto {
  @IsString()
  description: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsNumber()
  @Min(0)
  unitPrice: number;
}

export class CreateInvoiceDto {
  @IsString()
  leadId: string;

  /**
   * Optional. Omit to use PricingSettings.gstPercent — the configured rate for
   * the business (5% for Indian tour packages). Only send this to override the
   * configured rate for one invoice.
   */
  @IsOptional()
  @IsNumber()
  @Min(0)
  gstRate?: number;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInvoiceLineItemDto)
  lineItems: CreateInvoiceLineItemDto[];
}
