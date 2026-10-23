import { JobUpdateRules } from '../rules/job-update.rules';
import {
  ConflictError,
  ValidationError,
} from '../../../../../../libs/platform/errors/domain.error';

describe('JobUpdateRules', () => {
  const refTime = new Date('2026-10-22T12:00:00Z');

  describe('CLOSED job', () => {
    it('rejects any update on a CLOSED job', () => {
      expect(() =>
        JobUpdateRules.validateUpdate(
          { status: 'CLOSED', version: 1 },
          { version: 1, description: 'new description' },
          refTime,
        ),
      ).toThrow(ConflictError);
    });
  });

  describe('PUBLISHED job', () => {
    const publishedJob = {
      status: 'PUBLISHED',
      version: 1,
      title: 'Current Job Title Here',
      headcount: 5,
      jobType: 'FULL_TIME',
      workplaceMode: 'HYBRID',
    };

    it('rejects changes to title, headcount, jobType, workplaceMode', () => {
      expect(() =>
        JobUpdateRules.validateUpdate(
          publishedJob,
          { version: 1, title: 'Different Title Here' },
          refTime,
        ),
      ).toThrow(ConflictError);

      expect(() =>
        JobUpdateRules.validateUpdate(publishedJob, { version: 1, headcount: 10 }, refTime),
      ).toThrow(ConflictError);

      expect(() =>
        JobUpdateRules.validateUpdate(publishedJob, { version: 1, jobType: 'PART_TIME' }, refTime),
      ).toThrow(ConflictError);

      expect(() =>
        JobUpdateRules.validateUpdate(
          publishedJob,
          { version: 1, workplaceMode: 'REMOTE' },
          refTime,
        ),
      ).toThrow(ConflictError);
    });

    it('allows valid changes to description, location, deadline, salary, skills', () => {
      expect(() =>
        JobUpdateRules.validateUpdate(
          publishedJob,
          {
            version: 1,
            description:
              'This is an updated job description that is long enough to satisfy the 100 character minimum requirement easily.'.padEnd(
                120,
                '.',
              ),
            location: 'Da Nang, Vietnam',
            deadline: '2026-11-15T00:00:00Z',
            salaryMin: 1500,
            salaryMax: 3000,
            currency: 'USD',
          },
          refTime,
        ),
      ).not.toThrow();
    });

    it('validates updated fields on published job (e.g. description too short or past deadline)', () => {
      expect(() =>
        JobUpdateRules.validateUpdate(
          publishedJob,
          { version: 1, description: 'Too short' },
          refTime,
        ),
      ).toThrow(ValidationError);

      expect(() =>
        JobUpdateRules.validateUpdate(
          publishedJob,
          { version: 1, deadline: '2026-10-20T00:00:00Z' },
          refTime,
        ),
      ).toThrow(ValidationError);
    });
  });

  describe('DRAFT job', () => {
    const draftJob = {
      status: 'DRAFT',
      version: 0,
      title: 'Draft Title',
      headcount: 1,
      jobType: 'FULL_TIME',
      workplaceMode: 'ON_SITE',
    };

    it('allows updating title and headcount in DRAFT status', () => {
      expect(() =>
        JobUpdateRules.validateUpdate(
          draftJob,
          { version: 0, title: 'Updated Draft Title', headcount: 3 },
          refTime,
        ),
      ).not.toThrow();
    });

    it('validates updated fields when provided in draft', () => {
      expect(() =>
        JobUpdateRules.validateUpdate(draftJob, { version: 0, title: 'Short' }, refTime),
      ).toThrow(ValidationError);

      expect(() =>
        JobUpdateRules.validateUpdate(draftJob, { version: 0, headcount: 200 }, refTime),
      ).toThrow(ValidationError);
    });
  });
});
