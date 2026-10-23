import React from 'react';
import type { RouteObject } from 'react-router-dom';
import { RecruiterJobsListPage } from './recruiter/pages/recruiter-jobs-list-page';
import { JobFormPage } from './recruiter/pages/job-form-page';

export const recruiterJobsRoutes: RouteObject[] = [
  { path: 'jobs', element: <RecruiterJobsListPage /> },
  { path: 'jobs/new', element: <JobFormPage /> },
  { path: 'jobs/:id/edit', element: <JobFormPage /> },
];
