import { MlForecastingService } from './ml-forecasting.service';

describe('MlForecastingService', () => {
  let service: MlForecastingService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      booking: {
        count: jest.fn().mockResolvedValue(45),
      },
    };
    service = new MlForecastingService(mockPrisma);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('generates 90-day monthly forecasts with dynamic margin guidance', async () => {
    const forecast = await service.getTourismDemandForecast();

    expect(forecast.horizonDays).toBe(90);
    expect(forecast.monthlyProjections.length).toBe(3);
    expect(forecast.destinationBreakdown.length).toBeGreaterThanOrEqual(4);
    expect(forecast.operationalAlerts.length).toBeGreaterThan(0);

    // Verify first month structure
    const m1 = forecast.monthlyProjections[0];
    expect(m1.projectedInquiries).toBeGreaterThan(0);
    expect(m1.projectedBookings).toBeGreaterThan(0);
    expect(m1.marginAdvice).toBeDefined();
    expect(m1.marginAdvice.recommendedMarginPercent).toBeGreaterThanOrEqual(10);
  });

  it('evaluates dynamic margin for specific dates and destinations', () => {
    // Peak winter Gulmarg (December/January)
    const peakWinter = service.getDynamicMarginForDate('2026-01-15', 'Gulmarg Snow');
    expect(peakWinter.strategy).toBe('PREMIUM_SURGE');
    expect(peakWinter.recommendedMarginPercent).toBe(22);
    expect(peakWinter.surgePercentage).toBeGreaterThanOrEqual(35);

    // Spring bloom (April)
    const springBloom = service.getDynamicMarginForDate('2026-04-10', 'Srinagar');
    expect(springBloom.strategy).toBe('PREMIUM_SURGE');
    expect(springBloom.recommendedMarginPercent).toBe(22);

    // Off peak / moderate
    const offPeak = service.getDynamicMarginForDate('2026-09-15', 'Kashmir');
    expect(offPeak.recommendedMarginPercent).toBe(18);
  });
});
