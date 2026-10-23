import React from 'react';
import type { RouteObject } from 'react-router-dom';

const RecruiterApplicationsListPage: React.FC = () => (
  <div data-testid="ui19-applications-list">
    <h2>UI19: Danh sách Hồ sơ Tuyển dụng</h2>
    <p>Quản lý và sàng lọc ứng viên theo từng vị trí và trạng thái.</p>
  </div>
);

const RecruiterApplicationDetailPage: React.FC = () => (
  <div data-testid="ui20-application-detail">
    <h2>UI20: Chi tiết Xử lý Hồ sơ</h2>
    <p>Trung tâm xét duyệt, xem snapshot CV, duyệt đề nghị đổi CV và công bố kết quả.</p>
  </div>
);

export const recruiterApplicationsRoutes: RouteObject[] = [
  { path: 'applications', element: <RecruiterApplicationsListPage /> },
  { path: 'applications/:id', element: <RecruiterApplicationDetailPage /> },
];
