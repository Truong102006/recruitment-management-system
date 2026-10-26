import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../../lib/i18n';
import { CAREER_CATEGORIES, BLOG_ARTICLES } from '../../../features/blog/career-handbook-data';

export function ToolsDropdown() {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigate = useNavigate();

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 180);
  };

  const handleItemClick = (path: string) => {
    setIsOpen(false);
    navigate(path);
  };

  return (
    <div
      style={{ position: 'relative' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="true"
        aria-expanded={isOpen}
        style={{
          background: 'transparent',
          border: 'none',
          padding: '6px 0',
          fontSize: '14px',
          fontWeight: 500,
          color: isOpen ? '#00b14f' : 'var(--ink2)',
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          cursor: 'pointer',
          transition: 'color 0.15s ease',
        }}
      >
        <span>{t('nav.tools')}</span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.2s ease',
          }}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {/* Dropdown Menu (3 items requested by user) */}
      {isOpen && (
        <div
          role="menu"
          aria-label="Menu Công cụ"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: '0',
            width: '340px',
            background: 'var(--card)',
            border: '1px solid var(--hair2)',
            borderRadius: '16px',
            boxShadow: '0 12px 36px rgba(0, 0, 0, 0.12)',
            padding: '12px',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            animation: 'fadeIn 0.15s ease-out',
          }}
        >
          {/* Item 1: Bộ câu hỏi phỏng vấn */}
          <button
            type="button"
            role="menuitem"
            onClick={() => handleItemClick('/tools/interview-questions')}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              padding: '12px',
              borderRadius: '12px',
              border: 'none',
              background: 'transparent',
              textAlign: 'left',
              cursor: 'pointer',
              transition: 'background 0.15s ease',
              width: '100%',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--soft2)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: '#e8f7ee',
                color: '#008b3e',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink)' }}>
                  Bộ câu hỏi phỏng vấn
                </span>
                <span
                  style={{
                    background: '#00b14f',
                    color: '#ffffff',
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: '4px',
                  }}
                >
                  Mới
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--muted)', lineHeight: 1.4 }}>
                Ngân hàng câu hỏi & đáp án chuẩn vị trí IT
              </p>
            </div>
          </button>

          {/* Item 2: Trắc nghiệm MBTI */}
          <button
            type="button"
            role="menuitem"
            onClick={() => handleItemClick('/tools/mbti-test')}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              padding: '12px',
              borderRadius: '12px',
              border: 'none',
              background: 'transparent',
              textAlign: 'left',
              cursor: 'pointer',
              transition: 'background 0.15s ease',
              width: '100%',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--soft2)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: '#e0e7ff',
                color: '#4338ca',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink)', marginBottom: '2px' }}>
                Trắc nghiệm MBTI
              </div>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--muted)', lineHeight: 1.4 }}>
                Khám phá tính cách & định hướng nghề nghiệp
              </p>
            </div>
          </button>

          {/* Item 3: Talento Skills */}
          <button
            type="button"
            role="menuitem"
            onClick={() => handleItemClick('/tools/skills')}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              padding: '12px',
              borderRadius: '12px',
              border: 'none',
              background: 'transparent',
              textAlign: 'left',
              cursor: 'pointer',
              transition: 'background 0.15s ease',
              width: '100%',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--soft2)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: '#fef3c7',
                color: '#b45309',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink)', marginBottom: '2px' }}>
                Talento Skills
              </div>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--muted)', lineHeight: 1.4 }}>
                Bản đồ kỹ năng & lộ trình phát triển năng lực
              </p>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}

export function CareerHandbookDropdown() {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigate = useNavigate();

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 180);
  };

  const handleNavigate = (path: string) => {
    setIsOpen(false);
    navigate(path);
  };

  // 2 featured articles for right column (matching Image 2)
  const featuredArticles = BLOG_ARTICLES.filter((a) => a.isFeatured).slice(0, 2);

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'compass':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
          </svg>
        );
      case 'lightbulb':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="9" y1="18" x2="15" y2="18" />
            <line x1="10" y1="22" x2="14" y2="22" />
            <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14" />
          </svg>
        );
      case 'currency':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        );
      case 'book':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
        );
      case 'briefcase':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
          </svg>
        );
      default:
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
            <polyline points="17 6 23 6 23 12" />
          </svg>
        );
    }
  };

  return (
    <div
      style={{ position: 'relative' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="true"
        aria-expanded={isOpen}
        style={{
          background: 'transparent',
          border: 'none',
          padding: '6px 0',
          fontSize: '14px',
          fontWeight: 500,
          color: isOpen ? '#00b14f' : 'var(--ink2)',
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          cursor: 'pointer',
          transition: 'color 0.15s ease',
        }}
      >
        <span>{t('nav.careerHandbook')}</span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.2s ease',
          }}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {/* Mega Dropdown Menu (Matching Image 2) */}
      {isOpen && (
        <div
          role="menu"
          aria-label="Menu Cẩm nang nghề nghiệp"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: '-120px',
            width: '680px',
            background: 'var(--card)',
            border: '1px solid var(--hair2)',
            borderRadius: '18px',
            boxShadow: '0 16px 44px rgba(0, 0, 0, 0.13)',
            padding: '24px',
            zIndex: 1000,
            display: 'grid',
            gridTemplateColumns: '290px 1fr',
            gap: '24px',
            animation: 'fadeIn 0.15s ease-out',
          }}
        >
          {/* Left Column: 6 categories */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              borderRight: '1px solid var(--line)',
              paddingRight: '16px',
            }}
          >
            {CAREER_CATEGORIES.map((cat) => (
              <button
                key={cat.slug}
                type="button"
                role="menuitem"
                onClick={() => handleNavigate(`/blog/${cat.slug}`)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'transparent',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: 'var(--ink)',
                  transition: 'all 0.15s ease',
                  width: '100%',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#e8f7ee';
                  e.currentTarget.style.color = '#008b3e';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--ink)';
                }}
              >
                <span
                  style={{
                    color: '#00b14f',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {getCategoryIcon(cat.iconName)}
                </span>
                <span>{cat.name}</span>
              </button>
            ))}
          </div>

          {/* Right Column: Featured Articles (Matching Image 2) */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h4
              style={{
                fontSize: '14px',
                fontWeight: 700,
                color: 'var(--ink)',
                margin: '0 0 16px 0',
              }}
            >
              Bài viết nổi bật
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
              {featuredArticles.map((article) => (
                <div
                  key={article.id}
                  onClick={() => handleNavigate(`/blog/${article.categorySlug}`)}
                  style={{
                    display: 'flex',
                    gap: '12px',
                    padding: '8px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--soft2)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <img
                    src={article.imageUrl}
                    alt={article.title}
                    style={{
                      width: '84px',
                      height: '62px',
                      borderRadius: '8px',
                      objectFit: 'cover',
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <h5
                      style={{
                        margin: '0 0 4px 0',
                        fontSize: '13px',
                        fontWeight: 600,
                        color: 'var(--ink)',
                        lineHeight: 1.35,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {article.title}
                    </h5>
                    <p
                      style={{
                        margin: 0,
                        fontSize: '11.5px',
                        color: 'var(--muted)',
                        lineHeight: 1.35,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {article.excerpt}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom link: "Xem thêm bài viết nổi bật →" */}
            <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--hair2)' }}>
              <button
                type="button"
                onClick={() => handleNavigate('/blog/huong-nghiep')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: 0,
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#00b14f',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                Xem thêm bài viết nổi bật →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
