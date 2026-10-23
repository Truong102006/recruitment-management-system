import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useCompanyContext } from '../../features/companies/context/company-context';
import { useAuthContext } from '../../features/auth/context/auth-context';

export const RecruiterLayout: React.FC = () => {
  const { currentCompany, currentRole, memberships, switchCompany } = useCompanyContext();
  const { session, logout } = useAuthContext();

  return (
    <div
      className="recruiter-shell"
      style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}
    >
      {/* Sidebar */}
      <aside
        style={{
          width: '240px',
          borderRight: '1px solid var(--hair2)',
          background: 'var(--side-bg)',
          padding: '20px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingBottom: '12px' }}>
          <span
            style={{
              fontWeight: 700,
              fontSize: '20px',
              letterSpacing: '-0.02em',
              color: 'var(--blue)',
            }}
          >
            Talento
          </span>
          <span
            style={{
              fontSize: '11px',
              padding: '2px 6px',
              borderRadius: '6px',
              background: 'var(--tint-bg)',
              color: 'var(--tint-fg)',
              fontWeight: 600,
            }}
          >
            RECRUITER
          </span>
        </div>

        {/* Company Switcher */}
        {memberships.length > 0 && (
          <div style={{ paddingBottom: '8px' }}>
            <label
              htmlFor="company-select"
              style={{
                display: 'block',
                fontSize: '11px',
                color: 'var(--muted)',
                marginBottom: '4px',
                textTransform: 'uppercase',
              }}
            >
              Doanh nghiệp
            </label>
            <select
              id="company-select"
              value={currentCompany?.id ?? ''}
              onChange={(e) => switchCompany(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: '8px',
                border: '1px solid var(--line)',
                background: 'var(--card)',
                fontSize: '13px',
              }}
            >
              {memberships.map((m) => (
                <option key={m.company.id} value={m.company.id}>
                  {m.company.name} ({m.role})
                </option>
              ))}
            </select>
          </div>
        )}

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
          <NavLink
            to="/recruiter/jobs"
            style={({ isActive }) => ({
              padding: '9px 12px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: isActive ? 600 : 400,
              color: isActive ? 'var(--blue)' : 'var(--ink2)',
              background: isActive ? 'var(--tint-bg)' : 'transparent',
            })}
          >
            Tin tuyển dụng
          </NavLink>
          <NavLink
            to="/recruiter/applications"
            style={({ isActive }) => ({
              padding: '9px 12px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: isActive ? 600 : 400,
              color: isActive ? 'var(--blue)' : 'var(--ink2)',
              background: isActive ? 'var(--tint-bg)' : 'transparent',
            })}
          >
            Hồ sơ ứng viên
          </NavLink>
          <NavLink
            to="/interviews"
            style={({ isActive }) => ({
              padding: '9px 12px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: isActive ? 600 : 400,
              color: isActive ? 'var(--blue)' : 'var(--ink2)',
              background: isActive ? 'var(--tint-bg)' : 'transparent',
            })}
          >
            Lịch phỏng vấn
          </NavLink>
          <NavLink
            to="/recruiter/members"
            style={({ isActive }) => ({
              padding: '9px 12px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: isActive ? 600 : 400,
              color: isActive ? 'var(--blue)' : 'var(--ink2)',
              background: isActive ? 'var(--tint-bg)' : 'transparent',
            })}
          >
            Thành viên & Công ty
          </NavLink>
          <NavLink
            to="/recruiter/statistics"
            style={({ isActive }) => ({
              padding: '9px 12px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: isActive ? 600 : 400,
              color: isActive ? 'var(--blue)' : 'var(--ink2)',
              background: isActive ? 'var(--tint-bg)' : 'transparent',
            })}
          >
            Thống kê tuyển dụng
          </NavLink>
        </nav>

        {/* Footer in sidebar */}
        <div style={{ borderTop: '1px solid var(--hair2)', paddingTop: '12px', fontSize: '13px' }}>
          <div
            style={{
              fontWeight: 500,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {session?.fullName ?? 'Recruiter'}
          </div>
          <div style={{ color: 'var(--muted)', fontSize: '11px', marginBottom: '8px' }}>
            {currentRole ?? 'Member'}
          </div>
          <button onClick={() => void logout()} className="btn sm danger" style={{ width: '100%' }}>
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: '24px 32px', overflow: 'auto' }}>
        <Outlet />
      </main>
    </div>
  );
};
