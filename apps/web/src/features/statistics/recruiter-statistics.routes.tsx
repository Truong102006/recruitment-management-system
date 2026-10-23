import React from 'react';
import type { RouteObject } from 'react-router-dom';

const RecruiterStatisticsPage: React.FC = () => (
  <div data-testid="ui25-statistics">
    <h2>UI25: Thống kê Tuyển dụng</h2>
    <p>Biểu đồ phễu chuyển đổi (Funnel) và bảng số liệu tuyển dụng.</p>
  </div>
);

export const recruiterStatisticsRoutes: RouteObject[] = [
  { path: 'statistics', element: <RecruiterStatisticsPage /> },
];
