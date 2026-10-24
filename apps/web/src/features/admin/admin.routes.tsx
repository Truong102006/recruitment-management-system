import React from 'react';
import type { RouteObject } from 'react-router-dom';
import { AdminCompaniesPage } from './pages/admin-companies-page';
import { AdminUsersPage } from './pages/admin-users-page';
import { AdminJobsPage } from './pages/admin-jobs-page';
import { AdminAuditPage } from './pages/admin-audit-page';
import { AdminEventsPage } from './pages/admin-events-page';

export const adminRoutes: RouteObject[] = [
  { path: 'companies', element: <AdminCompaniesPage /> },
  { path: 'users', element: <AdminUsersPage /> },
  { path: 'jobs', element: <AdminJobsPage /> },
  { path: 'audit', element: <AdminAuditPage /> },
  { path: 'events', element: <AdminEventsPage /> },
];
