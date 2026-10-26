import React, { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/context/auth-context';
import { toggleTheme, getTheme } from '../../lib/talento-effects';
import { useLanguage } from '../../lib/i18n';

export function CandidateLayout() {
  const { actor, logout } = useAuth();
  const navigate = useNavigate();
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>(() => getTheme());
  const { language, toggleLanguage, t } = useLanguage();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleToggleTheme = () => {
    const next = toggleTheme();
    setCurrentTheme(next);
  };

  const initials = ((actor?.fullName || actor?.email || 'U').trim().split(/\s+/).slice(-2).map((w) => w[0]).join('') || 'U').toUpperCase();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg)' }}>
      <a href="#candidate-main" className="skip-link">
        {t('nav.skipToContent')}
      </a>

      {/* Top Header */}
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
            height: '68px',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <Link to="/" className="logo" aria-label="Về trang chủ Talento">
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
                padding: '2px 8px',
                borderRadius: '999px',
                background: 'var(--tint-bg)',
                color: 'var(--tint-fg)',
                fontWeight: 600,
                letterSpacing: '0.04em',
              }}
            >
              CANDIDATE
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Lang toggle */}
            <button
              type="button"
              className="lang"
              onClick={toggleLanguage}
              aria-label={t('nav.switchLanguage')}
            >
              <span className={language === 'vi' ? 'on' : ''}>VI</span>
              <span className={language === 'en' ? 'on' : ''}>EN</span>
            </button>

            {/* Theme toggle */}
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
              <span className="av p0" style={{ width: '32px', height: '32px' }}>
                {initials}
              </span>
              <span
                style={{
                  fontSize: '13.5px',
                  fontWeight: 500,
                  color: 'var(--ink)',
                  maxWidth: '160px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {actor?.fullName || actor?.email}
              </span>
            </div>

            <button
              type="button"
              className="btn sm danger"
              onClick={() => void handleLogout()}
            >
              {t('nav.logout')}
            </button>
          </div>
        </div>

        {/* Sub-nav for candidate */}
        <div
          style={{
            backgroundColor: 'var(--soft2)',
            borderTop: '1px solid var(--hair2)',
          }}
        >
          <div
            className="container"
            style={{
              display: 'flex',
              gap: '6px',
              overflowX: 'auto',
              whiteSpace: 'nowrap',
              padding: '6px 16px',
            }}
          >
            <NavLink
              to="/jobs"
              className={({ isActive }) => `nv ${isActive ? 'on' : ''}`}
              style={{ width: 'auto', padding: '6px 14px', borderRadius: '8px', fontSize: '13.5px' }}
            >
              {t('candidateNav.jobs')}
            </NavLink>
            <NavLink
              to="/candidate/applications"
              className={({ isActive }) => `nv ${isActive ? 'on' : ''}`}
              style={{ width: 'auto', padding: '6px 14px', borderRadius: '8px', fontSize: '13.5px' }}
            >
              {t('candidateNav.applications')}
            </NavLink>
            <NavLink
              to="/candidate/profile"
              className={({ isActive }) => `nv ${isActive ? 'on' : ''}`}
              style={{ width: 'auto', padding: '6px 14px', borderRadius: '8px', fontSize: '13.5px' }}
            >
              {t('candidateNav.profile')}
            </NavLink>
            <NavLink
              to="/candidate/cvs"
              className={({ isActive }) => `nv ${isActive ? 'on' : ''}`}
              style={{ width: 'auto', padding: '6px 14px', borderRadius: '8px', fontSize: '13.5px' }}
            >
              {t('candidateNav.cvs')}
            </NavLink>
            <NavLink
              to="/candidate/saved-jobs"
              className={({ isActive }) => `nv ${isActive ? 'on' : ''}`}
              style={{ width: 'auto', padding: '6px 14px', borderRadius: '8px', fontSize: '13.5px' }}
            >
              {t('candidateNav.savedJobs')}
            </NavLink>
            <NavLink
              to="/notifications"
              className={({ isActive }) => `nv ${isActive ? 'on' : ''}`}
              style={{ width: 'auto', padding: '6px 14px', borderRadius: '8px', fontSize: '13.5px' }}
            >
              {t('candidateNav.notifications')}
            </NavLink>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main id="candidate-main" style={{ flex: 1, padding: '24px 0' }}>
        <div className="container">
          <Outlet />
        </div>
      </main>

      {/* Footer */}
      <footer
        style={{
          borderTop: '1px solid var(--hair2)',
          backgroundColor: 'var(--card)',
          padding: '24px 0',
          color: 'var(--muted)',
          fontSize: '13px',
          textAlign: 'center',
        }}
      >
        <div className="container">{t('candidateNav.footer')}</div>
      </footer>
    </div>
  );
}

