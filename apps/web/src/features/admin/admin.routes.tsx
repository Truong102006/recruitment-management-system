import React from 'react';
import type { RouteObject } from 'react-router-dom';

const AdminCompaniesPage: React.FC = () => (
  <div data-testid="ui26-admin-companies">
    <h2>UI26: Kiểm duyệt Doanh nghiệp</h2>
    <p>Phê duyệt, đình chỉ và khôi phục Owner cho doanh nghiệp.</p>
  </div>
);

const AdminUsersPage: React.FC = () => (
  <div data-testid="ui27-admin-users">
    <h2>UI27: Quản trị Tài khoản</h2>
    <p>Khóa và mở khóa tài khoản vi phạm.</p>
  </div>
);

const AdminJobsPage: React.FC = () => (
  <div data-testid="ui27-admin-jobs">
    <h2>UI27: Kiểm duyệt Tin tuyển dụng</h2>
    <p>Đóng các tin tuyển dụng vi phạm chính sách.</p>
  </div>
);

const AdminAuditPage: React.FC = () => (
  <div data-testid="ui28-admin-audit">
    <h2>UI28: Nhật ký Audit</h2>
    <p>Tra cứu lịch sử thao tác toàn hệ thống.</p>
  </div>
);

const AdminEventsPage: React.FC = () => (
  <div data-testid="ui28-admin-events">
    <h2>UI28: Sự kiện Outbox lỗi</h2>
    <p>Giám sát và kích hoạt Retry cho các sự kiện FAILED.</p>
  </div>
);

export const adminRoutes: RouteObject[] = [
  { path: 'companies', element: <AdminCompaniesPage /> },
  { path: 'users', element: <AdminUsersPage /> },
  { path: 'jobs', element: <AdminJobsPage /> },
  { path: 'audit', element: <AdminAuditPage /> },
  { path: 'events', element: <AdminEventsPage /> },
];
