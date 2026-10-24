import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { RecruiterLayout } from './layouts/recruiter-layout';
import { AdminLayout } from './layouts/admin-layout';
import { recruiterCompanyRoutes } from '../features/companies/recruiter-company.routes';
import { recruiterJobsRoutes } from '../features/jobs/recruiter-jobs.routes';
import { recruiterApplicationsRoutes } from '../features/applications/recruiter-applications.routes';
import { recruiterStatisticsRoutes } from '../features/statistics/recruiter-statistics.routes';
import {
  interviewLayoutRoutes,
  interviewStandaloneRoutes,
} from '../features/interviews/interview.routes';
import { adminRoutes } from '../features/admin/admin.routes';

// Placeholders for FE1 public and candidate routes to guarantee non-breaking integration
const PublicHomePage: React.FC = () => (
  <div style={{ padding: '40px', textAlign: 'center' }}>
    <h1>Talento Recruitment Management System</h1>
    <p>Chào mừng đến với hệ thống quản lý tuyển dụng.</p>
    <div style={{ marginTop: '20px', display: 'flex', gap: '12px', justifyContent: 'center' }}>
      <a href="/recruiter/jobs" className="btn primary">
        Khu vực Nhà tuyển dụng
      </a>
      <a href="/admin/companies" className="btn">
        Khu vực Quản trị
      </a>
    </div>
  </div>
);

const NotFoundPage: React.FC = () => (
  <div style={{ padding: '40px', textAlign: 'center' }}>
    <h2>404 - Không tìm thấy trang</h2>
    <p>Đường dẫn bạn yêu cầu không tồn tại hoặc bạn không có quyền truy cập.</p>
    <a href="/" className="btn" style={{ marginTop: '16px', display: 'inline-block' }}>
      Về trang chủ
    </a>
  </div>
);

export const router = createBrowserRouter([
  {
    path: '/',
    element: <PublicHomePage />,
  },
  // FE2: Recruiter Shell & Features (including Interviews & Evaluations)
  {
    element: <RecruiterLayout />,
    children: [
      {
        path: '/recruiter',
        children: [
          { index: true, element: <Navigate to="/recruiter/jobs" replace /> },
          ...recruiterCompanyRoutes,
          ...recruiterJobsRoutes,
          ...recruiterApplicationsRoutes,
          ...recruiterStatisticsRoutes,
        ],
      },
      ...interviewLayoutRoutes,
    ],
  },
  // FE2: Admin Shell & Features (/admin/*)
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      { index: true, element: <Navigate to="/admin/companies" replace /> },
      ...adminRoutes,
    ],
  },
  // FE2: Standalone Video Room (Full-screen WebRTC room, no sidebar)
  ...interviewStandaloneRoutes,
  // 404 Fallback
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);
