import React, { useState } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ErrorBoundary } from '../error-boundary';
import { NotFoundPage } from '../not-found-page';
import { ForbiddenPage } from '../forbidden-page';
import { ServerErrorPage } from '../server-error-page';

function FaultyComponent({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error(
      'Test component crashed with sensitive DB query details: SELECT * FROM secrets',
    );
  }
  return <div>Component hoạt động bình thường</div>;
}

describe('UI29 Error States & Error Boundary', () => {
  it('bắt lỗi render bằng ErrorBoundary, hiển thị giao diện thân thiện và không để lộ stack trace', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    function TestHost() {
      const [shouldThrow, setShouldThrow] = useState(true);
      return (
        <div>
          <ErrorBoundary>
            <FaultyComponent shouldThrow={shouldThrow} />
          </ErrorBoundary>
          <button type="button" onClick={() => setShouldThrow(false)}>
            Sửa lỗi
          </button>
        </div>
      );
    }

    render(<TestHost />);

    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(screen.getByText('Đã xảy ra lỗi không mong muốn')).toBeInTheDocument();
    expect(screen.queryByText(/SELECT \* FROM secrets/)).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Sửa lỗi' }));
    await userEvent.click(screen.getByRole('button', { name: 'Thử lại' }));

    expect(screen.getByText('Component hoạt động bình thường')).toBeInTheDocument();
    consoleSpy.mockRestore();
  });

  it('NotFoundPage (404) hiển thị tiêu đề và liên kết quay về tìm việc', () => {
    render(
      <MemoryRouter>
        <NotFoundPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole('heading', { level: 1, name: 'Không tìm thấy trang' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Về trang tìm việc' })).toBeInTheDocument();
  });

  it('ForbiddenPage (403) hiển thị thông báo truy cập bị từ chối', () => {
    render(
      <MemoryRouter>
        <ForbiddenPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole('heading', { level: 1, name: 'Truy cập bị từ chối' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Về trang tìm việc' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Đổi tài khoản' })).toBeInTheDocument();
  });

  it('ServerErrorPage (500) hiển thị mã tra soát traceId và phản hồi nút Thử lại', async () => {
    const handleRetry = vi.fn();
    render(
      <ServerErrorPage
        status={500}
        message="Hệ thống tạm thời quá tải"
        traceId="trace-abc-123"
        onRetry={handleRetry}
      />,
    );

    expect(screen.getByRole('heading', { level: 1, name: 'Lỗi hệ thống' })).toBeInTheDocument();
    expect(screen.getByText('Hệ thống tạm thời quá tải')).toBeInTheDocument();
    expect(screen.getByText(/Mã tra soát \(Trace ID\): trace-abc-123/)).toBeInTheDocument();

    const retryBtn = screen.getByRole('button', { name: 'Thử lại' });
    await userEvent.click(retryBtn);
    expect(handleRetry).toHaveBeenCalledTimes(1);
  });
});
