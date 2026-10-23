import React from 'react';
import type { RouteObject } from 'react-router-dom';

const RecruiterCompanyPage: React.FC = () => (
  <div data-testid="ui16-company">
    <h2>UI16: Thông tin Doanh nghiệp</h2>
    <p>Cập nhật hồ sơ công ty và cấu hình tuyển dụng.</p>
  </div>
);

const RecruiterMembersPage: React.FC = () => (
  <div data-testid="ui16-members">
    <h2>UI16: Quản lý Thành viên</h2>
    <p>Danh sách thành viên, phân quyền RECRUITER/INTERVIEWER và chuyển giao OWNER.</p>
  </div>
);

export const recruiterCompanyRoutes: RouteObject[] = [
  { path: 'company', element: <RecruiterCompanyPage /> },
  { path: 'members', element: <RecruiterMembersPage /> },
];
