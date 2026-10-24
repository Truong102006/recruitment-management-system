import React from 'react';
import type { RouteObject } from 'react-router-dom';
import { InterviewListPage } from './pages/interview-list-page';
import { InterviewDetailPage } from './pages/interview-detail-page';
import { InterviewEvaluationPage } from './pages/interview-evaluation-page';
import { InterviewRoomPage } from './pages/interview-room-page';

export const interviewLayoutRoutes: RouteObject[] = [
  { path: '/interviews', element: <InterviewListPage /> },
  { path: '/interviews/:id', element: <InterviewDetailPage /> },
  { path: '/interviews/:id/evaluation', element: <InterviewEvaluationPage /> },
];

export const interviewStandaloneRoutes: RouteObject[] = [
  { path: '/interviews/:id/room', element: <InterviewRoomPage /> },
];

export const interviewRoutes: RouteObject[] = [
  ...interviewLayoutRoutes,
  ...interviewStandaloneRoutes,
];
