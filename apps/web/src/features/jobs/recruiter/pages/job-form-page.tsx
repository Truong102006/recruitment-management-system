import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCompanyContext } from '../../../companies/context/company-context';
import { recruiterJobsApi } from '../api/recruiter-jobs.api';
import { ConfirmDialog } from '../../../../components/ui/dialog';
import { ApiException } from '../../../../lib/http/api-client';
import type { JobType, WorkplaceMode, Currency, SkillDto } from '@rms/contracts/public';

export const JobFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { currentCompanyId, currentCompany } = useCompanyContext();

  // Job data & version
  const [version, setVersion] = useState<number>(1);
  const [skillsList, setSkillsList] = useState<SkillDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Form State
  const [title, setTitle] = useState<string>('');
  const [headcount, setHeadcount] = useState<number>(1);
  const [jobType, setJobType] = useState<JobType>('FULL_TIME');
  const [workplaceMode, setWorkplaceMode] = useState<WorkplaceMode>('ON_SITE');
  const [location, setLocation] = useState<string>('');
  const [deadline, setDeadline] = useState<string>(''); // YYYY-MM-DDTHH:mm
  const [isNegotiableSalary, setIsNegotiableSalary] = useState<boolean>(true);
  const [salaryMin, setSalaryMin] = useState<string>('');
  const [salaryMax, setSalaryMax] = useState<string>('');
  const [currency, setCurrency] = useState<Currency>('VND');
  const [description, setDescription] = useState<string>('');
  const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>([]);

  // Dirty form navigation warning
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState<boolean>(false);

  // Convert Date to local datetime string format for input[type="datetime-local"]
  const toLocalDatetimeString = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      const pad = (n: number) => String(n).padStart(2, '0');
      const year = d.getFullYear();
      const month = pad(d.getMonth() + 1);
      const day = pad(d.getDate());
      const hours = pad(d.getHours());
      const minutes = pad(d.getMinutes());
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch {
      return '';
    }
  };

  // Convert local datetime to ISO8601 with Asia/Ho_Chi_Minh offset (+07:00)
  const formatDeadlineWithOffset = (localStr: string) => {
    if (!localStr) return undefined;
    // localStr format: YYYY-MM-DDTHH:mm
    return `${localStr}:00+07:00`;
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    setFormError(null);
    setConflictWarning(null);

    try {
      // 1. Load active skills
      const skills = await recruiterJobsApi.getSkills();
      setSkillsList(skills);

      // 2. Load job if editing
      if (id && currentCompanyId) {
        const job = await recruiterJobsApi.getJobDetail(id, currentCompanyId);
        setVersion(job.version);
        setTitle(job.title || '');
        setHeadcount(job.headcount || 1);
        setJobType(job.jobType || 'FULL_TIME');
        setWorkplaceMode(job.workplaceMode || 'ON_SITE');
        setLocation(job.location || '');
        setDeadline(toLocalDatetimeString(job.deadline));
        setDescription(job.description || '');
        setSelectedSkillIds(job.skillIds || []);

        if (job.salary && (job.salary.min > 0 || job.salary.max > 0)) {
          setIsNegotiableSalary(false);
          setSalaryMin(String(job.salary.min));
          setSalaryMax(String(job.salary.max));
          setCurrency(job.salary.currency || 'VND');
        } else {
          setIsNegotiableSalary(true);
          setSalaryMin('');
          setSalaryMax('');
          setCurrency('VND');
        }
      }
    } catch (err: unknown) {
      if (err instanceof ApiException) {
        setFormError(err.message || 'Không thể tải thông tin tin tuyển dụng');
      } else {
        setFormError('Lỗi xảy ra khi tải dữ liệu');
      }
    } finally {
      setLoading(false);
      setIsDirty(false);
    }
  }, [id, currentCompanyId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const toggleSkill = (skillId: string) => {
    setIsDirty(true);
    setSelectedSkillIds((prev) =>
      prev.includes(skillId) ? prev.filter((s) => s !== skillId) : [...prev, skillId],
    );
  };

  // Common salary range helper
  const parsedSalary = useMemo(() => {
    if (isNegotiableSalary) return null;
    const min = salaryMin.trim() ? Number(salaryMin) : 0;
    const max = salaryMax.trim() ? Number(salaryMax) : 0;
    return { min, max, currency };
  }, [isNegotiableSalary, salaryMin, salaryMax, currency]);

  // Validation: Lưu nháp (Save Draft) - FE28
  const validateDraft = () => {
    const errors: Record<string, string> = {};

    if (title && title.length > 150) {
      errors.title = 'Tiêu đề không được vượt quá 150 ký tự';
    }

    if (headcount && (headcount < 1 || headcount > 100)) {
      errors.headcount = 'Chỉ tiêu tuyển dụng phải từ 1 đến 100';
    }

    if (!isNegotiableSalary) {
      const min = salaryMin.trim() ? Number(salaryMin) : null;
      const max = salaryMax.trim() ? Number(salaryMax) : null;
      if (min !== null && isNaN(min)) errors.salaryMin = 'Lương tối thiểu phải là số';
      if (max !== null && isNaN(max)) errors.salaryMax = 'Lương tối đa phải là số';
      if (min !== null && max !== null && min > max) {
        errors.salary = 'Lương tối thiểu không được lớn hơn lương tối đa (FE29)';
      }
    }

    return errors;
  };

  // Validation: Công bố tin (Publish) - FE28, FE29, BR03
  const validatePublish = () => {
    const errors: Record<string, string> = {};

    // 1. Title: 10 - 150 chars
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      errors.title = 'Vui lòng nhập tiêu đề tin tuyển dụng';
    } else if (trimmedTitle.length < 10 || trimmedTitle.length > 150) {
      errors.title = 'Tiêu đề tin tuyển dụng phải từ 10 đến 150 ký tự';
    }

    // 2. Description: 100 - 10000 chars
    const trimmedDesc = description.trim();
    if (!trimmedDesc) {
      errors.description = 'Vui lòng nhập mô tả công việc';
    } else if (trimmedDesc.length < 100 || trimmedDesc.length > 10000) {
      errors.description = 'Mô tả công việc phải từ 100 đến 10.000 ký tự';
    }

    // 3. Location: required even if REMOTE
    if (!location.trim()) {
      errors.location = 'Địa điểm làm việc là bắt buộc (kể cả hình thức REMOTE để ghi phạm vi)';
    }

    // 4. Headcount: integer 1 - 100
    if (!headcount || headcount < 1 || headcount > 100 || !Number.isInteger(headcount)) {
      errors.headcount = 'Chỉ tiêu tuyển dụng phải là số nguyên từ 1 đến 100';
    }

    // 5. Deadline: must be in the future (BR02, BR19, FE29)
    if (!deadline) {
      errors.deadline = 'Vui lòng chọn hạn nộp hồ sơ';
    } else {
      const deadlineDate = new Date(deadline);
      const now = new Date();
      if (isNaN(deadlineDate.getTime()) || deadlineDate.getTime() <= now.getTime()) {
        errors.deadline = 'Hạn nộp hồ sơ phải ở tương lai so với thời điểm hiện tại (BR02, FE29)';
      }
    }

    // 6. Salary: either null or 0 <= min <= max
    if (!isNegotiableSalary) {
      const min = salaryMin.trim() !== '' ? Number(salaryMin) : NaN;
      const max = salaryMax.trim() !== '' ? Number(salaryMax) : NaN;
      if (isNaN(min) || min < 0) {
        errors.salaryMin = 'Lương tối thiểu không hợp lệ (phải ≥ 0)';
      }
      if (isNaN(max) || max < 0) {
        errors.salaryMax = 'Lương tối đa không hợp lệ (phải ≥ 0)';
      }
      if (!isNaN(min) && !isNaN(max) && min > max) {
        errors.salary = 'Lương tối thiểu không được lớn hơn lương tối đa (FE29)';
      }
    }

    return errors;
  };

  // Submit Handler: Save Draft
  const handleSaveDraft = async () => {
    if (!currentCompanyId) return;

    const errors = validateDraft();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setSaving(true);
    setFormError(null);
    setConflictWarning(null);

    const deadlineIso = deadline ? formatDeadlineWithOffset(deadline) : undefined;

    try {
      if (isEdit && id) {
        const updated = await recruiterJobsApi.updateJob(id, {
          title: title.trim() || undefined,
          description: description.trim() || undefined,
          location: location.trim() || undefined,
          headcount,
          jobType,
          workplaceMode,
          salary: parsedSalary,
          deadline: deadlineIso,
          skillIds: selectedSkillIds,
          version,
        });
        setVersion(updated.version);
        setIsDirty(false);
      } else {
        await recruiterJobsApi.createJob({
          companyId: currentCompanyId,
          title: title.trim() || undefined,
          description: description.trim() || undefined,
          location: location.trim() || undefined,
          headcount,
          jobType,
          workplaceMode,
          salary: parsedSalary,
          deadline: deadlineIso,
          skillIds: selectedSkillIds,
        });
        setIsDirty(false);
      }
      navigate('/recruiter/jobs');
    } catch (err: unknown) {
      if (err instanceof ApiException && err.status === 409) {
        // Concurrency conflict (BR01, BR18, FE29): Keep user input intact, show banner
        setConflictWarning(
          'Dữ liệu tin tuyển dụng đã bị thay đổi bởi người dùng khác (xung đột phiên bản). Dữ liệu bạn vừa nhập đã được giữ lại để đối chiếu.',
        );
      } else if (err instanceof ApiException) {
        setFormError(err.message || 'Không thể lưu bản nháp');
        if (err.fieldErrors) {
          const mapped: Record<string, string> = {};
          for (const [key, msgs] of Object.entries(err.fieldErrors)) {
            mapped[key] = msgs[0] ?? 'Lỗi không hợp lệ';
          }
          setFieldErrors(mapped);
        }
      } else {
        setFormError('Lỗi xảy ra khi lưu nháp');
      }
    } finally {
      setSaving(false);
    }
  };

  // Submit Handler: Publish Job
  const handlePublish = async () => {
    if (!currentCompanyId) return;

    // 1. Check company approval (BR02, FE26)
    if (currentCompany?.approvalStatus !== 'APPROVED') {
      setFormError(
        'Doanh nghiệp chưa được phê duyệt (APPROVED), không thể công bố tin (BR02, FE26)',
      );
      return;
    }

    // 2. Validate all publish rules (FE28, FE29, BR03)
    const errors = validatePublish();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setSaving(true);
    setFormError(null);
    setConflictWarning(null);

    const deadlineIso = formatDeadlineWithOffset(deadline)!;

    try {
      let jobId = id;
      let currentVer = version;

      if (!isEdit || !jobId) {
        // Create draft first
        const created = await recruiterJobsApi.createJob({
          companyId: currentCompanyId,
          title: title.trim(),
          description: description.trim(),
          location: location.trim(),
          headcount,
          jobType,
          workplaceMode,
          salary: parsedSalary,
          deadline: deadlineIso,
          skillIds: selectedSkillIds,
        });
        jobId = created.id;
        currentVer = created.version;
      } else {
        // Update first
        const updated = await recruiterJobsApi.updateJob(jobId, {
          title: title.trim(),
          description: description.trim(),
          location: location.trim(),
          headcount,
          jobType,
          workplaceMode,
          salary: parsedSalary,
          deadline: deadlineIso,
          skillIds: selectedSkillIds,
          version: currentVer,
        });
        currentVer = updated.version;
      }

      // Publish the job
      await recruiterJobsApi.publishJob(jobId, {
        version: currentVer,
        deadline: deadlineIso,
      });

      setIsDirty(false);
      navigate('/recruiter/jobs');
    } catch (err: unknown) {
      if (err instanceof ApiException && err.status === 409) {
        // Concurrency conflict (BR01, BR18, FE29): Keep user input intact, show banner
        setConflictWarning(
          'Dữ liệu tin tuyển dụng đã bị thay đổi bởi người dùng khác (xung đột phiên bản). Dữ liệu bạn vừa nhập đã được giữ lại để đối chiếu.',
        );
      } else if (err instanceof ApiException) {
        setFormError(err.message || 'Không thể công bố tin tuyển dụng');
        if (err.fieldErrors) {
          const mapped: Record<string, string> = {};
          for (const [key, msgs] of Object.entries(err.fieldErrors)) {
            mapped[key] = msgs[0] ?? 'Lỗi không hợp lệ';
          }
          setFieldErrors(mapped);
        }
      } else {
        setFormError('Lỗi xảy ra khi công bố tin tuyển dụng');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCancelClick = () => {
    if (isDirty) {
      setShowCancelConfirm(true);
    } else {
      navigate('/recruiter/jobs');
    }
  };

  if (loading) {
    return (
      <div
        className="job-form-page"
        data-testid={isEdit ? 'ui18-job-edit' : 'ui18-job-create'}
        style={{ padding: '2rem' }}
      >
        <p>Đang tải thông tin tin tuyển dụng...</p>
      </div>
    );
  }

  if (!currentCompanyId) {
    return (
      <div
        className="job-form-page"
        data-testid={isEdit ? 'ui18-job-edit' : 'ui18-job-create'}
        style={{ padding: '2rem' }}
      >
        <h2>Biểu mẫu Tin tuyển dụng</h2>
        <p>Vui lòng chọn doanh nghiệp hoạt động trước khi tạo hoặc sửa tin.</p>
      </div>
    );
  }

  return (
    <div
      className="job-form-page"
      data-testid={isEdit ? 'ui18-job-edit' : 'ui18-job-create'}
      style={{ maxWidth: '960px', margin: '0 auto', padding: '1.5rem' }}
    >
      <div style={{ marginBottom: '1.5rem' }}>
        <h1
          style={{
            fontSize: '28px',
            fontWeight: 600,
            fontFamily: 'var(--font-d)',
            letterSpacing: '-0.02em',
            color: 'var(--ink)',
            margin: 0,
          }}
        >
          {isEdit ? 'Chỉnh sửa Tin tuyển dụng' : 'Đăng Tin tuyển dụng mới'}
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '14px', margin: '4px 0 0' }}>
          Tuân thủ quy tắc nghiệp vụ: Có thể lưu nháp thiếu trường (FE28); khi công bố kiểm tra chặt
          chẽ tiêu đề, mô tả, hạn nộp tương lai và mức lương (FE28, FE29, BR03).
        </p>
      </div>

      {/* Company Not Approved Alert */}
      {currentCompany?.approvalStatus !== 'APPROVED' && (
        <div
          data-testid="company-not-approved-banner"
          style={{
            padding: '1rem 1.25rem',
            background: 'var(--color-warning-subtle)',
            border: '1px solid var(--color-warning)',
            borderRadius: '8px',
            marginBottom: '1.5rem',
            color: 'var(--color-warning-dark)',
          }}
        >
          <strong>Cảnh báo (BR02):</strong> Doanh nghiệp hiện có trạng thái{' '}
          <strong>{currentCompany?.approvalStatus}</strong>. Bạn chỉ có thể Lưu nháp, tính năng Công
          bố tin sẽ bị chặn cho đến khi công ty được duyệt (APPROVED).
        </div>
      )}

      {/* Conflict 409 Warning Banner (FE29) */}
      {conflictWarning && (
        <div
          data-testid="conflict-alert"
          style={{
            padding: '1rem 1.25rem',
            background: 'var(--color-warning-subtle)',
            border: '1px solid var(--color-warning)',
            borderRadius: '8px',
            marginBottom: '1.5rem',
            color: 'var(--color-warning-dark)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>{conflictWarning}</div>
          <button
            type="button"
            data-testid="reload-latest-btn"
            onClick={() => void loadData()}
            style={{
              padding: '0.4rem 0.8rem',
              borderRadius: '6px',
              border: '1px solid var(--color-warning)',
              background: '#fff',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Tải lại dữ liệu mới nhất
          </button>
        </div>
      )}

      {/* Form Error Banner */}
      {formError && (
        <div
          data-testid="form-error-alert"
          style={{
            padding: '1rem 1.25rem',
            background: 'var(--color-danger-subtle)',
            border: '1px solid var(--color-danger)',
            borderRadius: '8px',
            marginBottom: '1.5rem',
            color: 'var(--color-danger)',
          }}
        >
          {formError}
        </div>
      )}

      <form
        onSubmit={(e) => e.preventDefault()}
        data-testid="job-form"
        className="card"
        style={{
          background: 'var(--card)',
          padding: '2rem',
          borderRadius: '24px',
          border: '1px solid var(--hair)',
          boxShadow: 'var(--sh-s)',
        }}
      >
        {/* Title */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label
            htmlFor="job-title"
            style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}
          >
            Tiêu đề tin tuyển dụng <span style={{ color: 'var(--color-danger)' }}>*</span>
          </label>
          <input
            id="job-title"
            data-testid="job-title-input"
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setIsDirty(true);
            }}
            placeholder="VD: Senior Frontend Engineer (React/TypeScript)"
            style={{
              width: '100%',
              padding: '0.6rem 0.8rem',
              borderRadius: '6px',
              border: `1px solid ${fieldErrors.title ? 'var(--color-danger)' : 'var(--color-border)'}`,
              fontSize: '0.95rem',
            }}
          />
          {fieldErrors.title && (
            <span
              data-testid="error-title"
              style={{ color: 'var(--color-danger)', fontSize: '0.85rem' }}
            >
              {fieldErrors.title}
            </span>
          )}
        </div>

        {/* Headcount, Job Type, Workplace Mode */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1.25rem',
            marginBottom: '1.25rem',
          }}
        >
          <div>
            <label
              htmlFor="job-headcount"
              style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}
            >
              Chỉ tiêu tuyển dụng <span style={{ color: 'var(--color-danger)' }}>*</span>
            </label>
            <input
              id="job-headcount"
              data-testid="job-headcount-input"
              type="number"
              min={1}
              max={100}
              value={headcount}
              onChange={(e) => {
                setHeadcount(parseInt(e.target.value, 10) || 0);
                setIsDirty(true);
              }}
              style={{
                width: '100%',
                padding: '0.6rem 0.8rem',
                borderRadius: '6px',
                border: `1px solid ${fieldErrors.headcount ? 'var(--color-danger)' : 'var(--color-border)'}`,
                fontSize: '0.95rem',
              }}
            />
            {fieldErrors.headcount && (
              <span
                data-testid="error-headcount"
                style={{ color: 'var(--color-danger)', fontSize: '0.85rem' }}
              >
                {fieldErrors.headcount}
              </span>
            )}
          </div>

          <div>
            <label
              htmlFor="job-type"
              style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}
            >
              Loại hình làm việc
            </label>
            <select
              id="job-type"
              data-testid="job-type-select"
              value={jobType}
              onChange={(e) => {
                setJobType(e.target.value as JobType);
                setIsDirty(true);
              }}
              style={{
                width: '100%',
                padding: '0.6rem 0.8rem',
                borderRadius: '6px',
                border: '1px solid var(--color-border)',
                fontSize: '0.95rem',
              }}
            >
              <option value="FULL_TIME">Toàn thời gian (FULL_TIME)</option>
              <option value="PART_TIME">Bán thời gian (PART_TIME)</option>
              <option value="CONTRACT">Hợp đồng (CONTRACT)</option>
              <option value="INTERNSHIP">Thực tập (INTERNSHIP)</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="job-workplace"
              style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}
            >
              Hình thức làm việc
            </label>
            <select
              id="job-workplace"
              data-testid="job-workplace-select"
              value={workplaceMode}
              onChange={(e) => {
                setWorkplaceMode(e.target.value as WorkplaceMode);
                setIsDirty(true);
              }}
              style={{
                width: '100%',
                padding: '0.6rem 0.8rem',
                borderRadius: '6px',
                border: '1px solid var(--color-border)',
                fontSize: '0.95rem',
              }}
            >
              <option value="ON_SITE">Tại văn phòng (ON_SITE)</option>
              <option value="HYBRID">Linh hoạt (HYBRID)</option>
              <option value="REMOTE">Từ xa (REMOTE)</option>
            </select>
          </div>
        </div>

        {/* Location & Deadline */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1.25rem',
            marginBottom: '1.25rem',
          }}
        >
          <div>
            <label
              htmlFor="job-location"
              style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}
            >
              Địa điểm làm việc <span style={{ color: 'var(--color-danger)' }}>*</span>
            </label>
            <input
              id="job-location"
              data-testid="job-location-input"
              type="text"
              value={location}
              onChange={(e) => {
                setLocation(e.target.value);
                setIsDirty(true);
              }}
              placeholder="VD: Quận 1, TP. Hồ Chí Minh"
              style={{
                width: '100%',
                padding: '0.6rem 0.8rem',
                borderRadius: '6px',
                border: `1px solid ${fieldErrors.location ? 'var(--color-danger)' : 'var(--color-border)'}`,
                fontSize: '0.95rem',
              }}
            />
            {fieldErrors.location && (
              <span
                data-testid="error-location"
                style={{ color: 'var(--color-danger)', fontSize: '0.85rem' }}
              >
                {fieldErrors.location}
              </span>
            )}
          </div>

          <div>
            <label
              htmlFor="job-deadline"
              style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}
            >
              Hạn nộp hồ sơ (Giờ Việt Nam) <span style={{ color: 'var(--color-danger)' }}>*</span>
            </label>
            <input
              id="job-deadline"
              data-testid="job-deadline-input"
              type="datetime-local"
              value={deadline}
              onChange={(e) => {
                setDeadline(e.target.value);
                setIsDirty(true);
              }}
              style={{
                width: '100%',
                padding: '0.6rem 0.8rem',
                borderRadius: '6px',
                border: `1px solid ${fieldErrors.deadline ? 'var(--color-danger)' : 'var(--color-border)'}`,
                fontSize: '0.95rem',
              }}
            />
            {fieldErrors.deadline && (
              <span
                data-testid="error-deadline"
                style={{ color: 'var(--color-danger)', fontSize: '0.85rem' }}
              >
                {fieldErrors.deadline}
              </span>
            )}
          </div>
        </div>

        {/* Salary section (FE29, BR03) */}
        <div
          style={{
            padding: '1.25rem',
            background: 'var(--color-bg-secondary)',
            borderRadius: '6px',
            marginBottom: '1.25rem',
          }}
        >
          <div
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}
          >
            <input
              id="job-salary-negotiable"
              data-testid="job-salary-negotiable-checkbox"
              type="checkbox"
              checked={isNegotiableSalary}
              onChange={(e) => {
                setIsNegotiableSalary(e.target.checked);
                setIsDirty(true);
              }}
              style={{ width: '1.1rem', height: '1.1rem' }}
            />
            <label htmlFor="job-salary-negotiable" style={{ fontWeight: 600, cursor: 'pointer' }}>
              Mức lương thỏa thuận
            </label>
          </div>

          {!isNegotiableSalary && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 120px', gap: '1rem' }}>
                <div>
                  <label
                    htmlFor="salary-min"
                    style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600 }}
                  >
                    Lương tối thiểu (Min)
                  </label>
                  <input
                    id="salary-min"
                    data-testid="salary-min-input"
                    type="number"
                    min={0}
                    value={salaryMin}
                    onChange={(e) => {
                      setSalaryMin(e.target.value);
                      setIsDirty(true);
                    }}
                    placeholder="VD: 15000000"
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '6px',
                      border: '1px solid var(--color-border)',
                      fontSize: '0.9rem',
                    }}
                  />
                  {fieldErrors.salaryMin && (
                    <span
                      data-testid="error-salary-min"
                      style={{ color: 'var(--color-danger)', fontSize: '0.85rem' }}
                    >
                      {fieldErrors.salaryMin}
                    </span>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="salary-max"
                    style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600 }}
                  >
                    Lương tối đa (Max)
                  </label>
                  <input
                    id="salary-max"
                    data-testid="salary-max-input"
                    type="number"
                    min={0}
                    value={salaryMax}
                    onChange={(e) => {
                      setSalaryMax(e.target.value);
                      setIsDirty(true);
                    }}
                    placeholder="VD: 25000000"
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '6px',
                      border: '1px solid var(--color-border)',
                      fontSize: '0.9rem',
                    }}
                  />
                  {fieldErrors.salaryMax && (
                    <span
                      data-testid="error-salary-max"
                      style={{ color: 'var(--color-danger)', fontSize: '0.85rem' }}
                    >
                      {fieldErrors.salaryMax}
                    </span>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="salary-currency"
                    style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600 }}
                  >
                    Đơn vị tiền tệ
                  </label>
                  <select
                    id="salary-currency"
                    data-testid="salary-currency-select"
                    value={currency}
                    onChange={(e) => {
                      setCurrency(e.target.value as Currency);
                      setIsDirty(true);
                    }}
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '6px',
                      border: '1px solid var(--color-border)',
                      fontSize: '0.9rem',
                    }}
                  >
                    <option value="VND">VND</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
              </div>

              {fieldErrors.salary && (
                <div
                  data-testid="error-salary"
                  style={{ color: 'var(--color-danger)', fontSize: '0.85rem', marginTop: '0.5rem' }}
                >
                  {fieldErrors.salary}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Description */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label
            htmlFor="job-description"
            style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}
          >
            Mô tả công việc (100 - 10.000 ký tự khi công bố){' '}
            <span style={{ color: 'var(--color-danger)' }}>*</span>
          </label>
          <textarea
            id="job-description"
            data-testid="job-description-input"
            rows={6}
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              setIsDirty(true);
            }}
            placeholder="Mô tả trách nhiệm công việc, yêu cầu kỹ năng và các quyền lợi đãi ngộ..."
            style={{
              width: '100%',
              padding: '0.6rem 0.8rem',
              borderRadius: '6px',
              border: `1px solid ${fieldErrors.description ? 'var(--color-danger)' : 'var(--color-border)'}`,
              fontSize: '0.95rem',
              resize: 'vertical',
            }}
          />
          {fieldErrors.description && (
            <span
              data-testid="error-description"
              style={{ color: 'var(--color-danger)', fontSize: '0.85rem' }}
            >
              {fieldErrors.description}
            </span>
          )}
        </div>

        {/* Skills Multi-select */}
        <div style={{ marginBottom: '1.75rem' }}>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
            Kỹ năng yêu cầu
          </label>
          <div
            data-testid="skills-selector"
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.5rem',
              maxHeight: '160px',
              overflowY: 'auto',
              padding: '0.75rem',
              background: 'var(--color-bg-secondary)',
              borderRadius: '6px',
              border: '1px solid var(--color-border)',
            }}
          >
            {skillsList.map((skill) => {
              const isSelected = selectedSkillIds.includes(skill.id);
              return (
                <button
                  key={skill.id}
                  type="button"
                  data-testid={`skill-item-${skill.id}`}
                  onClick={() => toggleSkill(skill.id)}
                  style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: '9999px',
                    border: `1px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    background: isSelected ? 'var(--color-primary)' : 'var(--color-bg-surface)',
                    color: isSelected ? '#fff' : 'var(--color-text)',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    fontWeight: isSelected ? 600 : 400,
                  }}
                >
                  {skill.name} {isSelected && '✓'}
                </button>
              );
            })}
          </div>
        </div>

        {/* Buttons */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: '1rem',
            borderTop: '1px solid var(--color-border)',
          }}
        >
          <button
            type="button"
            data-testid="cancel-btn"
            onClick={handleCancelClick}
            style={{
              padding: '0.6rem 1.25rem',
              borderRadius: '6px',
              border: '1px solid var(--color-border)',
              background: 'transparent',
              cursor: 'pointer',
            }}
          >
            Hủy bỏ
          </button>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              type="button"
              data-testid="save-draft-btn"
              disabled={saving}
              onClick={() => void handleSaveDraft()}
              style={{
                padding: '0.6rem 1.25rem',
                borderRadius: '6px',
                border: '1px solid var(--color-border)',
                background: 'var(--color-bg-secondary)',
                fontWeight: 600,
                cursor: saving ? 'not-allowed' : 'pointer',
              }}
            >
              {saving ? 'Đang lưu...' : 'Lưu bản nháp'}
            </button>

            <button
              type="button"
              data-testid="publish-btn"
              disabled={saving}
              onClick={() => void handlePublish()}
              style={{
                padding: '0.6rem 1.5rem',
                borderRadius: '6px',
                border: 'none',
                background: 'var(--color-success)',
                color: '#fff',
                fontWeight: 600,
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? 'Đang công bố...' : 'Công bố ngay'}
            </button>
          </div>
        </div>
      </form>

      {/* Dirty Form Navigation Confirm Dialog */}
      <ConfirmDialog
        open={showCancelConfirm}
        onClose={() => setShowCancelConfirm(false)}
        onConfirm={() => {
          setShowCancelConfirm(false);
          navigate('/recruiter/jobs');
        }}
        title="Xác nhận hủy bỏ thay đổi"
        message="Bạn có thay đổi chưa được lưu trên biểu mẫu. Nếu rời đi bây giờ, mọi thay đổi chưa lưu sẽ bị mất."
        confirmLabel="Rời khỏi trang"
        cancelLabel="Ở lại tiếp tục sửa"
        variant="danger"
      />
    </div>
  );
};
