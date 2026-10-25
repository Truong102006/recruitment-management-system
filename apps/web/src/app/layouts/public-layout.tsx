import React, { useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/context/auth-context';
import { toggleTheme, getTheme } from '../../lib/talento-effects';

export function PublicLayout() {
  const { isAuthenticated, actor, logout } = useAuth();
  const navigate = useNavigate();
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>(() => getTheme());
  const [lang, setLang] = useState<'vi' | 'en'>('vi');

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleToggleTheme = () => {
    const next = toggleTheme();
    setCurrentTheme(next);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg)' }}>
      <a href="#main-content" className="skip-link">
        Chuyển đến nội dung chính
      </a>

      {/* Talento Top Navigation */}
      <header
        style={{
          borderBottom: '1px solid var(--hair2)',
          backgroundColor: 'var(--card)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          boxShadow: 'var(--sh-s)',
        }}
      >
        <div
          className="container"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: '72px',
            gap: '16px',
          }}
        >
          {/* Logo with 4 dots */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
            <Link to="/" className="logo">
              <span className="dots">
                <i />
                <i />
                <i />
                <i />
              </span>
              <span>Talento</span>
            </Link>

            <nav aria-label="Điều hướng chính" style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
              <Link
                to="/jobs"
                style={{
                  fontSize: '14px',
                  fontWeight: 500,
                  color: 'var(--ink2)',
                  transition: 'color 0.15s',
                }}
              >
                Tìm việc làm
              </Link>
              <Link
                to="/#features"
                style={{
                  fontSize: '14px',
                  fontWeight: 500,
                  color: 'var(--ink2)',
                  transition: 'color 0.15s',
                }}
              >
                Tính năng
              </Link>
              <Link
                to="/#solutions"
                style={{
                  fontSize: '14px',
                  fontWeight: 500,
                  color: 'var(--ink2)',
                  transition: 'color 0.15s',
                }}
              >
                Giải pháp
              </Link>
              <Link
                to="/recruiter/jobs"
                style={{
                  fontSize: '14px',
                  fontWeight: 500,
                  color: 'var(--ink2)',
                  transition: 'color 0.15s',
                }}
              >
                Nhà tuyển dụng
              </Link>
            </nav>
          </div>

          {/* Right actions: Lang, Theme, Auth */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Lang button */}
            <button
              type="button"
              className="lang"
              onClick={() => setLang((prev) => (prev === 'vi' ? 'en' : 'vi'))}
              aria-label="Đổi ngôn ngữ"
            >
              <span className={lang === 'vi' ? 'on' : ''}>VI</span>
              <span className={lang === 'en' ? 'on' : ''}>EN</span>
            </button>

            {/* Theme button */}
            <button
              type="button"
              className="thm"
              onClick={handleToggleTheme}
              aria-label="Đổi giao diện sáng hoặc tối"
            >
              {currentTheme === 'dark' ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 14.5A8 8 0 019.5 4a8 8 0 1010.5 10.5z" />
                </svg>
              )}
            </button>

            {isAuthenticated && actor ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Link
                  to="/candidate/applications"
                  className="btn sm"
                  style={{ background: 'var(--soft2)' }}
                >
                  Khu vực ứng viên
                </Link>
                <div className="me">
                  <span className="av p0" style={{ width: '30px', height: '30px' }}>
                    {(actor.fullName || actor.email || 'U').slice(0, 2).toUpperCase()}
                  </span>
                  <span style={{ fontWeight: 500, fontSize: '13.5px' }}>{actor.fullName || actor.email}</span>
                </div>
                <button type="button" className="btn sm danger" onClick={() => void handleLogout()}>
                  Đăng xuất
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Link to="/login" className="btn sm">
                  Đăng nhập
                </Link>
                <Link to="/register" className="btn sm primary">
                  Đăng ký
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main id="main-content" style={{ flex: 1, padding: '24px 0' }}>
        <Outlet />
      </main>

      {/* Talento Footer */}
      <footer
        style={{
          borderTop: '1px solid var(--hair2)',
          backgroundColor: 'var(--card)',
          padding: '36px 0',
          color: 'var(--muted)',
          fontSize: '13px',
        }}
      >
        <div
          className="container"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="dots" style={{ transform: 'scale(0.8)' }}>
              <i />
              <i />
              <i />
              <i />
            </span>
            <span>© 2026 Talento Recruitment Management System. Chuẩn hóa quy trình tuyển dụng doanh nghiệp.</span>
          </div>
          <div style={{ display: 'flex', gap: '18px' }}>
            <Link to="/jobs">Việc làm</Link>
            <Link to="/recruiter/jobs">Dành cho Nhà tuyển dụng</Link>
            <Link to="/admin/companies">Quản trị hệ thống</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

