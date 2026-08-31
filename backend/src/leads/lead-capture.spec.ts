import { ValidationPipe, ArgumentMetadata } from '@nestjs/common';
import { CaptureLeadDto } from './dto/capture-lead.dto';

describe('Lead Capture Validation Pipe', () => {
  let target: ValidationPipe;
  const metadata: ArgumentMetadata = {
    type: 'body',
    metatype: CaptureLeadDto,
    data: '',
  };

  beforeEach(() => {
    target = new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    });
  });

  it('validates standard enquiry form payload with campaign', async () => {
    const payload = {
      name: 'Rohan Sharma',
      phone: '+91 98765 43210',
      email: 'rohan@example.com',
      destination: 'Kashmir',
      adults: 2,
      travelDate: '2026-10-15',
      message: 'Looking for 5 nights package',
      source: 'WEBSITE',
      campaign: '/packages/from/delhi',
      landingPage: '/packages/from/delhi',
    };

    const result = await target.transform(payload, metadata);
    expect(result).toBeDefined();
    expect(result.name).toBe('Rohan Sharma');
    expect(result.campaign).toBe('/packages/from/delhi');
  });

  it('validates package page enquiry payload with tags and campaign', async () => {
    const payload = {
      name: 'Pooja Verma',
      phone: '9811122233',
      email: 'pooja@example.com',
      destination: 'Gulmarg',
      adults: 2,
      source: 'WEBSITE',
      campaign: '/packages/gulmarg-honeymoon-packages',
      landingPage: '/packages/gulmarg-honeymoon-packages',
      tags: ['Gulmarg Honeymoon 5N/6D'],
    };

    const result = await target.transform(payload, metadata);
    expect(result).toBeDefined();
    expect(result.tags).toEqual(['Gulmarg Honeymoon 5N/6D']);
  });

  it('validates plan-my-trip wizard payload with free-text travelDate', async () => {
    const payload = {
      name: 'Amit Patel',
      phone: '9988776655',
      email: 'amit@example.com',
      destination: 'Kashmir',
      adults: 2,
      children: 1,
      travelDate: 'Next Month',
      message: '[Custom Planner] Duration: 5N/6D | Hotel: Deluxe | Travel Window: Next Month',
      source: 'WEBSITE',
      campaign: 'PLAN_MY_TRIP_WIZARD',
      landingPage: '/plan-my-trip',
      tags: ['CUSTOM_PLANNER', 'Kashmir', 'Deluxe'],
    };

    const result = await target.transform(payload, metadata);
    expect(result).toBeDefined();
    expect(result.travelDate).toBe('Next Month');
    expect(result.tags).toContain('CUSTOM_PLANNER');
  });
});
