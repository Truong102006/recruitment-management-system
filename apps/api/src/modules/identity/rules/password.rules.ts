import { ValidationError } from '../../../../../../libs/platform/errors/domain.error';

export class PasswordRules {
  static readonly MIN_CODE_POINTS = 10;
  static readonly MAX_UTF8_BYTES = 72; // BCrypt truncation limit

  /**
   * Validates password length by code points (>=10) and UTF-8 byte length (<=72).
   * Note: The password MUST NOT be normalized (e.g. NFC) because normalization alters user input.
   */
  static validate(password: string): void {
    if (typeof password !== 'string') {
      throw new ValidationError('Password must be a string');
    }

    const codePointLength = Array.from(password).length;
    if (codePointLength < this.MIN_CODE_POINTS) {
      throw new ValidationError(
        `Password must be at least ${this.MIN_CODE_POINTS} characters long`,
      );
    }

    const byteLength = Buffer.byteLength(password, 'utf8');
    if (byteLength > this.MAX_UTF8_BYTES) {
      throw new ValidationError(
        `Password UTF-8 representation exceeds maximum allowed length of ${this.MAX_UTF8_BYTES} bytes`,
      );
    }
  }
}
