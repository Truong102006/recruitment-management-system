import { registerAs } from '@nestjs/config';

export interface EnvironmentConfig {
  nodeEnv: 'development' | 'production' | 'test';
  port: number;
  databaseUrl: string;
  webOrigin: string;
  sessionSecret: string;
  sessionCookieName: string;
  csrfSecret: string;
  authEncryptionKey: string;
}

export function validateEnvironment(env: Record<string, unknown>): EnvironmentConfig {
  const nodeEnv = ((env.NODE_ENV as string) || 'development') as
    'development' | 'production' | 'test';
  const port = parseInt((env.API_PORT as string) || (env.PORT as string) || '3000', 10);
  const databaseUrl = (env.DATABASE_URL as string) || '';
  const webOrigin = (env.WEB_ORIGIN as string) || 'http://127.0.0.1:5173';
  const sessionSecret =
    (env.SESSION_SECRET as string) || 'default_session_secret_for_development_min_32_chars';
  const sessionCookieName =
    (env.SESSION_COOKIE_NAME as string) ||
    (nodeEnv === 'production' ? '__Host-recruitment_session' : 'recruitment_session');
  const csrfSecret =
    (env.CSRF_SECRET as string) || 'default_csrf_secret_for_development_min_32_chars';
  const authEncryptionKey = (env.AUTH_TOKEN_ENCRYPTION_KEY as string) || '';

  if (nodeEnv === 'production') {
    if (!databaseUrl) {
      throw new Error('DATABASE_URL is required in production');
    }
    if (sessionSecret.includes('replace_before') || sessionSecret.includes('default_')) {
      throw new Error('SESSION_SECRET must be configured with a secure random key in production');
    }
    if (Buffer.byteLength(sessionSecret) < 32)
      throw new Error('SESSION_SECRET must contain at least 32 bytes');
    if (
      Buffer.byteLength(csrfSecret) < 32 ||
      csrfSecret.includes('default_') ||
      csrfSecret.includes('replace_before')
    )
      throw new Error('CSRF_SECRET must contain at least 32 private bytes in production');
    if (!/^[0-9a-fA-F]{64}$/.test(authEncryptionKey))
      throw new Error(
        'AUTH_TOKEN_ENCRYPTION_KEY must contain 64 hexadecimal characters in production',
      );
    if (!webOrigin.startsWith('https://') || new URL(webOrigin).origin !== webOrigin)
      throw new Error('WEB_ORIGIN must be an HTTPS origin in production');
  }

  return {
    nodeEnv,
    port,
    databaseUrl,
    webOrigin,
    sessionSecret,
    sessionCookieName,
    csrfSecret,
    authEncryptionKey,
  };
}

export const environmentConfig = registerAs('environment', () => validateEnvironment(process.env));
