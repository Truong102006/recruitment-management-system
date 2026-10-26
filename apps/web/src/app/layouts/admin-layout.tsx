import React, { useState } from 'react';
import { Outlet, NavLink, Link } from 'react-router-dom';
import { useAuthContext } from '../../features/auth/context/auth-context';
import { toggleTheme, getTheme } from '../../lib/talento-effects';
import { useLanguage } from '../../lib/i18n';

export const AdminLayout: React.FC = () => {
  const { session, logout } = useAuthContext();
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>(() => getTheme());
  const { language, toggleLanguage, t } = useLanguage();

  const handleToggleTheme = () => {
    const next = toggleTheme();
    setCurrentTheme(next);
  };

  const initials = ((session?.fullName || 'A').trim().split(/\s+/).slice(-2).map((w) => w[0]).join('') || 'A').toUpperCase();

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
          padding: '20px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '2px 8px 12px' }}>
          <Link to="/" className="logo" style={{ fontSize: '20px' }} aria-label="Về trang chủ Talento">
            <span className="dots">
              <i style={{ background: 'var(--red)' }} />
              <i />
              <i />
              <i />
            </span>
            <span>Talento</span>
          </Link>
          <span
            style={{
              fontSize: '11px',
              padding: '2px 6px',
              borderRadius: '999px',
              background: 'rgba(238, 75, 43, 0.1)',
              color: 'var(--red)',
              fontWeight: 600,
              letterSpacing: '0.04em',
            }}
          >
            ADMIN
          </span>
        </div>

        <div className="side-label">{t('adminNav.systemAdmin')}</div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
          <NavLink
            to="/admin/companies"
            className={({ isActive }) => `nv ${isActive ? 'on active' : ''}`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M9 3v18M3 9h6M3 15h6" />
            </svg>
            <span className="t">{t('adminNav.companies')}</span>
          </NavLink>
          <NavLink
            to="/admin/users"
            className={({ isActive }) => `nv ${isActive ? 'on active' : ''}`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <span className="t">{t('adminNav.users')}</span>
          </NavLink>
          <NavLink
            to="/admin/jobs"
            className={({ isActive }) => `nv ${isActive ? 'on active' : ''}`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M3 8h18v12H3zM9 8V5h6v3" />
            </svg>
            <span className="t">{t('adminNav.jobs')}</span>
          </NavLink>
          <NavLink
            to="/admin/audit"
            className={({ isActive }) => `nv ${isActive ? 'on active' : ''}`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            <span className="t">{t('adminNav.audit')}</span>
          </NavLink>
          <NavLink
            to="/admin/events"
            className={({ isActive }) => `nv ${isActive ? 'on active' : ''}`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span className="t">{t('adminNav.events')}</span>
          </NavLink>
        </nav>

        {/* Footer in sidebar */}
        <div style={{ borderTop: '1px solid var(--hair2)', paddingTop: '12px', fontSize: '13px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span className="av p3" style={{ width: '28px', height: '28px' }}>
              {initials}
            </span>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                style={{
                  fontWeight: 600,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {session?.fullName ?? 'Admin'}
              </div>
              <div style={{ color: 'var(--muted)', fontSize: '11px' }}>
                {t('adminNav.adminRole')}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void logout()}
            className="btn sm danger"
            style={{ width: '100%' }}
          >
            {t('nav.logout')}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        {/* Admin Topbar */}
        <header
          style={{
            height: '64px',
            borderBottom: '1px solid var(--hair2)',
            background: 'var(--card)',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--ink2)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
              <path d="M4 6h16v14H4zM4 10h16M8 3v4M16 3v4" />
            </svg>
            <span>
              Thứ Bảy, {new Date().getDate()}/{new Date().getMonth() + 1}/{new Date().getFullYear()}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Lang button */}
            <button
              type="button"
              className="lang"
              onClick={toggleLanguage}
              aria-label={t('nav.switchLanguage')}
            >
              <span className={language === 'vi' ? 'on' : ''}>VI</span>
              <span className={language === 'en' ? 'on' : ''}>EN</span>
            </button>

            {/* Theme button */}
            <button
              type="button"
              className="thm"
              onClick={handleToggleTheme}
              aria-label={t('nav.toggleTheme')}
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

            <div className="me">
              <span className="av p3" style={{ width: '28px', height: '28px' }}>
                {initials}
              </span>
              <span style={{ fontWeight: 500, fontSize: '13px' }}>{t('adminNav.profile')}</span>
            </div>
          </div>
        </header>

        {/* Content body */}
        <main style={{ flex: 1, padding: '24px 32px', overflow: 'auto' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

