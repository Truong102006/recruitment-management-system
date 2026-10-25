import React from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/context/auth-context';
import { Button } from '../../components/ui/button';

export function CandidateLayout() {
  const { actor, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItemStyle = ({ isActive }: { isActive: boolean }): React.CSSProperties => ({
    fontSize: 'var(--font-size-sm)',
    fontWeight: isActive ? 'var(--font-weight-bold)' : 'var(--font-weight-medium)',
    color: isActive ? 'var(--color-primary)' : 'var(--color-foreground)',
    borderBottom: isActive ? '2px solid var(--color-primary)' : '2px solid transparent',
    padding: 'var(--space-2) 0',
    textDecoration: 'none',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <a href="#candidate-main" className="skip-link">
        Chuyển đến nội dung chính
      </a>

      {/* Top Header */}
      <header
        style={{
          borderBottom: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-surface)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <div
          className="container"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: '64px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-6)' }}>
            <Link
              to="/jobs"
              style={{
                fontSize: 'var(--font-size-xl)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'var(--color-primary)',
                textDecoration: 'none',
              }}
            >
              RecruitFlow
            </Link>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <span
              style={{
                fontSize: 'var(--font-size-sm)',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--color-foreground)',
              }}
            >
              {actor?.fullName || actor?.email}
            </span>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              Đăng xuất
            </Button>
          </div>
        </div>

        {/* Sub-nav for candidate */}
        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            borderTop: '1px solid var(--color-secondary)',
          }}
        >
          <div
            className="container"
            style={{
              display: 'flex',
              gap: 'var(--space-6)',
              overflowX: 'auto',
              whiteSpace: 'nowrap',
            }}
          >
            <NavLink to="/jobs" style={navItemStyle}>
              Tìm việc
            </NavLink>
            <NavLink to="/candidate/applications" style={navItemStyle}>
              Hồ sơ của tôi
            </NavLink>
            <NavLink to="/candidate/profile" style={navItemStyle}>
              Hồ sơ cá nhân
            </NavLink>
            <NavLink to="/candidate/cvs" style={navItemStyle}>
              Kho CV
            </NavLink>
            <NavLink to="/candidate/saved-jobs" style={navItemStyle}>
              Tin đã lưu
            </NavLink>
            <NavLink to="/notifications" style={navItemStyle}>
              Thông báo
            </NavLink>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main id="candidate-main" style={{ flex: 1, padding: 'var(--space-6) 0' }}>
        <div className="container">
          <Outlet />
        </div>
      </main>

      {/* Footer */}
      <footer
        style={{
          borderTop: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-surface)',
          padding: 'var(--space-4) 0',
          color: 'var(--color-muted)',
          fontSize: 'var(--font-size-xs)',
          textAlign: 'center',
        }}
      >
        <div className="container">RecruitFlow - Cổng thông tin ứng viên và quản lý tuyển dụng</div>
      </footer>
    </div>
  );
}
