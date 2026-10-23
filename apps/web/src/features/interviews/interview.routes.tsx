import React from 'react';
import type { RouteObject } from 'react-router-dom';

const InterviewListPage: React.FC = () => (
  <div data-testid="ui13-interviews">
    <h2>UI13: Lịch phỏng vấn của tôi</h2>
    <p>Chế độ xem lịch cá nhân (Calendar & Agenda) cho cả ứng viên và người phỏng vấn.</p>
  </div>
);

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

const InterviewEvaluationPage: React.FC = () => (
  <div data-testid="ui22-interview-evaluation">
    <h2>UI22: Phiếu đánh giá của Interviewer</h2>
    <p>Chấm điểm 1-5 và ghi chú nội bộ sau buổi phỏng vấn.</p>
  </div>
);

export const interviewRoutes: RouteObject[] = [
  { path: '/interviews', element: <InterviewListPage /> },
  { path: '/interviews/:id', element: <InterviewDetailPage /> },
  { path: '/interviews/:id/room', element: <InterviewRoomPage /> },
  { path: '/interviews/:id/evaluation', element: <InterviewEvaluationPage /> },
];
