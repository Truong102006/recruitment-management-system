import React, { useEffect, useState, useRef } from 'react';
import { Link, useSearchParams, useLocation } from 'react-router-dom';
import { verifyEmailToken, resendVerificationEmail } from './auth-api';
import { validateEmail } from './utils/validation';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Alert } from '../../components/ui/alert';
import { isApiError } from '../../lib/http/api-client';

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const tokenParam = searchParams.get('token');

  const [status, setStatus] = useState<'verifying' | 'success' | 'error' | 'idle'>(() => {
    return tokenParam ? 'verifying' : 'idle';
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Resend form state
  const [resendEmail, setResendEmail] = useState('');
  const [resendError, setResendError] = useState<string | null>(null);
  const [resendSuccess, setResendSuccess] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const tokenProcessedRef = useRef(false);

  // Strip token from browser address bar immediately after reading
  useEffect(() => {
    if (tokenParam && !tokenProcessedRef.current) {
      tokenProcessedRef.current = true;
      const cleanUrl = location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);

      void (async () => {
        try {
          await verifyEmailToken(tokenParam);
          setStatus('success');
        } catch (err) {
          setStatus('error');
          if (isApiError(err)) {
            setErrorMessage(
              err.message || 'Liên kết xác minh không còn hiệu lực hoặc đã được sử dụng.',
            );
          } else {
            setErrorMessage('Không thể xác minh email. Vui lòng thử lại sau.');
          }
        }
      })();
    }
  }, [tokenParam, location.pathname]);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  const handleResend = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isResending || cooldown > 0) return;

    setResendError(null);
    setResendSuccess(null);

    const emailErr = validateEmail(resendEmail);
    if (emailErr) {
      setResendError(emailErr);
      return;
    }

    setIsResending(true);
    try {
      const res = await resendVerificationEmail(resendEmail);
      setResendSuccess(
        res.message || 'Nếu email tồn tại, liên kết xác minh mới đã được gửi vào hộp thư của bạn.',
      );
      setCooldown(60); // 60s cooldown
    } catch (err) {
      if (isApiError(err) && err.status === 429) {
        setResendError('Bạn đã gửi yêu cầu quá thường xuyên. Vui lòng đợi trong giây lát.');
        setCooldown(60);
      } else {
        setResendError('Không thể gửi lại email xác minh lúc này. Vui lòng thử lại sau.');
      }
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div
      data-testid="verify-email-page"
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '70vh',
        padding: 'var(--space-4) 0',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '480px',
          backgroundColor: 'var(--color-surface)',
          padding: 'var(--space-8)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-md)',
          border: '1px solid var(--color-border)',
        }}
      >
        {status === 'verifying' && (
          <div style={{ textAlign: 'center', padding: 'var(--space-6) 0' }}>
            <div
              role="status"
              aria-live="polite"
              style={{
                display: 'inline-block',
                width: '40px',
                height: '40px',
                border: '3px solid var(--color-border)',
                borderTopColor: 'var(--color-primary)',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                marginBottom: 'var(--space-4)',
              }}
            />
            <h1
              style={{
                fontSize: 'var(--font-size-xl)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'var(--color-foreground)',
              }}
            >
              Đang xác minh địa chỉ email...
            </h1>
            <p
              style={{
                color: 'var(--color-muted)',
                fontSize: 'var(--font-size-sm)',
                marginTop: 'var(--space-2)',
              }}
            >
              Vui lòng không đóng trình duyệt trong giây lát.
            </p>
          </div>
        )}

        {status === 'success' && (
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-success-bg)',
                color: 'var(--color-success)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                marginBottom: 'var(--space-4)',
              }}
            >
              ✓
            </div>
            <h1
              style={{
                fontSize: 'var(--font-size-2xl)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'var(--color-foreground)',
                marginBottom: 'var(--space-2)',
              }}
            >
              Xác minh email thành công!
            </h1>
            <p
              style={{
                color: 'var(--color-muted)',
                fontSize: 'var(--font-size-base)',
                marginBottom: 'var(--space-6)',
              }}
            >
              Tài khoản của bạn đã được kích hoạt đầy đủ. Bạn hiện có thể đăng nhập và trải nghiệm
              toàn bộ tính năng tuyển dụng.
            </p>
            <Link to="/login">
              <Button variant="primary" size="lg" style={{ width: '100%' }}>
                Đăng nhập ngay
              </Button>
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-destructive-bg)',
                  color: 'var(--color-destructive)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                  marginBottom: 'var(--space-4)',
                }}
              >
                ✕
              </div>
              <h1
                style={{
                  fontSize: 'var(--font-size-xl)',
                  fontWeight: 'var(--font-weight-bold)',
                  color: 'var(--color-foreground)',
                  marginBottom: 'var(--space-2)',
                }}
              >
                Xác minh không thành công
              </h1>
              <Alert variant="error">{errorMessage}</Alert>
            </div>

            <div
              style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-6)' }}
            >
              <h2
                style={{
                  fontSize: 'var(--font-size-base)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--color-foreground)',
                  marginBottom: 'var(--space-2)',
                }}
              >
                Gửi lại email xác minh
              </h2>
              <p
                style={{
                  color: 'var(--color-muted)',
                  fontSize: 'var(--font-size-xs)',
                  marginBottom: 'var(--space-4)',
                }}
              >
                Nhập địa chỉ email đăng ký để nhận lại liên kết kích hoạt mới.
              </p>

              {resendSuccess && (
                <div style={{ marginBottom: 'var(--space-4)' }}>
                  <Alert variant="success">{resendSuccess}</Alert>
                </div>
              )}

              <form
                onSubmit={handleResend}
                noValidate
                style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}
              >
                <Input
                  id="resend-email"
                  label="Địa chỉ email"
                  type="email"
                  required
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  error={resendError || undefined}
                  placeholder="applicant@example.com"
                  disabled={isResending || cooldown > 0}
                />
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isResending}
                  disabled={cooldown > 0}
                >
                  {cooldown > 0 ? `Thử lại sau (${cooldown}s)` : 'Gửi lại email'}
                </Button>
              </form>
            </div>
          </div>
        )}

        {status === 'idle' && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
              <h1
                style={{
                  fontSize: 'var(--font-size-2xl)',
                  fontWeight: 'var(--font-weight-bold)',
                  color: 'var(--color-foreground)',
                  marginBottom: 'var(--space-2)',
                }}
              >
                Xác thực email tài khoản
              </h1>
              <p style={{ color: 'var(--color-muted)', fontSize: 'var(--font-size-sm)' }}>
                Nếu bạn chưa nhận được thư kích hoạt hoặc liên kết đã hết hạn, vui lòng yêu cầu gửi
                lại bên dưới.
              </p>
            </div>

            {resendSuccess && (
              <div style={{ marginBottom: 'var(--space-4)' }}>
                <Alert variant="success">{resendSuccess}</Alert>
              </div>
            )}

            <form
              onSubmit={handleResend}
              noValidate
              style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}
            >
              <Input
                id="idle-resend-email"
                label="Địa chỉ email đã đăng ký"
                type="email"
                required
                value={resendEmail}
                onChange={(e) => setResendEmail(e.target.value)}
                error={resendError || undefined}
                placeholder="applicant@example.com"
                disabled={isResending || cooldown > 0}
              />
              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isResending}
                disabled={cooldown > 0}
              >
                {cooldown > 0 ? `Vui lòng đợi (${cooldown}s)` : 'Gửi liên kết xác minh'}
              </Button>
            </form>

            <div
              style={{
                marginTop: 'var(--space-6)',
                textAlign: 'center',
                fontSize: 'var(--font-size-sm)',
                borderTop: '1px solid var(--color-border)',
                paddingTop: 'var(--space-4)',
              }}
            >
              <Link to="/login" style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>
                Quay lại trang Đăng nhập
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
