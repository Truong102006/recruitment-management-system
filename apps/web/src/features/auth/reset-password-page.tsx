import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams, useLocation } from 'react-router-dom';
import { resetPasswordWithToken } from './auth-api';
import { validatePassword, validatePasswordConfirm } from './utils/validation';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Alert } from '../../components/ui/alert';
import { isApiError } from '../../lib/http/api-client';

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const tokenParam = searchParams.get('token');

  const [token, setToken] = useState<string | null>(tokenParam);
  const tokenProcessedRef = useRef(false);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [fieldErrors, setFieldErrors] = useState<{
    newPassword?: string;
    confirmPassword?: string;
  }>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isTokenInvalid, setIsTokenInvalid] = useState(!tokenParam);

  // Strip token from browser address bar immediately
  useEffect(() => {
    if (tokenParam && !tokenProcessedRef.current) {
      tokenProcessedRef.current = true;
      setToken(tokenParam);
      const cleanUrl = location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    }
  }, [tokenParam, location.pathname]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting || !token) return;

    setGeneralError(null);
    const errors: typeof fieldErrors = {};

    const passErr = validatePassword(newPassword);
    if (passErr) errors.newPassword = passErr;

    const confirmErr = validatePasswordConfirm(newPassword, confirmPassword);
    if (confirmErr) errors.confirmPassword = confirmErr;

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);

    try {
      await resetPasswordWithToken({
        token,
        newPassword,
      });
      setIsSuccess(true);
    } catch (err) {
      if (isApiError(err)) {
        if (err.status === 409 || err.code === 'TOKEN_INVALID' || err.code === 'TOKEN_EXPIRED') {
          setIsTokenInvalid(true);
          setGeneralError('Liên kết đặt lại mật khẩu đã hết hạn hoặc đã được sử dụng.');
        } else if (err.fieldErrors) {
          setFieldErrors(err.fieldErrors as typeof fieldErrors);
          setGeneralError(err.message || 'Dữ liệu không hợp lệ');
        } else {
          setGeneralError(err.message);
        }
      } else {
        setGeneralError('Không thể đặt lại mật khẩu. Vui lòng thử lại sau.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div
        data-testid="reset-password-page"
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
            maxWidth: '440px',
            backgroundColor: 'var(--color-surface)',
            padding: 'var(--space-8)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-md)',
            border: '1px solid var(--color-border)',
            textAlign: 'center',
          }}
        >
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
            Đặt lại mật khẩu thành công!
          </h1>
          <p
            style={{
              color: 'var(--color-muted)',
              fontSize: 'var(--font-size-sm)',
              marginBottom: 'var(--space-6)',
              lineHeight: 'var(--line-height-base)',
            }}
          >
            Mật khẩu mới đã được cập nhật. Vì lý do an toàn, toàn bộ các phiên đăng nhập trước đó đã
            được thu hồi tự động (BR15). Vui lòng đăng nhập lại với mật khẩu mới.
          </p>

          <Link to="/login">
            <Button variant="primary" size="lg" style={{ width: '100%' }}>
              Đăng nhập ngay
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      data-testid="reset-password-page"
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
          maxWidth: '440px',
          backgroundColor: 'var(--color-surface)',
          padding: 'var(--space-8)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-md)',
          border: '1px solid var(--color-border)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
          <h1
            style={{
              fontSize: 'var(--font-size-2xl)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'var(--color-foreground)',
            }}
          >
            Thiết lập mật khẩu mới
          </h1>
          <p
            style={{
              color: 'var(--color-muted)',
              fontSize: 'var(--font-size-sm)',
              marginTop: 'var(--space-1)',
            }}
          >
            Nhập mật khẩu mới an toàn cho tài khoản của bạn
          </p>
        </div>

        {generalError && (
          <div style={{ marginBottom: 'var(--space-4)' }}>
            <Alert variant="error">{generalError}</Alert>
          </div>
        )}

        {isTokenInvalid ? (
          <div style={{ textAlign: 'center' }}>
            <p
              style={{
                color: 'var(--color-muted)',
                fontSize: 'var(--font-size-sm)',
                marginBottom: 'var(--space-4)',
              }}
            >
              Liên kết đặt lại mật khẩu không hợp lệ hoặc thiếu mã xác thực.
            </p>
            <Link to="/forgot-password">
              <Button variant="outline" size="md">
                Yêu cầu liên kết mới
              </Button>
            </Link>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            noValidate
            style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}
          >
            <Input
              id="reset-newPassword"
              label="Mật khẩu mới (tối thiểu 10 ký tự, tối đa 72 byte)"
              type="password"
              autoComplete="new-password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              error={fieldErrors.newPassword}
              placeholder="••••••••••"
              disabled={isSubmitting}
            />

            <Input
              id="reset-confirmPassword"
              label="Xác nhận mật khẩu mới"
              type="password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={fieldErrors.confirmPassword}
              placeholder="••••••••••"
              disabled={isSubmitting}
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isSubmitting}
              style={{ marginTop: 'var(--space-2)' }}
            >
              Lưu mật khẩu mới
            </Button>
          </form>
        )}

        <div
          style={{
            marginTop: 'var(--space-6)',
            textAlign: 'center',
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-muted)',
            borderTop: '1px solid var(--color-border)',
            paddingTop: 'var(--space-4)',
          }}
        >
          <Link
            to="/login"
            style={{
              color: 'var(--color-primary)',
              textDecoration: 'none',
            }}
          >
            Quay lại trang Đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
}
