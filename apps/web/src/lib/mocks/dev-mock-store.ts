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
};
