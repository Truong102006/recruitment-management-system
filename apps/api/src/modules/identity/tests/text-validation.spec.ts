import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { RegisterDto } from '../dto/auth.dto';
import { RegisterService } from '../services/register.service';
import { RateLimiterService } from '../../../common/services/rate-limiter.service';
import { ValidationError } from '../../../../../../libs/platform/errors/domain.error';

describe('UC04 normalized full name validation', () => {
  it.each(['   ', '♥️'.repeat(61)])(
    'rejects invalid normalized full name through DTO',
    (fullName) => {
      const dto = plainToInstance(RegisterDto, {
        fullName,
        email: 'name@example.test',
        password: 'Name-password-123!',
      });
      expect(validateSync(dto).some((error) => error.property === 'fullName')).toBe(true);
    },
  );

  it('normalizes full name before length checks and leaves password exact', () => {
    const password = '  unchanged-password  ';
    const dto = plainToInstance(RegisterDto, {
      fullName: `  ${'e\u0301'.repeat(120)}  `,
      email: 'name@example.test',
      password,
    });
    expect(validateSync(dto)).toEqual([]);
    expect(dto.fullName).toBe('é'.repeat(120));
    expect(dto.password).toBe(password);
  });

  it.each(['   ', '😀'.repeat(121), '♥️'.repeat(61)])(
    'rejects direct-service invalid name before transaction',
    async (fullName) => {
      const uow = { run: jest.fn().mockResolvedValue({ duplicate: true }) };
      const service = new RegisterService(
        {} as any,
        {} as any,
        new RateLimiterService(),
        uow as any,
        { ensureForCandidate: jest.fn(), getSubmissionSnapshot: jest.fn() },
        { append: jest.fn() },
      );
      await expect(
        service.register({ fullName, email: 'name@example.test', password: 'Name-password-123!' }),
      ).rejects.toThrow(ValidationError);
      expect(uow.run).not.toHaveBeenCalled();
    },
  );
});
