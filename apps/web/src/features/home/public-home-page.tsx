import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { burst } from '../../lib/talento-effects';
import { useLanguage } from '../../lib/i18n';

interface TodoItem {
  id: string;
  text: string;
  done: boolean;
}

interface DemoCandidate {
  id: string;
  name: string;
  jobTitle: string;
  stage: 'applied' | 'screening' | 'interview' | 'offer' | 'hired' | 'rejected';
  source: string;
  rating: number;
  timeAgo: string;
  interviewTime?: string;
}

interface DemoJob {
  id: string;
  title: string;
  dept: string;
  loc: string;
  type: string;
  openings: number;
  status: 'open' | 'paused' | 'closed';
  candidatesCount: number;
  hiredCount: number;
}

interface DemoInterview {
  id: string;
  candidateName: string;
  jobTitle: string;
  dateStr: string;
  dayNum: string;
  dayOfWeek: string;
  time: string;
  endTime: string;
  mode: string;
  interviewer: string;
}

const STAGES = [
  { id: 'applied', name: 'Ứng tuyển', color: '#1fc2ff' },
  { id: 'screening', name: 'Sàng lọc', color: '#1677ff' },
  { id: 'interview', name: 'Phỏng vấn', color: '#f6a623' },
  { id: 'offer', name: 'Đề nghị', color: '#ff7a3d' },
  { id: 'hired', name: 'Đã nhận', color: '#1fa971' },
  { id: 'rejected', name: 'Từ chối', color: '#a9a9af' },
];

