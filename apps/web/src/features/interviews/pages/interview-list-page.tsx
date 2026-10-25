import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { interviewsApi } from '../api/interviews.api';
import { applicationsApi } from '../../applications/api/applications.api';
import { companiesApi } from '../../companies/api/companies.api';
import { useCompanyContext } from '../../companies/context/company-context';
import {
  InterviewCalendar,
  type InterviewEvent,
} from '../../../components/calendar/interview-calendar';
import { Dialog } from '../../../components/ui/dialog';
import { ApiException } from '../../../lib/http/api-client';
import type { DevInterviewItem, DevApplicationItem } from '../../../lib/mocks/dev-mock-store';
import type { CompanyMemberDto } from '@rms/contracts/public';

export const InterviewListPage: React.FC = () => {
  const { currentCompanyId } = useCompanyContext();

  const [interviews, setInterviews] = useState<DevInterviewItem[]>([]);
  const [applications, setApplications] = useState<DevApplicationItem[]>([]);
  const [members, setMembers] = useState<CompanyMemberDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // UI21: Schedule Interview Modal state (UC08, BR10, BR11)
  const [showScheduleModal, setShowScheduleModal] = useState<boolean>(false);
  const [scheduling, setScheduling] = useState<boolean>(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);

  // Schedule Form State
  const [selectedAppId, setSelectedAppId] = useState<string>('');
  const [startAt, setStartAt] = useState<string>('');
  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  const [format, setFormat] = useState<'ONLINE' | 'IN_PERSON'>('ONLINE');
  const [selectedInterviewerIds, setSelectedInterviewerIds] = useState<string[]>([]);
  const [location, setLocation] = useState<string>('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const ivList = await interviewsApi.getInterviews();
      setInterviews(ivList);

      if (currentCompanyId) {
        const [appRes, memberList] = await Promise.all([
          applicationsApi.getCompanyApplications(currentCompanyId),
          companiesApi.getCompanyMembers(currentCompanyId),
        ]);
        setApplications(appRes.data);
        setMembers(memberList.filter((m) => m.active));
        if (appRes.data.length > 0 && !selectedAppId) {
          setSelectedAppId(appRes.data[0]!.applicationId);
        }
      }
    } catch (err: unknown) {
      if (err instanceof ApiException) {
        setError(err.message || 'Không thể tải lịch phỏng vấn');
      } else {
        setError('Đã có lỗi xảy ra');
      }
    } finally {
      setLoading(false);
    }
  }, [currentCompanyId, selectedAppId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Convert DevInterviewItem to Calendar InterviewEvent
  const calendarEvents = useMemo<InterviewEvent[]>(() => {
    return interviews.map((iv) => ({
      id: iv.id,
      title: `${iv.candidateName} - ${iv.jobTitle}`,
      startAt: iv.startAt,
      endAt: iv.endAt,
      status: iv.status,
      candidateName: iv.candidateName,
      jobTitle: iv.jobTitle,
      mode: iv.format,
      interviewerNames: iv.interviewers.map((i) => i.fullName),
    }));
  }, [interviews]);

  // Handle Schedule Submit (UI21, BR10)
  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const appId = selectedAppId || (applications.length > 0 ? applications[0]!.applicationId : '');
    if (!appId) {
      setScheduleError('Vui lòng chọn hồ sơ ứng viên để xếp lịch.');
      return;
    }

    if (!startAt) {
      setScheduleError('Vui lòng chọn thời gian bắt đầu phỏng vấn.');
      return;
    }

    // BR10: start_at phải ở tương lai
    const startDate = new Date(startAt);
    if (isNaN(startDate.getTime()) || startDate.getTime() <= Date.now()) {
      setScheduleError(
        'Thời gian bắt đầu phỏng vấn phải ở tương lai so với thời điểm hiện tại (BR10).',
      );
      return;
    }

    // BR10: duration 15 to 120 minutes
    if (durationMinutes < 15 || durationMinutes > 120) {
      setScheduleError('Thời lượng phỏng vấn phải từ 15 đến 120 phút (BR10).');
      return;
    }

    // BR10: at least one interviewer
    if (selectedInterviewerIds.length === 0) {
      setScheduleError('Vui lòng phân công ít nhất một người phỏng vấn (BR10).');
      return;
    }

    setScheduling(true);
    setScheduleError(null);

    try {
      await interviewsApi.scheduleInterview({
        applicationId: appId,
        startAt: `${startAt}:00+07:00`,
        durationMinutes,
        format,
        interviewerIds: selectedInterviewerIds,
        location: location.trim() || undefined,
      });

      setShowScheduleModal(false);
      setSuccessMessage('Xếp lịch phỏng vấn mới thành công!');
      await loadData();
    } catch (err: unknown) {
      if (err instanceof ApiException) {
        setScheduleError(err.message || 'Không thể xếp lịch phỏng vấn');
      } else {
        setScheduleError('Đã có lỗi xảy ra');
      }
    } finally {
      setScheduling(false);
    }
  };

  const toggleInterviewer = (userId: string) => {
    setSelectedInterviewerIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
    );
  };

  if (loading) {
    return (
      <div
        className="interview-list-page"
        data-testid="ui13-interviews"
        style={{ padding: '2rem' }}
      >
        <p>Đang tải lịch phỏng vấn...</p>
      </div>
    );
  }

  return (
    <div
      className="interview-list-page"
      data-testid="ui13-interviews"
      style={{ maxWidth: '1280px', margin: '0 auto', padding: '1.5rem' }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '28px',
              fontWeight: 600,
              fontFamily: 'var(--font-d)',
              letterSpacing: '-0.02em',
              color: 'var(--ink)',
              margin: 0,
            }}
          >
            Lịch phỏng vấn (UI13)
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '14px', margin: '4px 0 0' }}>
            Xem toàn bộ lịch theo định dạng Lịch tháng (Month Calendar) hoặc Dòng thời gian
            (Agenda).
          </p>
        </div>

        <button
          type="button"
          data-testid="open-schedule-modal-btn"
          className="btn primary sm"
          onClick={() => setShowScheduleModal(true)}
        >
          + Xếp lịch phỏng vấn (UI21)
        </button>
      </div>

      {/* Notifications */}
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

      {/* Interview Calendar Component */}
      <InterviewCalendar events={calendarEvents} />

      {/* UI21: Schedule Interview Dialog (UC08, BR10, BR11) */}
      <Dialog
        open={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        title="Xếp lịch phỏng vấn mới (UI21)"
        description="Quy tắc nghiệp vụ BR10: Thời gian bắt đầu phải ở tương lai, thời lượng 15-120 phút, chỉ định ít nhất 1 interviewer."
      >
        <form onSubmit={handleScheduleSubmit} data-testid="schedule-interview-form">
          {scheduleError && (
            <div
              data-testid="schedule-error-alert"
              style={{
                padding: '0.6rem 0.8rem',
                background: 'var(--color-danger-subtle)',
                color: 'var(--color-danger)',
                borderRadius: '6px',
                marginBottom: '1rem',
                fontSize: '0.85rem',
              }}
            >
              {scheduleError}
            </div>
          )}

          {/* Select Application */}
          <div style={{ marginBottom: '1rem' }}>
            <label
              htmlFor="select-candidate"
              style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}
            >
              Ứng viên & Vị trí ứng tuyển <span style={{ color: 'var(--color-danger)' }}>*</span>
            </label>
            <select
              id="select-candidate"
              data-testid="select-application-input"
              value={selectedAppId}
              onChange={(e) => setSelectedAppId(e.target.value)}
              style={{
                width: '100%',
                padding: '0.55rem 0.75rem',
                borderRadius: '6px',
                border: '1px solid var(--color-border)',
                fontSize: '0.9rem',
              }}
            >
              {applications.map((app) => (
                <option key={app.applicationId} value={app.applicationId}>
                  {app.candidateSnapshot.name} — {app.jobTitle || app.jobId} ({app.status})
                </option>
              ))}
            </select>
          </div>

          {/* Date & Time */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 140px',
              gap: '1rem',
              marginBottom: '1rem',
            }}
          >
            <div>
              <label
                htmlFor="schedule-start-at"
                style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}
              >
                Thời gian bắt đầu (Tương lai){' '}
                <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <input
                id="schedule-start-at"
                data-testid="schedule-start-at-input"
                type="datetime-local"
                value={startAt}
                onChange={(e) => setStartAt(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.55rem 0.75rem',
                  borderRadius: '6px',
                  border: '1px solid var(--color-border)',
                  fontSize: '0.9rem',
                }}
              />
            </div>

            <div>
              <label
                htmlFor="schedule-duration"
                style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}
              >
                Thời lượng (phút)
              </label>
              <select
                id="schedule-duration"
                data-testid="schedule-duration-select"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(parseInt(e.target.value, 10))}
                style={{
                  width: '100%',
                  padding: '0.55rem 0.75rem',
                  borderRadius: '6px',
                  border: '1px solid var(--color-border)',
                  fontSize: '0.9rem',
                }}
              >
                <option value={30}>30 phút</option>
                <option value={45}>45 phút</option>
                <option value={60}>60 phút</option>
                <option value={90}>90 phút</option>
                <option value={120}>120 phút</option>
              </select>
            </div>
          </div>

          {/* Format: ONLINE / IN_PERSON */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}>
              Hình thức phỏng vấn
            </label>
            <div style={{ display: 'flex', gap: '1.5rem' }}>
              <label
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}
              >
                <input
                  type="radio"
                  name="interviewFormat"
                  data-testid="format-online-radio"
                  value="ONLINE"
                  checked={format === 'ONLINE'}
                  onChange={() => setFormat('ONLINE')}
                />
                <span>Trực tuyến (WebRTC Jitsi)</span>
              </label>

              <label
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}
              >
                <input
                  type="radio"
                  name="interviewFormat"
                  data-testid="format-inperson-radio"
                  value="IN_PERSON"
                  checked={format === 'IN_PERSON'}
                  onChange={() => setFormat('IN_PERSON')}
                />
                <span>Trực tiếp tại văn phòng</span>
              </label>
            </div>
          </div>

          {/* Interviewers Multi-select (BR10) */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}>
              Người phỏng vấn (Ít nhất 1 interviewer){' '}
              <span style={{ color: 'var(--color-danger)' }}>*</span>
            </label>
            <div
              data-testid="interviewers-selector"
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.5rem',
                maxHeight: '120px',
                overflowY: 'auto',
                padding: '0.6rem',
                background: 'var(--color-bg-secondary)',
                borderRadius: '6px',
                border: '1px solid var(--color-border)',
              }}
            >
              {members.map((m) => {
                const isSelected = selectedInterviewerIds.includes(m.userId);
                return (
                  <button
                    key={m.userId}
                    type="button"
                    data-testid={`interviewer-chip-${m.userId}`}
                    onClick={() => toggleInterviewer(m.userId)}
                    style={{
                      padding: '0.3rem 0.65rem',
                      borderRadius: '9999px',
                      border: `1px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-border)'}`,
                      background: isSelected ? 'var(--color-primary)' : '#fff',
                      color: isSelected ? '#fff' : 'var(--color-text)',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      fontWeight: isSelected ? 600 : 400,
                    }}
                  >
                    {m.fullName || m.email} ({m.role}) {isSelected && '✓'}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Location or Notes */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label
              htmlFor="schedule-location"
              style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}
            >
              Địa điểm / Ghi chú cho buổi phỏng vấn
            </label>
            <input
              id="schedule-location"
              data-testid="schedule-location-input"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="VD: Phòng họp Tầng 8 hoặc Ghi chú chuẩn bị thiết bị..."
              style={{
                width: '100%',
                padding: '0.55rem 0.75rem',
                borderRadius: '6px',
                border: '1px solid var(--color-border)',
                fontSize: '0.9rem',
              }}
            />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={() => setShowScheduleModal(false)}
              style={{
                padding: '0.55rem 1.2rem',
                borderRadius: '6px',
                border: '1px solid var(--color-border)',
                background: 'transparent',
                cursor: 'pointer',
              }}
            >
              Hủy
            </button>
            <button
              type="submit"
              data-testid="confirm-schedule-btn"
              disabled={scheduling}
              style={{
                padding: '0.55rem 1.25rem',
                borderRadius: '6px',
                border: 'none',
                background: 'var(--color-primary)',
                color: '#fff',
                fontWeight: 600,
                cursor: scheduling ? 'not-allowed' : 'pointer',
                opacity: scheduling ? 0.7 : 1,
              }}
            >
              {scheduling ? 'Đang xếp lịch...' : 'Xác nhận xếp lịch'}
            </button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};
