import React from 'react';
import type { RouteObject } from 'react-router-dom';

const RecruiterJobsListPage: React.FC = () => (
  <div data-testid="ui17-jobs-list">
    <h2>UI17: Danh sách Tin tuyển dụng</h2>
    <p>Quản lý toàn bộ tin tuyển dụng (nháp, công bố, đã đóng) của doanh nghiệp.</p>
  </div>
);

const RecruiterJobCreatePage: React.FC = () => (
  <div data-testid="ui18-job-create">
    <h2>UI18: Tạo mới Tin tuyển dụng</h2>
    <p>Lưu nháp hoặc công bố tin tuyển dụng mới.</p>
  </div>
);

const RecruiterJobEditPage: React.FC = () => (
  <div data-testid="ui18-job-edit">
    <h2>UI18: Chỉnh sửa Tin tuyển dụng</h2>
    <p>Cập nhật mô tả, mức lương, địa điểm, kỹ năng và thời hạn tuyển dụng.</p>
  </div>
);

export const recruiterJobsRoutes: RouteObject[] = [
  { path: 'jobs', element: <RecruiterJobsListPage /> },
  { path: 'jobs/new', element: <RecruiterJobCreatePage /> },
  { path: 'jobs/:id/edit', element: <RecruiterJobEditPage /> },
];
