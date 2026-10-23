import React from 'react';
import type { RouteObject } from 'react-router-dom';
import { RecruiterApplicationsListPage } from './pages/recruiter-applications-list-page';
import { RecruiterApplicationDetailPage } from './pages/recruiter-application-detail-page';

export const recruiterApplicationsRoutes: RouteObject[] = [
  { path: 'applications', element: <RecruiterApplicationsListPage /> },
  { path: 'applications/:id', element: <RecruiterApplicationDetailPage /> },
];
