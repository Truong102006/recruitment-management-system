import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { SavedJobsPage } from '../saved-jobs-page';
import { NotificationsPage } from '../../notifications/notifications-page';
import { apiClient } from '../../../lib/http/api-client';
import type { PageResponse, SavedJobDto } from '@rms/contracts/public';

describe('FE1 Saved Jobs and Notifications (UI12, UI24, FE22, FE37)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  /* -------------------------------------------------------------------------- */
  /* FE22 - UI12: Tin đã lưu chuyển CLOSED                                      */
  /* -------------------------------------------------------------------------- */
  it('FE22: tin đã lưu chuyển sang trạng thái CLOSED hiển thị nhãn Đóng và không cho ứng tuyển', async () => {
    const mockSavedJobs: SavedJobDto[] = [
      {
        jobId: 'job-closed-1',
        savedAt: '2026-01-01T00:00:00Z',
        available: false,
        acceptingApplications: false,
        title: 'Backend Engineer (Đã đóng)',
      },
    ];

    vi.spyOn(apiClient, 'get').mockResolvedValue({
      data: mockSavedJobs,
      meta: { page: 1, pageSize: 20, total: 1 },
    } as PageResponse<SavedJobDto>);

    render(
      <MemoryRouter>
        <SavedJobsPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('Backend Engineer (Đã đóng)')).toBeInTheDocument();
      expect(screen.getByText('Đã đóng')).toBeInTheDocument();
    });

    // Nút ứng tuyển bị vô hiệu hóa
    const applyBtn = screen.getByRole('button', { name: 'Đã đóng nhận hồ sơ' });
    expect(applyBtn).toBeDisabled();

    // Bỏ lưu tin
    const deleteSpy = vi.spyOn(apiClient, 'delete').mockResolvedValue(undefined);
    fireEvent.click(screen.getByRole('button', { name: 'Bỏ lưu' }));

    await waitFor(() => {
      expect(deleteSpy).toHaveBeenCalledWith('/api/saved-jobs/job-closed-1');
      expect(screen.queryByText('Backend Engineer (Đã đóng)')).not.toBeInTheDocument();
    });
  });

  /* -------------------------------------------------------------------------- */
  /* FE37 - UI24: Thông báo hệ thống và xử lý quyền hạn bị thu hồi               */
  /* -------------------------------------------------------------------------- */
  it('FE37: bấm vào thông báo đánh dấu đã đọc; đích ngoài phạm vi hiển thị giải thích chung', async () => {
    const mockNotifs = [
      {
        id: 'notif-1',
        title: 'Thông báo bình thường',
        message: 'Nội dung thông báo công việc',
        targetUrl: '/jobs/job-1',
        read: false,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'notif-revoked',
        title: 'Thông báo quyền bị thu hồi',
        message: 'Tài nguyên đã bị xóa hoặc thu hồi',
        targetUrl: '/recruiter/company/revoked-resource',
        read: false,
        createdAt: new Date().toISOString(),
      },
    ];

    vi.spyOn(apiClient, 'get').mockResolvedValue(mockNotifs);
    const patchSpy = vi.spyOn(apiClient, 'patch').mockResolvedValue(undefined);

    render(
      <MemoryRouter initialEntries={['/notifications']}>
        <Routes>
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/jobs/job-1" element={<div>Trang Chi Tiết Việc Làm</div>} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('Thông báo bình thường')).toBeInTheDocument();
      expect(screen.getByText('Thông báo quyền bị thu hồi')).toBeInTheDocument();
    });

    // 1. Click vào thông báo revoked -> hiện giải thích thân thiện không tìm thấy/không có quyền (FE37)
    fireEvent.click(screen.getByText('Thông báo quyền bị thu hồi'));

    await waitFor(() => {
      expect(patchSpy).toHaveBeenCalledWith('/api/notifications/notif-revoked/read');
      expect(
        screen.getByText(/Tài nguyên đích liên kết với thông báo này không còn khả dụng/),
      ).toBeInTheDocument();
    });

    // 2. Click vào thông báo hợp lệ -> chuyển hướng thành công
    fireEvent.click(screen.getByText('Thông báo bình thường'));

    await waitFor(() => {
      expect(patchSpy).toHaveBeenCalledWith('/api/notifications/notif-1/read');
      expect(screen.getByText('Trang Chi Tiết Việc Làm')).toBeInTheDocument();
    });
  });
});
