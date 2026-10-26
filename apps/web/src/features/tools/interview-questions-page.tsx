import React, { useState } from 'react';
import { Link } from 'react-router-dom';

interface InterviewQuestion {
  id: string;
  category: string;
  level: 'Junior' | 'Middle' | 'Senior';
  question: string;
  sampleAnswer: string;
  keyPoints: string[];
}

const SAMPLE_QUESTIONS: InterviewQuestion[] = [
  {
    id: 'iq-1',
    category: 'Backend',
    level: 'Middle',
    question: 'Hãy giải thích cơ chế hoạt động của Database Index (B-Tree) và khi nào không nên đánh index?',
    sampleAnswer: 'B-Tree Index sắp xếp dữ liệu theo cấu trúc cây tự cân bằng giúp tra cứu đạt độ phức tạp O(log N). Không nên đánh index trên cột có độ đa dạng thấp (low cardinality như giới tính), bảng quá nhỏ hoặc bảng có tần suất ghi (INSERT/UPDATE/DELETE) cực lớn.',
    keyPoints: [
      'Hiểu bản chất cây B-Tree và phân biệt Clustered vs Non-clustered Index.',
      'Chi phí duy trì Index khi thực hiện thao tác DML.',
      'Độ chọn lọc (Selectivity/Cardinality) của dữ liệu.',
    ],
  },
  {
    id: 'iq-2',
    category: 'Backend',
    level: 'Senior',
    question: 'Làm thế nào để đảm bảo tính nhất quán (Consistency) trong kiến trúc Microservices khi không thể dùng Distributed Transaction?',
    sampleAnswer: 'Áp dụng mô hình Saga Pattern (Choreography hoặc Orchestration) kết hợp Outbox Pattern và Idempotent Consumer để đảm bảo tính nhất quán cuối cùng (Eventual Consistency) mà không làm suy giảm hiệu năng hệ thống.',
    keyPoints: [
      'Hiểu định lý CAP và đánh đổi giữa ACID vs BASE.',
      'Triển khai Saga Pattern và cơ chế Compensating Transactions.',
      'Đảm bảo tính Idempotency và phòng chống mất message bằng Outbox Pattern.',
    ],
  },
  {
    id: 'iq-3',
    category: 'Frontend',
    level: 'Junior',
    question: 'Sự khác biệt giữa Virtual DOM và Real DOM trong React là gì? React xử lý cập nhật giao diện như thế nào?',
    sampleAnswer: 'Virtual DOM là bản sao nhẹ (JavaScript object) của Real DOM trên bộ nhớ. Khi state thay đổi, React chạy thuật toán Reconciliation (Diffing) để so sánh cây VDOM mới và cũ, sau đó chỉ cập nhật đúng các node thay đổi vào Real DOM (Batch Update).',
    keyPoints: [
      'Virtual DOM giảm thiểu thao tác trực tiếp lên DOM thật gây Reflow/Repaint tốn kém.',
      'Thuật toán Reconciliation và nguyên tắc key trong danh sách.',
      'Cơ chế Fiber và lập lịch ưu tiên cập nhật.',
    ],
  },
  {
    id: 'iq-4',
    category: 'Frontend',
    level: 'Middle',
    question: 'Làm thế nào để tối ưu hiệu năng (Web Vitals) cho ứng dụng React có quy mô lớn?',
    sampleAnswer: 'Sử dụng Code Splitting (React.lazy / dynamic import), tối ưu hóa tái render (useMemo, useCallback, React.memo), nén tài nguyên hình ảnh (WebP/AVIF), phân tích bundle với bundle-analyzer và tối ưu hóa các chỉ số LCP, FID/INP, CLS.',
    keyPoints: [
      'Phân tích Core Web Vitals: LCP, INP, CLS.',
      'Tối ưu kích thước bundle và lazy load các route lớn.',
      'Tránh memory leak trong useEffect và quản lý state hiệu quả.',
    ],
  },
  {
    id: 'iq-5',
    category: 'DevOps',
    level: 'Middle',
    question: 'Giải thích quy trình CI/CD hoàn chỉnh và sự khác biệt giữa Blue-Green Deployment và Canary Deployment?',
    sampleAnswer: 'Blue-Green chạy song song 2 môi trường giống hệt nhau và chuyển đổi traffic qua Router ngay lập tức. Canary chuyển dần một phần nhỏ traffic (5-10%) sang phiên bản mới để kiểm tra lỗi thực tế trước khi rollout toàn bộ.',
    keyPoints: [
      'Các giai đoạn trong pipeline: Lint, Test, Build, Containerize, Security Scan, Deploy.',
      'Chiến lược triển khai giảm thiểu Zero Downtime.',
      'Cơ chế Rollback tự động khi xảy ra lỗi.',
    ],
  },
  {
    id: 'iq-6',
    category: 'QA / Tester',
    level: 'Middle',
    question: 'Bạn thiết kế Test Cases như thế nào bằng kỹ thuật Phân vùng tương đương (Equivalence Partitioning) và Phân tích giá trị biên (Boundary Value Analysis)?',
    sampleAnswer: 'Chia tập dữ liệu đầu vào thành các lớp tương đương hợp lệ và không hợp lệ để giảm số lượng test case nhưng vẫn đảm bảo độ bao phủ. Sau đó tập trung kiểm tra tại các giá trị biên (min, min+1, max-1, max) - nơi thường xuyên xảy ra lỗi logic nhất.',
    keyPoints: [
      'Áp dụng BVA với boundary 2-point và 3-point.',
      'Thiết kế ma trận kiểm thử (Traceability Matrix).',
      'Đánh giá rủi ro và độ ưu tiên thực thi test.',
    ],
  },
];

