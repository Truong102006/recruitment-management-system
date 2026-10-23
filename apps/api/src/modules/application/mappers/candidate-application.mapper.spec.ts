import type {
  CandidateApplicationDto,
  CandidateHistoryDto,
  CandidateProfileDto,
} from '../../../../../../libs/contracts/public';
import {
  toCandidateApplication,
  toCandidateHistory,
  toCandidateProfile,
} from './candidate-application.mapper';
import fixture from '../../../../../../contracts/fixtures/candidate-application.v1.json';

describe('candidate projection boundary', () => {
  it('copies only allowed fields including within the snapshot; original/current CV remain distinct', () => {
    const raw: CandidateApplicationDto & { internalNote: string; storageKey: string } = {
      ...fixture.data,
      status: 'SCREENING',
      candidateSnapshot: { ...fixture.data.candidateSnapshot },
      currentCvVersionId: '00000000-0000-4000-8000-000000000099',
      internalNote: 'PRIVATE',
      storageKey: 'PRIVATE',
    };
    Object.assign(raw.candidateSnapshot, { score: 5, token: 'PRIVATE' });
    const dto = toCandidateApplication(raw);
    expect(dto.originalCvVersionId).toBe(fixture.data.originalCvVersionId);
    expect(dto.currentCvVersionId).toBe(raw.currentCvVersionId);
    expect(dto.candidateSnapshot).not.toBe(raw.candidateSnapshot);
    expect(JSON.stringify(dto)).not.toMatch(/PRIVATE|score|token|internalNote|storageKey/);
    expect(dto.resultMessage).toBeNull();
  });
  it('does not derive public history messages from the internal reason', () => {
    const raw: CandidateHistoryDto & { reason: string } = {
      id: fixture.data.applicationId,
      eventType: 'STATUS_CHANGE',
      fromStatus: 'SUBMITTED',
      toStatus: 'SCREENING',
      oldCvId: null,
      newCvId: null,
      publicMessage: null,
      createdAt: fixture.data.updatedAt,
      aggregateVersion: 1,
      reason: 'PRIVATE',
    };
    expect(toCandidateHistory(raw)).toEqual({
      id: raw.id,
      eventType: 'STATUS_CHANGE',
      fromStatus: 'SUBMITTED',
      toStatus: 'SCREENING',
      oldCvId: null,
      newCvId: null,
      publicMessage: null,
      createdAt: raw.createdAt,
      aggregateVersion: 1,
    });
  });
  it('copies profile skills and drops internal account/membership data', () => {
    const raw: CandidateProfileDto & { passwordHash: string; membershipId: string } = {
      name: 'Ứng viên',
      email: 'candidate@example.test',
      phone: null,
      headline: null,
      summary: null,
      location: null,
      skillIds: ['skill-1'],
      version: 2,
      passwordHash: 'PRIVATE',
      membershipId: 'PRIVATE',
    };
    const dto = toCandidateProfile(raw);
    expect(dto.skillIds).not.toBe(raw.skillIds);
    expect(JSON.stringify(dto)).not.toContain('PRIVATE');
    expect(Object.keys(dto)).toEqual([
      'name',
      'email',
      'phone',
      'headline',
      'summary',
      'location',
      'skillIds',
      'version',
    ]);
  });
});