export const PublicHomePage: React.FC = () => {
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'dash' | 'jobs' | 'cands' | 'ints'>('dash');
  const [todoList, setTodoList] = useState<TodoItem[]>([
    { id: 't1', text: 'Rà soát CV Frontend trước 11:00', done: false },
    { id: 't2', text: 'Gửi email mời phỏng vấn cho Trần Quốc Bảo', done: false },
    { id: 't3', text: 'Duyệt ngân sách tuyển dụng quý 4', done: false },
    { id: 't4', text: 'Phản hồi đề nghị cho Võ Ngọc Lan', done: true },
  ]);
  const [newTodoText, setNewTodoText] = useState('');
  const [dashFilterTab, setDashFilterTab] = useState<'new' | 'interview' | 'hired'>('new');
  const [candidateFilterJob, setCandidateFilterJob] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [interviewTab, setInterviewTab] = useState<'up' | 'past'>('up');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Countdown timer simulation for next interview
  const [countdown, setCountdown] = useState('01:42:15');

  useEffect(() => {
    let secondsLeft = 1 * 3600 + 42 * 60 + 15;
    const interval = setInterval(() => {
      secondsLeft = Math.max(0, secondsLeft - 1);
      const h = Math.floor(secondsLeft / 3600);
      const m = Math.floor((secondsLeft % 3600) / 60);
      const s = secondsLeft % 60;
      setCountdown(
        `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`,
      );
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleToggleTodo = (id: string, e: React.MouseEvent<HTMLElement>) => {
    setTodoList((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const next = !t.done;
          if (next) {
            burst(e.clientX, e.clientY, 20);
          }
          return { ...t, done: next };
        }
        return t;
      }),
    );
  };

  const handleAddTodo = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newTodoText.trim()) {
      setTodoList((prev) => [
        ...prev,
        { id: `t_${Date.now()}`, text: newTodoText.trim(), done: false },
      ]);
      setNewTodoText('');
      showToast('Đã thêm việc cần làm');
    }
  };

  const handleDeleteTodo = (id: string) => {
    setTodoList((prev) => prev.filter((t) => t.id !== id));
    showToast('Đã xoá việc');
  };

  const [candidates, setCandidates] = useState<DemoCandidate[]>([
    {
      id: 'c1',
      name: 'Nguyễn Minh Anh',
      jobTitle: 'Frontend Developer',
      stage: 'interview',
      source: 'TopCV',
      rating: 4,
      timeAgo: 'Hôm nay',
      interviewTime: 'Hôm nay · 13:00',
    },
    {
      id: 'c2',
      name: 'Trần Quốc Bảo',
      jobTitle: 'Frontend Developer',
      stage: 'interview',
      source: 'LinkedIn',
      rating: 5,
      timeAgo: 'Hôm qua',
      interviewTime: 'Ngày mai · 10:00',
    },
    {
      id: 'c3',
      name: 'Lê Thu Hà',
      jobTitle: 'Frontend Developer',
      stage: 'screening',
      source: 'Website',
      rating: 3,
      timeAgo: '3 ngày trước',
    },
    {
      id: 'c4',
      name: 'Phạm Gia Huy',
      jobTitle: 'Frontend Developer',
      stage: 'applied',
      source: 'TopCV',
      rating: 0,
      timeAgo: '1 ngày trước',
    },
    {
      id: 'c5',
      name: 'Võ Ngọc Lan',
      jobTitle: 'UI/UX Designer',
      stage: 'offer',
      source: 'Giới thiệu',
      rating: 5,
      timeAgo: '5 ngày trước',
    },
    {
      id: 'c6',
      name: 'Đặng Hoàng Nam',
      jobTitle: 'UI/UX Designer',
      stage: 'screening',
      source: 'LinkedIn',
      rating: 3,
      timeAgo: '4 ngày trước',
    },
    {
      id: 'c7',
      name: 'Bùi Khánh Linh',
      jobTitle: 'UI/UX Designer',
      stage: 'applied',
      source: 'Website',
      rating: 0,
      timeAgo: 'Hôm nay',
    },
    {
      id: 'c8',
      name: 'Hoàng Đức Thành',
      jobTitle: 'Chuyên viên Nhân sự',
      stage: 'hired',
      source: 'Giới thiệu',
      rating: 4,
      timeAgo: '1 tuần trước',
    },
    {
      id: 'c9',
      name: 'Phan Mai Chi',
      jobTitle: 'Chuyên viên Nhân sự',
      stage: 'rejected',
      source: 'TopCV',
      rating: 2,
      timeAgo: '2 tuần trước',
    },
  ]);

  const jobs: DemoJob[] = [
    {
      id: 'j1',
      title: 'Frontend Developer',
      dept: 'Kỹ thuật',
      loc: 'TP. Hồ Chí Minh',
      type: 'Toàn thời gian',
      openings: 2,
      status: 'open',
      candidatesCount: 4,
      hiredCount: 0,
    },
    {
      id: 'j2',
      title: 'UI/UX Designer',
      dept: 'Thiết kế',
      loc: 'TP. Hồ Chí Minh',
      type: 'Toàn thời gian',
      openings: 1,
      status: 'open',
      candidatesCount: 3,
      hiredCount: 0,
    },
    {
      id: 'j3',
      title: 'Chuyên viên Nhân sự',
      dept: 'Nhân sự',
      loc: 'Hà Nội',
      type: 'Toàn thời gian',
      openings: 1,
      status: 'open',
      candidatesCount: 2,
      hiredCount: 1,
    },
    {
      id: 'j4',
      title: 'Marketing Executive',
      dept: 'Marketing',
      loc: 'TP. Hồ Chí Minh',
      type: 'Bán thời gian',
      openings: 2,
      status: 'paused',
      candidatesCount: 1,
      hiredCount: 0,
    },
  ];

  const interviews: DemoInterview[] = [
    {
      id: 'i1',
      candidateName: 'Nguyễn Minh Anh',
      jobTitle: 'Frontend Developer',
      dateStr: 'Hôm nay',
      dayNum: '25',
      dayOfWeek: 'T7',
      time: '13:00',
      endTime: '14:00',
      mode: 'Online',
      interviewer: 'Hồ Thị Mai',
    },
    {
      id: 'i2',
      candidateName: 'Trần Quốc Bảo',
      jobTitle: 'Frontend Developer',
      dateStr: 'Ngày mai',
      dayNum: '26',
      dayOfWeek: 'CN',
      time: '10:00',
      endTime: '10:45',
      mode: 'Trực tiếp',
      interviewer: 'Lê Văn Sơn',
    },
  ];

  // Drag and Drop simulation for Kanban board
  const draggedCandidateId = useRef<string | null>(null);

  const handleDragStart = (id: string) => {
    draggedCandidateId.current = id;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (stageId: DemoCandidate['stage'], e: React.DragEvent) => {
    e.preventDefault();
    const id = draggedCandidateId.current;
    if (!id) return;
    setCandidates((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          if (stageId === 'hired') {
            burst(e.clientX, e.clientY, 40);
            showToast(`Tuyệt vời! Đã chuyển ${c.name} sang Đã nhận.`);
          } else {
            burst(e.clientX, e.clientY, 12);
            showToast(`Đã chuyển ${c.name} sang ${stageId}`);
          }
          return { ...c, stage: stageId };
        }
        return c;
      }),
    );
    draggedCandidateId.current = null;
  };

  const filteredCandidates = candidates.filter((c) => {
    if (candidateFilterJob !== 'ALL' && c.jobTitle !== candidateFilterJob) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return c.name.toLowerCase().includes(q) || c.jobTitle.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div style={{ maxWidth: '1180px', margin: '0 auto', padding: '0 16px' }}>
      {/* Toast popup */}
      {toastMessage && (
        <div className="toast on" role="status">
          {toastMessage}
        </div>
      )}

      {/* Hero Section */}
      <section
        className="hero"
        id="top"
        style={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: '32px',
          backgroundColor: 'var(--canvas)',
          backgroundImage: 'radial-gradient(var(--dot) 1px, transparent 1.2px)',
          backgroundSize: '7px 7px',
          minHeight: '660px',
          display: 'grid',
          placeItems: 'center',
          textAlign: 'center',
          padding: '90px 24px',
          border: '1px solid var(--hair)',
          marginBottom: '60px',
        }}
      >
        {/* Decorative elements */}
        <div className="deco note-wrap" style={{ position: 'absolute', left: '24px', top: '26px', width: '270px', height: '330px', zIndex: 1 }} aria-hidden="true">
          <div
            className="glass"
            style={{
              position: 'absolute',
              left: '-20px',
              top: '112px',
              width: '250px',
              height: '250px',
              borderRadius: '34px',
              background: 'linear-gradient(150deg, rgba(31,194,255,.34), rgba(124,108,255,.24) 60%, rgba(255,140,170,.22))',
              border: '1px solid rgba(255,255,255,.5)',
              transform: 'rotate(-12deg)',
              boxShadow: '0 14px 34px rgba(0,0,0,.07)',
            }}
          />
          <div
            className="note"
            style={{
              position: 'absolute',
              left: '34px',
              top: '10px',
              width: '210px',
              height: '170px',
              background: 'linear-gradient(180deg,#fbea7a,#f6dc54)',
              transform: 'rotate(-3deg)',
              padding: '30px 20px 20px',
              font: 'italic 20px/1.22 var(--font-h)',
              textAlign: 'left',
              boxShadow: '0 12px 24px rgba(0,0,0,.12)',
              color: '#2b2410',
              borderRadius: '6px',
            }}
          >
            <span
              style={{
                position: 'absolute',
                left: '50%',
                top: '-7px',
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: 'var(--red)',
                boxShadow: '0 3px 4px rgba(0,0,0,.25)',
              }}
            />
            Ghi chú các chi tiết quan trọng về ứng viên và chốt nhiều việc hơn, dễ dàng hơn.
          </div>
          <div
            className="tile chk"
            style={{
              position: 'absolute',
              left: '186px',
              top: '150px',
              width: '64px',
              height: '64px',
              borderRadius: '19px',
              zIndex: 4,
              background: 'linear-gradient(180deg,#ffffff,#e9f1ff)',
              boxShadow: '0 10px 22px rgba(22,119,255,.28), 0 2px 4px rgba(0,0,0,.12)',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <i
              style={{
                display: 'grid',
                placeItems: 'center',
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'linear-gradient(180deg,#3d92ff,#1766e6)',
                color: '#fff',
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12.5l4.5 4.5L19 7.5" />
              </svg>
            </i>
          </div>
        </div>

        <div className="deco rem-wrap" style={{ position: 'absolute', right: '-34px', top: '26px', width: '400px', height: '300px', zIndex: 1 }} aria-hidden="true">
          <div
            style={{
              position: 'absolute',
              right: 0,
              top: 0,
              width: '300px',
              transform: 'rotate(3deg)',
              background: 'color-mix(in srgb, #f6a623 9%, var(--soft))',
              border: '1px solid color-mix(in srgb, #f6a623 22%, var(--line))',
              borderRadius: '22px',
              padding: '18px',
              boxShadow: 'var(--sh-m)',
              textAlign: 'left',
            }}
          >
            <h4 style={{ font: '500 17px var(--font-d)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#f6a623', boxShadow: '0 0 0 4px rgba(246,166,35,0.2)' }} />
              Nhắc nhở
            </h4>
            <div style={{ background: 'var(--card)', borderRadius: '14px', padding: '12px 14px', boxShadow: 'var(--sh-s)', fontSize: '13px', borderLeft: '3px solid #f6a623' }}>
              <b style={{ display: 'block', fontWeight: 600, fontSize: '14px' }}>Phỏng vấn hôm nay</b>
              <small style={{ color: 'var(--muted)', fontSize: '12px' }}>Vòng 2 · Frontend Developer</small>
              <br />
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '10px', background: 'var(--tint-bg)', color: 'var(--tint-fg)', borderRadius: '8px', padding: '5px 10px', fontSize: '12px', fontWeight: 500 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 2" />
                </svg>
                13:00 - 14:00
              </span>
            </div>
          </div>
          <div
            className="tile clk"
            style={{
              position: 'absolute',
              left: '6px',
              top: '50px',
              width: '78px',
              height: '78px',
              zIndex: 3,
              borderRadius: '20px',
              background: 'linear-gradient(180deg,#ffd27a,#ffab2e)',
              color: '#fff',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <svg width="40" height="40" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
              <circle cx="24" cy="26" r="15" />
              <path d="M20 6h8M24 6v5M24 26V16M24 26l7 4" />
              <circle cx="24" cy="26" r="1.6" fill="#ee4b2b" stroke="none" />
            </svg>
          </div>
        </div>

        {/* Hero Core Content */}
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span className="pill" style={{ marginBottom: '20px', fontSize: '13px', padding: '6px 16px' }}>
            Talento Recruitment Management System
          </span>
          <div
            className="tile static"
            style={{
              marginBottom: '34px',
              width: '76px',
              height: '76px',
              borderRadius: '22px',
              background: 'linear-gradient(180deg, var(--tile-a), var(--tile-b))',
              boxShadow: 'var(--sh-t), inset 0 1px 0 var(--tile-hi)',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <span className="dots" style={{ gridTemplateColumns: 'repeat(2, 16px)', gap: '6px' }}>
              <i style={{ width: '16px', height: '16px' }} />
              <i style={{ width: '16px', height: '16px' }} />
              <i style={{ width: '16px', height: '16px' }} />
              <i style={{ width: '16px', height: '16px' }} />
            </span>
          </div>

          <h1
            style={{
              font: '600 clamp(32px, 5.3vw, 64px)/1.14 var(--font-d)',
              letterSpacing: '-0.03em',
              textWrap: 'balance',
            }}
          >
            {language === 'en' ? (
              <span>
                Hire, review, and track
                <span style={{ color: 'var(--faint)', display: 'block' }}>all candidates in one place</span>
              </span>
            ) : (
              <span>
                <span style={{ display: 'inline' }}>
                  <span className="vb vb-hire" tabIndex={0}>
                    Tuyển
                  </span>
                  ,{' '}
                  <span className="vb vb-review" tabIndex={0}>
                    duyệt
                  </span>{' '}
                  <span style={{ margin: '0 0.28em' }}>và</span>{' '}
                  <span className="vb vb-track" tabIndex={0}>
                    theo dõi
                  </span>
                </span>
                <span style={{ color: 'var(--faint)', display: 'block' }}>mọi ứng viên ở một nơi</span>
              </span>
            )}
          </h1>

          <p
            style={{
              margin: '30px auto 28px',
              fontSize: '17px',
              color: 'var(--ink2)',
              maxWidth: '46ch',
              lineHeight: 1.5,
            }}
          >
            {language === 'en'
              ? 'Streamline job openings, applicant pipelines, and interview schedules to help your team hire faster.'
              : 'Quản lý vị trí, hồ sơ và lịch phỏng vấn gọn gàng để cả nhóm chốt người nhanh hơn.'}
          </p>

          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link to="/register" className="btn primary lg">
              {language === 'en' ? 'Start Free Trial' : 'Dùng thử miễn phí'}
            </Link>
            <Link to="/jobs" className="btn lg">
              {t('nav.findJobs')}
            </Link>
            <Link to="/recruiter/jobs" className="btn lg">
              {t('nav.recruiterArea')}
            </Link>
          </div>
        </div>
      </section>

      {/* Solutions Section */}
      <section className="sec" id="solutions" style={{ paddingTop: '40px', paddingBottom: '60px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <span className="pill" style={{ fontSize: '13px', padding: '6px 18px' }}>
            Giải pháp
          </span>
          <h2
            style={{
              font: '600 clamp(28px, 4vw, 46px)/1.18 var(--font-d)',
              letterSpacing: '-0.025em',
              marginTop: '18px',
            }}
          >
            Giải quyết những khó khăn lớn nhất của đội tuyển dụng
          </h2>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '24px',
            borderTop: '1px solid var(--hair)',
            paddingTop: '36px',
          }}
        >
          <div style={{ fontSize: '14.5px', color: 'var(--ink2)', lineHeight: 1.6 }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '16px', display: 'block' }}>
              <circle cx="12" cy="12" r="2.4" />
              <circle cx="12" cy="4" r="1.6" />
              <circle cx="12" cy="20" r="1.6" />
              <circle cx="4.5" cy="12" r="1.6" />
              <circle cx="19.5" cy="12" r="1.6" />
              <path d="M12 5.6v4M12 14.4v4M6.1 12h3.5M14.4 12h3.5" />
            </svg>
            <strong>Đồng bộ thông tin:</strong> Cả nhóm luôn cùng nắm một thông tin nhờ chia sẻ hồ sơ và cập nhật minh bạch.
          </div>
          <div style={{ fontSize: '14.5px', color: 'var(--ink2)', lineHeight: 1.6 }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '16px', display: 'block' }}>
              <path d="M3 6l1.6 1.6L7.5 4.5M3 13l1.6 1.6L7.5 11.5M3 20l1.6 1.6L7.5 18.5M11 6h10M11 13h10M11 20h10" />
            </svg>
            <strong>Tập trung ưu tiên:</strong> Sắp xếp ưu tiên hiệu quả để nhóm tập trung vào những ứng viên quan trọng nhất.
          </div>
          <div style={{ fontSize: '14.5px', color: 'var(--ink2)', lineHeight: 1.6 }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '16px', display: 'block' }}>
              <circle cx="9" cy="8" r="3.4" />
              <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M18 8v6M15 11h6" />
            </svg>
            <strong>Trách nhiệm rõ ràng:</strong> Mọi người chịu trách nhiệm rõ ràng mà không cần liên tục hỏi thăm tiến độ.
          </div>
        </div>

        {/* Live App Frame with Interactive Workspace */}
        <div className="frame" id="app" style={{ marginTop: '56px' }}>
          <div
            className="badge tile"
            style={{
              position: 'absolute',
              right: '-20px',
              top: '80px',
              width: '64px',
              height: '64px',
              borderRadius: '18px',
              zIndex: 5,
            }}
            aria-hidden="true"
          >
            <i
              style={{
                display: 'grid',
                placeItems: 'center',
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'linear-gradient(180deg,#27c98a,#14a56f)',
                color: '#fff',
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
                <path d="M5 12.5l4.5 4.5L19 7.5" />
              </svg>
            </i>
          </div>

          <div
            className="badge tile"
            style={{
              position: 'absolute',
              left: '-24px',
              top: '280px',
              width: '84px',
              height: '84px',
              borderRadius: '24px',
              font: '500 44px/1 var(--font-d)',
              zIndex: 5,
            }}
            aria-hidden="true"
          >
            {new Date().getDate()}
          </div>

          <div className="appwin">
            {/* App Sidebar */}
            <aside
              style={{
                padding: '20px 14px',
                borderRight: '1px solid var(--hair2)',
                background: 'var(--side-bg)',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  font: '600 17px var(--font-d)',
                  padding: '2px 8px 12px',
                }}
              >
                <span className="dots">
                  <i />
                  <i />
                  <i />
                  <i />
                </span>
                Talento
              </div>

              <button
                type="button"
                className="side-create"
                onClick={() => {
                  navigate('/recruiter/jobs/new');
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Tạo mới
              </button>

              <div className="side-label">CHUNG</div>
              <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <button
                  type="button"
                  className={`nv ${activeTab === 'dash' ? 'on' : ''}`}
                  onClick={() => setActiveTab('dash')}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                    <path d="M3 11l9-8 9 8M5 10v10h14V10" />
                  </svg>
                  <span className="t">Tổng quan</span>
                </button>
                <button
                  type="button"
                  className={`nv ${activeTab === 'jobs' ? 'on' : ''}`}
                  onClick={() => setActiveTab('jobs')}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                    <path d="M3 8h18v12H3zM9 8V5h6v3" />
                  </svg>
                  <span className="t">Vị trí</span>
                  <span className="n">{jobs.length}</span>
                </button>
                <button
                  type="button"
                  className={`nv ${activeTab === 'cands' ? 'on' : ''}`}
                  onClick={() => setActiveTab('cands')}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                    <circle cx="9" cy="8" r="3.2" />
                    <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M16 5.2a3.2 3.2 0 010 6M18 14.3c1.8.8 3 2.6 3 4.7" />
                  </svg>
                  <span className="t">Ứng viên</span>
                  <span className="n">{candidates.length}</span>
                </button>
                <button
                  type="button"
                  className={`nv ${activeTab === 'ints' ? 'on' : ''}`}
                  onClick={() => setActiveTab('ints')}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                    <path d="M4 6h16v14H4zM4 10h16M8 3v4M16 3v4" />
                  </svg>
                  <span className="t">Lịch phỏng vấn</span>
                  <span className="n">{interviews.length}</span>
                </button>
              </nav>

              <div className="side-label" style={{ marginTop: '12px' }}>
                VỊ TRÍ ĐANG TUYỂN
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {jobs.slice(0, 4).map((j, idx) => (
                  <button
                    key={j.id}
                    type="button"
                    className="nv"
                    onClick={() => {
                      setCandidateFilterJob(j.title);
                      setActiveTab('cands');
                    }}
                  >
                    <i
                      className="sq"
                      style={{
                        background: ['#1fc2ff', '#1677ff', '#f6a623', '#1fa971'][idx % 4],
                      }}
                    />
                    <span className="t">{j.title}</span>
                    <span className="n">{j.candidatesCount}</span>
                  </button>
                ))}
              </div>
            </aside>

            {/* App Main Area */}
            <main style={{ padding: '20px 24px 28px', minWidth: 0, overflowY: 'auto' }}>
              {/* Top Bar inside App */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  marginBottom: '22px',
                  flexWrap: 'wrap',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '13px',
                    color: 'var(--ink2)',
                    marginRight: 'auto',
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
                    <path d="M4 6h16v14H4zM4 10h16M8 3v4M16 3v4" />
                  </svg>
                  <span>
                    Thứ Bảy, {new Date().getDate()}/{new Date().getMonth() + 1}/{new Date().getFullYear()}
                  </span>
                </div>

                <label className="search" style={{ flex: '0 1 220px' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                    <circle cx="11" cy="11" r="6" />
                    <path d="M20 20l-4-4" />
                  </svg>
                  <input
                    type="search"
                    placeholder="Tìm ứng viên"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </label>

                <div className="me">
                  <span className="av p1" style={{ width: '28px', height: '28px' }}>
                    LH
                  </span>
                  <span style={{ fontWeight: 500 }}>Hồ Linh</span>
                </div>
              </div>

              {/* View Content depending on active tab */}
              {activeTab === 'dash' && (
                <div style={{ animation: 'rise 0.4s var(--spring)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                    <h3 style={{ font: '600 clamp(24px, 3vw, 30px)/1.1 var(--font-d)' }}>
                      Chào buổi sáng, <span style={{ color: 'var(--blue)' }}>Linh</span>
                    </h3>
                    <Link to="/recruiter/jobs/new" className="btn sm primary">
                      + Tạo mới
                    </Link>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                      gap: '16px',
                      alignItems: 'start',
                    }}
                  >
                    {/* To-do List Card */}
                    <div className="card todo">
                      <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingBottom: '10px', borderBottom: '2px solid var(--ink)', marginBottom: '8px', fontSize: '16px' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="2" strokeLinecap="round">
                          <path d="M4 20l4-1 11-11-3-3L5 16zM14 7l3 3" />
                        </svg>
                        Việc cần làm
                      </h4>
                      <div>
                        {todoList.map((t) => (
                          <div
                            key={t.id}
                            style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: '10px',
                              padding: '9px 0',
                              fontSize: '13px',
                              borderBottom: '1px solid var(--hair2)',
                              color: t.done ? 'var(--faint)' : 'var(--ink2)',
                              textDecoration: t.done ? 'line-through' : 'none',
                            }}
                          >
                            <button
                              type="button"
                              onClick={(e) => handleToggleTodo(t.id, e)}
                              style={{
                                width: '18px',
                                height: '18px',
                                marginTop: '1px',
                                border: '1.5px solid var(--cbb)',
                                borderRadius: '4px',
                                background: t.done ? 'var(--blue)' : 'var(--card)',
                                borderColor: t.done ? 'var(--blue)' : 'var(--cbb)',
                                display: 'grid',
                                placeItems: 'center',
                                padding: 0,
                                color: '#fff',
                                cursor: 'pointer',
                              }}
                            >
                              {t.done && (
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6">
                                  <path d="M5 12.5l4.5 4.5L19 7.5" />
                                </svg>
                              )}
                            </button>
                            <span style={{ flex: 1, minWidth: 0 }}>{t.text}</span>
                            <button
                              type="button"
                              onClick={() => handleDeleteTodo(t.id)}
                              style={{
                                border: 0,
                                background: 'none',
                                color: 'var(--muted)',
                                cursor: 'pointer',
                                fontSize: '13px',
                              }}
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '10px', color: 'var(--muted)', fontSize: '13px' }}>
                        +
                        <input
                          type="text"
                          placeholder="Thêm việc cần làm (nhấn Enter)"
                          value={newTodoText}
                          onChange={(e) => setNewTodoText(e.target.value)}
                          onKeyDown={handleAddTodo}
                          style={{
                            border: 0,
                            outline: 0,
                            background: 'none',
                            width: '100%',
                            fontSize: '13px',
                          }}
                        />
                      </div>
                    </div>

                    {/* Next Interview Countdown Clock */}
                    <div className="card timer">
                      <div className="card-h">
                        <h4>Phỏng vấn kế tiếp</h4>
                      </div>
                      <div
                        style={{
                          font: '600 32px/1 var(--font-d)',
                          letterSpacing: '-0.01em',
                          fontVariantNumeric: 'tabular-nums',
                          margin: '18px 0 12px',
                          color: 'var(--blue)',
                        }}
                      >
                        {countdown}
                      </div>
                      <b style={{ fontSize: '15px' }}>Nguyễn Minh Anh</b>
                      <small style={{ color: 'var(--muted)', display: 'block', fontSize: '13px', marginTop: '4px' }}>
                        Frontend Developer · Hôm nay 13:00
                      </small>
                    </div>

                    {/* Progress Rings Card */}
                    <div className="card act">
                      <div className="card-h">
                        <h4>Tiến độ</h4>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12.5px', color: 'var(--muted)' }}>
                          <div style={{ paddingLeft: '8px', borderLeft: '3px solid #1677ff' }}>
                            Đã sàng lọc
                            <b style={{ display: 'block', color: 'var(--ink)', fontSize: '18px' }}>
                              7<i style={{ fontStyle: 'normal', color: 'var(--faint)' }}>/12</i>
                            </b>
                          </div>
                          <div style={{ paddingLeft: '8px', borderLeft: '3px solid #1fc2ff' }}>
                            Phỏng vấn tuần này
                            <b style={{ display: 'block', color: 'var(--ink)', fontSize: '18px' }}>
                              2<i style={{ fontStyle: 'normal', color: 'var(--faint)' }}>/4</i>
                            </b>
                          </div>
                          <div style={{ paddingLeft: '8px', borderLeft: '3px solid #f6a623' }}>
                            Đã nhận / cần tuyển
                            <b style={{ display: 'block', color: 'var(--ink)', fontSize: '18px' }}>
                              1<i style={{ fontStyle: 'normal', color: 'var(--faint)' }}>/3</i>
                            </b>
                          </div>
                        </div>

                        {/* Circular Progress Rings SVG */}
                        <svg width="118" height="118" viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
                          <circle cx="60" cy="60" r="52" fill="none" stroke="var(--track)" strokeWidth="9" />
                          <circle cx="60" cy="60" r="52" fill="none" stroke="#1677ff" strokeWidth="9" strokeLinecap="round" strokeDasharray="190 327" />
                          <circle cx="60" cy="60" r="40" fill="none" stroke="var(--track)" strokeWidth="9" />
                          <circle cx="60" cy="60" r="40" fill="none" stroke="#1fc2ff" strokeWidth="9" strokeLinecap="round" strokeDasharray="125 251" />
                          <circle cx="60" cy="60" r="28" fill="none" stroke="var(--track)" strokeWidth="9" />
                          <circle cx="60" cy="60" r="28" fill="none" stroke="#f6a623" strokeWidth="9" strokeLinecap="round" strokeDasharray="58 175" />
                        </svg>
                      </div>
                    </div>

                    {/* Candidate Review Tasks */}
                    <div className="card tasks" style={{ gridColumn: '1 / -1' }}>
                      <div className="card-h">
                        <h4>Ứng viên cần xử lý</h4>
                      </div>
                      <div style={{ display: 'flex', gap: '16px', fontSize: '13px', marginBottom: '12px' }}>
                        <button
                          type="button"
                          onClick={() => setDashFilterTab('new')}
                          style={{
                            border: 0,
                            background: 'none',
                            padding: '2px 0',
                            color: dashFilterTab === 'new' ? 'var(--blue)' : 'var(--muted)',
                            borderBottom: dashFilterTab === 'new' ? '2px solid var(--blue)' : '2px solid transparent',
                            fontWeight: dashFilterTab === 'new' ? 600 : 400,
                            cursor: 'pointer',
                          }}
                        >
                          Mới ứng tuyển
                        </button>
                        <button
                          type="button"
                          onClick={() => setDashFilterTab('interview')}
                          style={{
                            border: 0,
                            background: 'none',
                            padding: '2px 0',
                            color: dashFilterTab === 'interview' ? 'var(--blue)' : 'var(--muted)',
                            borderBottom: dashFilterTab === 'interview' ? '2px solid var(--blue)' : '2px solid transparent',
                            fontWeight: dashFilterTab === 'interview' ? 600 : 400,
                            cursor: 'pointer',
                          }}
                        >
                          Cần phỏng vấn
                        </button>
                        <button
                          type="button"
                          onClick={() => setDashFilterTab('hired')}
                          style={{
                            border: 0,
                            background: 'none',
                            padding: '2px 0',
                            color: dashFilterTab === 'hired' ? 'var(--blue)' : 'var(--muted)',
                            borderBottom: dashFilterTab === 'hired' ? '2px solid var(--blue)' : '2px solid transparent',
                            fontWeight: dashFilterTab === 'hired' ? 600 : 400,
                            cursor: 'pointer',
                          }}
                        >
                          Đã nhận
                        </button>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {candidates
                          .filter((c) =>
                            dashFilterTab === 'new'
                              ? c.stage === 'applied' || c.stage === 'screening'
                              : dashFilterTab === 'interview'
                                ? c.stage === 'interview'
                                : c.stage === 'hired',
                          )
                          .map((c, i) => (
                            <div
                              key={c.id}
                              style={{
                                display: 'grid',
                                gridTemplateColumns: '24px minmax(0, 1.4fr) minmax(60px, 1fr) 38px auto',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '9px 12px',
                                borderRadius: '10px',
                                background: 'var(--soft2)',
                                fontSize: '13.5px',
                              }}
                            >
                              <span
                                style={{
                                  display: 'grid',
                                  placeItems: 'center',
                                  width: '20px',
                                  height: '20px',
                                  borderRadius: '5px',
                                  color: '#fff',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  background: STAGES.find((s) => s.id === c.stage)?.color || 'var(--blue)',
                                }}
                              >
                                {i + 1}
                              </span>
                              <div>
                                <b style={{ display: 'block', fontWeight: 600 }}>{c.name}</b>
                                <small style={{ color: 'var(--muted)', fontSize: '12px' }}>{c.jobTitle}</small>
                              </div>
                              <div style={{ height: '4px', borderRadius: '4px', background: 'var(--track)', overflow: 'hidden' }}>
                                <i
                                  style={{
                                    display: 'block',
                                    height: '100%',
                                    background: STAGES.find((s) => s.id === c.stage)?.color || 'var(--blue)',
                                    width: c.stage === 'hired' ? '100%' : c.stage === 'interview' ? '65%' : '35%',
                                  }}
                                />
                              </div>
                              <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                                {c.stage === 'hired' ? '100%' : c.stage === 'interview' ? '65%' : '35%'}
                              </span>
                              <span className="av p2">{c.name.slice(0, 2).toUpperCase()}</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* View: Jobs */}
              {activeTab === 'jobs' && (
                <div style={{ animation: 'rise 0.4s var(--spring)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ font: '600 24px var(--font-d)' }}>Vị trí tuyển dụng</h3>
                    <button
                      type="button"
                      className="btn primary sm"
                      onClick={() => navigate('/recruiter/jobs/new')}
                    >
                      + Tạo vị trí
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
                    {jobs.map((j) => (
                      <article key={j.id} className="card jc">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                          <h4 style={{ fontSize: '16px', fontWeight: 600 }}>{j.title}</h4>
                          <span className="pill" style={{ ['--c' as string]: j.status === 'open' ? '#1fa971' : '#f6a623' }}>
                            {j.status === 'open' ? 'Đang tuyển' : 'Tạm dừng'}
                          </span>
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--muted)' }}>
                          {j.dept} • {j.loc} • {j.type}
                        </div>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--ink2)' }}>
                            <span>{j.candidatesCount} ứng viên</span>
                            <span>Đã nhận {j.hiredCount}/{j.openings}</span>
                          </div>
                          <div style={{ height: '4px', borderRadius: '4px', background: 'var(--track)', marginTop: '8px', overflow: 'hidden' }}>
                            <div
                              style={{
                                height: '100%',
                                background: 'var(--green)',
                                width: `${Math.round((j.hiredCount / j.openings) * 100)}%`,
                              }}
                            />
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                          <button
                            type="button"
                            className="btn sm"
                            onClick={() => {
                              setCandidateFilterJob(j.title);
                              setActiveTab('cands');
                            }}
                          >
                            Xem ứng viên
                          </button>
                          <button
                            type="button"
                            className="btn sm"
                            onClick={() => navigate(`/recruiter/jobs/${j.id}/edit`)}
                          >
                            Sửa
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              )}

              {/* View: Candidates Kanban Board */}
              {activeTab === 'cands' && (
                <div style={{ animation: 'rise 0.4s var(--spring)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                    <h3 style={{ font: '600 24px var(--font-d)' }}>Ứng viên</h3>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <select
                        value={candidateFilterJob}
                        onChange={(e) => setCandidateFilterJob(e.target.value)}
                        style={{
                          border: '1px solid var(--line)',
                          borderRadius: '10px',
                          background: 'var(--card)',
                          padding: '8px 12px',
                          fontSize: '13.5px',
                        }}
                      >
                        <option value="ALL">Tất cả vị trí</option>
                        {jobs.map((j) => (
                          <option key={j.id} value={j.title}>
                            {j.title}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="btn primary sm"
                        onClick={() => navigate('/recruiter/applications')}
                      >
                        + Thêm ứng viên
                      </button>
                    </div>
                  </div>

                  <div className="board">
                    {STAGES.map((s) => {
                      const stageCands = filteredCandidates.filter((c) => c.stage === s.id);
                      return (
                        <div
                          key={s.id}
                          className="col"
                          data-stage={s.id}
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDrop(s.id as DemoCandidate['stage'], e)}
                        >
                          <div className="col-h" style={{ ['--c' as string]: s.color }}>
                            <i className="sq" />
                            {s.name}
                            <span className="n">{stageCands.length}</span>
                          </div>

                          {stageCands.map((c) => (
                            <article
                              key={c.id}
                              className="kc"
                              draggable
                              onDragStart={() => handleDragStart(c.id)}
                            >
                              <div className="kc-top">
                                <span className="av p0" style={{ width: '30px', height: '30px' }}>
                                  {c.name.slice(0, 2).toUpperCase()}
                                </span>
                                <div>
                                  <b>{c.name}</b>
                                  <span className="j">{c.jobTitle}</span>
                                </div>
                              </div>
                              {c.rating > 0 && (
                                <div className="stars">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <span key={star} className={star <= c.rating ? 'on' : ''}>
                                      ★
                                    </span>
                                  ))}
                                </div>
                              )}
                              <div className="kc-meta">
                                <span className="chip">{c.source}</span>
                                <span>{c.timeAgo}</span>
                              </div>
                              {c.interviewTime && (
                                <div className="iv">
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                                    <circle cx="12" cy="12" r="9" />
                                    <path d="M12 7v5l3 2" />
                                  </svg>
                                  {c.interviewTime}
                                </div>
                              )}
                            </article>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* View: Interviews */}
              {activeTab === 'ints' && (
                <div style={{ animation: 'rise 0.4s var(--spring)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ font: '600 24px var(--font-d)' }}>Lịch phỏng vấn</h3>
                    <button
                      type="button"
                      className="btn primary sm"
                      onClick={() => navigate('/interviews')}
                    >
                      + Lên lịch
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: '16px', fontSize: '13px', marginBottom: '14px' }}>
                    <button
                      type="button"
                      onClick={() => setInterviewTab('up')}
                      style={{
                        border: 0,
                        background: 'none',
                        padding: '2px 0',
                        color: interviewTab === 'up' ? 'var(--blue)' : 'var(--muted)',
                        borderBottom: interviewTab === 'up' ? '2px solid var(--blue)' : '2px solid transparent',
                        fontWeight: interviewTab === 'up' ? 600 : 400,
                        cursor: 'pointer',
                      }}
                    >
                      Sắp tới
                    </button>
                    <button
                      type="button"
                      onClick={() => setInterviewTab('past')}
                      style={{
                        border: 0,
                        background: 'none',
                        padding: '2px 0',
                        color: interviewTab === 'past' ? 'var(--blue)' : 'var(--muted)',
                        borderBottom: interviewTab === 'past' ? '2px solid var(--blue)' : '2px solid transparent',
                        fontWeight: interviewTab === 'past' ? 600 : 400,
                        cursor: 'pointer',
                      }}
                    >
                      Đã qua
                    </button>
                  </div>

                  <div>
                    {interviews.map((iv) => (
                      <div
                        key={iv.id}
                        className="card"
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '54px minmax(0, 1fr) auto',
                          gap: '14px',
                          alignItems: 'center',
                          padding: '14px',
                          marginBottom: '10px',
                        }}
                      >
                        <div
                          style={{
                            display: 'grid',
                            placeItems: 'center',
                            width: '54px',
                            height: '54px',
                            borderRadius: '14px',
                            background: 'var(--soft)',
                            font: '600 20px/1 var(--font-d)',
                            color: 'var(--blue)',
                          }}
                        >
                          <div>
                            <small style={{ display: 'block', fontSize: '10px', color: 'var(--muted)', textAlign: 'center' }}>
                              {iv.dayOfWeek}
                            </small>
                            {iv.dayNum}
                          </div>
                        </div>

                        <div>
                          <b style={{ fontSize: '15px' }}>{iv.candidateName}</b>
                          <div style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '2px' }}>
                            {iv.jobTitle} • {iv.mode} • Phụ trách: {iv.interviewer}
                          </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              background: 'var(--tint-bg)',
                              color: 'var(--tint-fg)',
                              borderRadius: '8px',
                              padding: '5px 10px',
                              fontSize: '12px',
                              fontWeight: 500,
                            }}
                          >
                            {iv.time} - {iv.endTime}
                          </span>
                          <button
                            type="button"
                            className="btn sm danger"
                            onClick={() => showToast('Đã huỷ lịch phỏng vấn')}
                          >
                            Huỷ lịch
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </main>
          </div>
        </div>
      </section>

      {/* Features Bento Grid */}
      <section
        className="feat"
        id="features"
        style={{
          marginTop: '80px',
          background: 'var(--panel)',
          border: '1px solid var(--hair)',
          borderRadius: '36px',
          padding: '56px 44px 40px',
          backgroundImage: 'radial-gradient(var(--dot) 1px, transparent 1.4px)',
          backgroundSize: '20px 20px',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <span className="pill" style={{ fontSize: '13px', padding: '6px 18px' }}>
            Tính năng
          </span>
          <h2 style={{ font: '600 clamp(28px, 4vw, 46px)/1.18 var(--font-d)', letterSpacing: '-0.025em', marginTop: '18px' }}>
            Mọi thứ tuyển dụng ở một nơi
          </h2>
          <p style={{ color: 'var(--ink2)', marginTop: '10px' }}>Quên những công cụ quản lý phức tạp.</p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(12, minmax(0, 1fr))',
            gap: '18px',
            marginTop: '48px',
          }}
        >
          {/* Card 1: Team Collaboration */}
          <div
            className="card"
            style={{
              gridColumn: 'span 5',
              padding: '28px',
              minHeight: '340px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ background: 'var(--soft)', borderRadius: '16px', padding: '16px', marginBottom: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--muted)', marginBottom: '10px' }}>
                  <span>Nhóm Tuyển dụng</span>
                  <span>Thành viên: 3</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="av p1" style={{ width: '24px', height: '24px' }}>LH</span>
                    Hồ Linh (Quản trị viên)
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="av p2" style={{ width: '24px', height: '24px' }}>TS</span>
                    Lê Văn Sơn (Interviewer)
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="av p0" style={{ width: '24px', height: '24px' }}>TM</span>
                    Hồ Thị Mai (HR Specialist)
                  </div>
                </div>
              </div>
              <h4 style={{ fontSize: '20px', fontWeight: 600, textAlign: 'center' }}>Phối hợp nhóm</h4>
              <p style={{ textAlign: 'center', fontSize: '13.5px', color: 'var(--ink2)', marginTop: '8px' }}>
                Cùng xem hồ sơ, chia việc và cập nhật tiến độ ứng viên cho nhau.
              </p>
            </div>
          </div>

          {/* Card 2: Time Management Tools */}
          <div
            className="card"
            style={{
              gridColumn: 'span 7',
              padding: '28px',
              minHeight: '340px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '18px' }}>
                <div style={{ background: 'var(--soft)', borderRadius: '16px', padding: '14px', fontSize: '12.5px' }}>
                  <b style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Lịch phỏng vấn tuần này</b>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span>Frontend • Vòng 1</span>
                    <span style={{ color: 'var(--blue)' }}>13:00</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span>UI/UX • Vòng 2</span>
                    <span style={{ color: 'var(--blue)' }}>10:00</span>
                  </div>
                </div>
                <div style={{ background: 'var(--soft)', borderRadius: '16px', padding: '14px', textAlign: 'center' }}>
                  <b style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '12.5px' }}>Tải việc của nhóm</b>
                  <div
                    style={{
                      width: '74px',
                      height: '74px',
                      borderRadius: '50%',
                      margin: '8px auto',
                      background: 'conic-gradient(var(--amber) 0 75%, var(--track) 75% 100%)',
                      display: 'grid',
                      placeItems: 'center',
                      font: '600 16px var(--font-d)',
                    }}
                  >
                    <span
                      style={{
                        display: 'grid',
                        placeItems: 'center',
                        width: '54px',
                        height: '54px',
                        borderRadius: '50%',
                        background: 'var(--card)',
                      }}
                    >
                      75%
                    </span>
                  </div>
                </div>
              </div>
              <h4 style={{ fontSize: '20px', fontWeight: 600, textAlign: 'center' }}>Công cụ quản lý thời gian</h4>
              <p style={{ textAlign: 'center', fontSize: '13.5px', color: 'var(--ink2)', marginTop: '8px' }}>
                Tối ưu thời gian với bộ đếm, nhắc nhở và lịch phỏng vấn tích hợp.
              </p>
            </div>
          </div>

          {/* Card 3: Advanced Candidate Tracking */}
          <div
            className="card"
            style={{
              gridColumn: 'span 8',
              padding: '28px',
              minHeight: '260px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ background: 'var(--soft)', borderRadius: '16px', padding: '16px', marginBottom: '18px' }}>
                <b style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '10px' }}>Tiến độ vị trí</b>
                <div style={{ height: '24px', borderRadius: '8px', background: '#f6a623', color: '#fff', fontSize: '11px', display: 'flex', alignItems: 'center', padding: '0 12px', width: '68%', marginBottom: '8px' }}>
                  Frontend Developer • 68%
                </div>
                <div style={{ height: '24px', borderRadius: '8px', background: '#1fc2ff', color: '#fff', fontSize: '11px', display: 'flex', alignItems: 'center', padding: '0 12px', width: '45%', marginLeft: '25%' }}>
                  UI/UX Designer • 45%
                </div>
              </div>
              <h4 style={{ fontSize: '20px', fontWeight: 600 }}>Theo dõi ứng viên nâng cao</h4>
              <p style={{ fontSize: '13.5px', color: 'var(--ink2)', marginTop: '6px' }}>
                Nhìn tổng thể toàn bộ hành vi và tiến độ tuyển dụng trên cùng một bảng điều khiển.
              </p>
            </div>
          </div>

          {/* Card 4: Customizable Workspace */}
          <div
            className="card"
            style={{
              gridColumn: 'span 4',
              padding: '28px',
              minHeight: '260px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              borderStyle: 'dashed',
              background: 'transparent',
            }}
          >
            <div
              style={{
                width: '130px',
                height: '84px',
                borderRadius: '20px',
                background: '#fbe45f',
                boxShadow: 'var(--sh-m)',
                display: 'grid',
                placeItems: 'center',
                font: '600 32px var(--font-d)',
                color: '#1a1608',
                marginBottom: '16px',
              }}
            >
              04:21
            </div>
            <h4 style={{ fontSize: '19px', fontWeight: 600, textAlign: 'center' }}>Không gian tuỳ chỉnh</h4>
            <p style={{ fontSize: '13px', color: 'var(--muted)', textAlign: 'center', marginTop: '4px' }}>
              Widget, kiểu xem và giao diện linh hoạt
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="site-foot"
        id="contact"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          flexWrap: 'wrap',
          padding: '44px 0 48px',
          fontSize: '13px',
          color: 'var(--muted)',
          borderTop: '1px solid var(--hair)',
          marginTop: '60px',
        }}
      >
        <span>Bản Talento RMS. Hệ thống tuyển dụng chuẩn hóa theo quy trình doanh nghiệp.</span>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link to="/jobs" className="btn sm">
            Tìm việc
          </Link>
          <Link to="/login" className="btn sm">
            Đăng nhập
          </Link>
          <Link to="/register" className="btn sm primary">
            Đăng ký
          </Link>
        </div>
      </footer>
    </div>
  );
};
