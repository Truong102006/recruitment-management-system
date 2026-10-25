import { Transform } from 'class-transformer';
import { registerDecorator, ValidationOptions } from 'class-validator';

/** BR18: ordinary text only; never apply to passwords or opaque tokens. */
export function normalizeText(value: string): string {
  return value.trim().normalize('NFC');
}

export function NormalizeText(): PropertyDecorator {
  return Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? normalizeText(value) : value,
  );
}

/** validator.js length ignores variation selectors; BR18 counts every code point. */
export function CodePointLength(
  min: number,
  max: number,
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return (target, propertyKey) => {
    registerDecorator({
      name: 'codePointLength',
      target: target.constructor,
      propertyName: String(propertyKey),
      constraints: [min, max],
      options: validationOptions,
      validator: {
        validate(value: unknown): boolean {
          if (typeof value !== 'string') return false;
          const length = [...normalizeText(value)].length;
          return length >= min && length <= max;
        },
        defaultMessage: () =>
          `${String(propertyKey)} must contain between ${min} and ${max} Unicode code points`,
      },
    });
  };
}
