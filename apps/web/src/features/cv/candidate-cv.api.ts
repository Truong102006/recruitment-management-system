import { apiClient } from '../../lib/http/api-client';
import { isDevBrowser } from '../../lib/mocks/dev-mock-store';

export interface CvDto {
  id: string;
  fileName: string;
  fileSize: number;
  fileUrl: string;
  status: 'ACTIVE' | 'SCANNING' | 'REJECTED';
  isDefault: boolean;
  uploadedAt: string;
  applicationCount: number;
}

const STORAGE_KEY = 'rms_candidate_cvs';

function getStoredCvs(): CvDto[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return [
    {
      id: 'cv-default-1',
      fileName: 'NguyenVanA_Resume_SeniorFrontend.pdf',
      fileSize: 1024 * 1024 * 1.5, // 1.5 MB
      fileUrl: '/mock-cv/resume-1.pdf',
      status: 'ACTIVE',
      isDefault: true,
      uploadedAt: '2026-01-10T10:00:00Z',
      applicationCount: 2, // In use by applications
    },
    {
      id: 'cv-alt-2',
      fileName: 'NguyenVanA_CV_English.pdf',
      fileSize: 1024 * 800, // 800 KB
      fileUrl: '/mock-cv/resume-2.pdf',
      status: 'ACTIVE',
      isDefault: false,
      uploadedAt: '2026-02-01T14:30:00Z',
      applicationCount: 0, // Not referenced
    },
  ];
}

function saveStoredCvs(cvs: CvDto[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cvs));
  } catch {
    // ignore
  }
}

export async function listCandidateCvs(): Promise<CvDto[]> {
  try {
    return await apiClient.get<CvDto[]>('/api/candidate/cvs');
  } catch (error) {
    if (!isDevBrowser()) throw error;
    return getStoredCvs();
  }
}

export async function uploadCandidateCv(file: File): Promise<CvDto> {
  // FE15 Validations
  if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
    throw new Error('Định dạng tệp không hợp lệ. Hệ thống chỉ chấp nhận tệp định dạng PDF.');
  }

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('Kích thước tệp vượt quá giới hạn cho phép (tối đa 5MB).');
  }

  if (
    file.name.toLowerCase().includes('encrypted') ||
    file.name.toLowerCase().includes('password')
  ) {
    throw new Error('Tệp PDF được bảo vệ bằng mật khẩu. Vui lòng gỡ mật khẩu trước khi tải lên.');
  }

  try {
    const formData = new FormData();
    formData.append('file', file);
    return await apiClient.post<CvDto>('/api/candidate/cvs', formData);
  } catch (error) {
    if (!isDevBrowser()) throw error;
    // Fallback store
    const current = getStoredCvs();
    const newCv: CvDto = {
      id: 'cv-' + Date.now(),
      fileName: file.name,
      fileSize: file.size,
      fileUrl: URL.createObjectURL ? URL.createObjectURL(file) : '/mock-cv/new.pdf',
      status: 'SCANNING', // FE14 initial status
      isDefault: current.length === 0,
      uploadedAt: new Date().toISOString(),
      applicationCount: 0,
    };
    current.unshift(newCv);
    saveStoredCvs(current);
    return newCv;
  }
}

export async function deleteCandidateCv(cvId: string): Promise<void> {
  // Check if in use
  const current = isDevBrowser() ? getStoredCvs() : [];
  const target = current.find((c) => c.id === cvId);
  if (target && target.applicationCount > 0) {
    throw new Error(
      `Không thể xóa CV này vì đang được sử dụng trong ${target.applicationCount} hồ sơ ứng tuyển đang hoạt động.`,
    );
  }

  try {
    await apiClient.delete(`/api/candidate/cvs/${encodeURIComponent(cvId)}`);
  } catch (error) {
    if (!isDevBrowser()) throw error;
    const filtered = current.filter((c) => c.id !== cvId);
    saveStoredCvs(filtered);
  }
}

export async function setDefaultCandidateCv(cvId: string): Promise<void> {
  try {
    await apiClient.post(`/api/candidate/cvs/${encodeURIComponent(cvId)}/default`);
  } catch (error) {
    if (!isDevBrowser()) throw error;
    const current = getStoredCvs();
    for (const c of current) {
      c.isDefault = c.id === cvId;
    }
    saveStoredCvs(current);
  }
}
