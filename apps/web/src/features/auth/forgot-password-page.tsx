import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { requestForgotPassword } from './auth-api';
import { validateEmail } from './utils/validation';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Alert } from '../../components/ui/alert';
import { isApiError } from '../../lib/http/api-client';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [submittedMessage, setSubmittedMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting || cooldown > 0) return;

    setEmailError(null);
    setGeneralError(null);

    const err = validateEmail(email);
    if (err) {
      setEmailError(err);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await requestForgotPassword(email);
      // Uniform generic message to prevent email enumeration (BR15)
      setSubmittedMessage(
        res.message ||
          'Nếu email tồn tại trong hệ thống, hướng dẫn đặt lại mật khẩu đã được gửi đến hộp thư của bạn.',
      );
      setCooldown(60);
    } catch (apiErr) {
      if (isApiError(apiErr) && apiErr.status === 429) {
        setGeneralError('Bạn đã gửi yêu cầu quá thường xuyên. Vui lòng đợi trong giây lát.');
        setCooldown(60);
      } else {
        setGeneralError('Không thể gửi yêu cầu lúc này. Vui lòng thử lại sau.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      data-testid="forgot-password-page"
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
            Quên mật khẩu
          </h1>
          <p
            style={{
              color: 'var(--muted)',
              fontSize: '14px',
              marginTop: '6px',
            }}
          >
            Nhập email của bạn để nhận liên kết thiết lập lại mật khẩu an toàn
          </p>
        </div>

        {generalError && (
          <div style={{ marginBottom: 'var(--space-4)' }}>
            <Alert variant="error">{generalError}</Alert>
          </div>
        )}

        {submittedMessage ? (
          <div>
            <div style={{ marginBottom: 'var(--space-6)' }}>
              <Alert variant="success">{submittedMessage}</Alert>
            </div>
            <p
              style={{
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-muted)',
                marginBottom: 'var(--space-4)',
                textAlign: 'center',
              }}
            >
              Liên kết đặt lại mật khẩu có hiệu lực trong vòng 30 phút.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <Button
                variant="outline"
                size="md"
                disabled={cooldown > 0}
                onClick={() => {
                  setSubmittedMessage(null);
                }}
              >
                {cooldown > 0 ? `Gửi lại sau (${cooldown}s)` : 'Gửi lại yêu cầu'}
              </Button>
              <Link to="/login" style={{ textAlign: 'center' }}>
                <Button variant="ghost" size="md">
                  Quay lại Đăng nhập
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            noValidate
            style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}
          >
            <Input
              id="forgot-email"
              label="Địa chỉ email tài khoản"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={emailError || undefined}
              placeholder="applicant@example.com"
              disabled={isSubmitting}
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isSubmitting}
              disabled={cooldown > 0}
              style={{ marginTop: 'var(--space-2)' }}
            >
              {cooldown > 0 ? `Vui lòng đợi (${cooldown}s)` : 'Gửi yêu cầu'}
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
          Nhớ mật khẩu?{' '}
          <Link
            to="/login"
            style={{
              color: 'var(--color-primary)',
              fontWeight: 'var(--font-weight-medium)',
              textDecoration: 'none',
            }}
          >
            Đăng nhập ngay
          </Link>
        </div>
      </div>
    </div>
  );
}
