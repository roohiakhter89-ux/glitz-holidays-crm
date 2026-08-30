import { computeNextFollowUp, isBreached } from './follow-up-cadence';
import { LeadStatus } from '@prisma/client';

describe('follow-up-cadence', () => {
  it('computes correct next follow up for NEW', () => {
    const anchor = new Date('2024-01-01T10:00:00.000Z');
    const result = computeNextFollowUp(LeadStatus.NEW, anchor);
    expect(result?.toISOString()).toBe('2024-01-01T10:05:00.000Z');
  });

  it('computes correct next follow up for other active stages', () => {
    const anchor = new Date('2024-01-01T10:00:00.000Z');
    expect(computeNextFollowUp(LeadStatus.CONTACTED, anchor)?.toISOString()).toBe('2024-01-03T10:00:00.000Z');
    expect(computeNextFollowUp(LeadStatus.INTERESTED, anchor)?.toISOString()).toBe('2024-01-04T10:00:00.000Z');
  });

  it('returns null for parked or terminal states', () => {
    const anchor = new Date();
    expect(computeNextFollowUp(LeadStatus.FUTURE_FOLLOWUP, anchor)).toBeNull();
    expect(computeNextFollowUp(LeadStatus.LOST, anchor)).toBeNull();
  });

  it('evaluates breach correctly', () => {
    const nextFollowUp = new Date('2024-01-01T10:00:00.000Z');
    const nowBefore = new Date('2024-01-01T09:00:00.000Z');
    const nowAfter = new Date('2024-01-01T11:00:00.000Z');

    expect(isBreached(LeadStatus.NEW, nextFollowUp, nowBefore)).toBe(false);
    expect(isBreached(LeadStatus.NEW, nextFollowUp, nowAfter)).toBe(true);
    
    // terminal states don't breach
    expect(isBreached(LeadStatus.LOST, nextFollowUp, nowAfter)).toBe(false);
  });
});
