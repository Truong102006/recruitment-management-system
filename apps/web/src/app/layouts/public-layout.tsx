import React from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/context/auth-context';
import { Button } from '../../components/ui/button';

export function PublicLayout() {
  const { isAuthenticated, actor, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <a href="#main-content" className="skip-link">
        Chuyển đến nội dung chính
      </a>

      {/* Header */}
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

            <nav aria-label="Điều hướng chính" style={{ display: 'flex', gap: 'var(--space-4)' }}>
              <Link
                to="/jobs"
                style={{
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 'var(--font-weight-medium)',
                  color: 'var(--color-foreground)',
                  textDecoration: 'none',
                }}
              >
                Tìm việc
              </Link>
            </nav>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            {isAuthenticated && actor ? (
              <>
                <Link
                  to="/candidate/applications"
                  style={{
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 'var(--font-weight-medium)',
                    color: 'var(--color-foreground)',
                    textDecoration: 'none',
                  }}
                >
                  Khu vực ứng viên
                </Link>
                <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-muted)' }}>
                  {actor.fullName}
                </span>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  Đăng xuất
                </Button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="outline" size="sm">
                    Đăng nhập
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary" size="sm">
                    Đăng ký
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main id="main-content" style={{ flex: 1, padding: 'var(--space-6) 0' }}>
        <div className="container">
          <Outlet />
        </div>
      </main>

      {/* Footer */}
      <footer
        style={{
          borderTop: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-surface)',
          padding: 'var(--space-6) 0',
          color: 'var(--color-muted)',
          fontSize: 'var(--font-size-sm)',
        }}
      >
        <div
          className="container"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 'var(--space-4)',
          }}
        >
          <div>© 2026 RecruitFlow. Hệ thống quản lý tuyển dụng chuẩn hóa.</div>
          <div>Môn học Kiểm chứng phần mềm (SE113) - Nhóm 4</div>
        </div>
      </footer>
    </div>
  );
}
