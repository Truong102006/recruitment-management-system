import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { interviewsApi } from '../api/interviews.api';
import { ApiException } from '../../../lib/http/api-client';
import type { DevInterviewItem } from '../../../lib/mocks/dev-mock-store';

export const InterviewEvaluationPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [interview, setInterview] = useState<DevInterviewItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // 3 Evaluation Criteria Scores (1 to 5 integer) - BR13
  const [technicalScore, setTechnicalScore] = useState<number>(4);
  const [problemSolvingScore, setProblemSolvingScore] = useState<number>(4);
  const [cultureFitScore, setCultureFitScore] = useState<number>(4);

  // Recommendation: HIRE | HOLD | REJECT - BR13
  const [recommendation, setRecommendation] = useState<'HIRE' | 'HOLD' | 'REJECT'>('HIRE');

  // Internal Notes (1 to 5000 chars required) - BR13
  const [note, setNote] = useState<string>('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const loadInterview = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await interviewsApi.getInterviewDetail(id);
      setInterview(data);
    } catch (err: unknown) {
      if (err instanceof ApiException) {
        setError(err.message || 'Không thể tải thông tin buổi phỏng vấn');
      } else {
        setError('Đã có lỗi xảy ra');
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadInterview();
  }, [loadInterview]);

  const handleSubmitEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!interview || !id) return;

    const trimmedNote = note.trim();
    const errors: Record<string, string> = {};

    // BR13: Note 1 to 5000 chars required
    if (!trimmedNote) {
      errors.note = 'Vui lòng nhập nhận xét / ghi chú đánh giá nội bộ (BR13).';
    } else if (trimmedNote.length < 10) {
      errors.note = 'Nhận xét đánh giá phải có độ dài tối thiểu 10 ký tự.';
    } else if (trimmedNote.length > 5000) {
      errors.note = 'Nhận xét không được vượt quá 5.000 ký tự.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    const interviewerId = interview.interviewers[0]?.userId || 'u-interviewer-default';

    try {
      await interviewsApi.submitEvaluation(id, {
        interviewerId,
        technicalScore,
        problemSolvingScore,
        cultureFitScore,
        recommendation,
        note: trimmedNote,
      });
      setSuccessMessage('Gửi phiếu đánh giá phỏng vấn thành công!');
      setTimeout(() => {
        navigate('/interviews');
      }, 1500);
    } catch (err: unknown) {
      if (err instanceof ApiException) {
        setError(err.message || 'Không thể gửi phiếu đánh giá');
      } else {
        setError('Đã có lỗi xảy ra khi gửi đánh giá');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div
        className="interview-evaluation-page"
        data-testid="ui22-interview-evaluation"
        style={{ padding: '2rem' }}
      >
        <p>Đang tải thông tin buổi phỏng vấn...</p>
      </div>
    );
  }

  if (!interview) {
    return (
      <div
        className="interview-evaluation-page"
        data-testid="ui22-interview-evaluation"
        style={{ padding: '2rem' }}
      >
        <h2>Phiếu Đánh giá Phỏng vấn</h2>
        {error ? (
          <div
            data-testid="error-alert"
            style={{
              padding: '0.85rem 1.25rem',
              background: 'var(--color-danger-subtle)',
              border: '1px solid var(--color-danger)',
              borderRadius: '8px',
              marginBottom: '1rem',
              color: 'var(--color-danger)',
            }}
          >
            {error}
          </div>
        ) : (
          <p>Không tìm thấy buổi phỏng vấn yêu cầu.</p>
        )}
        <button
          type="button"
          onClick={() => navigate('/interviews')}
          style={{ padding: '0.5rem 1rem', cursor: 'pointer' }}
        >
          ← Quay lại Lịch phỏng vấn
        </button>
      </div>
    );
  }

  return (
    <div
      className="interview-evaluation-page"
      data-testid="ui22-interview-evaluation"
      style={{ maxWidth: '850px', margin: '0 auto', padding: '1.5rem' }}
    >
      <div style={{ marginBottom: '1.5rem' }}>
        <button
          type="button"
          onClick={() => navigate('/interviews')}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--color-primary)',
            cursor: 'pointer',
            padding: 0,
            marginBottom: '0.5rem',
            fontWeight: 600,
          }}
        >
          ← Quay lại lịch phỏng vấn
        </button>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: '0 0 0.25rem' }}>
          Phiếu Đánh giá Phỏng vấn (UI22)
        </h1>
        <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>
          Ứng viên: <strong>{interview.candidateName}</strong> • Vị trí:{' '}
          <strong>{interview.jobTitle}</strong>
          {interview.interviewers.length > 0 && (
            <span>
              {' '}
              • Người đánh giá: <strong>{interview.interviewers[0]?.fullName}</strong>
            </span>
          )}
        </p>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div
          data-testid="success-alert"
          style={{
            padding: '0.85rem 1.25rem',
            background: 'var(--color-success-subtle)',
            border: '1px solid var(--color-success)',
            borderRadius: '8px',
            marginBottom: '1.25rem',
            color: 'var(--color-success)',
          }}
        >
          {successMessage}
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div
          data-testid="error-alert"
          style={{
            padding: '0.85rem 1.25rem',
            background: 'var(--color-danger-subtle)',
            border: '1px solid var(--color-danger)',
            borderRadius: '8px',
            marginBottom: '1.25rem',
            color: 'var(--color-danger)',
          }}
        >
          {error}
        </div>
      )}

      {/* BR13 Confidentiality Notice */}
      <div
        style={{
          background: '#f8fafc',
          border: '1px solid #cbd5e1',
          borderRadius: '8px',
          padding: '1rem',
          marginBottom: '1.5rem',
          fontSize: '0.85rem',
          color: '#475569',
        }}
      >
        🔒 <strong>Bảo mật nghiệp vụ (BR13):</strong> Điểm số, khuyến nghị tuyển dụng và nhận xét
        này là <strong>tuyệt mật nội bộ doanh nghiệp</strong>. Ứng viên không bao giờ nhìn thấy hoặc
        nhận được thông tin này qua bất kỳ giao diện, email hay thông báo nào.
      </div>

      <form
        onSubmit={handleSubmitEvaluation}
        data-testid="evaluation-form"
        style={{
          background: 'var(--color-bg-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '8px',
          padding: '1.5rem',
        }}
      >
        {/* 3 Criteria Scoring (1 - 5) */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
            marginBottom: '1.5rem',
          }}
        >
          {/* 1. Technical */}
          <div>
            <div
              style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}
            >
              <label htmlFor="score-technical" style={{ fontWeight: 600 }}>
                1. Năng lực Chuyên môn & Kỹ thuật (Technical Competency)
              </label>
              <strong style={{ color: 'var(--color-primary)' }}>{technicalScore} / 5 điểm</strong>
            </div>
            <input
              id="score-technical"
              data-testid="score-technical-input"
              type="range"
              min={1}
              max={5}
              value={technicalScore}
              onChange={(e) => setTechnicalScore(parseInt(e.target.value, 10))}
              style={{ width: '100%', cursor: 'pointer' }}
            />
          </div>

          {/* 2. Problem Solving */}
          <div>
            <div
              style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}
            >
              <label htmlFor="score-problem-solving" style={{ fontWeight: 600 }}>
                2. Tư duy Giải quyết Vấn đề & Hệ thống (Problem Solving)
              </label>
              <strong style={{ color: 'var(--color-primary)' }}>
                {problemSolvingScore} / 5 điểm
              </strong>
            </div>
            <input
              id="score-problem-solving"
              data-testid="score-problem-solving-input"
              type="range"
              min={1}
              max={5}
              value={problemSolvingScore}
              onChange={(e) => setProblemSolvingScore(parseInt(e.target.value, 10))}
              style={{ width: '100%', cursor: 'pointer' }}
            />
          </div>

          {/* 3. Culture Fit */}
          <div>
            <div
              style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}
            >
              <label htmlFor="score-culture-fit" style={{ fontWeight: 600 }}>
                3. Giao tiếp & Phù hợp Văn hóa (Culture Fit & Communication)
              </label>
              <strong style={{ color: 'var(--color-primary)' }}>{cultureFitScore} / 5 điểm</strong>
            </div>
            <input
              id="score-culture-fit"
              data-testid="score-culture-fit-input"
              type="range"
              min={1}
              max={5}
              value={cultureFitScore}
              onChange={(e) => setCultureFitScore(parseInt(e.target.value, 10))}
              style={{ width: '100%', cursor: 'pointer' }}
            />
          </div>
        </div>

        {/* Recommendation (HIRE / HOLD / REJECT) - BR13 */}
        <div
          style={{
            marginBottom: '1.5rem',
            padding: '1rem',
            background: 'var(--color-bg-secondary)',
            borderRadius: '6px',
          }}
        >
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
            Khuyến nghị tuyển dụng (Recommendation){' '}
            <span style={{ color: 'var(--color-danger)' }}>*</span>
          </label>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <label
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}
            >
              <input
                type="radio"
                name="recommendation"
                data-testid="recommendation-hire"
                value="HIRE"
                checked={recommendation === 'HIRE'}
                onChange={() => setRecommendation('HIRE')}
              />
              <span style={{ color: '#16a34a', fontWeight: 600 }}>Nên tuyển (HIRE)</span>
            </label>

            <label
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}
            >
              <input
                type="radio"
                name="recommendation"
                data-testid="recommendation-hold"
                value="HOLD"
                checked={recommendation === 'HOLD'}
                onChange={() => setRecommendation('HOLD')}
              />
              <span style={{ color: '#d97706', fontWeight: 600 }}>Cân nhắc thêm (HOLD)</span>
            </label>

            <label
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}
            >
              <input
                type="radio"
                name="recommendation"
                data-testid="recommendation-reject"
                value="REJECT"
                checked={recommendation === 'REJECT'}
                onChange={() => setRecommendation('REJECT')}
              />
              <span style={{ color: '#dc2626', fontWeight: 600 }}>Không tuyển (REJECT)</span>
            </label>
          </div>
        </div>

        {/* Note (1 to 5000 chars required) */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label
            htmlFor="evaluation-note"
            style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}
          >
            Ghi chú nhận xét chi tiết (Bắt buộc theo BR13){' '}
            <span style={{ color: 'var(--color-danger)' }}>*</span>
          </label>
          <textarea
            id="evaluation-note"
            data-testid="evaluation-note-input"
            rows={5}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Nêu rõ ưu điểm, hạn chế kỹ thuật và lý do đưa ra khuyến nghị tuyển dụng trên..."
            style={{
              width: '100%',
              padding: '0.6rem 0.8rem',
              borderRadius: '6px',
              border: `1px solid ${fieldErrors.note ? 'var(--color-danger)' : 'var(--color-border)'}`,
              fontSize: '0.9rem',
              resize: 'vertical',
            }}
          />
          {fieldErrors.note && (
            <span
              data-testid="error-note"
              style={{ color: 'var(--color-danger)', fontSize: '0.85rem' }}
            >
              {fieldErrors.note}
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button
            type="button"
            onClick={() => navigate('/interviews')}
            style={{
              padding: '0.6rem 1.25rem',
              borderRadius: '6px',
              border: '1px solid var(--color-border)',
              background: 'transparent',
              cursor: 'pointer',
            }}
          >
            Hủy bỏ
          </button>
          <button
            type="submit"
            data-testid="submit-evaluation-btn"
            disabled={submitting}
            style={{
              padding: '0.6rem 1.5rem',
              borderRadius: '6px',
              border: 'none',
              background: 'var(--color-primary)',
              color: '#fff',
              fontWeight: 600,
              cursor: submitting ? 'not-allowed' : 'pointer',
              opacity: submitting ? 0.7 : 1,
            }}
          >
            {submitting ? 'Đang gửi...' : 'Gửi phiếu đánh giá'}
          </button>
        </div>
      </form>
    </div>
  );
};
