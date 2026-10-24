import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useAuthContext } from '../../features/auth/context/auth-context';

export const AdminLayout: React.FC = () => {
  const { session, logout } = useAuthContext();

  return (
    <div
      className="admin-shell"
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
              color: 'var(--red)',
            }}
          >
            Talento
          </span>
          <span
            style={{
              fontSize: '11px',
              padding: '2px 6px',
              borderRadius: '6px',
              background: 'rgba(238, 75, 43, 0.1)',
              color: 'var(--red)',
              fontWeight: 600,
            }}
          >
            ADMIN
          </span>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
          <NavLink
            to="/admin/companies"
            style={({ isActive }) => ({
              padding: '9px 12px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: isActive ? 600 : 400,
              color: isActive ? 'var(--blue)' : 'var(--ink2)',
              background: isActive ? 'var(--tint-bg)' : 'transparent',
            })}
          >
            Duyệt doanh nghiệp
          </NavLink>
          <NavLink
            to="/admin/users"
            style={({ isActive }) => ({
              padding: '9px 12px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: isActive ? 600 : 400,
              color: isActive ? 'var(--blue)' : 'var(--ink2)',
              background: isActive ? 'var(--tint-bg)' : 'transparent',
            })}
          >
            Quản trị tài khoản
          </NavLink>
          <NavLink
            to="/admin/jobs"
            style={({ isActive }) => ({
              padding: '9px 12px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: isActive ? 600 : 400,
              color: isActive ? 'var(--blue)' : 'var(--ink2)',
              background: isActive ? 'var(--tint-bg)' : 'transparent',
            })}
          >
            Kiểm duyệt tin
          </NavLink>
          <NavLink
            to="/admin/audit"
            style={({ isActive }) => ({
              padding: '9px 12px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: isActive ? 600 : 400,
              color: isActive ? 'var(--blue)' : 'var(--ink2)',
              background: isActive ? 'var(--tint-bg)' : 'transparent',
            })}
          >
            Nhật ký Audit
          </NavLink>
          <NavLink
            to="/admin/events"
            style={({ isActive }) => ({
              padding: '9px 12px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: isActive ? 600 : 400,
              color: isActive ? 'var(--blue)' : 'var(--ink2)',
              background: isActive ? 'var(--tint-bg)' : 'transparent',
            })}
          >
            Sự kiện Outbox lỗi
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
            {session?.fullName ?? 'Admin'}
          </div>
          <div style={{ color: 'var(--muted)', fontSize: '11px', marginBottom: '8px' }}>
            Quản trị viên
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
