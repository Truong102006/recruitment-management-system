import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ProfilePage } from '../profile-page';
import { CvListPage } from '../../cv/cv-list-page';
import { apiClient, ApiException } from '../../../lib/http/api-client';
import * as cvApi from '../../cv/candidate-cv.api';

describe('FE1 Profile and CV Management (UI07, UI08, FE13 - FE16)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  /* -------------------------------------------------------------------------- */
  /* FE13 - UI07: Sửa profile, API 409 xung đột phiên bản                       */
  /* -------------------------------------------------------------------------- */
  it('FE13: sửa profile gặp lỗi 409 thì giữ nguyên dữ liệu vừa nhập, không tự ghi đè', async () => {
    vi.spyOn(apiClient, 'get').mockImplementation(async (url: string) => {
      if (url.includes('/api/candidate/profile')) {
        return {
          name: 'Nguyễn Văn Cũ',
          email: 'test@example.com',
          phone: '0901111111',
          headline: 'Junior Dev',
          summary: 'Kinh nghiệm 1 năm',
          location: 'Hà Nội',
          skillIds: ['s1'],
          version: 1,
        };
      }
      if (url.includes('/api/skills')) {
        return [{ id: 's1', name: 'React', active: true }];
      }
      return {};
    });

    // Mock 409 Conflict error on patch
    vi.spyOn(apiClient, 'patch').mockRejectedValue(
      new ApiException(409, {
        code: 'VERSION_CONFLICT',
        message: 'Phiên bản không khớp',
      }),
    );

    render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('Nguyễn Văn Cũ')).toBeInTheDocument();
    });

    // Nhập tên mới
    const nameInput = screen.getByLabelText(/Họ và tên/);
    fireEvent.change(nameInput, { target: { value: 'Nguyễn Văn Mới Đang Sửa' } });

    // Bấm lưu thay đổi
    const submitBtn = screen.getByRole('button', { name: 'Lưu thay đổi' });
    fireEvent.click(submitBtn);

    // Kiểm tra thông báo xung đột xuất hiện
    await waitFor(() => {
      expect(
        screen.getByText(/Hồ sơ của bạn đã được cập nhật từ một phiên khác \(Xung đột phiên bản\)/),
      ).toBeInTheDocument();
    });

    // Dữ liệu vừa nhập vẫn được giữ nguyên trong input (FE13)
    expect(screen.getByDisplayValue('Nguyễn Văn Mới Đang Sửa')).toBeInTheDocument();
  });

  /* -------------------------------------------------------------------------- */
  /* FE14 - UI08: Upload PDF hợp lệ hiển thị SCANNING                           */
  /* -------------------------------------------------------------------------- */
  it('FE14: upload PDF hợp lệ hiển thị trạng thái SCANNING trong danh sách', async () => {
    const mockCvItem: cvApi.CvDto = {
      id: 'cv-new-1',
      fileName: 'MyNewResume.pdf',
      fileSize: 1024 * 500,
      fileUrl: '/mock/cv.pdf',
      status: 'SCANNING',
      isDefault: false,
      uploadedAt: new Date().toISOString(),
      applicationCount: 0,
    };

    vi.spyOn(cvApi, 'listCandidateCvs').mockResolvedValue([]);
    vi.spyOn(cvApi, 'uploadCandidateCv').mockResolvedValue(mockCvItem);

    render(
      <MemoryRouter>
        <CvListPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('Bạn chưa tải lên bản CV nào')).toBeInTheDocument();
    });

    const file = new File(['dummy content'], 'MyNewResume.pdf', { type: 'application/pdf' });
    const input = screen.getByLabelText('Tải lên tệp CV PDF');
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText('MyNewResume.pdf')).toBeInTheDocument();
      expect(screen.getByText('SCANNING')).toBeInTheDocument();
    });
  });

  /* -------------------------------------------------------------------------- */
  /* FE15 - UI08: Kiểm tra tệp quá cỡ, sai loại hoặc có mật khẩu               */
  /* -------------------------------------------------------------------------- */
  it('FE15: từ chối tệp không phải PDF, tệp quá 5MB và PDF có mật khẩu', async () => {
    vi.spyOn(cvApi, 'listCandidateCvs').mockResolvedValue([]);

    render(
      <MemoryRouter>
        <CvListPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('Bạn chưa tải lên bản CV nào')).toBeInTheDocument();
    });

    const input = screen.getByLabelText('Tải lên tệp CV PDF');

    // 1. Tệp không phải PDF
    const wordFile = new File(['word content'], 'MyResume.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    fireEvent.change(input, { target: { files: [wordFile] } });

    await waitFor(() => {
      expect(
        screen.getByText('Định dạng tệp không hợp lệ. Hệ thống chỉ chấp nhận tệp định dạng PDF.'),
      ).toBeInTheDocument();
    });

    // 2. Tệp PDF vượt quá 5MB
    const bigFile = new File([new Uint8Array(6 * 1024 * 1024)], 'BigResume.pdf', {
      type: 'application/pdf',
    });
    fireEvent.change(input, { target: { files: [bigFile] } });

    await waitFor(() => {
      expect(
        screen.getByText('Kích thước tệp vượt quá giới hạn cho phép (tối đa 5MB).'),
      ).toBeInTheDocument();
    });

    // 3. Tệp PDF có mật khẩu
    const passwordFile = new File(['encrypted pdf'], 'password-protected-resume.pdf', {
      type: 'application/pdf',
    });
    fireEvent.change(input, { target: { files: [passwordFile] } });

    await waitFor(() => {
      expect(
        screen.getByText(
          'Tệp PDF được bảo vệ bằng mật khẩu. Vui lòng gỡ mật khẩu trước khi tải lên.',
        ),
      ).toBeInTheDocument();
    });
  });

  /* -------------------------------------------------------------------------- */
  /* FE16 - UI08: Xóa CV đang tham chiếu và CV không tham chiếu                */
  /* -------------------------------------------------------------------------- */
  it('FE16: không cho xóa CV đang được sử dụng trong hồ sơ ứng tuyển hoạt động', async () => {
    const mockCvs: cvApi.CvDto[] = [
      {
        id: 'cv-used-1',
        fileName: 'Resume_In_Use.pdf',
        fileSize: 1024 * 1024,
        fileUrl: '/cv/1.pdf',
        status: 'ACTIVE',
        isDefault: true,
        uploadedAt: '2026-01-01T00:00:00Z',
        applicationCount: 3, // In use
      },
    ];

    vi.spyOn(cvApi, 'listCandidateCvs').mockResolvedValue(mockCvs);

    render(
      <MemoryRouter>
        <CvListPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('Resume_In_Use.pdf')).toBeInTheDocument();
    });

    // Bấm nút Xóa
    const deleteBtn = screen.getByRole('button', { name: 'Xóa' });
    fireEvent.click(deleteBtn);

    // Kiểm tra thông báo giải thích lý do không thể xóa
    await waitFor(() => {
      expect(
        screen.getByText(
          'Không thể xóa CV "Resume_In_Use.pdf" vì đang được sử dụng trong 3 hồ sơ ứng tuyển đang hoạt động.',
        ),
      ).toBeInTheDocument();
    });
  });

  it('FE16: xóa thành công CV không bị tham chiếu và CV biến mất khỏi danh sách', async () => {
    const mockCvs: cvApi.CvDto[] = [
      {
        id: 'cv-unused-1',
        fileName: 'Old_Resume_Unused.pdf',
        fileSize: 1024 * 500,
        fileUrl: '/cv/2.pdf',
        status: 'ACTIVE',
        isDefault: false,
        uploadedAt: '2026-01-01T00:00:00Z',
        applicationCount: 0, // Not in use
      },
    ];

    vi.spyOn(cvApi, 'listCandidateCvs').mockResolvedValue(mockCvs);
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const deleteSpy = vi.spyOn(cvApi, 'deleteCandidateCv').mockResolvedValue(undefined);

    render(
      <MemoryRouter>
        <CvListPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('Old_Resume_Unused.pdf')).toBeInTheDocument();
    });

    const deleteBtn = screen.getByRole('button', { name: 'Xóa' });
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(deleteSpy).toHaveBeenCalledWith('cv-unused-1');
      expect(screen.queryByText('Old_Resume_Unused.pdf')).not.toBeInTheDocument();
      expect(screen.getByText('Đã xóa thành công CV "Old_Resume_Unused.pdf".')).toBeInTheDocument();
    });
  });
});
