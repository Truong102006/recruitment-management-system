import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { InterviewQuestionsPage } from './interview-questions-page';
import { MbtiTestPage } from './mbti-test-page';
import { SkillsPage } from './skills-page';

describe('Tools Pages Suite', () => {
  it('renders InterviewQuestionsPage and filters by category', () => {
    render(
      <MemoryRouter>
        <InterviewQuestionsPage />
      </MemoryRouter>,
    );

    expect(screen.getByText('Bộ câu hỏi phỏng vấn chuẩn chuyên môn')).toBeInTheDocument();
    expect(screen.getByText('MỚI')).toBeInTheDocument();

    // Default question is displayed
    expect(
      screen.getByText('Hãy giải thích cơ chế hoạt động của Database Index (B-Tree) và khi nào không nên đánh index?'),
    ).toBeInTheDocument();

    // Click filter Frontend
    const feBtn = screen.getByRole('button', { name: 'Frontend' });
    fireEvent.click(feBtn);

    expect(
      screen.getByText('Sự khác biệt giữa Virtual DOM và Real DOM trong React là gì? React xử lý cập nhật giao diện như thế nào?'),
    ).toBeInTheDocument();
  });

  it('renders MbtiTestPage and computes result after answering quiz', () => {
    render(
      <MemoryRouter>
        <MbtiTestPage />
      </MemoryRouter>,
    );

    expect(screen.getByText('Trắc nghiệm tính cách nghề nghiệp MBTI')).toBeInTheDocument();

    // Answer questions
    const optionAButtons = screen.getAllByText('A.');
    optionAButtons.forEach((btn) => fireEvent.click(btn));

    const submitBtn = screen.getByRole('button', { name: 'Xem kết quả phân tích tính cách' });
    expect(submitBtn).not.toBeDisabled();
    fireEvent.click(submitBtn);

    expect(screen.getByText(/ESTJ|INTJ|ENTJ/)).toBeInTheDocument();
    expect(screen.getByText('Công việc và vị trí gợi ý phù hợp nhất:')).toBeInTheDocument();
  });

  it('renders SkillsPage and switches role roadmap', () => {
    render(
      <MemoryRouter>
        <SkillsPage />
      </MemoryRouter>,
    );

    expect(screen.getByText('Talento Skills - Bản đồ kỹ năng & Lộ trình công nghệ')).toBeInTheDocument();
    expect(screen.getByText('Ngôn ngữ & Runtime')).toBeInTheDocument();

    // Switch to Frontend Engineer
    const feTab = screen.getByRole('button', { name: 'Frontend Engineer' });
    fireEvent.click(feTab);

    expect(screen.getByText('Modern JavaScript / TS')).toBeInTheDocument();
    expect(screen.getByText('React Ecosystem')).toBeInTheDocument();
  });
});
