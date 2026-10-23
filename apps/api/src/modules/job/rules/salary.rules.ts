import { ValidationError } from '../../../../../../libs/platform/errors/domain.error';

export const ALLOWED_CURRENCIES = ['VND', 'USD'] as const;

export class SalaryRules {
  public static validateSalary(
    salaryMin?: number | null,
    salaryMax?: number | null,
    currency?: string | null,
  ): void {
    const hasMin = salaryMin !== undefined && salaryMin !== null;
    const hasMax = salaryMax !== undefined && salaryMax !== null;
    const hasCur = currency !== undefined && currency !== null && currency.trim().length > 0;

    // Case 1: All three are null/empty -> Thỏa thuận (Valid)
    if (!hasMin && !hasMax && !hasCur) {
      return;
    }

    // Case 2: Partial salary is NOT allowed
    if (!hasMin || !hasMax || !hasCur) {
      throw new ValidationError(
        'Salary must specify all three fields (salaryMin, salaryMax, currency) or leave all three empty.',
        { salary: ['Partial salary specification is invalid'] },
      );
    }

    // Currency check
    const normalizedCurrency = currency.trim().toUpperCase();
    if (!(ALLOWED_CURRENCIES as readonly string[]).includes(normalizedCurrency)) {
      throw new ValidationError(
        `Invalid currency '${currency}'. Allowed currencies are: ${ALLOWED_CURRENCIES.join(', ')}.`,
        { currency: ['Currency must be VND or USD'] },
      );
    }

    // Numeric checks
    const min = Number(salaryMin);
    const max = Number(salaryMax);

    if (isNaN(min) || min < 0) {
      throw new ValidationError('salaryMin must be a non-negative number.', {
        salaryMin: ['salaryMin must be >= 0'],
      });
    }

    if (isNaN(max) || max < 0) {
      throw new ValidationError('salaryMax must be a non-negative number.', {
        salaryMax: ['salaryMax must be >= 0'],
      });
    }

    if (min > max) {
      throw new ValidationError('salaryMin cannot exceed salaryMax.', {
        salaryMin: ['salaryMin must be <= salaryMax'],
      });
    }
  }
}
