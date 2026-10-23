import { SalaryRules } from '../rules/salary.rules';
import { ValidationError } from '../../../../../../libs/platform/errors/domain.error';

describe('SalaryRules', () => {
  it('allows all salary fields to be undefined/null (undisclosed salary)', () => {
    expect(() => SalaryRules.validateSalary(undefined, undefined, undefined)).not.toThrow();
    expect(() => SalaryRules.validateSalary(null, null, null)).not.toThrow();
    expect(() => SalaryRules.validateSalary(null, null, '')).not.toThrow();
  });

  it('rejects partial salary specifications', () => {
    expect(() => SalaryRules.validateSalary(1000, null, 'VND')).toThrow(ValidationError);
    expect(() => SalaryRules.validateSalary(null, 2000, 'VND')).toThrow(ValidationError);
    expect(() => SalaryRules.validateSalary(1000, 2000, null)).toThrow(ValidationError);
    expect(() => SalaryRules.validateSalary(1000, 2000, '  ')).toThrow(ValidationError);
    expect(() => SalaryRules.validateSalary(null, null, 'VND')).toThrow(ValidationError);
  });

  it('rejects invalid currency', () => {
    expect(() => SalaryRules.validateSalary(1000, 2000, 'EUR')).toThrow(ValidationError);
    expect(() => SalaryRules.validateSalary(1000, 2000, 'BTC')).toThrow(ValidationError);
  });

  it('accepts valid currencies (VND, USD)', () => {
    expect(() => SalaryRules.validateSalary(1000, 2000, 'VND')).not.toThrow();
    expect(() => SalaryRules.validateSalary(1000, 2000, 'USD')).not.toThrow();
    expect(() => SalaryRules.validateSalary(1000, 2000, 'vnd')).not.toThrow();
  });

  it('rejects negative salary values', () => {
    expect(() => SalaryRules.validateSalary(-1, 2000, 'VND')).toThrow(ValidationError);
    expect(() => SalaryRules.validateSalary(1000, -5, 'VND')).toThrow(ValidationError);
    expect(() => SalaryRules.validateSalary(NaN, 2000, 'VND')).toThrow(ValidationError);
    expect(() => SalaryRules.validateSalary(1000, NaN, 'VND')).toThrow(ValidationError);
  });

  it('rejects when salaryMin > salaryMax', () => {
    expect(() => SalaryRules.validateSalary(3000, 2000, 'VND')).toThrow(ValidationError);
  });

  it('accepts when salaryMin == salaryMax or salaryMin < salaryMax', () => {
    expect(() => SalaryRules.validateSalary(2000, 2000, 'VND')).not.toThrow();
    expect(() => SalaryRules.validateSalary(1000, 2000, 'VND')).not.toThrow();
    expect(() => SalaryRules.validateSalary(0, 0, 'VND')).not.toThrow();
  });
});
