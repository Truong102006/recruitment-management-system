import {
  ConflictError,
  ForbiddenError,
  ValidationError,
} from '../../../../../../libs/platform/errors/domain.error';
import { normalizeText } from '../../../common/validation/text';

export class CompanyRules {
  private static readonly TAX_CODE_REGEX = /^[A-Z0-9-]{8,50}$/;

  public static normalizeTaxCode(taxCode: string): string {
    if (!taxCode) return '';
    return normalizeText(taxCode).toUpperCase();
  }

  public static normalizeRequiredText(value: unknown, field: 'name' | 'address'): string {
    const [min, max]: [number, number] = field === 'name' ? [2, 255] : [5, 500];
    if (typeof value !== 'string') {
      throw new ValidationError(`Company ${field} must be text.`, {
        [field]: ['Text is required'],
      });
    }
    const normalized = normalizeText(value);
    const length = [...normalized].length;
    if (length < min || length > max) {
      throw new ValidationError(
        `Company ${field} must contain between ${min} and ${max} characters.`,
        {
          [field]: [`Length must be between ${min} and ${max} Unicode code points`],
        },
      );
    }
    return normalized;
  }

  public static normalizeNullableText(
    value: unknown,
    field: 'website' | 'description',
  ): string | null | undefined {
    if (value === undefined || value === null) return value;
    if (typeof value !== 'string') {
      throw new ValidationError(`Company ${field} must be text.`, {
        [field]: ['Text is required'],
      });
    }
    const normalized = normalizeText(value);
    if (field === 'website' && [...normalized].length > 255) {
      throw new ValidationError('Company website must contain at most 255 characters.', {
        website: ['Length must be at most 255 Unicode code points'],
      });
    }
    return normalized || null;
  }

  public static validateTaxCode(taxCode: string): void {
    const normalized = this.normalizeTaxCode(taxCode);
    if (!this.TAX_CODE_REGEX.test(normalized)) {
      throw new ValidationError(
        'Invalid tax/registration code. Must be 8 to 50 alphanumeric characters or hyphens.',
      );
    }
  }

  public static assertCompanyCanBeUpdated(status: string): void {
    if (status === 'SUSPENDED') {
      throw new ForbiddenError(
        'Company is suspended and cannot be modified by members; contact administrator',
        'COMPANY_SUSPENDED',
      );
    }
    const updatableStatuses = ['PENDING', 'APPROVED', 'REJECTED'];
    if (!updatableStatuses.includes(status)) {
      throw new ConflictError(
        `Company in status ${status} cannot be modified`,
        'INVALID_COMPANY_STATUS',
      );
    }
  }

  public static assertCompanyCanBeResubmitted(status: string): void {
    if (status === 'PENDING') {
      throw new ConflictError('Company is already pending review', 'COMPANY_ALREADY_PENDING');
    }
    if (status === 'APPROVED') {
      throw new ConflictError('Approved company cannot be resubmitted', 'COMPANY_ALREADY_APPROVED');
    }
    if (status === 'SUSPENDED') {
      throw new ForbiddenError(
        'Suspended company cannot be resubmitted; contact administrator',
        'COMPANY_SUSPENDED',
      );
    }
    if (status !== 'REJECTED') {
      throw new ConflictError(
        'Only REJECTED companies can be resubmitted',
        'INVALID_COMPANY_STATUS',
      );
    }
  }
}