export function InterviewQuestionsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('Tất cả');
  const [selectedLevel, setSelectedLevel] = useState<string>('Tất cả');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [expandedId, setExpandedId] = useState<string | null>('iq-1');

  const categories = ['Tất cả', 'Backend', 'Frontend', 'DevOps', 'QA / Tester'];
  const levels = ['Tất cả', 'Junior', 'Middle', 'Senior'];

  const filteredQuestions = SAMPLE_QUESTIONS.filter((q) => {
    const matchCategory = selectedCategory === 'Tất cả' || q.category === selectedCategory;
    const matchLevel = selectedLevel === 'Tất cả' || q.level === selectedLevel;
    const matchKeyword =
      !searchKeyword ||
      q.question.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      q.sampleAnswer.toLowerCase().includes(searchKeyword.toLowerCase());
    return matchCategory && matchLevel && matchKeyword;
  });

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Banner */}
      <section
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          color: '#ffffff',
          padding: '44px 0',
        }}
      >
        <div className="container" style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <span
              style={{
                background: '#00b14f',
                color: '#ffffff',
                fontSize: '11px',
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: '4px',
              }}
            >
              MỚI
            </span>
            <span style={{ fontSize: '13px', color: '#94a3b8' }}>Công cụ phỏng vấn Talento</span>
          </div>
          <h1 style={{ fontSize: '30px', fontWeight: 800, margin: '0 0 12px 0' }}>
            Bộ câu hỏi phỏng vấn chuẩn chuyên môn
          </h1>
          <p style={{ fontSize: '15px', color: '#cbd5e1', margin: 0, maxWidth: '700px', lineHeight: 1.6 }}>
            Tổng hợp ngân hàng câu hỏi phỏng vấn thực tế từ các tập đoàn công nghệ hàng đầu, kèm câu trả lời mẫu chuẩn mực và tiêu chí đánh giá của nhà tuyển dụng.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <div className="container" style={{ maxWidth: '1100px', margin: '0 auto', padding: '28px 24px' }}>
        {/* Breadcrumb */}
        <nav style={{ fontSize: '13.5px', color: 'var(--muted)', marginBottom: '20px' }}>
          <Link to="/" style={{ color: 'var(--muted)', textDecoration: 'none' }}>
            Trang chủ
          </Link>
          <span style={{ margin: '0 8px' }}>›</span>
          <span style={{ color: 'var(--muted)' }}>Công cụ</span>
          <span style={{ margin: '0 8px' }}>›</span>
          <span style={{ color: 'var(--ink)', fontWeight: 600 }}>Bộ câu hỏi phỏng vấn</span>
        </nav>

        {/* Filter Bar */}
        <div
          style={{
            background: 'var(--card)',
            border: '1px solid var(--hair2)',
            borderRadius: '16px',
            padding: '20px',
            boxShadow: 'var(--sh-s)',
            marginBottom: '28px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '16px',
            alignItems: 'center',
          }}
        >
          {/* Keyword search */}
          <div style={{ flex: 1, minWidth: '240px' }}>
            <input
              type="text"
              placeholder="Tìm kiếm câu hỏi, từ khóa kỹ thuật..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1px solid var(--line2)',
                background: 'var(--soft2)',
                fontSize: '14px',
                color: 'var(--ink)',
              }}
            />
          </div>

          {/* Category filter pills */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '7px 14px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 500,
                  border: '1px solid',
                  borderColor: selectedCategory === cat ? '#00b14f' : 'var(--line2)',
                  background: selectedCategory === cat ? '#e8f7ee' : 'var(--card)',
                  color: selectedCategory === cat ? '#008b3e' : 'var(--ink2)',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Level filter */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {levels.map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setSelectedLevel(lvl)}
                style={{
                  padding: '7px 12px',
                  borderRadius: '8px',
                  fontSize: '12.5px',
                  fontWeight: 500,
                  border: '1px solid',
                  borderColor: selectedLevel === lvl ? 'var(--blue)' : 'var(--line2)',
                  background: selectedLevel === lvl ? 'var(--over-bg)' : 'var(--card)',
                  color: selectedLevel === lvl ? 'var(--blue)' : 'var(--ink2)',
                  cursor: 'pointer',
                }}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        {/* Questions list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredQuestions.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '48px',
                background: 'var(--card)',
                borderRadius: '16px',
                border: '1px dashed var(--line2)',
              }}
            >
              <p style={{ color: 'var(--muted)', fontSize: '15px' }}>
                Không tìm thấy câu hỏi phù hợp với tiêu chí lọc.
              </p>
            </div>
          ) : (
            filteredQuestions.map((q) => {
              const isExpanded = expandedId === q.id;
              return (
                <div
                  key={q.id}
                  style={{
                    background: 'var(--card)',
                    border: '1px solid var(--hair2)',
                    borderRadius: '14px',
                    overflow: 'hidden',
                    boxShadow: 'var(--sh-s)',
                    transition: 'all 0.2s',
                  }}
                >
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : q.id)}
                    style={{
                      padding: '18px 22px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      gap: '16px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                      <span
                        style={{
                          background: 'var(--soft2)',
                          color: '#008b3e',
                          fontWeight: 700,
                          fontSize: '11.5px',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          border: '1px solid rgba(0, 177, 79, 0.2)',
                        }}
                      >
                        {q.category}
                      </span>
                      <span
                        style={{
                          background: 'var(--soft2)',
                          color: 'var(--muted)',
                          fontSize: '11.5px',
                          padding: '3px 8px',
                          borderRadius: '6px',
                        }}
                      >
                        {q.level}
                      </span>
                      <h3
                        style={{
                          fontSize: '15.5px',
                          fontWeight: 600,
                          color: 'var(--ink)',
                          margin: 0,
                          lineHeight: 1.45,
                        }}
                      >
                        {q.question}
                      </h3>
                    </div>
                    <span
                      style={{
                        fontSize: '18px',
                        color: 'var(--muted)',
                        transform: isExpanded ? 'rotate(180deg)' : 'none',
                        transition: 'transform 0.2s',
                      }}
                    >
                      ▾
                    </span>
                  </div>

                  {isExpanded && (
                    <div
                      style={{
                        padding: '20px 22px',
                        background: 'var(--soft2)',
                        borderTop: '1px solid var(--line)',
                      }}
                    >
                      <h4
                        style={{
                          fontSize: '13px',
                          fontWeight: 700,
                          color: '#008b3e',
                          textTransform: 'uppercase',
                          marginBottom: '8px',
                          letterSpacing: '0.03em',
                        }}
                      >
                        Gợi ý câu trả lời mẫu:
                      </h4>
                      <p
                        style={{
                          fontSize: '14.5px',
                          lineHeight: 1.65,
                          color: 'var(--ink)',
                          marginBottom: '16px',
                        }}
                      >
                        {q.sampleAnswer}
                      </p>

                      <h4
                        style={{
                          fontSize: '13px',
                          fontWeight: 700,
                          color: 'var(--ink2)',
                          marginBottom: '8px',
                        }}
                      >
                        Ý chính nhà tuyển dụng mong đợi:
                      </h4>
                      <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13.5px', color: 'var(--ink2)' }}>
                        {q.keyPoints.map((point, idx) => (
                          <li key={idx} style={{ marginBottom: '6px' }}>
                            {point}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
