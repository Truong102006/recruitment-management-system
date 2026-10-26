import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom';
import { useCompanyContext } from '../../features/companies/context/company-context';
import { useAuthContext } from '../../features/auth/context/auth-context';
import { toggleTheme, getTheme } from '../../lib/talento-effects';
import { useLanguage } from '../../lib/i18n';

export const RecruiterLayout: React.FC = () => {
  const navigate = useNavigate();
  const { currentCompany, currentRole, memberships, switchCompany } = useCompanyContext();
  const { session, logout } = useAuthContext();
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>(() => getTheme());
  const { language, toggleLanguage, t } = useLanguage();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleToggleTheme = () => {
    const next = toggleTheme();
    setCurrentTheme(next);
  };

  const initials = ((session?.fullName || session?.email || 'R').trim().split(/\s+/).slice(-2).map((w) => w[0]).join('') || 'R').toUpperCase();

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
              <i />
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
              background: 'var(--tint-bg)',
              color: 'var(--tint-fg)',
              fontWeight: 600,
              letterSpacing: '0.04em',
            }}
          >
            RECRUITER
          </span>
        </div>

        {/* Create new button */}
        <button
          type="button"
          className="side-create"
          onClick={() => navigate('/recruiter/jobs/new')}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          {t('recruiterNav.postJob')}
        </button>

        <div className="side-label">{t('common.all').toUpperCase()}</div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
          <NavLink
            to="/recruiter/jobs"
            className={({ isActive }) => `nv ${isActive ? 'on active' : ''}`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M3 8h18v12H3zM9 8V5h6v3" />
            </svg>
            <span className="t">{t('recruiterNav.jobs')}</span>
          </NavLink>
          <NavLink
            to="/recruiter/applications"
            className={({ isActive }) => `nv ${isActive ? 'on active' : ''}`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <circle cx="9" cy="8" r="3.2" />
              <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M16 5.2a3.2 3.2 0 010 6M18 14.3c1.8.8 3 2.6 3 4.7" />
            </svg>
            <span className="t">{t('recruiterNav.applications')}</span>
          </NavLink>
          <NavLink
            to="/interviews"
            className={({ isActive }) => `nv ${isActive ? 'on active' : ''}`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M4 6h16v14H4zM4 10h16M8 3v4M16 3v4" />
            </svg>
            <span className="t">{t('recruiterNav.interviews')}</span>
          </NavLink>
          <NavLink
            to="/recruiter/members"
            className={({ isActive }) => `nv ${isActive ? 'on active' : ''}`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            <span className="t">{t('recruiterNav.company')}</span>
          </NavLink>
          <NavLink
            to="/recruiter/statistics"
            className={({ isActive }) => `nv ${isActive ? 'on active' : ''}`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M18 20V10M12 20V4M6 20v-6" />
            </svg>
            <span className="t">{t('recruiterNav.statistics')}</span>
          </NavLink>
        </nav>

        {/* Company Switcher */}
        {memberships.length > 0 && (
          <div style={{ borderTop: '1px solid var(--hair2)', paddingTop: '10px' }}>
            <div className="side-label" style={{ padding: '0 0 4px' }}>
              DOANH NGHIỆP
            </div>
            <select
              id="company-select"
              aria-label="Chọn doanh nghiệp"
              value={currentCompany?.id ?? ''}
              onChange={(e) => switchCompany(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: '8px',
                border: '1px solid var(--line)',
                background: 'var(--card)',
                fontSize: '13px',
                color: 'var(--ink)',
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

        {/* Footer in sidebar */}
        <div style={{ borderTop: '1px solid var(--hair2)', paddingTop: '12px', fontSize: '13px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span className="av p1" style={{ width: '28px', height: '28px' }}>
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
                {session?.fullName ?? 'Recruiter'}
              </div>
              <div style={{ color: 'var(--muted)', fontSize: '11px' }}>
                {currentRole ?? 'Member'}
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
        {/* Recruiter Topbar */}
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
            <label className="search" style={{ width: '240px' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <circle cx="11" cy="11" r="6" />
                <path d="M20 20l-4-4" />
              </svg>
              <input
                type="search"
                placeholder={t('nav.quickSearch')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </label>

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

            {/* User profile with menu */}
            <div className="me-wrap">
              <button
                type="button"
                className="me"
                onClick={() => setUserMenuOpen((prev) => !prev)}
                aria-label="Tài khoản cá nhân"
              >
                <span className="av p1" style={{ width: '28px', height: '28px' }}>
                  {initials}
                </span>
                <span style={{ fontWeight: 500 }}>Tài khoản</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>

              {userMenuOpen && (
                <div className="menu" role="menu">
                  <div className="who">
                    <b>{session?.fullName ?? 'Recruiter'}</b>
                    <span>{session?.email}</span>
                  </div>
                  <button type="button" onClick={() => navigate('/recruiter/members')}>
                    Hồ sơ doanh nghiệp
                  </button>
                  <button
                    type="button"
                    className="out"
                    onClick={() => {
                      setUserMenuOpen(false);
                      void logout();
                    }}
                  >
                    Đăng xuất
                  </button>
                </div>
              )}
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

