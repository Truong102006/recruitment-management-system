import React from 'react';
import type { RouteObject } from 'react-router-dom';
import { RecruiterStatisticsPage } from './pages/recruiter-statistics-page';

export const recruiterStatisticsRoutes: RouteObject[] = [
  { path: 'statistics', element: <RecruiterStatisticsPage /> },
];
