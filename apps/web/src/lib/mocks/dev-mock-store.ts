import type {
  CompanyDto,
  CompanyMemberDto,
  JobDetailDto,
  JobSummaryDto,
  SkillDto,
  CreateJobRequest,
  UpdateJobRequest,
  PublishJobRequest,
  UpdateCompanyRequest,
  AddMemberRequest,
  UpdateMemberRequest,
  TransferOwnerRequest,
  CandidateApplicationDto,
  CandidateHistoryDto,
  ApplicationStatus,
  ReviewApplicationRequest,
  ReviewCvChangeRequest,
  PublishResultRequest,
} from '@rms/contracts/public';

export const isDevBrowser = (): boolean => {
  return Boolean(import.meta.env.DEV && import.meta.env.MODE !== 'test');
};

export const devCompany: CompanyDto = {
  id: 'c1111111-1111-1111-1111-111111111111',
  name: 'Công ty Cổ phần Công nghệ Talento',
  taxCode: 'TAX-0102030405',
  address: 'Tòa nhà Landmark, 123 Đường Nam Kỳ Khởi Nghĩa, Quận 1, TP.HCM',
  website: 'https://talento.example.com',
  description: 'Doanh nghiệp tiên phong trong giải pháp quản lý tuyển dụng và nhân sự công nghệ.',
  approvalStatus: 'APPROVED',
  rejectionReason: null,
  version: 1,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

export const devSkills: SkillDto[] = [
  { id: 's1', name: 'React', category: 'Frontend', active: true },
  { id: 's2', name: 'TypeScript', category: 'Language', active: true },
  { id: 's3', name: 'Node.js', category: 'Backend', active: true },
  { id: 's4', name: 'NestJS', category: 'Backend', active: true },
  { id: 's5', name: 'PostgreSQL', category: 'Database', active: true },
  { id: 's6', name: 'Docker', category: 'DevOps', active: true },
  { id: 's7', name: 'Next.js', category: 'Frontend', active: true },
  { id: 's8', name: 'Kubernetes', category: 'DevOps', active: true },
];

const devMembersStore: CompanyMemberDto[] = [
  {
    userId: 'u1111111-1111-1111-1111-111111111111',
    email: 'admin.owner@talento.vn',
    fullName: 'Nguyễn Văn An (Chủ sở hữu)',
    role: 'OWNER',
    permissions: ['RECRUITER'],
    active: true,
    version: 1,
    joinedAt: '2026-01-01T00:00:00Z',
  },
  {
    userId: 'u2222222-2222-2222-2222-222222222222',
    email: 'recruiter.binh@talento.vn',
    fullName: 'Trần Thị Bình (Tuyển dụng)',
    role: 'RECRUITER',
    permissions: ['RECRUITER'],
    active: true,
    version: 1,
    joinedAt: '2026-01-15T00:00:00Z',
  },
  {
    userId: 'u3333333-3333-3333-3333-333333333333',
    email: 'interviewer.cuong@talento.vn',
    fullName: 'Lê Hoàng Cường (Tech Lead)',
    role: 'INTERVIEWER',
    permissions: ['INTERVIEWER'],
    active: true,
    version: 1,
    joinedAt: '2026-02-01T00:00:00Z',
  },
];

const devJobsStore: JobDetailDto[] = [
  {
    id: 'j1111111-1111-1111-1111-111111111111',
    companyId: devCompany.id,
    companyName: devCompany.name,
    title: 'Senior Frontend Engineer (React/TypeScript)',
    location: 'Quận 1, TP. Hồ Chí Minh',
    jobType: 'FULL_TIME',
    workplaceMode: 'HYBRID',
    salary: { min: 25000000, max: 42000000, currency: 'VND' },
    deadline: '2026-12-31T23:59:00+07:00',
    description:
      'Chúng tôi đang tìm kiếm Senior Frontend Engineer có kinh nghiệm sâu về React 19, TypeScript và tối ưu hiệu năng để phát triển phân hệ nhà tuyển dụng và ứng viên.',
    headcount: 2,
    status: 'PUBLISHED',
    publishedAt: '2026-02-01T08:00:00Z',
    skillIds: ['s1', 's2', 's7'],
    skills: [devSkills[0]!, devSkills[1]!, devSkills[6]!],
    version: 3,
    createdAt: '2026-01-15T00:00:00Z',
    updatedAt: '2026-02-01T08:00:00Z',
  },
  {
    id: 'j2222222-2222-2222-2222-222222222222',
    companyId: devCompany.id,
    companyName: devCompany.name,
    title: 'Backend Engineer (NodeJS / NestJS)',
    location: 'Quận Cầu Giấy, Hà Nội',
    jobType: 'FULL_TIME',
    workplaceMode: 'ON_SITE',
    salary: null,
    deadline: '2026-11-30T18:00:00+07:00',
    description:
      'Thiết kế kiến trúc vi dịch vụ, triển khai Transaction Script / Unit of Work và đảm bảo khả năng mở rộng của hệ thống dữ liệu PostgreSQL.',
    headcount: 3,
    status: 'DRAFT',
    publishedAt: null,
    skillIds: ['s3', 's4', 's5'],
    skills: [devSkills[2]!, devSkills[3]!, devSkills[4]!],
    version: 1,
    createdAt: '2026-02-10T00:00:00Z',
    updatedAt: '2026-02-10T00:00:00Z',
  },
  {
    id: 'j3333333-3333-3333-3333-333333333333',
    companyId: devCompany.id,
    companyName: devCompany.name,
    title: 'DevOps & Cloud Specialist (Đã hoàn thành tuyển)',
    location: 'Quận Hải Châu, Đà Nẵng',
    jobType: 'CONTRACT',
    workplaceMode: 'REMOTE',
    salary: { min: 35000000, max: 50000000, currency: 'VND' },
    deadline: '2026-01-01T17:00:00+07:00',
    description:
      'Vị trí thiết lập hạ tầng đám mây và tối ưu pipeline CI/CD GitHub Actions cho dự án. Hiện đã tuyển đủ nhân sự.',
    headcount: 1,
    status: 'CLOSED',
    publishedAt: '2025-12-01T00:00:00Z',
    skillIds: ['s6', 's8'],
    skills: [devSkills[5]!, devSkills[7]!],
    version: 2,
    createdAt: '2025-11-20T00:00:00Z',
    updatedAt: '2026-01-01T17:00:00Z',
  },
];

export const devMockStore = {
  getCompany: async (): Promise<CompanyDto> => {
    return devCompany;
  },

  updateCompany: async (payload: UpdateCompanyRequest): Promise<CompanyDto> => {
    if (payload.name) devCompany.name = payload.name;
    if (payload.address) devCompany.address = payload.address;
    if (payload.website !== undefined) devCompany.website = payload.website;
    if (payload.description !== undefined) devCompany.description = payload.description;
    devCompany.version += 1;
    return { ...devCompany };
  },

  getCompanyMembers: async (): Promise<CompanyMemberDto[]> => {
    return [...devMembersStore];
  },

  addMember: async (payload: AddMemberRequest): Promise<CompanyMemberDto> => {
    const newMember: CompanyMemberDto = {
      userId: `u-dev-${Date.now()}`,
      email: payload.email,
      fullName: payload.email.split('@')[0] ?? 'Thành viên mới',
      role: payload.role,
      permissions: payload.permissions ?? [payload.role],
      active: true,
      version: 1,
      joinedAt: new Date().toISOString(),
    };
    devMembersStore.push(newMember);
    return newMember;
  },

  updateMember: async (userId: string, payload: UpdateMemberRequest): Promise<CompanyMemberDto> => {
    const member = devMembersStore.find((m) => m.userId === userId);
    if (!member) throw new Error('Thành viên không tồn tại');
    if (payload.active !== undefined) member.active = payload.active;
    if (payload.role !== undefined) member.role = payload.role;
    if (payload.permissions !== undefined) member.permissions = payload.permissions;
    member.version += 1;
    return { ...member };
  },

  transferOwner: async (payload: TransferOwnerRequest): Promise<{ success: true }> => {
    const target = devMembersStore.find((m) => m.userId === payload.targetUserId);
    if (!target) throw new Error('Không tìm thấy thành viên đích');
    devMembersStore.forEach((m) => {
      if (m.role === 'OWNER') m.role = 'RECRUITER';
    });
    target.role = 'OWNER';
    target.version += 1;
    devCompany.version += 1;
    return { success: true };
  },

  getJobs: async (query?: {
    status?: string;
    q?: string;
  }): Promise<{
    data: JobSummaryDto[];
    meta: { page: number; pageSize: number; total: number; totalPages: number };
  }> => {
    let list = [...devJobsStore];
    if (query?.status) {
      list = list.filter((j) => j.status === query.status);
    }
    if (query?.q) {
      const qLower = query.q.toLowerCase();
      list = list.filter((j) => j.title.toLowerCase().includes(qLower));
    }
    return {
      data: list,
      meta: {
        page: 1,
        pageSize: 10,
        total: list.length,
        totalPages: 1,
      },
    };
  },

  getJobDetail: async (jobId: string): Promise<JobDetailDto> => {
    const found = devJobsStore.find((j) => j.id === jobId);
    if (found) return found;
    return devJobsStore[0]!;
  },

  createJob: async (payload: CreateJobRequest): Promise<JobDetailDto> => {
    const newJob: JobDetailDto = {
      id: `j-dev-${Date.now()}`,
      companyId: devCompany.id,
      companyName: devCompany.name,
      title: payload.title || 'Tin tuyển dụng mới (Bản nháp)',
      location: payload.location || 'TP. Hồ Chí Minh',
      jobType: payload.jobType || 'FULL_TIME',
      workplaceMode: payload.workplaceMode || 'ON_SITE',
      salary: payload.salary || null,
      deadline: payload.deadline || '2026-12-31T23:59:00+07:00',
      description: payload.description || '',
      headcount: payload.headcount || 1,
      status: 'DRAFT',
      publishedAt: null,
      skillIds: payload.skillIds || [],
      skills: devSkills.filter((s) => payload.skillIds?.includes(s.id)),
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    devJobsStore.unshift(newJob);
    return newJob;
  },

  updateJob: async (jobId: string, payload: UpdateJobRequest): Promise<JobDetailDto> => {
    const job = devJobsStore.find((j) => j.id === jobId);
    if (!job) throw new Error('Không tìm thấy tin');
    if (payload.title) job.title = payload.title;
    if (payload.description) job.description = payload.description;
    if (payload.location) job.location = payload.location;
    if (payload.headcount) job.headcount = payload.headcount;
    if (payload.jobType) job.jobType = payload.jobType;
    if (payload.workplaceMode) job.workplaceMode = payload.workplaceMode;
    if (payload.salary !== undefined) job.salary = payload.salary;
    if (payload.deadline) job.deadline = payload.deadline;
    if (payload.skillIds) {
      job.skillIds = payload.skillIds;
      job.skills = devSkills.filter((s) => payload.skillIds?.includes(s.id));
    }
    job.version += 1;
    return { ...job };
  },

  publishJob: async (jobId: string, payload: PublishJobRequest): Promise<JobDetailDto> => {
    const job = devJobsStore.find((j) => j.id === jobId);
    if (!job) throw new Error('Không tìm thấy tin');
    job.status = 'PUBLISHED';
    job.publishedAt = new Date().toISOString();
    job.deadline = payload.deadline;
    job.version += 1;
    return { ...job };
  },

  closeJob: async (jobId: string): Promise<JobDetailDto> => {
    const job = devJobsStore.find((j) => j.id === jobId);
    if (!job) throw new Error('Không tìm thấy tin');
    job.status = 'CLOSED';
    job.version += 1;
    return { ...job };
  },

  getSkills: async (): Promise<SkillDto[]> => {
    return [...devSkills];
  },

  // ==========================================
  // Applications Store & Handlers
  // ==========================================
  getApplications: async (params?: {
    jobId?: string;
    status?: ApplicationStatus;
    q?: string;
  }): Promise<{ data: DevApplicationItem[]; meta: { total: number } }> => {
    let list = [...devApplicationsStore];
    if (params?.jobId) {
      list = list.filter((a) => a.jobId === params.jobId);
    }
    if (params?.status) {
      list = list.filter((a) => a.status === params.status);
    }
    if (params?.q) {
      const q = params.q.toLowerCase();
      list = list.filter(
        (a) =>
          a.candidateSnapshot.name.toLowerCase().includes(q) ||
          a.candidateSnapshot.email.toLowerCase().includes(q) ||
          (a.candidateSnapshot.headline && a.candidateSnapshot.headline.toLowerCase().includes(q)),
      );
    }
    return { data: list, meta: { total: list.length } };
  },

  getApplicationDetail: async (id: string): Promise<DevApplicationItem> => {
    const found = devApplicationsStore.find((a) => a.applicationId === id);
    if (!found) {
      // Fallback to first if not found
      return devApplicationsStore[0]!;
    }
    return { ...found };
  },

  getApplicationHistory: async (applicationId: string): Promise<CandidateHistoryDto[]> => {
    return (
      devHistoryStore[applicationId] || [
        {
          id: `h-init-${Date.now()}`,
          eventType: 'SUBMIT',
          fromStatus: null,
          toStatus: 'SUBMITTED',
          oldCvId: null,
          newCvId: 'cv-ver-1',
          publicMessage: 'Hồ sơ đã được gửi thành công.',
          createdAt: '2026-02-01T08:00:00Z',
          aggregateVersion: 1,
        },
      ]
    );
  },

  reviewApplication: async (
    applicationId: string,
    payload: ReviewApplicationRequest,
  ): Promise<DevApplicationItem> => {
    const app = devApplicationsStore.find((a) => a.applicationId === applicationId);
    if (!app) throw new Error('Không tìm thấy hồ sơ');
    const oldStatus = app.status;
    app.status = payload.status;
    app.version += 1;
    app.updatedAt = new Date().toISOString();

    const history = devHistoryStore[applicationId] || [];
    history.unshift({
      id: `h-${Date.now()}`,
      eventType: 'STATUS_CHANGE',
      fromStatus: oldStatus,
      toStatus: payload.status,
      oldCvId: null,
      newCvId: null,
      publicMessage: `Trạng thái hồ sơ được cập nhật sang ${payload.status}.`,
      createdAt: new Date().toISOString(),
      aggregateVersion: app.version,
    });
    devHistoryStore[applicationId] = history;

    return { ...app };
  },

  reviewCvChange: async (
    applicationId: string,
    payload: ReviewCvChangeRequest,
  ): Promise<DevApplicationItem> => {
    void payload;
    const app = devApplicationsStore.find((a) => a.applicationId === applicationId);
    if (!app) throw new Error('Không tìm thấy hồ sơ');
    if (!app.pendingCvChange) throw new Error('Không có đề nghị đổi CV nào đang chờ duyệt');

    const oldCvId = app.currentCvVersionId;
    const newCvId = app.pendingCvChange.newCvId;
    app.currentCvVersionId = newCvId;
    app.pendingCvChange = null;
    app.version += 1;
    app.updatedAt = new Date().toISOString();

    const history = devHistoryStore[applicationId] || [];
    history.unshift({
      id: `h-cv-${Date.now()}`,
      eventType: 'CV_REPLACED',
      fromStatus: app.status,
      toStatus: app.status,
      oldCvId,
      newCvId,
      publicMessage: 'Nhà tuyển dụng đã chấp thuận đề nghị cập nhật CV phiên bản mới.',
      createdAt: new Date().toISOString(),
      aggregateVersion: app.version,
    });
    devHistoryStore[applicationId] = history;

    return { ...app };
  },

  publishResult: async (
    applicationId: string,
    payload: PublishResultRequest,
  ): Promise<DevApplicationItem> => {
    const app = devApplicationsStore.find((a) => a.applicationId === applicationId);
    if (!app) throw new Error('Không tìm thấy hồ sơ');
    const oldStatus = app.status;
    app.status = payload.result;
    app.resultMessage = payload.message;
    app.resultPublishedAt = new Date().toISOString();
    app.version += 1;
    app.updatedAt = new Date().toISOString();

    const history = devHistoryStore[applicationId] || [];
    history.unshift({
      id: `h-res-${Date.now()}`,
      eventType: 'RESULT_PUBLISHED',
      fromStatus: oldStatus,
      toStatus: payload.result,
      oldCvId: null,
      newCvId: null,
      publicMessage: payload.message,
      createdAt: new Date().toISOString(),
      aggregateVersion: app.version,
    });
    devHistoryStore[applicationId] = history;

    return { ...app };
  },

  // ==========================================
  // Interviews Store & Handlers
  // ==========================================
  getInterviews: async (): Promise<DevInterviewItem[]> => {
    return [...devInterviewsStore];
  },

  getInterviewDetail: async (id: string): Promise<DevInterviewItem> => {
    const found = devInterviewsStore.find((iv) => iv.id === id);
    if (found) return { ...found };
    return { ...devInterviewsStore[0]! };
  },

  scheduleInterview: async (payload: {
    applicationId: string;
    startAt: string;
    durationMinutes: number;
    format: 'ONLINE' | 'IN_PERSON';
    interviewerIds: string[];
    notes?: string;
    location?: string;
  }): Promise<DevInterviewItem> => {
    const app = devApplicationsStore.find((a) => a.applicationId === payload.applicationId);
    const candidateName = app ? app.candidateSnapshot.name : 'Ứng viên';
    const candidateEmail = app ? app.candidateSnapshot.email : 'candidate@email.com';
    const jobTitle = app ? app.jobTitle : 'Vị trí tuyển dụng';

    const startDate = new Date(payload.startAt);
    const endDate = new Date(startDate.getTime() + payload.durationMinutes * 60000);

    const interviewers = devMembersStore.filter((m) => payload.interviewerIds.includes(m.userId));

    const newInterview: DevInterviewItem = {
      id: `iv-${Date.now()}`,
      applicationId: payload.applicationId,
      candidateName,
      candidateEmail,
      jobTitle,
      startAt: payload.startAt,
      endAt: endDate.toISOString(),
      durationMinutes: payload.durationMinutes,
      format: payload.format,
      status: 'CONFIRMED',
      interviewers: interviewers.map((i) => ({
        userId: i.userId,
        fullName: i.fullName,
        email: i.email,
      })),
      locationOrMeetingLink:
        payload.format === 'ONLINE'
          ? 'https://meet.talento.vn/room-iv-' + Date.now().toString(36)
          : payload.location || 'Phòng họp Tầng 8, Trụ sở Talento',
      evaluations: [],
    };

    devInterviewsStore.unshift(newInterview);

    if (app) {
      app.status = 'INTERVIEW_SCHEDULED';
      app.version += 1;
      const history = devHistoryStore[payload.applicationId] || [];
      history.unshift({
        id: `h-iv-${Date.now()}`,
        eventType: 'INTERVIEW_CONFIRMED',
        fromStatus: 'SHORTLISTED',
        toStatus: 'INTERVIEW_SCHEDULED',
        oldCvId: null,
        newCvId: null,
        publicMessage: `Lịch phỏng vấn đã được xác nhận vào lúc ${new Date(payload.startAt).toLocaleString('vi-VN')}.`,
        createdAt: new Date().toISOString(),
        aggregateVersion: app.version,
      });
      devHistoryStore[payload.applicationId] = history;
    }

    return newInterview;
  },

  submitEvaluation: async (
    interviewId: string,
    payload: {
      interviewerId: string;
      technicalScore: number;
      problemSolvingScore: number;
      cultureFitScore: number;
      recommendation: 'HIRE' | 'HOLD' | 'REJECT';
      note: string;
    },
  ): Promise<{ success: true }> => {
    const iv = devInterviewsStore.find((i) => i.id === interviewId);
    if (!iv) throw new Error('Không tìm thấy lịch phỏng vấn');

    const reviewer = devMembersStore.find((m) => m.userId === payload.interviewerId);
    if (!iv.evaluations) iv.evaluations = [];

    iv.evaluations.push({
      interviewerId: payload.interviewerId,
      interviewerName: reviewer?.fullName || 'Người phỏng vấn',
      technicalScore: payload.technicalScore,
      problemSolvingScore: payload.problemSolvingScore,
      cultureFitScore: payload.cultureFitScore,
      recommendation: payload.recommendation,
      note: payload.note,
      submittedAt: new Date().toISOString(),
    });

    iv.status = 'COMPLETED';

    // Transition application to INTERVIEWED if not yet
    const app = devApplicationsStore.find((a) => a.applicationId === iv.applicationId);
    if (app && app.status === 'INTERVIEW_SCHEDULED') {
      app.status = 'INTERVIEWED';
      app.version += 1;
    }

    return { success: true };
  },
};

// ====================================================
// Mock In-memory Storage for Applications & Interviews
// ====================================================
export interface DevApplicationItem extends CandidateApplicationDto {
  jobTitle: string;
  pendingCvChange?: {
    requestId: string;
    requestVersion: number;
    newCvId: string;
    newCvName?: string;
    reason?: string;
    createdAt: string;
  } | null;
}

export interface DevInterviewItem {
  id: string;
  applicationId: string;
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  startAt: string;
  endAt: string;
  durationMinutes: number;
  format: 'ONLINE' | 'IN_PERSON';
  status: 'PROPOSED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  interviewers: { userId: string; fullName: string; email: string }[];
  locationOrMeetingLink: string;
  evaluations?: {
    interviewerId: string;
    interviewerName: string;
    technicalScore: number;
    problemSolvingScore: number;
    cultureFitScore: number;
    recommendation: 'HIRE' | 'HOLD' | 'REJECT';
    note: string;
    submittedAt: string;
  }[];
}

const devApplicationsStore: DevApplicationItem[] = [
  {
    applicationId: 'app-001',
    jobId: 'j1111111-1111-1111-1111-111111111111',
    jobTitle: 'Senior Frontend Engineer (React/TypeScript)',
    status: 'SCREENING',
    version: 2,
    originalCvVersionId: 'cv-ver-1-quan',
    currentCvVersionId: 'cv-ver-1-quan',
    candidateSnapshot: {
      name: 'Đặng Minh Quân',
      email: 'minhquan.dang@gmail.com',
      phone: '0901234567',
      headline: 'Senior React Developer | 5 năm kinh nghiệm SPA & Design System',
    },
    coverLetter:
      'Kính gửi bộ phận Tuyển dụng Talento, tôi có hơn 5 năm kinh nghiệm thực chiến phát triển ứng dụng React quy mô lớn với TypeScript, Tailwind và kiến trúc Micro-Frontend. Rất mong muốn được đóng góp cho hệ thống của công ty.',
    submittedAt: '2026-02-01T09:30:00+07:00',
    updatedAt: '2026-02-02T14:15:00+07:00',
    resultMessage: null,
    resultPublishedAt: null,
    pendingCvChange: {
      requestId: 'req-cv-001',
      requestVersion: 1,
      newCvId: 'cv-ver-2-quan',
      newCvName: 'CV_DangMinhQuan_Frontend_Senior_2026_Updated.pdf',
      reason: 'Cập nhật thêm chứng chỉ AWS Certified Developer và dự án fintech gần nhất.',
      createdAt: '2026-02-02T14:00:00+07:00',
    },
  },
  {
    applicationId: 'app-002',
    jobId: 'j1111111-1111-1111-1111-111111111111',
    jobTitle: 'Senior Frontend Engineer (React/TypeScript)',
    status: 'INTERVIEWED',
    version: 4,
    originalCvVersionId: 'cv-ver-1-baoanh',
    currentCvVersionId: 'cv-ver-1-baoanh',
    candidateSnapshot: {
      name: 'Lê Bảo Anh',
      email: 'baoanh.le@techcorp.vn',
      phone: '0987654321',
      headline: 'Frontend Lead | Next.js & Performance Optimization',
    },
    coverLetter: 'Xin chào quý công ty, tôi ứng tuyển vị trí Senior Frontend Engineer...',
    submittedAt: '2026-01-20T10:00:00+07:00',
    updatedAt: '2026-02-10T16:00:00+07:00',
    resultMessage: null,
    resultPublishedAt: null,
    pendingCvChange: null,
  },
  {
    applicationId: 'app-003',
    jobId: 'j2222222-2222-2222-2222-222222222222',
    jobTitle: 'Backend Engineer (NodeJS / NestJS)',
    status: 'SUBMITTED',
    version: 1,
    originalCvVersionId: 'cv-ver-1-nam',
    currentCvVersionId: 'cv-ver-1-nam',
    candidateSnapshot: {
      name: 'Phạm Hoàng Nam',
      email: 'hoangnam.pham@backend.io',
      phone: '0912348899',
      headline: 'Backend Developer | NestJS, PostgreSQL & Event-Driven Architecture',
    },
    coverLetter: 'Tôi có 3 năm kinh nghiệm phát triển backend bằng NestJS và Prisma...',
    submittedAt: '2026-02-12T11:20:00+07:00',
    updatedAt: '2026-02-12T11:20:00+07:00',
    resultMessage: null,
    resultPublishedAt: null,
    pendingCvChange: null,
  },
  {
    applicationId: 'app-004',
    jobId: 'j1111111-1111-1111-1111-111111111111',
    jobTitle: 'Senior Frontend Engineer (React/TypeScript)',
    status: 'HIRED',
    version: 5,
    originalCvVersionId: 'cv-ver-1-trang',
    currentCvVersionId: 'cv-ver-1-trang',
    candidateSnapshot: {
      name: 'Vũ Thu Trang',
      email: 'thutrang.vu@gmail.com',
      phone: '0933221100',
      headline: 'UI/UX Engineer & React Enthusiast',
    },
    coverLetter: 'Rất hân hạnh được ứng tuyển vào vị trí Frontend...',
    submittedAt: '2026-01-10T08:00:00+07:00',
    updatedAt: '2026-02-15T09:00:00+07:00',
    resultMessage: 'Chúc mừng bạn đã trúng tuyển vị trí Senior Frontend Engineer tại Talento!',
    resultPublishedAt: '2026-02-15T09:00:00+07:00',
    pendingCvChange: null,
  },
];

const devHistoryStore: Record<string, CandidateHistoryDto[]> = {
  'app-001': [
    {
      id: 'h-01',
      eventType: 'STATUS_CHANGE',
      fromStatus: 'SUBMITTED',
      toStatus: 'SCREENING',
      oldCvId: null,
      newCvId: null,
      publicMessage:
        'Hồ sơ đã qua vòng lọc hồ sơ ban đầu và chuyển sang trạng thái Sàng lọc chuyên sâu.',
      createdAt: '2026-02-02T10:00:00+07:00',
      aggregateVersion: 2,
    },
    {
      id: 'h-00',
      eventType: 'SUBMIT',
      fromStatus: null,
      toStatus: 'SUBMITTED',
      oldCvId: null,
      newCvId: 'cv-ver-1-quan',
      publicMessage: 'Ứng viên nộp hồ sơ ứng tuyển với CV phiên bản 1.',
      createdAt: '2026-02-01T09:30:00+07:00',
      aggregateVersion: 1,
    },
  ],
  'app-002': [
    {
      id: 'h-04',
      eventType: 'STATUS_CHANGE',
      fromStatus: 'INTERVIEW_SCHEDULED',
      toStatus: 'INTERVIEWED',
      oldCvId: null,
      newCvId: null,
      publicMessage: 'Đã hoàn thành buổi phỏng vấn chuyên môn và tổng hợp phiếu đánh giá.',
      createdAt: '2026-02-10T16:00:00+07:00',
      aggregateVersion: 4,
    },
    {
      id: 'h-03',
      eventType: 'INTERVIEW_CONFIRMED',
      fromStatus: 'SHORTLISTED',
      toStatus: 'INTERVIEW_SCHEDULED',
      oldCvId: null,
      newCvId: null,
      publicMessage: 'Xác nhận lịch phỏng vấn chuyên môn kỹ thuật.',
      createdAt: '2026-02-05T14:00:00+07:00',
      aggregateVersion: 3,
    },
  ],
};

const devInterviewsStore: DevInterviewItem[] = [
  {
    id: 'iv-001',
    applicationId: 'app-002',
    candidateName: 'Lê Bảo Anh',
    candidateEmail: 'baoanh.le@techcorp.vn',
    jobTitle: 'Senior Frontend Engineer (React/TypeScript)',
    startAt: '2026-02-10T14:30:00+07:00',
    endAt: '2026-02-10T15:30:00+07:00',
    durationMinutes: 60,
    format: 'ONLINE',
    status: 'COMPLETED',
    interviewers: [
      {
        userId: 'u3333333-3333-3333-3333-333333333333',
        fullName: 'Lê Hoàng Cường (Tech Lead)',
        email: 'interviewer.cuong@talento.vn',
      },
    ],
    locationOrMeetingLink: 'https://meet.talento.vn/room-senior-fe-baoanh',
    evaluations: [
      {
        interviewerId: 'u3333333-3333-3333-3333-333333333333',
        interviewerName: 'Lê Hoàng Cường',
        technicalScore: 5,
        problemSolvingScore: 4,
        cultureFitScore: 5,
        recommendation: 'HIRE',
        note: 'Ứng viên nắm rất chắc về kiến trúc Frontend, am hiểu lifecycle React 19 và các kỹ thuật server components. Khuyên tuyển dụng.',
        submittedAt: '2026-02-10T16:00:00+07:00',
      },
    ],
  },
  {
    id: 'iv-002',
    applicationId: 'app-001',
    candidateName: 'Đặng Minh Quân',
    candidateEmail: 'minhquan.dang@gmail.com',
    jobTitle: 'Senior Frontend Engineer (React/TypeScript)',
    startAt: '2026-12-25T10:00:00+07:00',
    endAt: '2026-12-25T11:00:00+07:00',
    durationMinutes: 60,
    format: 'ONLINE',
    status: 'CONFIRMED',
    interviewers: [
      {
        userId: 'u2222222-2222-2222-2222-222222222222',
        fullName: 'Trần Thị Bình (Tuyển dụng)',
        email: 'recruiter.binh@talento.vn',
      },
      {
        userId: 'u3333333-3333-3333-3333-333333333333',
        fullName: 'Lê Hoàng Cường (Tech Lead)',
        email: 'interviewer.cuong@talento.vn',
      },
    ],
    locationOrMeetingLink: 'https://meet.talento.vn/room-fe-minhquan',
    evaluations: [],
  },
];
