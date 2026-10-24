import React from 'react';
import type { RouteObject } from 'react-router-dom';
import { InterviewListPage } from './pages/interview-list-page';
import { InterviewEvaluationPage } from './pages/interview-evaluation-page';

const InterviewDetailPage: React.FC = () => (
  <div data-testid="ui14-interview-detail">
    <h2>UI14: Chi tiết Lịch & Chuẩn bị phòng</h2>
    <p>Thông tin người tham gia, đếm ngược và kiểm tra quyền vào phòng họp.</p>
  </div>
);

const InterviewRoomPage: React.FC = () => (
  <div data-testid="ui15-interview-room">
    <h2>UI15: Phòng phỏng vấn trực tuyến Jitsi</h2>
    <p>Phòng họp WebRTC video call an toàn.</p>
  </div>
);

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
