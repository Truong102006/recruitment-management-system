import { PublicationRules } from '../rules/publication.rules';
import { ValidationError } from '../../../../../../libs/platform/errors/domain.error';

describe('PublicationRules', () => {
  it('counts normalized Unicode code points rather than UTF-16 units or graphemes', () => {
    expect(() => PublicationRules.validateTitle('😀'.repeat(5))).toThrow(ValidationError);
    expect(() => PublicationRules.validateTitle('😀'.repeat(150))).not.toThrow();
    expect(() => PublicationRules.validateTitle('e\u0301'.repeat(151))).toThrow(ValidationError);
    expect(() => PublicationRules.validateDescription('e\u0301'.repeat(99))).toThrow(
      ValidationError,
    );
    expect(() => PublicationRules.validateDescription('😀'.repeat(100))).not.toThrow();
    expect(() => PublicationRules.validateLocation('😀'.repeat(255))).not.toThrow();
    expect(() => PublicationRules.validateTitle('a\uFE0F'.repeat(76))).toThrow(ValidationError);
  });

  describe('validateTitle', () => {
    it('accepts valid title between 10 and 150 chars', () => {
      expect(() => PublicationRules.validateTitle('Software Engineer (Fullstack)')).not.toThrow();
    });

    it('rejects title shorter than 10 chars or longer than 150 chars', () => {
      expect(() => PublicationRules.validateTitle('Dev')).toThrow(ValidationError);
      expect(() => PublicationRules.validateTitle('a'.repeat(151))).toThrow(ValidationError);
    });

    it('handles optional title', () => {
      expect(() => PublicationRules.validateTitle(null, false)).not.toThrow();
      expect(() => PublicationRules.validateTitle(undefined, false)).not.toThrow();
      expect(() => PublicationRules.validateTitle('', false)).not.toThrow();
      expect(() => PublicationRules.validateTitle('', true)).toThrow(ValidationError);
    });
  });

  describe('validateDescription', () => {
    const validDesc = 'a'.repeat(150);

    it('accepts description between 100 and 10000 chars', () => {
      expect(() => PublicationRules.validateDescription(validDesc)).not.toThrow();
    });

    it('rejects description shorter than 100 or longer than 10000 chars', () => {
      expect(() => PublicationRules.validateDescription('Short description')).toThrow(
        ValidationError,
      );
      expect(() => PublicationRules.validateDescription('a'.repeat(10001))).toThrow(
        ValidationError,
      );
    });

    it('handles optional description', () => {
      expect(() => PublicationRules.validateDescription(null, false)).not.toThrow();
      expect(() => PublicationRules.validateDescription('', true)).toThrow(ValidationError);
    });
  });

  describe('validateLocation', () => {
    it('accepts location between 1 and 255 chars', () => {
      expect(() => PublicationRules.validateLocation('Ho Chi Minh City, Vietnam')).not.toThrow();
    });

    it('rejects empty or over 255 chars', () => {
      expect(() => PublicationRules.validateLocation('')).toThrow(ValidationError);
      expect(() => PublicationRules.validateLocation('a'.repeat(256))).toThrow(ValidationError);
    });

    it('handles optional location', () => {
      expect(() => PublicationRules.validateLocation(null, false)).not.toThrow();
    });
  });

  describe('validateHeadcount', () => {
    it('accepts integer between 1 and 100', () => {
      expect(() => PublicationRules.validateHeadcount(1)).not.toThrow();
      expect(() => PublicationRules.validateHeadcount(50)).not.toThrow();
      expect(() => PublicationRules.validateHeadcount(100)).not.toThrow();
    });

    it('rejects 0, negative, over 100, or non-integer', () => {
      expect(() => PublicationRules.validateHeadcount(0)).toThrow(ValidationError);
      expect(() => PublicationRules.validateHeadcount(-5)).toThrow(ValidationError);
      expect(() => PublicationRules.validateHeadcount(101)).toThrow(ValidationError);
      expect(() => PublicationRules.validateHeadcount(3.5)).toThrow(ValidationError);
    });

    it('handles optional headcount', () => {
      expect(() => PublicationRules.validateHeadcount(null, false)).not.toThrow();
      expect(() => PublicationRules.validateHeadcount(null, true)).toThrow(ValidationError);
    });
  });

  describe('validateJobType', () => {
    it('accepts allowlisted types', () => {
      expect(() => PublicationRules.validateJobType('FULL_TIME')).not.toThrow();
      expect(() => PublicationRules.validateJobType('PART_TIME')).not.toThrow();
      expect(() => PublicationRules.validateJobType('CONTRACT')).not.toThrow();
      expect(() => PublicationRules.validateJobType('INTERNSHIP')).not.toThrow();
    });

    it('rejects invalid job types', () => {
      expect(() => PublicationRules.validateJobType('FREELANCE')).toThrow(ValidationError);
      expect(() => PublicationRules.validateJobType(null, true)).toThrow(ValidationError);
    });
  });

  describe('validateWorkplaceMode', () => {
    it('accepts allowlisted modes', () => {
      expect(() => PublicationRules.validateWorkplaceMode('ON_SITE')).not.toThrow();
      expect(() => PublicationRules.validateWorkplaceMode('HYBRID')).not.toThrow();
      expect(() => PublicationRules.validateWorkplaceMode('REMOTE')).not.toThrow();
    });

    it('rejects invalid modes', () => {
      expect(() => PublicationRules.validateWorkplaceMode('WORK_FROM_ANYWHERE')).toThrow(
        ValidationError,
      );
      expect(() => PublicationRules.validateWorkplaceMode(null, true)).toThrow(ValidationError);
    });
  });

  describe('validateDeadline', () => {
    const ref = new Date('2026-10-22T12:00:00Z');

    it('accepts future deadline', () => {
      expect(() => PublicationRules.validateDeadline('2026-10-23T12:00:00Z', ref)).not.toThrow();
      expect(() =>
        PublicationRules.validateDeadline(new Date('2026-10-25T00:00:00Z'), ref),
      ).not.toThrow();
    });

    it('rejects past or equal deadline', () => {
      expect(() => PublicationRules.validateDeadline('2026-10-21T12:00:00Z', ref)).toThrow(
        ValidationError,
      );
      expect(() => PublicationRules.validateDeadline('2026-10-22T12:00:00Z', ref)).toThrow(
        ValidationError,
      );
    });

    it('rejects invalid date format', () => {
      expect(() => PublicationRules.validateDeadline('not-a-date', ref)).toThrow(ValidationError);
    });
  });

  describe('validateCompletenessForPublish', () => {
    const ref = new Date('2026-10-22T12:00:00Z');
    const validJob = {
      title: 'Senior Backend Engineer',
      description:
        'We are looking for a Senior Backend Engineer with experience in TypeScript, Node.js, and PostgreSQL. '.repeat(
          3,
        ),
      location: 'Ho Chi Minh City',
      headcount: 2,
      jobType: 'FULL_TIME',
      workplaceMode: 'HYBRID',
      deadline: '2026-11-01T00:00:00Z',
      salaryMin: 2000,
      salaryMax: 4000,
      currency: 'USD',
    };

    it('passes for complete valid job', () => {
      expect(() => PublicationRules.validateCompletenessForPublish(validJob, ref)).not.toThrow();
    });

    it('fails if any mandatory field is missing', () => {
      expect(() =>
        PublicationRules.validateCompletenessForPublish({ ...validJob, title: null }, ref),
      ).toThrow(ValidationError);
      expect(() =>
        PublicationRules.validateCompletenessForPublish({ ...validJob, description: null }, ref),
      ).toThrow(ValidationError);
      expect(() =>
        PublicationRules.validateCompletenessForPublish({ ...validJob, location: null }, ref),
      ).toThrow(ValidationError);
      expect(() =>
        PublicationRules.validateCompletenessForPublish({ ...validJob, headcount: null }, ref),
      ).toThrow(ValidationError);
      expect(() =>
        PublicationRules.validateCompletenessForPublish({ ...validJob, jobType: null }, ref),
      ).toThrow(ValidationError);
      expect(() =>
        PublicationRules.validateCompletenessForPublish({ ...validJob, workplaceMode: null }, ref),
      ).toThrow(ValidationError);
      expect(() =>
        PublicationRules.validateCompletenessForPublish({ ...validJob, deadline: null }, ref),
      ).toThrow(ValidationError);
    });
  });
});
