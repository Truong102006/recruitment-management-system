import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { registerUser } from './auth-api';
import {
  validateEmail,
  validatePassword,
  validateFullName,
  validatePasswordConfirm,
} from './utils/validation';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Alert } from '../../components/ui/alert';
import { isApiError } from '../../lib/http/api-client';

export function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'CANDIDATE' | 'RECRUITER'>('CANDIDATE');

  const [fieldErrors, setFieldErrors] = useState<{
    fullName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;

    setGeneralError(null);
    const errors: typeof fieldErrors = {};

    const nameErr = validateFullName(fullName);
    if (nameErr) errors.fullName = nameErr;

    const emailErr = validateEmail(email);
    if (emailErr) errors.email = emailErr;

    const passErr = validatePassword(password);
    if (passErr) errors.password = passErr;

    const confirmErr = validatePasswordConfirm(password, confirmPassword);
    if (confirmErr) errors.confirmPassword = confirmErr;

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);

    try {
      await registerUser({
        fullName,
        email,
        password,
        role,
      });
      setIsSuccess(true);
    } catch (err) {
      if (isApiError(err)) {
        if (err.fieldErrors) {
          setFieldErrors(err.fieldErrors as typeof fieldErrors);
          setGeneralError(err.message || 'Dữ liệu đăng ký không hợp lệ');
        } else {
          setGeneralError(err.message);
        }
      } else {
        setGeneralError('Không thể hoàn tất đăng ký. Vui lòng thử lại sau.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div
        data-testid="register-page"
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
            maxWidth: '480px',
            backgroundColor: 'var(--card)',
            padding: '36px 32px 30px',
            borderRadius: '28px',
            boxShadow: 'var(--sh-m)',
            border: '1px solid var(--hair)',
            textAlign: 'center',
            animation: 'rise 0.4s var(--spring)',
          }}
        >
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '16px',
              backgroundColor: 'var(--p2b)',
              color: 'var(--p2f)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              fontWeight: 700,
              marginBottom: 'var(--space-4)',
              boxShadow: 'var(--sh-s)',
            }}
          >
            ✓
          </div>
          <h1
            style={{
              fontSize: '24px',
              fontWeight: 600,
              fontFamily: 'var(--font-d)',
              letterSpacing: '-0.02em',
              color: 'var(--ink)',
              marginBottom: 'var(--space-2)',
            }}
          >
            Đăng ký tài khoản thành công!
          </h1>
          <p
            style={{
              color: 'var(--muted)',
              fontSize: '14px',
              marginBottom: 'var(--space-6)',
              lineHeight: 1.5,
            }}
          >
            Chúng tôi đã gửi một liên kết xác minh đến địa chỉ email <strong>{email}</strong>. Vui
            lòng kiểm tra hộp thư đến (hoặc thư rác) và kích hoạt tài khoản trước khi đăng nhập.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <Link to="/login">
              <Button variant="primary" size="lg" style={{ width: '100%' }}>
                Đi đến trang Đăng nhập
              </Button>
            </Link>
            <Link to="/verify-email">
              <Button variant="outline" size="md" style={{ width: '100%' }}>
                Nhập mã / Gửi lại email xác minh
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      data-testid="register-page"
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
          maxWidth: '480px',
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
            Tạo tài khoản mới
          </h1>
          <p
            style={{
              color: 'var(--muted)',
              fontSize: '14px',
              marginTop: '6px',
            }}
          >
            Gia nhập cộng đồng tuyển dụng RecruitFlow ngay hôm nay
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
            id="register-fullName"
            label="Họ và tên"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            error={fieldErrors.fullName}
            placeholder="Nguyễn Văn A"
            disabled={isSubmitting}
          />

          <Input
            id="register-email"
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

          <Input
            id="register-password"
            label="Mật khẩu (tối thiểu 10 ký tự, tối đa 72 byte)"
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={fieldErrors.password}
            placeholder="••••••••••"
            disabled={isSubmitting}
          />

          <Input
            id="register-confirmPassword"
            label="Xác nhận mật khẩu"
            type="password"
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={fieldErrors.confirmPassword}
            placeholder="••••••••••"
            disabled={isSubmitting}
          />

          {/* Role Selection: allowlist CANDIDATE or RECRUITER only */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <span
              style={{
                fontSize: 'var(--font-size-sm)',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--color-foreground)',
              }}
            >
              Mục đích sử dụng tài khoản{' '}
              <span style={{ color: 'var(--color-destructive)' }}>*</span>
            </span>
            <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  fontSize: 'var(--font-size-sm)',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="radio"
                  name="role"
                  value="CANDIDATE"
                  checked={role === 'CANDIDATE'}
                  onChange={() => setRole('CANDIDATE')}
                  disabled={isSubmitting}
                />
                Ứng viên tìm việc
              </label>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  fontSize: 'var(--font-size-sm)',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="radio"
                  name="role"
                  value="RECRUITER"
                  checked={role === 'RECRUITER'}
                  onChange={() => setRole('RECRUITER')}
                  disabled={isSubmitting}
                />
                Nhà tuyển dụng
              </label>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isSubmitting}
            style={{ marginTop: 'var(--space-2)' }}
          >
            Đăng ký tài khoản
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
          Đã có tài khoản?{' '}
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
