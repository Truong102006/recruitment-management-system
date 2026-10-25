import React, { useState } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../button';
import { Input } from '../input';
import { StatusBadge } from '../status-badge';
import { Dialog } from '../dialog';
import { Alert } from '../alert';

describe('Shared UI Form Controls', () => {
  describe('Button', () => {
    it('render nội dung và phản hồi sự kiện click', async () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Lưu thay đổi</Button>);

      const button = screen.getByRole('button', { name: 'Lưu thay đổi' });
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('type', 'button');

      await userEvent.click(button);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('vô hiệu hóa và hiển thị trạng thái aria-busy khi isLoading=true', async () => {
      const handleClick = vi.fn();
      render(
        <Button isLoading onClick={handleClick}>
          Đang gửi
        </Button>,
      );

      const button = screen.getByRole('button', { name: 'Đang gửi' });
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('aria-busy', 'true');

      await userEvent.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Input', () => {
    it('kết nối label với input và cho phép nhập văn bản', async () => {
      render(<Input label="Email ứng viên" placeholder="name@example.com" />);

      const input = screen.getByLabelText('Email ứng viên');
      expect(input).toBeInTheDocument();

      await userEvent.type(input, 'test@example.com');
      expect(input).toHaveValue('test@example.com');
    });

    it('hiển thị lỗi với role="alert" và liên kết aria-describedby', () => {
      render(<Input label="Mật khẩu" error="Mật khẩu phải từ 10 ký tự trở lên" />);

      const input = screen.getByLabelText(/Mật khẩu/);
      expect(input).toHaveAttribute('aria-invalid', 'true');

      const errorMessage = screen.getByRole('alert');
      expect(errorMessage).toHaveTextContent('Mật khẩu phải từ 10 ký tự trở lên');
      expect(input).toHaveAttribute('aria-describedby', expect.stringContaining(errorMessage.id));
    });
  });

  describe('StatusBadge', () => {
    it('render nhãn trạng thái với nội dung văn bản ngữ nghĩa', () => {
      render(<StatusBadge variant="APPROVED">Đã được duyệt</StatusBadge>);
      expect(screen.getByText('Đã được duyệt')).toBeInTheDocument();
    });
  });

  describe('Alert', () => {
    it('gán role="alert" cho variant error và role="status" cho variant info', () => {
      const { rerender } = render(<Alert variant="error">Có lỗi xảy ra</Alert>);
      expect(screen.getByRole('alert')).toHaveTextContent('Có lỗi xảy ra');

      rerender(<Alert variant="info">Thông tin quan trọng</Alert>);
      expect(screen.getByRole('status')).toHaveTextContent('Thông tin quan trọng');
    });
  });

  describe('Dialog', () => {
    function TestDialogWrapper() {
      const [isOpen, setIsOpen] = useState(true);
      return (
        <div>
          <button type="button" onClick={() => setIsOpen(true)}>
            Mở hộp thoại
          </button>
          <Dialog
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
            title="Xác nhận ứng tuyển"
            description="Vui lòng kiểm tra kỹ CV đã chọn"
          >
            <div>
              <p>Nội dung xác nhận</p>
              <button type="button" onClick={() => setIsOpen(false)}>
                Hủy
              </button>
              <button type="button">Xác nhận nộp</button>
            </div>
          </Dialog>
        </div>
      );
    }

    it('mở dialog với role="dialog", aria-modal="true" và xử lý phím Escape để đóng', async () => {
      render(<TestDialogWrapper />);

      const dialog = screen.getByRole('dialog', { name: 'Xác nhận ứng tuyển' });
      expect(dialog).toBeInTheDocument();
      expect(dialog).toHaveAttribute('aria-modal', 'true');

      // Press Escape key
      await userEvent.keyboard('{Escape}');
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('bẫy tiêu điểm (focus trap) bên trong dialog khi nhấn Tab', async () => {
      const user = userEvent.setup();
      render(<TestDialogWrapper />);

      const closeButton = screen.getByRole('button', { name: 'Đóng hộp thoại' });
      const cancelButton = screen.getByRole('button', { name: 'Hủy' });
      const submitButton = screen.getByRole('button', { name: 'Xác nhận nộp' });

      // Focus close button
      closeButton.focus();
      expect(closeButton).toHaveFocus();

      await user.tab();
      expect(cancelButton).toHaveFocus();

      await user.tab();
      expect(submitButton).toHaveFocus();

      // Tab on last element wraps around to first element
      await user.tab();
      expect(closeButton).toHaveFocus();

      // Shift+Tab on first element wraps around to last element
      await user.tab({ shift: true });
      expect(submitButton).toHaveFocus();
    });
  });
});
