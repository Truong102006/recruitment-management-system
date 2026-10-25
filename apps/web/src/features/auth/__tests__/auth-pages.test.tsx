import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { LoginPage } from '../login-page';
import { RegisterPage } from '../register-page';
import { VerifyEmailPage } from '../verify-email-page';
import { ForgotPasswordPage } from '../forgot-password-page';
import { ResetPasswordPage } from '../reset-password-page';
import { AuthProvider } from '../context/auth-context';
import { apiClient, ApiException } from '../../../lib/http/api-client';

describe('FE1 Authentication (UI03, UI04, UI05, UI06)', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    vi.restoreAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /* -------------------------------------------------------------------------- */
  /* FE08 (UI03): Đăng ký tài khoản                                              */
  /* -------------------------------------------------------------------------- */
  describe('FE08 - UI03 Đăng ký tài khoản', () => {
    it('hiển thị lỗi cạnh trường khi email sai, mật khẩu quá ngắn hoặc không khớp', async () => {
      render(
        <MemoryRouter>
          <RegisterPage />
        </MemoryRouter>,
      );

      // Điền email sai cú pháp, password ngắn (5 ký tự), password không khớp
      fireEvent.change(screen.getByLabelText(/Họ và tên/), { target: { value: 'Trần Văn B' } });
      fireEvent.change(screen.getByLabelText(/Địa chỉ email/), {
        target: { value: 'email-sai-dinh-dang' },
      });
      fireEvent.change(screen.getByLabelText(/^Mật khẩu/), { target: { value: '12345' } });
      fireEvent.change(screen.getByLabelText(/Xác nhận mật khẩu/), { target: { value: '123456' } });

      await user.click(screen.getByRole('button', { name: 'Đăng ký tài khoản' }));

      expect(screen.getByText('Địa chỉ email không đúng định dạng')).toBeInTheDocument();
      expect(screen.getByText('Mật khẩu phải chứa ít nhất 10 ký tự')).toBeInTheDocument();
      expect(
        screen.getByText('Mật khẩu xác nhận không khớp với mật khẩu đã nhập'),
      ).toBeInTheDocument();
    });

    it('từ chối mật khẩu vượt quá 72 byte UTF-8 theo quy tắc BCrypt', async () => {
      render(
        <MemoryRouter>
          <RegisterPage />
        </MemoryRouter>,
      );

      const longPassword = 'a'.repeat(73);

      fireEvent.change(screen.getByLabelText(/Họ và tên/), { target: { value: 'Trần Văn B' } });
      fireEvent.change(screen.getByLabelText(/Địa chỉ email/), {
        target: { value: 'user@example.com' },
      });
      fireEvent.change(screen.getByLabelText(/^Mật khẩu/), { target: { value: longPassword } });
      fireEvent.change(screen.getByLabelText(/Xác nhận mật khẩu/), {
        target: { value: longPassword },
      });

      await user.click(screen.getByRole('button', { name: 'Đăng ký tài khoản' }));

      expect(screen.getByText(/Mật khẩu quá dài \(73 byte\)/)).toBeInTheDocument();
    });

    it('giao diện chỉ cho phép chọn CANDIDATE hoặc RECRUITER, không có tùy chọn ADMIN', () => {
      render(
        <MemoryRouter>
          <RegisterPage />
        </MemoryRouter>,
      );

      expect(screen.getByLabelText('Ứng viên tìm việc')).toBeInTheDocument();
      expect(screen.getByLabelText('Nhà tuyển dụng')).toBeInTheDocument();
      expect(screen.queryByLabelText(/Quản trị|Admin/i)).not.toBeInTheDocument();
    });

    it('hiển thị màn hình thành công hướng dẫn xác minh khi đăng ký hợp lệ', async () => {
      vi.spyOn(apiClient, 'post').mockResolvedValue({
        message: 'Đăng ký thành công',
      });

      render(
        <MemoryRouter>
          <RegisterPage />
        </MemoryRouter>,
      );

      fireEvent.change(screen.getByLabelText(/Họ và tên/), { target: { value: 'Nguyễn Văn A' } });
      fireEvent.change(screen.getByLabelText(/Địa chỉ email/), {
        target: { value: 'nguyenvana@example.com' },
      });
      fireEvent.change(screen.getByLabelText(/^Mật khẩu/), {
        target: { value: 'MatKhauHopLe123@' },
      });
      fireEvent.change(screen.getByLabelText(/Xác nhận mật khẩu/), {
        target: { value: 'MatKhauHopLe123@' },
      });

      await user.click(screen.getByRole('button', { name: 'Đăng ký tài khoản' }));

      await waitFor(() => {
        expect(screen.getByText('Đăng ký tài khoản thành công!')).toBeInTheDocument();
      });
      expect(screen.getByText(/nguyenvana@example.com/)).toBeInTheDocument();
    });
  });

  /* -------------------------------------------------------------------------- */
  /* FE09 (UI04): Đăng nhập tài khoản & Chống Open Redirect                     */
  /* -------------------------------------------------------------------------- */
  describe('FE09 - UI04 Đăng nhập tài khoản', () => {
    it('hiển thị lỗi chung khi thông tin đăng nhập sai (401)', async () => {
      vi.spyOn(apiClient, 'post').mockRejectedValue(
        new ApiException(401, {
          code: 'UNAUTHORIZED',
          message: 'Email hoặc mật khẩu không chính xác',
        }),
      );

      render(
        <AuthProvider skipAutoFetch={true}>
          <MemoryRouter>
            <LoginPage />
          </MemoryRouter>
        </AuthProvider>,
      );

      fireEvent.change(screen.getByLabelText(/Địa chỉ email/), {
        target: { value: 'user@example.com' },
      });
      fireEvent.change(screen.getByLabelText(/Mật khẩu/), { target: { value: 'MatKhauSai123@' } });
      await user.click(screen.getByRole('button', { name: 'Đăng nhập' }));

      await waitFor(() => {
        expect(screen.getByText('Email hoặc mật khẩu không chính xác')).toBeInTheDocument();
      });
    });

    it('chống open-redirect: lọc bỏ các URL nguy hiểm như //evil.com và quay về mặc định', async () => {
      vi.spyOn(apiClient, 'post').mockResolvedValue({
        userId: 'u1',
        email: 'user@example.com',
        fullName: 'Người dùng',
        roles: ['CANDIDATE'],
        status: 'ACTIVE',
      });
      vi.spyOn(apiClient, 'get').mockResolvedValue({
        userId: 'u1',
        email: 'user@example.com',
        fullName: 'Người dùng',
        roles: ['CANDIDATE'],
        status: 'ACTIVE',
        csrfToken: 'csrf-token',
      });

      render(
        <AuthProvider skipAutoFetch={true}>
          <MemoryRouter initialEntries={['/login?returnTo=//evil.com/phishing']}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/jobs" element={<div>Trang tìm việc an toàn</div>} />
            </Routes>
          </MemoryRouter>
        </AuthProvider>,
      );

      fireEvent.change(screen.getByLabelText(/Địa chỉ email/), {
        target: { value: 'user@example.com' },
      });
      fireEvent.change(screen.getByLabelText(/Mật khẩu/), { target: { value: 'MatKhauDung123@' } });
      await user.click(screen.getByRole('button', { name: 'Đăng nhập' }));

      await waitFor(() => {
        expect(screen.getByText('Trang tìm việc an toàn')).toBeInTheDocument();
      });
    });
  });

  /* -------------------------------------------------------------------------- */
  /* FE10 & FE11 (UI05): Xác thực Email                                         */
  /* -------------------------------------------------------------------------- */
  describe('FE10 & FE11 - UI05 Xác thực Email', () => {
    it('FE10 - kích hoạt tài khoản thành công khi token hợp lệ', async () => {
      vi.spyOn(apiClient, 'post').mockResolvedValue({
        message: 'Email verified successfully',
      });

      render(
        <MemoryRouter initialEntries={['/verify-email?token=valid-jwt-token-123']}>
          <VerifyEmailPage />
        </MemoryRouter>,
      );

      await waitFor(() => {
        expect(screen.getByText('Xác minh email thành công!')).toBeInTheDocument();
      });
      expect(screen.getByRole('button', { name: 'Đăng nhập ngay' })).toBeInTheDocument();
    });

    it('FE10 - hiển thị lỗi và nút gửi lại khi token không hợp lệ hoặc hết hạn', async () => {
      vi.spyOn(apiClient, 'post').mockRejectedValue(
        new ApiException(409, {
          code: 'TOKEN_INVALID',
          message: 'Liên kết xác minh không còn hiệu lực hoặc đã được sử dụng.',
        }),
      );

      render(
        <MemoryRouter initialEntries={['/verify-email?token=expired-token-456']}>
          <VerifyEmailPage />
        </MemoryRouter>,
      );

      await waitFor(() => {
        expect(screen.getByText('Xác minh không thành công')).toBeInTheDocument();
      });
      expect(screen.getByText(/Liên kết xác minh không còn hiệu lực/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Gửi lại email' })).toBeInTheDocument();
    });

    it('FE11 - tự động dọn token khỏi URL address bar để tránh rò rỉ qua Referer', async () => {
      const replaceStateSpy = vi.spyOn(window.history, 'replaceState');
      vi.spyOn(apiClient, 'post').mockResolvedValue({ message: 'OK' });

      render(
        <MemoryRouter initialEntries={['/verify-email?token=secret-token-xyz']}>
          <VerifyEmailPage />
        </MemoryRouter>,
      );

      await waitFor(() => {
        expect(replaceStateSpy).toHaveBeenCalledWith({}, expect.any(String), '/verify-email');
      });
    });
  });

  /* -------------------------------------------------------------------------- */
  /* FE12 (UI06): Quên & Đặt lại mật khẩu                                      */
  /* -------------------------------------------------------------------------- */
  describe('FE12 - UI06 Quên và Đặt lại mật khẩu', () => {
    it('chống dò quét tài khoản (anti-enumeration): hiển thị thông báo trung tính giống nhau', async () => {
      vi.spyOn(apiClient, 'post').mockResolvedValue({
        message:
          'Nếu email tồn tại trong hệ thống, hướng dẫn đặt lại mật khẩu đã được gửi đến hộp thư của bạn.',
      });

      render(
        <MemoryRouter>
          <ForgotPasswordPage />
        </MemoryRouter>,
      );

      fireEvent.change(screen.getByLabelText(/Địa chỉ email/), {
        target: { value: 'nonexistent@example.com' },
      });
      await user.click(screen.getByRole('button', { name: 'Gửi yêu cầu' }));

      await waitFor(() => {
        expect(
          screen.getByText(/Nếu email tồn tại trong hệ thống, hướng dẫn đặt lại mật khẩu/),
        ).toBeInTheDocument();
      });
    });

    it('đặt lại mật khẩu thành công thông báo thu hồi toàn bộ phiên cũ', async () => {
      const replaceStateSpy = vi.spyOn(window.history, 'replaceState');
      vi.spyOn(apiClient, 'post').mockResolvedValue({
        message: 'Mật khẩu đã được cập nhật thành công',
      });

      render(
        <MemoryRouter initialEntries={['/reset-password?token=valid-reset-token']}>
          <ResetPasswordPage />
        </MemoryRouter>,
      );

      expect(replaceStateSpy).toHaveBeenCalledWith({}, expect.any(String), '/reset-password');

      fireEvent.change(screen.getByLabelText(/^Mật khẩu mới/), {
        target: { value: 'MatKhauMoiSieuCap123@' },
      });
      fireEvent.change(screen.getByLabelText(/Xác nhận mật khẩu mới/), {
        target: { value: 'MatKhauMoiSieuCap123@' },
      });
      await user.click(screen.getByRole('button', { name: 'Lưu mật khẩu mới' }));

      await waitFor(() => {
        expect(screen.getByText('Đặt lại mật khẩu thành công!')).toBeInTheDocument();
      });
      expect(
        screen.getByText(/toàn bộ các phiên đăng nhập trước đó đã được thu hồi tự động/),
      ).toBeInTheDocument();
    });

    it('từ chối token hết hạn hoặc đã sử dụng khi đổi mật khẩu (409)', async () => {
      vi.spyOn(apiClient, 'post').mockRejectedValue(
        new ApiException(409, {
          code: 'TOKEN_INVALID',
          message: 'Liên kết đặt lại mật khẩu đã hết hạn hoặc đã được sử dụng.',
        }),
      );

      render(
        <MemoryRouter initialEntries={['/reset-password?token=used-token-789']}>
          <ResetPasswordPage />
        </MemoryRouter>,
      );

      fireEvent.change(screen.getByLabelText(/^Mật khẩu mới/), {
        target: { value: 'MatKhauMoi1234@' },
      });
      fireEvent.change(screen.getByLabelText(/Xác nhận mật khẩu mới/), {
        target: { value: 'MatKhauMoi1234@' },
      });
      await user.click(screen.getByRole('button', { name: 'Lưu mật khẩu mới' }));

      await waitFor(() => {
        expect(
          screen.getByText('Liên kết đặt lại mật khẩu đã hết hạn hoặc đã được sử dụng.'),
        ).toBeInTheDocument();
      });
    });
  });
});
