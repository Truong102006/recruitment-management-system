import React from 'react';
import { createBrowserRouter, Navigate, type RouteObject } from 'react-router-dom';
import { RecruiterLayout } from './layouts/recruiter-layout';
import { AdminLayout } from './layouts/admin-layout';
import { PublicLayout } from './layouts/public-layout';
import { CandidateLayout } from './layouts/candidate-layout';
import { ProtectedRoute } from '../components/auth/protected-route';
import { PublicOnlyRoute } from '../components/auth/public-only-route';
import { NotFoundPage } from '../components/errors/not-found-page';
import { ForbiddenPage } from '../components/errors/forbidden-page';

// FE1 Public & Auth Pages
import { LoginPage } from '../features/auth/login-page';
import { RegisterPage } from '../features/auth/register-page';
import { VerifyEmailPage } from '../features/auth/verify-email-page';
import { ForgotPasswordPage } from '../features/auth/forgot-password-page';
import { ResetPasswordPage } from '../features/auth/reset-password-page';

// FE1 Job & Candidate Pages
import { JobListPage } from '../features/jobs/job-list-page';
import { JobDetailPage } from '../features/jobs/job-detail-page';
import { ProfilePage } from '../features/profile/profile-page';
import { CvListPage } from '../features/cv/cv-list-page';
import { MyApplicationsPage } from '../features/applications/my-applications-page';
import { ApplicationDetailPage } from '../features/applications/application-detail-page';
import { SavedJobsPage } from '../features/saved-jobs/saved-jobs-page';
import { NotificationsPage } from '../features/notifications/notifications-page';

// FE2 Modular Routes
import { recruiterCompanyRoutes } from '../features/companies/recruiter-company.routes';
import { recruiterJobsRoutes } from '../features/jobs/recruiter-jobs.routes';
import { recruiterApplicationsRoutes } from '../features/applications/recruiter-applications.routes';
import { recruiterStatisticsRoutes } from '../features/statistics/recruiter-statistics.routes';
import {
  interviewLayoutRoutes,
  interviewStandaloneRoutes,
} from '../features/interviews/interview.routes';
import { adminRoutes } from '../features/admin/admin.routes';

const PublicHomePage: React.FC = () => (
  <div style={{ padding: '40px', textAlign: 'center' }}>
    <h1>Talento Recruitment Management System</h1>
    <p>Chào mừng đến với hệ thống quản lý tuyển dụng.</p>
    <div style={{ marginTop: '20px', display: 'flex', gap: '12px', justifyContent: 'center' }}>
      <a href="/jobs" className="btn primary">
        Tìm việc làm
      </a>
      <a href="/recruiter/jobs" className="btn">
        Khu vực Nhà tuyển dụng
      </a>
      <a href="/admin/companies" className="btn">
        Khu vực Quản trị
      </a>
    </div>
  </div>
);

export const routes: RouteObject[] = [
  // FE1: Public Shell & Auth Routes
  {
    element: <PublicLayout />,
    children: [
      {
        path: '/',
        element: <PublicHomePage />,
      },
      {
        path: '/jobs',
        element: <JobListPage />,
      },
      {
        path: '/jobs/:id',
        element: <JobDetailPage />,
      },
      {
        element: <PublicOnlyRoute />,
        children: [
          { path: '/login', element: <LoginPage /> },
          { path: '/register', element: <RegisterPage /> },
          { path: '/verify-email', element: <VerifyEmailPage /> },
          { path: '/forgot-password', element: <ForgotPasswordPage /> },
          { path: '/reset-password', element: <ResetPasswordPage /> },
        ],
      },
    ],
  },

  // FE1: Candidate Shell (Protected with CANDIDATE role)
  {
    element: <ProtectedRoute requiredRoles={['CANDIDATE']} />,
    children: [
      {
        element: <CandidateLayout />,
        children: [
          { path: '/candidate/applications', element: <MyApplicationsPage /> },
          { path: '/candidate/applications/:id', element: <ApplicationDetailPage /> },
          { path: '/candidate/profile', element: <ProfilePage /> },
          { path: '/candidate/cvs', element: <CvListPage /> },
          { path: '/candidate/saved-jobs', element: <SavedJobsPage /> },
          { path: '/notifications', element: <NotificationsPage /> },
        ],
      },
    ],
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

  // Common Error Routes
  {
    path: '/403',
    element: <ForbiddenPage />,
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
];

export const router = createBrowserRouter(routes);
