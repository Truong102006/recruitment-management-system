import React, { useState } from 'react';
import { Link } from 'react-router-dom';

interface MBTIQuestion {
  id: number;
  question: string;
  optionA: { text: string; dimension: 'E' | 'S' | 'T' | 'J' };
  optionB: { text: string; dimension: 'I' | 'N' | 'F' | 'P' };
}

const QUESTIONS: MBTIQuestion[] = [
  {
    id: 1,
    question: 'Sau một tuần làm việc căng thẳng, bạn nạp lại năng lượng bằng cách nào?',
    optionA: { text: 'Gặp gỡ bạn bè, tham gia tiệc tùng hoặc các sự kiện sôi động', dimension: 'E' },
    optionB: { text: 'Dành thời gian yên tĩnh một mình, đọc sách hoặc xem phim thư giãn', dimension: 'I' },
  },
  {
    id: 2,
    question: 'Khi tiếp cận một bài toán hoặc dự án mới, bạn chú ý điều gì đầu tiên?',
    optionA: { text: 'Dữ liệu thực tế, các con số cụ thể và kinh nghiệm thực chứng', dimension: 'S' },
    optionB: { text: 'Bức tranh tổng thể, ý tưởng mới mẻ và các mối liên kết tương lai', dimension: 'N' },
  },
  {
    id: 3,
    question: 'Khi cần đưa ra quyết định quan trọng trong công việc, bạn dựa trên yếu tố nào?',
    optionA: { text: 'Logic khách quan, nguyên tắc rõ ràng và hiệu quả công việc', dimension: 'T' },
    optionB: { text: 'Giá trị nhân văn, cảm xúc và sự đồng thuận của mọi người', dimension: 'F' },
  },
  {
    id: 4,
    question: 'Cách bạn tổ chức công việc hàng ngày thường diễn ra như thế nào?',
    optionA: { text: 'Lập kế hoạch rõ ràng, theo sát thời hạn và có danh sách việc cần làm', dimension: 'J' },
    optionB: { text: 'Linh hoạt, thích nghi tùy tình huống và mở với những thay đổi bất ngờ', dimension: 'P' },
  },
];

const MBTI_PROFILES: Record<string, { title: string; desc: string; careers: string[] }> = {
  INTJ: {
    title: 'Nhà Kiến Tạo Chiến Lược (Architect)',
    desc: 'Tư duy logic sắc bén, độc lập và có tầm nhìn chiến lược dài hạn.',
    careers: ['Software Architect', 'Data Scientist', 'CTO / Engineering Manager', 'Quản lý Chiến lược'],
  },
  INTP: {
    title: 'Nhà Tư Duy Logic (Logician)',
    desc: 'Đam mê khám phá các lý thuyết phức tạp và sáng tạo giải pháp công nghệ mới.',
    careers: ['AI Researcher', 'Backend Engineer', 'Bảo mật hệ thống', 'Chuyên gia Phân tích'],
  },
  ENTJ: {
    title: 'Nhà Lãnh Đạo Quyết Đoán (Commander)',
    desc: 'Năng động, có tầm nhìn vĩ mô và kỹ năng dẫn dắt đội ngũ chinh phục mục tiêu lớn.',
    careers: ['CEO / Founder', 'Product Director', 'Project Manager', 'Tư vấn Doanh nghiệp'],
  },
  ENTP: {
    title: 'Nhà Phát Minh Sáng Tạo (Debater)',
    desc: 'Nhanh nhạy, thích giải quyết các vấn đề thách thức và thử nghiệm công nghệ đột phá.',
    careers: ['Product Manager', 'Solutions Architect', 'Growth Lead', 'Tech Evangelist'],
  },
  INFJ: {
    title: 'Người Cố Vấn Tận Tâm (Advocate)',
    desc: 'Giàu trực giác, thấu hiểu con người sâu sắc và có nguyên tắc đạo đức mạnh mẽ.',
    careers: ['UX/UI Researcher', 'HR Director', 'Product Designer', 'Huấn luyện viên nghề nghiệp'],
  },
  ENFP: {
    title: 'Người Truyền Cảm Hứng (Campaigner)',
    desc: 'Sáng tạo vô hạn, nhiệt tình và có khả năng kết nối mọi người tuyệt vời.',
    careers: ['Marketing Director', 'Developer Relations', 'Creative Strategist', 'Scrum Master'],
  },
};

