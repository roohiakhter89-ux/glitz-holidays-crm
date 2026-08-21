import {
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
  IsDateString,
} from 'class-validator';
import { LeadSource } from '@prisma/client';

/**
 * Public payload posted by landing pages / ads / WhatsApp bots.
 * Only name + phone are required — never lose a lead over validation.
 */
export class CaptureLeadDto {
  @IsString() @MinLength(2) @MaxLength(120)
  name: string;

  @IsString() @MinLength(6) @MaxLength(20)
  phone: string;

  @IsOptional() @IsEmail()
  email?: string;

  @IsOptional() @IsString() @MaxLength(120)
  city?: string;

  @IsOptional() @IsString() @MaxLength(120)
  country?: string;

  @IsOptional() @IsString() @MaxLength(200)
  destination?: string;

  @IsOptional() @IsDateString()
  travelDate?: string;

  @IsOptional() @IsInt() @Min(0)
  nights?: number;

  @IsOptional() @IsInt() @Min(0)
  adults?: number;

  @IsOptional() @IsInt() @Min(0)
  children?: number;

  @IsOptional() @IsInt() @Min(0)
  budget?: number;

  @IsOptional() @IsString() @MaxLength(2000)
  message?: string;

  @IsOptional() @IsEnum(LeadSource)
  source?: LeadSource;

  // --- attribution: pass these straight through from the landing page ---
  @IsOptional() @IsString() @MaxLength(200) utmSource?: string;
  @IsOptional() @IsString() @MaxLength(200) utmMedium?: string;
  @IsOptional() @IsString() @MaxLength(200) utmCampaign?: string;
  @IsOptional() @IsString() @MaxLength(200) utmTerm?: string;
  @IsOptional() @IsString() @MaxLength(200) utmContent?: string;
  @IsOptional() @IsString() @MaxLength(300) gclid?: string;
  @IsOptional() @IsString() @MaxLength(300) fbclid?: string;
  @IsOptional() @IsString() @MaxLength(500) landingPage?: string;
  @IsOptional() @IsString() @MaxLength(500) referrer?: string;
  @IsOptional() @IsString() @MaxLength(200) keyword?: string;

  /**
   * Landing-page beacon returned this on page load; the form submit sends it
   * back. When present, the visit's stored attribution wins over anything the
   * form fields carry — the URL had the ground truth, form values can be
   * spoofed by copy-paste.
   */
  @IsOptional() @IsString() @MaxLength(64) visitId?: string;

  /**
   * Only honoured on the authenticated manual-create path AND only when the
   * caller has full lead access (owner / super-admin / sales manager).
   * Public capture ignores it. Sales-exec attempts are silently coerced back
   * to themselves in leads.service.
   */
  @IsOptional() @IsString() @MaxLength(64) assignedToId?: string;
}
