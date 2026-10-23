import React from 'react';
import type { RouteObject } from 'react-router-dom';
import { CompanyDetailPage } from './pages/company-detail-page';
import { CompanyMembersPage } from './pages/company-members-page';

export const recruiterCompanyRoutes: RouteObject[] = [
  { path: 'company', element: <CompanyDetailPage /> },
  { path: 'members', element: <CompanyMembersPage /> },
];