export function MbtiTestPage() {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [result, setResult] = useState<string | null>(null);

  const handleSelect = (questionId: number, dimension: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: dimension }));
  };

  const handleCalculate = () => {
    const eCount = Object.values(answers).filter((v) => v === 'E').length;
    const iCount = Object.values(answers).filter((v) => v === 'I').length;
    const sCount = Object.values(answers).filter((v) => v === 'S').length;
    const nCount = Object.values(answers).filter((v) => v === 'N').length;
    const tCount = Object.values(answers).filter((v) => v === 'T').length;
    const fCount = Object.values(answers).filter((v) => v === 'F').length;
    const jCount = Object.values(answers).filter((v) => v === 'J').length;
    const pCount = Object.values(answers).filter((v) => v === 'P').length;

    const type = [
      eCount >= iCount ? 'E' : 'I',
      sCount >= nCount ? 'S' : 'N',
      tCount >= fCount ? 'T' : 'F',
      jCount >= pCount ? 'J' : 'P',
    ].join('');

    setResult(type);
  };

  const currentProfile = result ? MBTI_PROFILES[result] || MBTI_PROFILES['INTJ'] : null;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Banner */}
      <section
        style={{
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
          color: '#ffffff',
          padding: '44px 0',
        }}
      >
        <div className="container" style={{ maxWidth: '960px', margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <span
              style={{
                background: '#818cf8',
                color: '#1e1b4b',
                fontSize: '11px',
                fontWeight: 800,
                padding: '3px 8px',
                borderRadius: '4px',
              }}
            >
              TEST
            </span>
            <span style={{ fontSize: '13px', color: '#c7d2fe' }}>Công cụ trắc nghiệm Talento</span>
          </div>
          <h1 style={{ fontSize: '30px', fontWeight: 800, margin: '0 0 12px 0' }}>
            Trắc nghiệm tính cách nghề nghiệp MBTI
          </h1>
          <p style={{ fontSize: '15px', color: '#e0e7ff', margin: 0, lineHeight: 1.6 }}>
            Khám phá 16 nhóm tính cách để thấu hiểu bản thân, phát huy điểm mạnh bẩm sinh và lựa chọn hướng đi sự nghiệp tối ưu nhất.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <div className="container" style={{ maxWidth: '960px', margin: '0 auto', padding: '28px 24px' }}>
        <nav style={{ fontSize: '13.5px', color: 'var(--muted)', marginBottom: '24px' }}>
          <Link to="/" style={{ color: 'var(--muted)', textDecoration: 'none' }}>
            Trang chủ
          </Link>
          <span style={{ margin: '0 8px' }}>›</span>
          <span style={{ color: 'var(--muted)' }}>Công cụ</span>
          <span style={{ margin: '0 8px' }}>›</span>
          <span style={{ color: 'var(--ink)', fontWeight: 600 }}>Trắc nghiệm MBTI</span>
        </nav>

        {/* Questions list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '32px' }}>
          {QUESTIONS.map((q) => (
            <div
              key={q.id}
              style={{
                background: 'var(--card)',
                border: '1px solid var(--hair2)',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: 'var(--sh-s)',
              }}
            >
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--ink)', marginBottom: '16px' }}>
                Câu {q.id}: {q.question}
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <button
                  type="button"
                  onClick={() => handleSelect(q.id, q.optionA.dimension)}
                  style={{
                    padding: '16px',
                    borderRadius: '12px',
                    border: '2px solid',
                    borderColor: answers[q.id] === q.optionA.dimension ? '#4f46e5' : 'var(--line2)',
                    background: answers[q.id] === q.optionA.dimension ? 'rgba(79, 70, 229, 0.08)' : 'var(--soft2)',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '14px',
                    lineHeight: 1.5,
                    color: 'var(--ink)',
                    transition: 'all 0.15s',
                  }}
                >
                  <strong style={{ display: 'block', marginBottom: '4px', color: '#4f46e5' }}>A.</strong>
                  {q.optionA.text}
                </button>

                <button
                  type="button"
                  onClick={() => handleSelect(q.id, q.optionB.dimension)}
                  style={{
                    padding: '16px',
                    borderRadius: '12px',
                    border: '2px solid',
                    borderColor: answers[q.id] === q.optionB.dimension ? '#4f46e5' : 'var(--line2)',
                    background: answers[q.id] === q.optionB.dimension ? 'rgba(79, 70, 229, 0.08)' : 'var(--soft2)',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '14px',
                    lineHeight: 1.5,
                    color: 'var(--ink)',
                    transition: 'all 0.15s',
                  }}
                >
                  <strong style={{ display: 'block', marginBottom: '4px', color: '#4f46e5' }}>B.</strong>
                  {q.optionB.text}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Calculate button */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <button
            type="button"
            className="btn primary"
            style={{ padding: '12px 36px', fontSize: '15px', fontWeight: 600 }}
            onClick={handleCalculate}
            disabled={Object.keys(answers).length < QUESTIONS.length}
          >
            {Object.keys(answers).length < QUESTIONS.length
              ? `Vui lòng trả lời đủ (${Object.keys(answers).length}/${QUESTIONS.length}) câu hỏi`
              : 'Xem kết quả phân tích tính cách'}
          </button>
        </div>

        {/* Result Card */}
        {result && currentProfile && (
          <div
            style={{
              background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
              border: '2px solid #86efac',
              borderRadius: '20px',
              padding: '32px',
              boxShadow: 'var(--sh-m)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
              <span
                style={{
                  background: '#16a34a',
                  color: '#ffffff',
                  fontSize: '22px',
                  fontWeight: 800,
                  padding: '6px 16px',
                  borderRadius: '10px',
                }}
              >
                {result}
              </span>
              <div>
                <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#14532d', margin: 0 }}>
                  {currentProfile.title}
                </h2>
                <p style={{ margin: 0, fontSize: '14.5px', color: '#166534' }}>{currentProfile.desc}</p>
              </div>
            </div>

            <div style={{ marginTop: '20px', borderTop: '1px solid #bbf7d0', paddingTop: '16px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#14532d', marginBottom: '10px' }}>
                Công việc và vị trí gợi ý phù hợp nhất:
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {currentProfile.careers.map((career, idx) => (
                  <span
                    key={idx}
                    style={{
                      background: '#ffffff',
                      border: '1px solid #86efac',
                      color: '#15803d',
                      fontSize: '13.5px',
                      fontWeight: 600,
                      padding: '6px 14px',
                      borderRadius: '8px',
                    }}
                  >
                    ✓ {career}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
