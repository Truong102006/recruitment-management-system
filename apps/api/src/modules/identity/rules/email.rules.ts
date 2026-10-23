import { ValidationError } from '../../../../../../libs/platform/errors/domain.error';

export class EmailRules {
  private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  /**
   * Normalizes email: trim whitespace and convert to lowercase.
   * Crucial rule: Do NOT strip dots or plus tags (+tag) from email, as that changes email semantics.
   */
  static normalize(email: string): string {
    if (typeof email !== 'string') {
      throw new ValidationError('Email must be a string');
    }
    const normalized = email.trim().toLowerCase();
    if (!this.EMAIL_REGEX.test(normalized)) {
      throw new ValidationError('Email is invalid');
    }
    return normalized;
  }
}
