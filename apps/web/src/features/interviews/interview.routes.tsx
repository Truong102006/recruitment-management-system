import React from 'react';
import type { RouteObject } from 'react-router-dom';
import { InterviewListPage } from './pages/interview-list-page';
import { InterviewDetailPage } from './pages/interview-detail-page';
import { InterviewEvaluationPage } from './pages/interview-evaluation-page';
import { InterviewRoomPage } from './pages/interview-room-page';
import { ProtectedRoute } from '../../components/auth/protected-route';

export const interviewLayoutRoutes: RouteObject[] = [
  { path: '/interviews', element: <InterviewListPage /> },
  { path: '/interviews/:id', element: <InterviewDetailPage /> },
  {
    path: '/interviews/:id/evaluation',
    element: (
      <ProtectedRoute requiredRoles={['INTERVIEWER']}>
        <InterviewEvaluationPage />
      </ProtectedRoute>
    ),
  },
];

export const interviewStandaloneRoutes: RouteObject[] = [
  {
    path: '/interviews/:id/room',
    element: (
      <ProtectedRoute requiredRoles={['CANDIDATE', 'RECRUITER', 'INTERVIEWER']}>
        <InterviewRoomPage />
      </ProtectedRoute>
    ),
  },
];

export const interviewRoutes: RouteObject[] = [
  ...interviewLayoutRoutes,
  ...interviewStandaloneRoutes,
];
