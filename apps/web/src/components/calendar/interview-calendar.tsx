import React, { useState, useMemo } from 'react';
import { StatusBadge } from '../ui/status-badge';

export interface InterviewEvent {
  id: string;
  title: string;
  startAt: string; // ISO
  endAt: string; // ISO
  status: 'PROPOSED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  candidateName: string;
  jobTitle: string;
  mode: 'ONLINE' | 'IN_PERSON';
  interviewerNames?: string[];
}

export interface InterviewCalendarProps {
  events: InterviewEvent[];
  onSelectEvent?: (event: InterviewEvent) => void;
  defaultView?: 'calendar' | 'agenda';
  readOnly?: boolean;
}

const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

export const InterviewCalendar: React.FC<InterviewCalendarProps> = ({
  events,
  onSelectEvent,
  defaultView = 'agenda',
}) => {
  const [viewMode, setViewMode] = useState<'calendar' | 'agenda'>(defaultView);
  const [currentDate, setCurrentDate] = useState(() => new Date());

  // Format helpers
  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const formatDateLabel = (isoDateStr: string) => {
    const d = new Date(isoDateStr);
    const today = new Date();
    const isToday =
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear();

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const isTomorrow =
      d.getDate() === tomorrow.getDate() &&
      d.getMonth() === tomorrow.getMonth() &&
      d.getFullYear() === tomorrow.getFullYear();

    if (isToday) return 'Hôm nay';
    if (isTomorrow) return 'Ngày mai';

    const dayOfWeek = d.getDay() === 0 ? 'Chủ nhật' : `Thứ ${d.getDay() + 1}`;
    return `${dayOfWeek}, ${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  };

  // Group events by date for Agenda view
  const groupedEvents = useMemo(() => {
    const sorted = [...events].sort(
      (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
    );
    const groups: Record<string, InterviewEvent[]> = {};

    for (const evt of sorted) {
      const dateKey = evt.startAt.slice(0, 10);
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(evt);
    }

    return Object.entries(groups).map(([date, items]) => ({ date, items }));
  }, [events]);

  // Calendar Month calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay(); // 0 is Sunday
    // adjust so Monday is 0: Sunday becomes 6
    const startingBlankDays = firstDay === 0 ? 6 : firstDay - 1;
    const totalDays = new Date(year, month + 1, 0).getDate();

    const days: (number | null)[] = [];
    for (let i = 0; i < startingBlankDays; i++) {
      days.push(null);
    }
    for (let i = 1; i <= totalDays; i++) {
      days.push(i);
    }
    return days;
  }, [year, month]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  return (
    <div className="interview-calendar-card" style={{ width: '100%' }}>
      {/* View Switcher and Controls */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '16px',
        }}
      >
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setViewMode('agenda')}
            className={`btn sm ${viewMode === 'agenda' ? 'primary' : ''}`}
            data-testid="tab-agenda"
          >
            Chương trình (Agenda)
          </button>
          <button
            type="button"
            onClick={() => setViewMode('calendar')}
            className={`btn sm ${viewMode === 'calendar' ? 'primary' : ''}`}
            data-testid="tab-calendar"
          >
            Lịch tháng (Calendar)
          </button>
        </div>

        {viewMode === 'calendar' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button type="button" onClick={handlePrevMonth} className="btn sm">
              ◀
            </button>
            <span
              style={{ fontWeight: 600, fontSize: '14px', minWidth: '120px', textAlign: 'center' }}
            >
              Tháng {month + 1} / {year}
            </span>
            <button type="button" onClick={handleNextMonth} className="btn sm">
              ▶
            </button>
          </div>
        )}
      </div>

      {/* AGENDA VIEW */}
      {viewMode === 'agenda' && (
        <div
          className="agenda-view"
          data-testid="agenda-view"
          style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}
        >
          {groupedEvents.length === 0 ? (
            <div
              className="card"
              style={{ textAlign: 'center', padding: '36px', color: 'var(--muted)' }}
            >
              Chưa có lịch phỏng vấn nào.
            </div>
          ) : (
            groupedEvents.map(({ date, items }) => (
              <div key={date}>
                <h4
                  style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: 'var(--muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    marginBottom: '8px',
                  }}
                >
                  {formatDateLabel(items[0]?.startAt ?? date)}
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {items.map((evt) => (
                    <article
                      key={evt.id}
                      className="card"
                      onClick={() => onSelectEvent?.(evt)}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '80px 1fr auto',
                        alignItems: 'center',
                        gap: '14px',
                        cursor: onSelectEvent ? 'pointer' : 'default',
                        transition: 'transform 0.15s, box-shadow 0.15s',
                        padding: '14px 18px',
                      }}
                    >
                      {/* Time */}
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--blue)' }}>
                          {formatTime(evt.startAt)}
                        </div>
                        <div style={{ fontSize: '11.5px', color: 'var(--muted)' }}>
                          {formatTime(evt.endAt)}
                        </div>
                      </div>

                      {/* Info */}
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--ink)' }}>
                          {evt.candidateName}
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--ink2)', marginTop: '2px' }}>
                          {evt.jobTitle}
                          {evt.interviewerNames && evt.interviewerNames.length > 0 && (
                            <span style={{ color: 'var(--muted)' }}>
                              {' '}
                              · Phỏng vấn bởi: {evt.interviewerNames.join(', ')}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Badges */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <StatusBadge status={evt.mode} />
                        <StatusBadge status={evt.status} />
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* CALENDAR MONTH VIEW */}
      {viewMode === 'calendar' && (
        <div
          className="calendar-view card"
          data-testid="calendar-view"
          style={{ padding: '16px', overflowX: 'auto' }}
        >
          {/* Weekday headers */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              textAlign: 'center',
              fontWeight: 600,
              fontSize: '12.5px',
              color: 'var(--muted)',
              paddingBottom: '8px',
              borderBottom: '1px solid var(--line)',
            }}
          >
            {WEEKDAYS.map((wd) => (
              <div key={wd}>{wd}</div>
            ))}
          </div>

          {/* Days Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: '4px',
              marginTop: '8px',
            }}
          >
            {daysInMonth.map((dayNum, idx) => {
              if (dayNum === null) {
                return (
                  <div
                    key={`blank-${idx}`}
                    style={{ minHeight: '80px', background: 'transparent' }}
                  />
                );
              }

              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const dayEvents = events.filter((e) => e.startAt.startsWith(dateStr));
              const isToday =
                dayNum === new Date().getDate() &&
                month === new Date().getMonth() &&
                year === new Date().getFullYear();

              return (
                <div
                  key={`day-${dayNum}`}
                  style={{
                    minHeight: '80px',
                    border: '1px solid var(--hair2)',
                    borderRadius: '8px',
                    padding: '6px',
                    background: isToday ? 'var(--tint-bg)' : 'var(--card)',
                  }}
                >
                  <div
                    style={{
                      fontSize: '12px',
                      fontWeight: isToday ? 700 : 500,
                      color: isToday ? 'var(--blue)' : 'var(--ink2)',
                      marginBottom: '4px',
                    }}
                  >
                    {dayNum}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    {dayEvents.slice(0, 2).map((e) => (
                      <div
                        key={e.id}
                        onClick={() => onSelectEvent?.(e)}
                        style={{
                          fontSize: '11px',
                          padding: '2px 4px',
                          borderRadius: '4px',
                          background: 'var(--soft)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          cursor: onSelectEvent ? 'pointer' : 'default',
                        }}
                      >
                        {formatTime(e.startAt)} {e.candidateName}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div style={{ fontSize: '10px', color: 'var(--muted)' }}>
                        +{dayEvents.length - 2} buổi khác
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
