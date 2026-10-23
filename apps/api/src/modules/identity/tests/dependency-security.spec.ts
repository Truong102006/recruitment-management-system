import { RegisterService } from '../services/register.service';
import { AuthTokenService } from '../services/auth-token.service';
import { RateLimiterService } from '../../../common/services/rate-limiter.service';
import { ServiceUnavailableError } from '../../../../../../libs/platform/errors/domain.error';
import { CloseJobService } from '../../job/services/close-job.service';
import { PublishJobService } from '../../job/services/publish-job.service';

describe('BE1 required dependency failure safety', () => {
  const uow: any = { run: jest.fn() };
  beforeEach(() => jest.clearAllMocks());

  it('refuses registration when profile and outbox providers are absent', async () => {
    const service = new RegisterService({} as any, {} as any, new RateLimiterService(), uow);
    await expect(
      service.register({ email: 'user@example.com', fullName: 'User', password: 'ValidPass123!' }),
    ).rejects.toThrow(ServiceUnavailableError);
    expect(uow.run).not.toHaveBeenCalled();
  });

  it('refuses mail token rotation when outbox provider is absent', async () => {
    const service = new AuthTokenService(
      {} as any,
      {} as any,
      {} as any,
      new RateLimiterService(),
      uow,
    );
    await expect(service.resendVerification('user@example.com')).rejects.toThrow(
      ServiceUnavailableError,
    );
    await expect(service.forgotPassword('user@example.com')).rejects.toThrow(
      ServiceUnavailableError,
    );
    expect(uow.run).not.toHaveBeenCalled();
  });

  it('refuses job lifecycle mutation when event provider is absent', async () => {
    const close = new CloseJobService({} as any, {} as any, {} as any, uow);
    const publish = new PublishJobService({} as any, {} as any, {} as any, uow);
    await expect(
      close.closeJob({} as any, 'job', { version: 0, reason: 'security' }),
    ).rejects.toThrow(ServiceUnavailableError);
    await expect(publish.publishJob({} as any, 'job', { version: 0 })).rejects.toThrow(
      ServiceUnavailableError,
    );
    expect(uow.run).not.toHaveBeenCalled();
  });
});
