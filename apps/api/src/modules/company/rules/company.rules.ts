import {
  ConflictError,
  ForbiddenError,
  ValidationError,
} from '../../../../../../libs/platform/errors/domain.error';

export class CompanyRules {
  private static readonly TAX_CODE_REGEX = /^[A-Z0-9-]{8,50}$/;

  public static normalizeTaxCode(taxCode: string): string {
    if (!taxCode) return '';
    return taxCode.trim().toUpperCase();
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
