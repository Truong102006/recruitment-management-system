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
  return Boolean(
    import.meta.env.DEV &&
    import.meta.env.MODE !== 'test' &&
    import.meta.env.VITE_ENABLE_DEMO_MOCKS === 'true',
  );
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

  recordAttendance: async (
    interviewId: string,
    participantId: string,
    status: 'ATTENDED' | 'ABSENT' | 'NO_SHOW',
  ): Promise<DevInterviewItem> => {
    const iv = devInterviewsStore.find((i) => i.id === interviewId);
    if (!iv) throw new Error('Không tìm thấy buổi phỏng vấn');
    if (!iv.participants) {
      iv.participants = [];
    }
    const p = iv.participants.find((part) => part.userId === participantId);
    if (p) {
      p.attendanceStatus = status;
    }
    return { ...iv };
  },

  submitEvaluation: async (
    interviewId: string,
    payload: {
      technicalScore: number;
      problemSolvingScore: number;
      cultureFitScore: number;
      recommendation: 'HIRE' | 'HOLD' | 'REJECT';
      note: string;
    },
  ): Promise<{ success: true }> => {
    const iv = devInterviewsStore.find((i) => i.id === interviewId);
    if (!iv) throw new Error('Không tìm thấy buổi phỏng vấn');
    if (!iv.evaluations) iv.evaluations = [];
    iv.evaluations.push({
      interviewerId: 'u-dev-1',
      interviewerName: 'Người phỏng vấn',
      technicalScore: payload.technicalScore,
      problemSolvingScore: payload.problemSolvingScore,
      cultureFitScore: payload.cultureFitScore,
      recommendation: payload.recommendation,
      note: payload.note,
      submittedAt: new Date().toISOString(),
    });
    return { success: true };
  },

  getRoomToken: async (
    interviewId: string,
  ): Promise<{ token: string; roomName: string; domain: string }> => {
    const iv = devInterviewsStore.find((i) => i.id === interviewId);
    if (!iv) throw new Error('Không tìm thấy buổi phỏng vấn');
    return {
      token: `jwt-jitsi-mock-${interviewId}-${Date.now()}`,
      roomName: `rms-interview-${interviewId}`,
      domain: 'meet.jit.si',
    };
  },

  getStatistics: async (
    companyId: string,
    periodDays: number = 30,
  ): Promise<RecruitmentFunnelDto> => {
    void companyId;
    void periodDays;
    const submitted = devApplicationsStore.length;
    const screening = devApplicationsStore.filter(
      (a) =>
        a.status === 'SCREENING' ||
        a.status === 'SHORTLISTED' ||
        a.status === 'INTERVIEWED' ||
        a.status === 'HIRED',
    ).length;
    const interviewed = devApplicationsStore.filter(
      (a) => a.status === 'INTERVIEWED' || a.status === 'HIRED',
    ).length;
    const hired = devApplicationsStore.filter((a) => a.status === 'HIRED').length;
    const rejected = devApplicationsStore.filter((a) => a.status === 'REJECTED').length;

    // FE38: Safe calculation preventing NaN or Infinity
    const calcRate = (num: number, den: number): number => {
      if (!den || den === 0 || isNaN(den)) return 0;
      const res = (num / den) * 100;
      return isFinite(res) ? Math.round(res * 10) / 10 : 0;
    };

    return {
      submitted,
      screening,
      interviewed,
      hired,
      rejected,
      rates: {
        submittedToScreening: calcRate(screening, submitted),
        screeningToInterviewed: calcRate(interviewed, screening),
        interviewedToHired: calcRate(hired, interviewed),
        overallHiredRate: calcRate(hired, submitted),
      },
      asOf: new Date().toISOString(),
      period: `${periodDays} ngày qua`,
    };
  },

  getAdminCompanies: async (params?: {
    status?: string;
    q?: string;
  }): Promise<{ data: CompanyDto[]; meta: { total: number } }> => {
    let list = [...devAdminCompaniesStore];
    if (params?.status && params.status !== 'ALL') {
      list = list.filter((c) => c.approvalStatus === params.status);
    }
    if (params?.q) {
      const q = params.q.toLowerCase();
      list = list.filter(
        (c) => c.name.toLowerCase().includes(q) || c.taxCode.toLowerCase().includes(q),
      );
    }
    return { data: list, meta: { total: list.length } };
  },

  reviewCompany: async (
    companyId: string,
    payload: { status: 'APPROVED' | 'REJECTED'; reason?: string; version: number },
  ): Promise<CompanyDto> => {
    const comp = devAdminCompaniesStore.find((c) => c.id === companyId);
    if (!comp) throw new Error('Không tìm thấy doanh nghiệp');
    if (payload.status === 'REJECTED' && !payload.reason?.trim()) {
      throw new Error('Bắt buộc nhập lý do từ chối (FE39)');
    }
    comp.approvalStatus = payload.status;
    comp.rejectionReason = payload.reason || null;
    comp.version += 1;
    comp.updatedAt = new Date().toISOString();

    devAuditLogsStore.unshift({
      id: `audit-${Date.now()}`,
      actorId: 'admin-01',
      actorEmail: 'admin@rms.gov.vn',
      action: `REVIEW_COMPANY_${payload.status}`,
      entityType: 'Company',
      entityId: companyId,
      traceId: `tr-${Date.now()}`,
      details: `Đã ${payload.status === 'APPROVED' ? 'phê duyệt' : 'từ chối'} doanh nghiệp ${comp.name}. Lý do: ${payload.reason || 'N/A'}`,
      createdAt: new Date().toISOString(),
    });

    return { ...comp };
  },

  suspendCompany: async (
    companyId: string,
    payload: { reason: string; version: number },
  ): Promise<CompanyDto> => {
    const comp = devAdminCompaniesStore.find((c) => c.id === companyId);
    if (!comp) throw new Error('Không tìm thấy doanh nghiệp');
    comp.approvalStatus = 'SUSPENDED';
    comp.rejectionReason = payload.reason;
    comp.version += 1;
    comp.updatedAt = new Date().toISOString();

    devAuditLogsStore.unshift({
      id: `audit-${Date.now()}`,
      actorId: 'admin-01',
      actorEmail: 'admin@rms.gov.vn',
      action: 'SUSPEND_COMPANY',
      entityType: 'Company',
      entityId: companyId,
      traceId: `tr-${Date.now()}`,
      details: `Đã đình chỉ hoạt động doanh nghiệp ${comp.name}. Lý do: ${payload.reason}`,
      createdAt: new Date().toISOString(),
    });

    return { ...comp };
  },

  unsuspendCompany: async (
    companyId: string,
    payload: { version: number },
  ): Promise<CompanyDto> => {
    void payload;
    const comp = devAdminCompaniesStore.find((c) => c.id === companyId);
    if (!comp) throw new Error('Không tìm thấy doanh nghiệp');
    comp.approvalStatus = 'APPROVED';
    comp.rejectionReason = null;
    comp.version += 1;
    comp.updatedAt = new Date().toISOString();

    devAuditLogsStore.unshift({
      id: `audit-${Date.now()}`,
      actorId: 'admin-01',
      actorEmail: 'admin@rms.gov.vn',
      action: 'UNSUSPEND_COMPANY',
      entityType: 'Company',
      entityId: companyId,
      traceId: `tr-${Date.now()}`,
      details: `Đã khôi phục hoạt động cho doanh nghiệp ${comp.name}`,
      createdAt: new Date().toISOString(),
    });

    return { ...comp };
  },

  getEligibleOwners: async (companyId: string) => {
    void companyId;
    return devMembersStore
      .filter((m) => m.active)
      .map((m) => ({
        userId: m.userId,
        fullName: m.fullName,
        email: m.email,
        role: m.role,
        active: m.active,
        version: m.version,
      }));
  },

  recoverOwner: async (
    companyId: string,
    payload: {
      targetUserId: string;
      targetMemberVersion: number;
      companyVersion: number;
      reason: string;
    },
  ): Promise<CompanyDto> => {
    const comp = devAdminCompaniesStore.find((c) => c.id === companyId);
    if (!comp) throw new Error('Không tìm thấy doanh nghiệp');
    const member = devMembersStore.find((m) => m.userId === payload.targetUserId);
    if (member) {
      member.role = 'OWNER';
      member.version += 1;
    }
    comp.version += 1;
    comp.updatedAt = new Date().toISOString();

    devAuditLogsStore.unshift({
      id: `audit-${Date.now()}`,
      actorId: 'admin-01',
      actorEmail: 'admin@rms.gov.vn',
      action: 'RECOVER_OWNER',
      entityType: 'Company',
      entityId: companyId,
      traceId: `tr-${Date.now()}`,
      details: `Đã chỉ định ${member?.fullName || payload.targetUserId} làm Owner mới theo yêu cầu khôi phục. Lý do: ${payload.reason}`,
      createdAt: new Date().toISOString(),
    });

    return { ...comp };
  },

  getAdminUsers: async (params?: {
    status?: string;
    q?: string;
  }): Promise<{ data: AdminUserDto[]; meta: { total: number } }> => {
    let list = [...devAdminUsersStore];
    if (params?.status && params.status !== 'ALL') {
      list = list.filter((u) => u.status === params.status);
    }
    if (params?.q) {
      const q = params.q.toLowerCase();
      list = list.filter(
        (u) => u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
      );
    }
    return { data: list, meta: { total: list.length } };
  },

  updateUserStatus: async (
    userId: string,
    payload: { status: 'ACTIVE' | 'LOCKED'; reason?: string; version: number },
  ): Promise<AdminUserDto> => {
    const user = devAdminUsersStore.find((u) => u.userId === userId);
    if (!user) throw new Error('Không tìm thấy người dùng');

    // FE40: Chặn khóa tài khoản ADMIN cuối cùng
    if (user.role === 'ADMIN' && payload.status === 'LOCKED') {
      const activeAdmins = devAdminUsersStore.filter(
        (u) => u.role === 'ADMIN' && u.status === 'ACTIVE',
      );
      if (activeAdmins.length <= 1) {
        throw new Error('Không thể khóa tài khoản Quản trị viên (ADMIN) cuối cùng của hệ thống!');
      }
    }

    user.status = payload.status;
    user.version += 1;
    user.updatedAt = new Date().toISOString();

    devAuditLogsStore.unshift({
      id: `audit-${Date.now()}`,
      actorId: 'admin-01',
      actorEmail: 'admin@rms.gov.vn',
      action: `USER_${payload.status}`,
      entityType: 'User',
      entityId: userId,
      traceId: `tr-${Date.now()}`,
      details: `Đã ${payload.status === 'LOCKED' ? 'khóa' : 'mở khóa'} tài khoản ${user.email}. Lý do: ${payload.reason || 'N/A'}`,
      createdAt: new Date().toISOString(),
    });

    return { ...user };
  },

  getAdminJobs: async (params?: {
    status?: string;
    q?: string;
  }): Promise<{ data: JobDetailDto[]; meta: { total: number } }> => {
    let list = [...devJobsStore];
    if (params?.status && params.status !== 'ALL') {
      list = list.filter((j) => j.status === params.status);
    }
    if (params?.q) {
      const q = params.q.toLowerCase();
      list = list.filter(
        (j) => j.title.toLowerCase().includes(q) || j.companyName.toLowerCase().includes(q),
      );
    }
    return { data: list, meta: { total: list.length } };
  },

  adminCloseJob: async (
    jobId: string,
    payload: { version: number; reason: string },
  ): Promise<JobDetailDto> => {
    const job = devJobsStore.find((j) => j.id === jobId);
    if (!job) throw new Error('Không tìm thấy tin tuyển dụng');
    job.status = 'CLOSED';
    job.version += 1;
    job.updatedAt = new Date().toISOString();

    devAuditLogsStore.unshift({
      id: `audit-${Date.now()}`,
      actorId: 'admin-01',
      actorEmail: 'admin@rms.gov.vn',
      action: 'ADMIN_CLOSE_JOB',
      entityType: 'Job',
      entityId: jobId,
      traceId: `tr-${Date.now()}`,
      details: `Admin đóng tin tuyển dụng vi phạm: "${job.title}". Lý do: ${payload.reason}`,
      createdAt: new Date().toISOString(),
    });

    return { ...job };
  },

  getAuditLogs: async (params?: {
    entityType?: string;
    q?: string;
  }): Promise<{ data: AuditLogItem[]; meta: { total: number } }> => {
    let list = [...devAuditLogsStore];
    if (params?.entityType && params.entityType !== 'ALL') {
      list = list.filter((a) => a.entityType === params.entityType);
    }
    if (params?.q) {
      const q = params.q.toLowerCase();
      list = list.filter(
        (a) =>
          a.action.toLowerCase().includes(q) ||
          a.details.toLowerCase().includes(q) ||
          a.traceId.toLowerCase().includes(q),
      );
    }
    return { data: list, meta: { total: list.length } };
  },

  getOutboxEvents: async (params?: {
    status?: string;
  }): Promise<{ data: OutboxEventItem[]; meta: { total: number } }> => {
    let list = [...devOutboxStore];
    if (params?.status && params.status !== 'ALL') {
      list = list.filter((e) => e.status === params.status);
    }
    return { data: list, meta: { total: list.length } };
  },

  retryOutboxEvent: async (eventId: string): Promise<OutboxEventItem> => {
    const evt = devOutboxStore.find((e) => e.id === eventId);
    if (!evt) throw new Error('Không tìm thấy sự kiện Outbox');
    evt.status = 'PUBLISHED';
    evt.retryCount += 1;
    evt.lastError = null;
    evt.updatedAt = new Date().toISOString();

    // FE41: Record audit log for retry
    devAuditLogsStore.unshift({
      id: `audit-${Date.now()}`,
      actorId: 'admin-01',
      actorEmail: 'admin@rms.gov.vn',
      action: 'RETRY_OUTBOX_EVENT',
      entityType: 'OutboxEvent',
      entityId: eventId,
      traceId: `tr-${Date.now()}`,
      details: `Admin kích hoạt retry sự kiện ${evt.eventType} (ID: ${eventId}).`,
      createdAt: new Date().toISOString(),
    });

    return { ...evt };
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

export interface InterviewParticipant {
  userId: string;
  fullName: string;
  email: string;
  role: 'INTERVIEWER' | 'CANDIDATE';
  responseStatus: 'ACCEPTED' | 'PENDING' | 'DECLINED';
  attendanceStatus?: 'ATTENDED' | 'ABSENT' | 'NO_SHOW' | null;
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
  participants?: InterviewParticipant[];
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

export interface RecruitmentFunnelDto {
  submitted: number;
  screening: number;
  interviewed: number;
  hired: number;
  rejected: number;
  rates: {
    submittedToScreening: number;
    screeningToInterviewed: number;
    interviewedToHired: number;
    overallHiredRate: number;
  };
  asOf: string;
  period: string;
}

export interface AdminUserDto {
  userId: string;
  email: string;
  fullName: string;
  role: string;
  status: 'ACTIVE' | 'LOCKED';
  version: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuditLogItem {
  id: string;
  actorId: string;
  actorEmail: string;
  action: string;
  entityType: string;
  entityId: string;
  traceId: string;
  details: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface OutboxEventItem {
  id: string;
  eventType: string;
  aggregateType: string;
  aggregateId: string;
  traceId?: string;
  status: 'PENDING' | 'PUBLISHED' | 'FAILED';
  payload: Record<string, unknown>;
  retryCount: number;
  lastError?: string | null;
  createdAt: string;
  updatedAt: string;
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
    participants: [
      {
        userId: 'cand-002',
        fullName: 'Lê Bảo Anh',
        email: 'baoanh.le@techcorp.vn',
        role: 'CANDIDATE',
        responseStatus: 'ACCEPTED',
        attendanceStatus: 'ATTENDED',
      },
      {
        userId: 'u3333333-3333-3333-3333-333333333333',
        fullName: 'Lê Hoàng Cường (Tech Lead)',
        email: 'interviewer.cuong@talento.vn',
        role: 'INTERVIEWER',
        responseStatus: 'ACCEPTED',
        attendanceStatus: 'ATTENDED',
      },
    ],
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
    participants: [
      {
        userId: 'cand-001',
        fullName: 'Đặng Minh Quân',
        email: 'minhquan.dang@gmail.com',
        role: 'CANDIDATE',
        responseStatus: 'ACCEPTED',
        attendanceStatus: null,
      },
      {
        userId: 'u2222222-2222-2222-2222-222222222222',
        fullName: 'Trần Thị Bình',
        email: 'recruiter.binh@talento.vn',
        role: 'INTERVIEWER',
        responseStatus: 'ACCEPTED',
        attendanceStatus: null,
      },
      {
        userId: 'u3333333-3333-3333-3333-333333333333',
        fullName: 'Lê Hoàng Cường',
        email: 'interviewer.cuong@talento.vn',
        role: 'INTERVIEWER',
        responseStatus: 'ACCEPTED',
        attendanceStatus: null,
      },
    ],
    evaluations: [],
  },
  {
    id: 'iv-003',
    applicationId: 'app-003',
    candidateName: 'Phạm Hoàng Nam',
    candidateEmail: 'hoangnam.pham@backend.io',
    jobTitle: 'Backend Engineer (NodeJS / NestJS)',
    startAt: '2026-12-28T14:00:00+07:00',
    endAt: '2026-12-28T15:00:00+07:00',
    durationMinutes: 60,
    format: 'ONLINE',
    status: 'PROPOSED',
    interviewers: [
      {
        userId: 'u3333333-3333-3333-3333-333333333333',
        fullName: 'Lê Hoàng Cường (Tech Lead)',
        email: 'interviewer.cuong@talento.vn',
      },
    ],
    locationOrMeetingLink: 'https://meet.talento.vn/room-be-hoangnam',
    // FE23: One ACCEPTED, one PENDING -> whole schedule remains PROPOSED / pending confirmation
    participants: [
      {
        userId: 'cand-003',
        fullName: 'Phạm Hoàng Nam',
        email: 'hoangnam.pham@backend.io',
        role: 'CANDIDATE',
        responseStatus: 'ACCEPTED',
        attendanceStatus: null,
      },
      {
        userId: 'u3333333-3333-3333-3333-333333333333',
        fullName: 'Lê Hoàng Cường',
        email: 'interviewer.cuong@talento.vn',
        role: 'INTERVIEWER',
        responseStatus: 'PENDING',
        attendanceStatus: null,
      },
    ],
    evaluations: [],
  },
];

// ==========================================
// Mock Stores for Admin Subsystem
// ==========================================
const devAdminCompaniesStore: CompanyDto[] = [
  { ...devCompany },
  {
    id: 'c2222222-2222-2222-2222-222222222222',
    name: 'Fintech Innovators JSC',
    taxCode: 'TAX-9988776655',
    address: 'Tầng 15, Keangnam Landmark, Cầu Giấy, Hà Nội',
    website: 'https://fintechinnovators.vn',
    description: 'Công ty công nghệ tài chính chuyên về Core Banking thế hệ mới.',
    approvalStatus: 'PENDING',
    rejectionReason: null,
    version: 1,
    createdAt: '2026-02-10T08:00:00Z',
    updatedAt: '2026-02-10T08:00:00Z',
  },
  {
    id: 'c3333333-3333-3333-3333-333333333333',
    name: 'Blockchain Global Enterprise',
    taxCode: 'TAX-5544332211',
    address: '456 Đường Nguyễn Thị Minh Khai, Quận 3, TP.HCM',
    website: 'https://bc-global.example.com',
    description: 'Nền tảng hợp đồng thông minh và giải pháp web3.',
    approvalStatus: 'SUSPENDED',
    rejectionReason:
      'Có dấu hiệu vi phạm chính sách đăng tin đa cấp, tạm khóa để xác minh pháp lý.',
    version: 3,
    createdAt: '2026-01-05T08:00:00Z',
    updatedAt: '2026-02-01T10:00:00Z',
  },
  {
    id: 'c4444444-4444-4444-4444-444444444444',
    name: 'AI Robotics Automation Ltd',
    taxCode: 'TAX-1122334455',
    address: 'Khu Công nghệ cao Hòa Lạc, Thạch Thất, Hà Nội',
    website: 'https://ai-robotics.vn',
    description: 'Chế tạo robot công nghiệp và trí tuệ nhân tạo thị giác máy tính.',
    approvalStatus: 'REJECTED',
    rejectionReason:
      'Mã số thuế không tồn tại trên Cổng thông tin Quốc gia về đăng ký doanh nghiệp.',
    version: 2,
    createdAt: '2026-01-15T09:00:00Z',
    updatedAt: '2026-01-18T14:00:00Z',
  },
  {
    id: 'c5555555-5555-5555-5555-555555555555',
    name: 'Orphan Tech Solutions (Mất Owner)',
    taxCode: 'TAX-7788990011',
    address: 'Khu Công nghệ cao Quận 9, TP. Thủ Đức, TP.HCM',
    website: 'https://orphantech.vn',
    description:
      'Doanh nghiệp nghiên cứu vi mạch. Chủ sở hữu cũ đã rời công ty, cần khôi phục Owner.',
    approvalStatus: 'APPROVED',
    rejectionReason: null,
    version: 4,
    createdAt: '2025-10-01T08:00:00Z',
    updatedAt: '2026-01-01T08:00:00Z',
  },
];

const devAdminUsersStore: AdminUserDto[] = [
  {
    userId: 'u-admin-root',
    email: 'admin.super@rms.gov.vn',
    fullName: 'Quản trị viên Hệ thống (Root)',
    role: 'ADMIN',
    status: 'ACTIVE',
    version: 1,
    createdAt: '2025-12-01T00:00:00Z',
    updatedAt: '2025-12-01T00:00:00Z',
  },
  {
    userId: 'u1111111-1111-1111-1111-111111111111',
    email: 'admin.owner@talento.vn',
    fullName: 'Nguyễn Văn An (Chủ sở hữu Talento)',
    role: 'OWNER',
    status: 'ACTIVE',
    version: 1,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    userId: 'u2222222-2222-2222-2222-222222222222',
    email: 'recruiter.binh@talento.vn',
    fullName: 'Trần Thị Bình (Tuyển dụng)',
    role: 'RECRUITER',
    status: 'ACTIVE',
    version: 1,
    createdAt: '2026-01-15T00:00:00Z',
    updatedAt: '2026-01-15T00:00:00Z',
  },
  {
    userId: 'u3333333-3333-3333-3333-333333333333',
    email: 'interviewer.cuong@talento.vn',
    fullName: 'Lê Hoàng Cường (Tech Lead)',
    role: 'INTERVIEWER',
    status: 'ACTIVE',
    version: 1,
    createdAt: '2026-02-01T00:00:00Z',
    updatedAt: '2026-02-01T00:00:00Z',
  },
  {
    userId: 'u-violator-99',
    email: 'spammer.fake@badmail.com',
    fullName: 'Tài khoản Vi phạm Quảng cáo',
    role: 'CANDIDATE',
    status: 'LOCKED',
    version: 2,
    createdAt: '2026-02-05T00:00:00Z',
    updatedAt: '2026-02-08T00:00:00Z',
  },
];

const devAuditLogsStore: AuditLogItem[] = [
  {
    id: 'audit-001',
    actorId: 'u-admin-root',
    actorEmail: 'admin.super@rms.gov.vn',
    action: 'SYSTEM_BOOTSTRAP',
    entityType: 'System',
    entityId: 'sys-core',
    traceId: 'tr-boot-001',
    details: 'Khởi tạo hệ thống và cấu hình chính sách bảo mật đa tầng.',
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'audit-002',
    actorId: 'u-admin-root',
    actorEmail: 'admin.super@rms.gov.vn',
    action: 'APPROVE_COMPANY',
    entityType: 'Company',
    entityId: devCompany.id,
    traceId: 'tr-comp-002',
    details: `Phê duyệt doanh nghiệp ${devCompany.name} sau khi xác thực mã số thuế hợp lệ.`,
    createdAt: '2026-01-02T10:30:00Z',
  },
  {
    id: 'audit-003',
    actorId: 'u1111111-1111-1111-1111-111111111111',
    actorEmail: 'admin.owner@talento.vn',
    action: 'PUBLISH_JOB',
    entityType: 'Job',
    entityId: 'j1111111-1111-1111-1111-111111111111',
    traceId: 'tr-job-003',
    details: 'Công bố tin tuyển dụng Senior Frontend Engineer.',
    createdAt: '2026-02-01T08:00:00Z',
  },
];

const devOutboxStore: OutboxEventItem[] = [
  {
    id: 'evt-001',
    eventType: 'COMPANY_APPROVED',
    aggregateType: 'Company',
    aggregateId: devCompany.id,
    status: 'PUBLISHED',
    payload: { companyId: devCompany.id, approvedAt: '2026-01-02T10:30:00Z' },
    retryCount: 0,
    lastError: null,
    createdAt: '2026-01-02T10:30:00Z',
    updatedAt: '2026-01-02T10:30:01Z',
  },
  {
    id: 'evt-002',
    eventType: 'JOB_PUBLISHED',
    aggregateType: 'Job',
    aggregateId: 'j1111111-1111-1111-1111-111111111111',
    status: 'PUBLISHED',
    payload: { jobId: 'j1111111-1111-1111-1111-111111111111', companyId: devCompany.id },
    retryCount: 0,
    lastError: null,
    createdAt: '2026-02-01T08:00:00Z',
    updatedAt: '2026-02-01T08:00:01Z',
  },
  {
    id: 'evt-003',
    eventType: 'SEND_INVITATION_EMAIL',
    aggregateType: 'EmailNotification',
    aggregateId: 'mail-notif-777',
    status: 'FAILED',
    payload: {
      recipient: 'new-interviewer@talento.vn',
      subject: 'Thư mời tham gia phỏng vấn',
      template: 'interview_invitation_v1',
    },
    retryCount: 2,
    lastError: 'SMTP Connection Timeout after 30000ms: mail.gateway.rms unreachable',
    createdAt: '2026-02-11T15:20:00Z',
    updatedAt: '2026-02-11T15:25:00Z',
  },
];
