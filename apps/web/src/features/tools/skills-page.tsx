import React, { useState } from 'react';
import { Link } from 'react-router-dom';

interface SkillNode {
  title: string;
  category: string;
  level: 'Cơ bản' | 'Nâng cao' | 'Chuyên sâu';
  description: string;
}

const SKILL_DOMAINS = [
  {
    role: 'Backend Engineer',
    skills: [
      { title: 'Ngôn ngữ & Runtime', category: 'Core', level: 'Cơ bản', description: 'TypeScript, Node.js / Go / Java / Python, Async programming, Memory model' },
      { title: 'Cơ sở dữ liệu & Modeling', category: 'Data', level: 'Cơ bản', description: 'PostgreSQL, MySQL, Indexing, Transactions, Normalization, Query optimization' },
      { title: 'API & Architecture', category: 'Design', level: 'Nâng cao', description: 'REST, GraphQL, gRPC, Clean Architecture, Domain-Driven Design, Saga' },
      { title: 'Caching & Messaging', category: 'Scale', level: 'Nâng cao', description: 'Redis Cache, Kafka, RabbitMQ, Outbox pattern, Event-driven architecture' },
      { title: 'Container & CI/CD', category: 'DevOps', level: 'Chuyên sâu', description: 'Docker, Kubernetes, GitHub Actions, Helm, Zero-downtime deployment' },
      { title: 'Security & Observability', category: 'Ops', level: 'Chuyên sâu', description: 'OAuth2, JWT, OpenTelemetry, Prometheus, Grafana, Distributed tracing' },
    ] as SkillNode[],
  },
  {
    role: 'Frontend Engineer',
    skills: [
      { title: 'Modern JavaScript / TS', category: 'Core', level: 'Cơ bản', description: 'ESNext, TypeScript strict mode, Async/Await, Web APIs' },
      { title: 'React Ecosystem', category: 'Framework', level: 'Cơ bản', description: 'React 19, Hooks, State Management, Next.js / Vite' },
      { title: 'Styling & Design System', category: 'UI', level: 'Nâng cao', description: 'CSS Variables, Responsive grid, Accessibility (a11y), Tailwind / CSS Modules' },
      { title: 'Web Performance', category: 'Optimization', level: 'Nâng cao', description: 'Core Web Vitals (LCP, INP, CLS), Code-splitting, Image optimization' },
      { title: 'Testing & Quality', category: 'QA', level: 'Chuyên sâu', description: 'Vitest, Testing Library, Playwright E2E, Mocking' },
      { title: 'Micro-frontends & Architecture', category: 'Architecture', level: 'Chuyên sâu', description: 'Module Federation, Monorepo Turborepo, SSR & Streaming' },
    ] as SkillNode[],
  },
];

export function SkillsPage() {
  const [selectedRoleIndex, setSelectedRoleIndex] = useState<number>(0);
  const currentDomain = SKILL_DOMAINS[selectedRoleIndex] || (SKILL_DOMAINS[0] as (typeof SKILL_DOMAINS)[0]);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Banner */}
      <section
        style={{
          background: 'linear-gradient(135deg, #022c22 0%, #064e3b 100%)',
          color: '#ffffff',
          padding: '44px 0',
        }}
      >
        <div className="container" style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <span
              style={{
                background: '#10b981',
                color: '#064e3b',
                fontSize: '11px',
                fontWeight: 800,
                padding: '3px 8px',
                borderRadius: '4px',
              }}
            >
              SKILLS
            </span>
            <span style={{ fontSize: '13px', color: '#a7f3d0' }}>Khung kỹ năng chuẩn quốc tế</span>
          </div>
          <h1 style={{ fontSize: '30px', fontWeight: 800, margin: '0 0 12px 0' }}>
            Talento Skills - Bản đồ kỹ năng & Lộ trình công nghệ
          </h1>
          <p style={{ fontSize: '15px', color: '#d1fae5', margin: 0, maxWidth: '720px', lineHeight: 1.6 }}>
            Hệ thống hóa toàn bộ các kỹ năng cốt lõi theo từng vị trí chuyên môn, giúp bạn tự đánh giá năng lực và chuẩn bị lộ trình thăng tiến rõ ràng.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <div className="container" style={{ maxWidth: '1100px', margin: '0 auto', padding: '28px 24px' }}>
        <nav style={{ fontSize: '13.5px', color: 'var(--muted)', marginBottom: '24px' }}>
          <Link to="/" style={{ color: 'var(--muted)', textDecoration: 'none' }}>
            Trang chủ
          </Link>
          <span style={{ margin: '0 8px' }}>›</span>
          <span style={{ color: 'var(--muted)' }}>Công cụ</span>
          <span style={{ margin: '0 8px' }}>›</span>
          <span style={{ color: 'var(--ink)', fontWeight: 600 }}>Talento Skills</span>
        </nav>

        {/* Role Switcher */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '32px' }}>
          {SKILL_DOMAINS.map((domain, idx) => (
            <button
              key={domain.role}
              type="button"
              onClick={() => setSelectedRoleIndex(idx)}
              style={{
                padding: '12px 24px',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: 700,
                border: '2px solid',
                borderColor: selectedRoleIndex === idx ? '#059669' : 'var(--line2)',
                background: selectedRoleIndex === idx ? '#ecfdf5' : 'var(--card)',
                color: selectedRoleIndex === idx ? '#065f46' : 'var(--ink2)',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {domain.role}
            </button>
          ))}
        </div>

        {/* Skills Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '20px',
          }}
        >
          {currentDomain.skills.map((skill, index) => (
            <div
              key={index}
              style={{
                background: 'var(--card)',
                border: '1px solid var(--hair2)',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: 'var(--sh-s)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '12px',
                }}
              >
                <span
                  style={{
                    background: '#e0f2fe',
                    color: '#0369a1',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: '6px',
                  }}
                >
                  {skill.category}
                </span>
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color:
                      skill.level === 'Cơ bản'
                        ? '#059669'
                        : skill.level === 'Nâng cao'
                        ? '#d97706'
                        : '#7c3aed',
                  }}
                >
                  {skill.level}
                </span>
              </div>

              <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--ink)', marginBottom: '8px' }}>
                {skill.title}
              </h3>

              <p style={{ fontSize: '13.5px', color: 'var(--ink2)', lineHeight: 1.6, margin: 0 }}>
                {skill.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
