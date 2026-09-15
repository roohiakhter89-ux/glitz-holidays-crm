import { MlScoringService } from './ml-scoring.service';
import { LeadSource, LeadStatus } from '@prisma/client';

describe('MlScoringService', () => {
  let service: MlScoringService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      lead: {
        findUnique: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
      },
    };
    service = new MlScoringService(mockPrisma);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateLeadScore', () => {
    it('ranks a high-budget WhatsApp family lead during peak Gulmarg snow season as HOT', () => {
      const res = service.calculateLeadScore({
        name: 'Amit Sharma',
        source: LeadSource.WHATSAPP,
        destination: 'Gulmarg',
        travelDate: '2027-01-15', // Jan = peak snow
        nights: 5,
        adults: 2,
        children: 2,
        budget: 90000,
        message: 'Looking for 4 star hotel in Gulmarg and Phase 2 Gondola tickets for family. Dates are fixed.',
        enquiryCount: 1,
        createdAt: new Date().toISOString(),
        firstContactAt: new Date(Date.now() + 30 * 60000).toISOString(), // 30 min latency
      });

      expect(res.score).toBeGreaterThanOrEqual(75);
      expect(res.grade).toBe('HOT');
      expect(res.winProbability).toBeGreaterThanOrEqual(0.75);
      expect(res.positiveSignals.length).toBeGreaterThan(0);
      expect(res.positiveSignals.some((s) => s.includes('Gulmarg'))).toBe(true);
      expect(res.positiveSignals.some((s) => s.includes('WhatsApp'))).toBe(true);
      expect(res.recommendedAction).toContain('Priority Lead');
    });

    it('flags solo lead with low budget and off-season timing with risk signals', () => {
      const res = service.calculateLeadScore({
        name: 'Rahul',
        source: LeadSource.EMAIL,
        destination: 'Ladakh',
        travelDate: '2027-01-10', // Jan = subzero, passes closed
        nights: 6,
        adults: 1,
        children: 0,
        budget: 5000, // unrealistically low
        message: 'Just inquiring about budget bike trip to Leh',
        enquiryCount: 1,
        createdAt: new Date(Date.now() - 48 * 3600000).toISOString(), // 48h old
        firstContactAt: null, // uncontacted
        status: LeadStatus.NEW,
      });

      expect(res.score).toBeLessThan(50);
      expect(['COOL', 'COLD']).toContain(res.grade);
      expect(res.riskSignals.length).toBeGreaterThan(0);
    });

    it('identifies repeat inquiry with persistent intent', () => {
      const res = service.calculateLeadScore({
        name: 'Pooja Verma',
        source: LeadSource.PHONE,
        destination: 'Srinagar',
        travelDate: '2027-04-05', // Tulip festival
        nights: 4,
        adults: 2,
        budget: 45000,
        enquiryCount: 3,
      });

      expect(res.positiveSignals.some((s) => s.includes('Repeat inquiry'))).toBe(true);
      expect(res.positiveSignals.some((s) => s.includes('Tulip'))).toBe(true);
      expect(res.score).toBeGreaterThanOrEqual(60);
    });
  });
});
