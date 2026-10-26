import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { CareerHandbookPage } from './career-handbook-page';

describe('CareerHandbookPage (Matching Hình 3)', () => {
  it('renders default category "Định hướng nghề nghiệp" with hero, pills, and breadcrumbs', () => {
    render(
      <MemoryRouter initialEntries={['/blog/huong-nghiep']}>
        <Routes>
          <Route path="/blog/:categorySlug" element={<CareerHandbookPage />} />
        </Routes>
      </MemoryRouter>,
    );

    // Hero title & description
    expect(screen.getByRole('heading', { level: 1, name: 'Định hướng nghề nghiệp' })).toBeInTheDocument();
    expect(
      screen.getByText(
        'Chia sẻ thông tin và kiến thức cần thiết giúp bạn sớm định hướng được nghề nghiệp, tìm được công việc phù hợp với sở thích và năng lực của bản thân.',
      ),
    ).toBeInTheDocument();

    // Mascot
    expect(screen.getByLabelText('Linh vật Cẩm nang nghề nghiệp')).toBeInTheDocument();

    // Breadcrumbs
    expect(screen.getByText('Trang chủ')).toBeInTheDocument();
    expect(screen.getByText('Cẩm nang nghề nghiệp')).toBeInTheDocument();

    // Pills for other categories
    expect(screen.getByRole('button', { name: 'Bí kíp tìm việc' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Chế độ lương thưởng' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Kiến thức chuyên ngành' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Hành trang nghề nghiệp' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Thị trường và xu hướng tuyển dụng' })).toBeInTheDocument();

    // Section "Bài viết nổi bật"
    expect(screen.getByRole('heading', { level: 2, name: 'Bài viết nổi bật' })).toBeInTheDocument();
  });

  it('opens article reader modal when clicking on an article card', () => {
    render(
      <MemoryRouter initialEntries={['/blog/huong-nghiep']}>
        <Routes>
          <Route path="/blog/:categorySlug" element={<CareerHandbookPage />} />
        </Routes>
      </MemoryRouter>,
    );

    // Click on featured article
    const articleTitle = screen.getByText(
      'Nhân viên bán hàng là gì? Bảng mô tả công việc nhân viên bán hàng',
    );
    fireEvent.click(articleTitle);

    // Modal dialog is open
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByLabelText('Đóng bài viết')).toBeInTheDocument();
    expect(screen.getByText('Hoàn tất đọc')).toBeInTheDocument();

    // Close modal
    fireEvent.click(screen.getByLabelText('Đóng bài viết'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
