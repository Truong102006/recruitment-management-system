import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from './context/auth-context';
import { loginUser } from './auth-api';
import { validateEmail, validatePassword, sanitizeReturnTo } from './utils/validation';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Alert } from '../../components/ui/alert';
import { isApiError } from '../../lib/http/api-client';

export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refreshSession } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;

    setGeneralError(null);
    const errors: { email?: string; password?: string } = {};

    const emailErr = validateEmail(email);
    if (emailErr) errors.email = emailErr;

    const passErr = validatePassword(password);
    if (passErr) errors.password = passErr;

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);

    try {
      await loginUser({ email, password });
      await refreshSession();
      const targetUrl = sanitizeReturnTo(searchParams.get('returnTo'));
      navigate(targetUrl, { replace: true });
    } catch (err) {
      if (isApiError(err)) {
        if (err.status === 401) {
          setGeneralError('Email hoặc mật khẩu không chính xác');
        } else if (err.status === 429) {
          setGeneralError('Bạn đã thử đăng nhập quá nhiều lần. Vui lòng thử lại sau.');
        } else if (err.fieldErrors) {
          setFieldErrors(err.fieldErrors as { email?: string; password?: string });
          setGeneralError(err.message || 'Dữ liệu đăng nhập không hợp lệ');
        } else {
          setGeneralError(err.message);
        }
      } else {
        setGeneralError('Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      data-testid="login-page"
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '75vh',
        padding: 'var(--space-8) var(--space-4)',
        background: 'var(--canvas)',
        backgroundImage: 'radial-gradient(var(--dot) 1px, transparent 1.2px)',
        backgroundSize: '8px 8px',
        borderRadius: '32px',
        margin: 'var(--space-4) 0',
      }}
    >
      <div
        className="card auth-card"
        style={{
          width: '100%',
          maxWidth: '440px',
          backgroundColor: 'var(--card)',
          padding: '36px 32px 30px',
          borderRadius: '28px',
          boxShadow: 'var(--sh-m)',
          border: '1px solid var(--hair)',
          animation: 'rise 0.4s var(--spring)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
          <div
            className="tile static logo-tile"
            style={{
              margin: '0 auto 16px',
              width: '56px',
              height: '56px',
              borderRadius: '16px',
            }}
          >
            <span className="dots">
              <i />
              <i />
              <i />
              <i />
            </span>
          </div>
          <h1
            style={{
              fontSize: '26px',
              fontWeight: 600,
              fontFamily: 'var(--font-d)',
              letterSpacing: '-0.02em',
              color: 'var(--ink)',
            }}
          >
            Đăng nhập hệ thống
          </h1>
          <p
            style={{
              color: 'var(--muted)',
              fontSize: '14px',
              marginTop: '6px',
            }}
          >
            Chào mừng bạn quay trở lại với RecruitFlow
          </p>
        </div>

        {generalError && (
          <div style={{ marginBottom: 'var(--space-4)' }}>
            <Alert variant="error">{generalError}</Alert>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          noValidate
          style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}
        >
          <Input
            id="login-email"
            label="Địa chỉ email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={fieldErrors.email}
            placeholder="applicant@example.com"
            disabled={isSubmitting}
          />

          <div style={{ position: 'relative' }}>
            <Input
              id="login-password"
              label="Mật khẩu"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={fieldErrors.password}
              placeholder="••••••••••"
              disabled={isSubmitting}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '12px',
                top: fieldErrors.password ? '32px' : '36px',
                background: 'none',
                border: 'none',
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-muted)',
                cursor: 'pointer',
                padding: '4px',
              }}
              tabIndex={-1}
              aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            >
              {showPassword ? 'Ẩn' : 'Hiện'}
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Link
              to="/forgot-password"
              style={{
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-primary)',
                textDecoration: 'none',
              }}
            >
              Quên mật khẩu?
            </Link>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isSubmitting}
            style={{ marginTop: 'var(--space-2)' }}
          >
            Đăng nhập
          </Button>
        </form>

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
          Chưa có tài khoản?{' '}
          <Link
            to="/register"
            style={{
              color: 'var(--color-primary)',
              fontWeight: 'var(--font-weight-medium)',
              textDecoration: 'none',
            }}
          >
            Đăng ký ngay
          </Link>
        </div>
      </div>
    </div>
  );
}
