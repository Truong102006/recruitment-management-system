import React from 'react';

export type BadgeVariant =
  | 'SUBMITTED'
  | 'SCREENING'
  | 'SHORTLISTED'
  | 'INTERVIEW_SCHEDULED'
  | 'INTERVIEWED'
  | 'HIRED'
  | 'REJECTED'
  | 'WITHDRAWN'
  | 'DRAFT'
  | 'PUBLISHED'
  | 'CLOSED'
  | 'PENDING'
  | 'APPROVED'
  | 'SUSPENDED'
  | 'ACTIVE'
  | 'LOCKED'
  | 'PROPOSED'
  | 'CONFIRMED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW'
  | 'DECLINED'
  | 'EXPIRED'
  | 'ONLINE'
  | 'IN_PERSON';

interface BadgeConfig {
  label: string;
  color: string;
  bg: string;
}

const BADGE_CONFIGS: Record<string, BadgeConfig> = {
  SUBMITTED: { label: 'Đã nộp', color: '#0a6fb4', bg: '#dff3ff' },
  SCREENING: { label: 'Sàng lọc', color: '#1677ff', bg: '#e8f3ff' },
  SHORTLISTED: { label: 'Vào danh sách ngắn', color: '#8b5cf6', bg: '#f3e8ff' },
  INTERVIEW_SCHEDULED: { label: 'Đã xếp lịch', color: '#f6a623', bg: '#ffeccf' },
  INTERVIEWED: { label: 'Đã phỏng vấn', color: '#0f63da', bg: '#dff4ff' },
  HIRED: { label: 'Đã tuyển dụng', color: '#14774f', bg: '#e1f6ea' },
  REJECTED: { label: 'Từ chối', color: '#b43a1c', bg: '#ffe3dc' },
  WITHDRAWN: { label: 'Đã rút hồ sơ', color: '#4b4b57', bg: '#ececf1' },

  DRAFT: { label: 'Bản nháp', color: '#4b4b57', bg: '#ececf1' },
  PUBLISHED: { label: 'Đang tuyển', color: '#14774f', bg: '#e1f6ea' },
  CLOSED: { label: 'Đã đóng', color: '#b43a1c', bg: '#ffe3dc' },

  PENDING: { label: 'Chờ duyệt', color: '#a56300', bg: '#ffeccf' },
  APPROVED: { label: 'Đã duyệt', color: '#14774f', bg: '#e1f6ea' },
  SUSPENDED: { label: 'Bị đình chỉ', color: '#ee4b2b', bg: '#ffe3dc' },

  ACTIVE: { label: 'Hoạt động', color: '#14774f', bg: '#e1f6ea' },
  LOCKED: { label: 'Đã khóa', color: '#b43a1c', bg: '#ffe3dc' },

  PROPOSED: { label: 'Đề xuất', color: '#a56300', bg: '#ffeccf' },
  CONFIRMED: { label: 'Đã xác nhận', color: '#1677ff', bg: '#e8f3ff' },
  COMPLETED: { label: 'Hoàn thành', color: '#14774f', bg: '#e1f6ea' },
  CANCELLED: { label: 'Đã hủy', color: '#4b4b57', bg: '#ececf1' },
  NO_SHOW: { label: 'Vắng mặt', color: '#ee4b2b', bg: '#ffe3dc' },
  DECLINED: { label: 'Từ chối lịch', color: '#b43a1c', bg: '#ffe3dc' },
  EXPIRED: { label: 'Hết hạn', color: '#8e8e93', bg: '#f3f3f4' },

  ONLINE: { label: 'Online', color: '#0a6fb4', bg: '#dff3ff' },
  IN_PERSON: { label: 'Trực tiếp', color: '#14774f', bg: '#e1f6ea' },
};

export interface StatusBadgeProps {
  status?: BadgeVariant | string;
  variant?: BadgeVariant | string;
  customLabel?: string;
  children?: React.ReactNode;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status: statusProp,
  variant,
  customLabel,
  children,
  size = 'sm',
}) => {
  const resolvedStatus = statusProp ?? variant ?? 'APPROVED';
  const childText = typeof children === 'string' ? children : undefined;
  const config = BADGE_CONFIGS[resolvedStatus] ?? {
    label: customLabel ?? childText ?? resolvedStatus,
    color: '#3d3d42',
    bg: '#f3f3f4',
  };

  const isSmall = size === 'sm';

  return (
    <span
      data-testid="status-badge"
      data-status={resolvedStatus}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: isSmall ? '5px' : '6px',
        padding: isSmall ? '2px 8px' : '4px 12px',
        borderRadius: '999px',
        fontSize: isSmall ? '12px' : '13px',
        fontWeight: 500,
        lineHeight: 1.2,
        color: config.color,
        background: config.bg,
        whiteSpace: 'nowrap',
      }}
    >
      <span
        style={{
          width: isSmall ? '5px' : '6px',
          height: isSmall ? '5px' : '6px',
          borderRadius: '50%',
          background: config.color,
          flexShrink: 0,
        }}
      />
      {customLabel ?? childText ?? config.label}
    </span>
  );
};
