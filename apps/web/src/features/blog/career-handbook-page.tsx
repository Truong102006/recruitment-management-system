import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  CAREER_CATEGORIES,
  BLOG_ARTICLES,
  type BlogArticle,
  type BlogCategory,
} from './career-handbook-data';

export function CareerHandbookPage() {
  const { categorySlug } = useParams<{ categorySlug?: string }>();
  const navigate = useNavigate();

  // Active category determination
  const activeSlug = categorySlug || 'huong-nghiep';
  const defaultCategory = CAREER_CATEGORIES[0] as BlogCategory;
  const currentCategory: BlogCategory =
    CAREER_CATEGORIES.find((cat) => cat.slug === activeSlug) || defaultCategory;

  // Articles in current category or fallback to all
  const categoryArticles = BLOG_ARTICLES.filter(
    (art) => art.categorySlug === currentCategory.slug,
  );
  const otherArticles = BLOG_ARTICLES.filter(
    (art) => art.categorySlug !== currentCategory.slug,
  );
  const displayArticles =
    categoryArticles.length > 0
      ? [...categoryArticles, ...otherArticles.slice(0, 3)]
      : BLOG_ARTICLES;

  const featuredArticle =
    displayArticles.find((art) => art.isFeatured) || displayArticles[0];
  const listArticles = displayArticles.filter((art) => art.id !== featuredArticle?.id);

  // Modal for reading article
  const [selectedArticle, setSelectedArticle] = useState<BlogArticle | null>(null);

  // Other categories for pills
  const otherCategories = CAREER_CATEGORIES.filter((c) => c.slug !== currentCategory.slug);

  return (
    <div className="career-handbook-page" style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Hero Banner Section (Matching Hình 3) */}
      <section
        style={{
          background: 'linear-gradient(135deg, #e8f7ee 0%, #f4fbf7 55%, #e1f5ea 100%)',
          borderBottom: '1px solid rgba(0, 177, 79, 0.15)',
          padding: '44px 0 52px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          className="container"
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '32px',
          }}
        >
          {/* Hero Left Content */}
          <div style={{ flex: 1, maxWidth: '720px' }}>
            <h1
              style={{
                fontSize: '34px',
                fontWeight: 800,
                color: '#006535',
                letterSpacing: '-0.02em',
                marginBottom: '16px',
                lineHeight: 1.25,
              }}
            >
              {currentCategory.name}
            </h1>
            <p
              style={{
                fontSize: '15.5px',
                lineHeight: 1.65,
                color: '#374151',
                margin: 0,
              }}
            >
              {currentCategory.heroSubtitle}
            </p>
          </div>

          {/* Hero Right Mascot Illustration (Matching TopCV Cute Robot in Hình 3) */}
          <div
            style={{
              flexShrink: 0,
              width: '180px',
              height: '180px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}
          >
            {/* Robot SVG Illustration */}
            <svg
              width="170"
              height="170"
              viewBox="0 0 200 200"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-label="Linh vật Cẩm nang nghề nghiệp"
            >
              {/* Stack of books at base */}
              <rect x="35" y="155" width="130" height="18" rx="4" fill="#00b14f" />
              <rect x="30" y="158" width="140" height="7" rx="3" fill="#008b3e" opacity="0.4" />
              <rect x="42" y="137" width="116" height="18" rx="4" fill="#3b82f6" />
              <rect x="38" y="140" width="124" height="6" rx="3" fill="#1d4ed8" opacity="0.3" />
              <rect x="48" y="121" width="104" height="16" rx="4" fill="#f59e0b" />

              {/* Robot Body */}
              <rect x="68" y="70" width="64" height="52" rx="14" fill="#ffffff" stroke="#00b14f" strokeWidth="4" />
              <rect x="76" y="78" width="48" height="36" rx="8" fill="#e8f7ee" />

              {/* Robot Head */}
              <rect x="60" y="24" width="80" height="46" rx="16" fill="#1e293b" />
              {/* Face screen */}
              <rect x="66" y="29" width="68" height="36" rx="12" fill="#0f172a" stroke="#00b14f" strokeWidth="2.5" />
              {/* Eyes */}
              <circle cx="85" cy="47" r="7" fill="#00e575" />
              <circle cx="85" cy="47" r="3.5" fill="#ffffff" />
              <circle cx="115" cy="47" r="7" fill="#00e575" />
              <circle cx="115" cy="47" r="3.5" fill="#ffffff" />
              {/* Antenna */}
              <line x1="100" y1="24" x2="100" y2="12" stroke="#00b14f" strokeWidth="3.5" strokeLinecap="round" />
              <circle cx="100" cy="10" r="5" fill="#f59e0b" />
              {/* Cute green headphones */}
              <rect x="52" y="32" width="9" height="24" rx="4.5" fill="#00b14f" />
              <rect x="139" y="32" width="9" height="24" rx="4.5" fill="#00b14f" />
              <path d="M57 32C57 15 143 15 143 32" stroke="#00b14f" strokeWidth="3.5" fill="none" strokeLinecap="round" />

              {/* Open Book in Robot's Hands */}
              <path
                d="M60 102C75 97 96 100 100 106C104 100 125 97 140 102V124C125 119 104 122 100 128C96 122 75 119 60 124V102Z"
                fill="#ffffff"
                stroke="#006535"
                strokeWidth="2.5"
              />
              <line x1="100" y1="106" x2="100" y2="128" stroke="#00b14f" strokeWidth="2" />
              {/* Magic sparkles */}
              <circle cx="162" cy="42" r="3" fill="#f59e0b" />
              <circle cx="36" cy="65" r="2.5" fill="#00b14f" />
              <circle cx="170" cy="85" r="2" fill="#3b82f6" />
            </svg>
          </div>
        </div>
      </section>

      {/* Main Container */}
      <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
        {/* Category Pills (Matching Hình 3 pill buttons) */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '10px',
            marginBottom: '24px',
          }}
        >
          {otherCategories.map((cat) => (
            <button
              key={cat.slug}
              type="button"
              onClick={() => navigate(`/blog/${cat.slug}`)}
              style={{
                background: 'var(--card)',
                border: '1px solid var(--line2)',
                borderRadius: '999px',
                padding: '8px 18px',
                fontSize: '13.5px',
                fontWeight: 500,
                color: 'var(--ink2)',
                cursor: 'pointer',
                transition: 'all 0.18s ease',
                display: 'inline-flex',
                alignItems: 'center',
                boxShadow: 'var(--sh-s)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#00b14f';
                e.currentTarget.style.color = '#00b14f';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--line2)';
                e.currentTarget.style.color = 'var(--ink2)';
                e.currentTarget.style.transform = 'none';
              }}
            >
              {cat.shortName || cat.name}
            </button>
          ))}
        </div>

        {/* Breadcrumb Navigation (Trang chủ > Cẩm nang nghề nghiệp > Tên danh mục) */}
        <nav
          aria-label="Breadcrumb"
          style={{
            fontSize: '13.5px',
            color: 'var(--muted)',
            marginBottom: '28px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Link to="/" style={{ color: 'var(--muted)', textDecoration: 'none' }}>
            Trang chủ
          </Link>
          <span>›</span>
          <Link to="/blog/huong-nghiep" style={{ color: '#00b14f', fontWeight: 500, textDecoration: 'none' }}>
            Cẩm nang nghề nghiệp
          </Link>
          <span>›</span>
          <span style={{ color: 'var(--ink)', fontWeight: 600 }}>{currentCategory.name}</span>
        </nav>

        {/* Section Heading: "Bài viết nổi bật" */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '24px',
          }}
        >
          <h2
            style={{
              fontSize: '24px',
              fontWeight: 800,
              color: 'var(--ink)',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            Bài viết nổi bật
          </h2>
          <span style={{ fontSize: '13.5px', color: 'var(--muted)' }}>
            {displayArticles.length} bài viết
          </span>
        </div>

        {/* Featured Hero Article Card */}
        {featuredArticle && (
          <div
            onClick={() => setSelectedArticle(featuredArticle)}
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '28px',
              background: 'var(--card)',
              border: '1px solid var(--hair2)',
              borderRadius: '18px',
              overflow: 'hidden',
              boxShadow: 'var(--sh-m)',
              marginBottom: '36px',
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 16px 32px rgba(0,0,0,0.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = 'var(--sh-m)';
            }}
          >
            <div
              style={{
                height: '320px',
                background: '#e2e8f0',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <img
                src={featuredArticle.imageUrl}
                alt={featuredArticle.title}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  top: '16px',
                  left: '16px',
                  background: 'rgba(0, 177, 79, 0.92)',
                  color: '#ffffff',
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  letterSpacing: '0.04em',
                }}
              >
                {featuredArticle.categoryName}
              </div>
            </div>

            <div
              style={{
                padding: '32px 28px 32px 0',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  fontSize: '12.5px',
                  color: 'var(--muted)',
                  marginBottom: '12px',
                }}
              >
                <span>{featuredArticle.publishedAt}</span>
                <span>•</span>
                <span>{featuredArticle.readingMinutes} phút đọc</span>
                <span>•</span>
                <span>{featuredArticle.author}</span>
              </div>

              <h3
                style={{
                  fontSize: '22px',
                  fontWeight: 700,
                  color: 'var(--ink)',
                  lineHeight: 1.35,
                  marginBottom: '12px',
                }}
              >
                {featuredArticle.title}
              </h3>

              <p
                style={{
                  fontSize: '14.5px',
                  color: 'var(--ink2)',
                  lineHeight: 1.6,
                  marginBottom: '20px',
                }}
              >
                {featuredArticle.excerpt}
              </p>

              <div>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: '#00b14f',
                    fontWeight: 600,
                    fontSize: '14px',
                  }}
                >
                  Đọc tiếp bài viết
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Other Articles Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '24px',
            marginBottom: '48px',
          }}
        >
          {listArticles.map((article) => (
            <div
              key={article.id}
              onClick={() => setSelectedArticle(article)}
              style={{
                background: 'var(--card)',
                border: '1px solid var(--hair2)',
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: 'var(--sh-s)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = 'var(--sh-m)';
                e.currentTarget.style.borderColor = 'var(--line2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = 'var(--sh-s)';
                e.currentTarget.style.borderColor = 'var(--hair2)';
              }}
            >
              <div style={{ height: '180px', position: 'relative', overflow: 'hidden' }}>
                <img
                  src={article.imageUrl}
                  alt={article.title}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
                <span
                  style={{
                    position: 'absolute',
                    top: '12px',
                    left: '12px',
                    background: 'rgba(15, 23, 42, 0.75)',
                    backdropFilter: 'blur(4px)',
                    color: '#ffffff',
                    fontSize: '10.5px',
                    fontWeight: 600,
                    padding: '3px 8px',
                    borderRadius: '4px',
                  }}
                >
                  {article.categoryName}
                </span>
              </div>

              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '12px',
                    color: 'var(--muted)',
                    marginBottom: '8px',
                  }}
                >
                  <span>{article.publishedAt}</span>
                  <span>•</span>
                  <span>{article.readingMinutes} phút đọc</span>
                </div>

                <h4
                  style={{
                    fontSize: '16px',
                    fontWeight: 700,
                    color: 'var(--ink)',
                    lineHeight: 1.4,
                    marginBottom: '10px',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {article.title}
                </h4>

                <p
                  style={{
                    fontSize: '13px',
                    color: 'var(--ink2)',
                    lineHeight: 1.55,
                    marginBottom: '16px',
                    flex: 1,
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {article.excerpt}
                </p>

                <div
                  style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#00b14f',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  Đọc bài viết →
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Article Detail Reading Modal */}
      {selectedArticle && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="article-modal-title"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(12, 12, 14, 0.65)',
            backdropFilter: 'blur(5px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
          }}
          onClick={() => setSelectedArticle(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--card)',
              maxWidth: '740px',
              width: '100%',
              maxHeight: '90vh',
              borderRadius: '20px',
              boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
              overflowY: 'auto',
              padding: '36px',
              position: 'relative',
            }}
          >
            <button
              type="button"
              onClick={() => setSelectedArticle(null)}
              aria-label="Đóng bài viết"
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'var(--soft2)',
                border: 'none',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'var(--ink)',
              }}
            >
              ✕
            </button>

            <div
              style={{
                display: 'inline-block',
                background: '#e8f7ee',
                color: '#008b3e',
                fontSize: '12px',
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: '6px',
                marginBottom: '12px',
              }}
            >
              {selectedArticle.categoryName}
            </div>

            <h2
              id="article-modal-title"
              style={{
                fontSize: '24px',
                fontWeight: 800,
                color: 'var(--ink)',
                lineHeight: 1.35,
                marginBottom: '14px',
              }}
            >
              {selectedArticle.title}
            </h2>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                fontSize: '13px',
                color: 'var(--muted)',
                marginBottom: '24px',
                paddingBottom: '16px',
                borderBottom: '1px solid var(--line)',
              }}
            >
              <span>{selectedArticle.publishedAt}</span>
              <span>•</span>
              <span>Tác giả: {selectedArticle.author}</span>
              <span>•</span>
              <span>{selectedArticle.readingMinutes} phút đọc</span>
            </div>

            <div style={{ height: '260px', borderRadius: '12px', overflow: 'hidden', marginBottom: '24px' }}>
              <img
                src={selectedArticle.imageUrl}
                alt={selectedArticle.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>

            <div style={{ fontSize: '15.5px', lineHeight: 1.75, color: 'var(--ink2)' }}>
              {selectedArticle.content.map((paragraph, index) => (
                <p key={index} style={{ marginBottom: '16px' }}>
                  {paragraph}
                </p>
              ))}
            </div>

            <div style={{ marginTop: '32px', textAlign: 'center' }}>
              <button
                type="button"
                className="btn primary"
                onClick={() => setSelectedArticle(null)}
              >
                Hoàn tất đọc
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
