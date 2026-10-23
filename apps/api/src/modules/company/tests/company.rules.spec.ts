import { CompanyRules } from '../rules/company.rules';
import {
  ConflictError,
  ForbiddenError,
  ValidationError,
} from '../../../../../../libs/platform/errors/domain.error';

describe('CompanyRules (Unit)', () => {
  describe('normalizeTaxCode', () => {
    it('trims and converts to uppercase', () => {
      expect(CompanyRules.normalizeTaxCode('  0101234567-001  ')).toBe('0101234567-001');
      expect(CompanyRules.normalizeTaxCode('abc12345')).toBe('ABC12345');
    });

    it('handles empty input gracefully', () => {
      expect(CompanyRules.normalizeTaxCode('')).toBe('');
    });
  });

  describe('validateTaxCode', () => {
    it('accepts valid tax / registration codes', () => {
      expect(() => CompanyRules.validateTaxCode('0101234567')).not.toThrow();
      expect(() => CompanyRules.validateTaxCode('0101234567-001')).not.toThrow();
      expect(() => CompanyRules.validateTaxCode('ABC-12345678')).not.toThrow();
    });

    it('rejects codes shorter than 8 chars or longer than 50 chars', () => {
      expect(() => CompanyRules.validateTaxCode('1234567')).toThrow(ValidationError);
      expect(() => CompanyRules.validateTaxCode('A'.repeat(51))).toThrow(ValidationError);
    });

    it('rejects invalid characters (spaces, special punctuation)', () => {
      expect(() => CompanyRules.validateTaxCode('010123 4567')).toThrow(ValidationError);
      expect(() => CompanyRules.validateTaxCode('0101234567@!')).toThrow(ValidationError);
    });
  });

  describe('assertCompanyCanBeUpdated', () => {
    it('allows updating in PENDING, APPROVED, and REJECTED statuses', () => {
      expect(() => CompanyRules.assertCompanyCanBeUpdated('PENDING')).not.toThrow();
      expect(() => CompanyRules.assertCompanyCanBeUpdated('APPROVED')).not.toThrow();
      expect(() => CompanyRules.assertCompanyCanBeUpdated('REJECTED')).not.toThrow();
    });

    it('forbids updating when SUSPENDED', () => {
      expect(() => CompanyRules.assertCompanyCanBeUpdated('SUSPENDED')).toThrow(ForbiddenError);
    });

    it('rejects unknown status with ConflictError', () => {
      expect(() => CompanyRules.assertCompanyCanBeUpdated('UNKNOWN')).toThrow(ConflictError);
    });
  });

  describe('assertCompanyCanBeResubmitted', () => {
    it('allows resubmitting only when REJECTED', () => {
      expect(() => CompanyRules.assertCompanyCanBeResubmitted('REJECTED')).not.toThrow();
    });

    it('throws ConflictError if PENDING', () => {
      expect(() => CompanyRules.assertCompanyCanBeResubmitted('PENDING')).toThrow(ConflictError);
    });

    it('throws ConflictError if APPROVED', () => {
      expect(() => CompanyRules.assertCompanyCanBeResubmitted('APPROVED')).toThrow(ConflictError);
    });

    it('throws ForbiddenError if SUSPENDED', () => {
      expect(() => CompanyRules.assertCompanyCanBeResubmitted('SUSPENDED')).toThrow(ForbiddenError);
    });
  });
});
