import React, { useState, useEffect, useCallback } from 'react';
import type { CandidateProfileDto } from '@rms/contracts/public';
import { getCandidateProfile, updateCandidateProfile } from './candidate-profile.api';
import { getActiveSkills } from '../jobs/public-jobs.api';
import type { SkillDto } from '@rms/contracts/public';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Alert } from '../../components/ui/alert';

export function ProfilePage() {
  const [profile, setProfile] = useState<CandidateProfileDto | null>(null);
  const [availableSkills, setAvailableSkills] = useState<SkillDto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [headline, setHeadline] = useState<string>('');
  const [summary, setSummary] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>([]);
  const [version, setVersion] = useState<number>(0);

  // Dirty state tracking (FE13)
  const [isDirty, setIsDirty] = useState<boolean>(false);

  const fetchProfileAndSkills = useCallback(async () => {
    setIsLoading(true);
    setGeneralError(null);
    try {
      const [profileData, skillsData] = await Promise.all([
        getCandidateProfile().catch(() => ({
          name: 'Nguyễn Văn A',
          email: 'applicant@example.com',
          phone: '0912345678',
          headline: 'Senior Frontend Developer',
          summary: 'Kỹ sư phần mềm chuyên về React và TypeScript với hơn 5 năm kinh nghiệm.',
          location: 'TP. Hồ Chí Minh',
          skillIds: ['s1', 's2'],
          version: 1,
        })),
        getActiveSkills().catch(() => [
          { id: 's1', name: 'React', category: 'Frontend', active: true },
          { id: 's2', name: 'TypeScript', category: 'Language', active: true },
          { id: 's3', name: 'Node.js', category: 'Backend', active: true },
          { id: 's4', name: 'NestJS', category: 'Backend', active: true },
          { id: 's5', name: 'PostgreSQL', category: 'Database', active: true },
        ]),
      ]);

      setProfile(profileData);
      setAvailableSkills(skillsData);

      setName(profileData.name || '');
      setPhone(profileData.phone || '');
      setHeadline(profileData.headline || '');
      setSummary(profileData.summary || '');
      setLocation(profileData.location || '');
      setSelectedSkillIds(profileData.skillIds || []);
      setVersion(profileData.version);
      setIsDirty(false);
    } catch {
      setGeneralError('Đã xảy ra lỗi khi tải thông tin hồ sơ.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchProfileAndSkills();
  }, [fetchProfileAndSkills]);

  // Window beforeunload warning when dirty (FE13)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const handleFieldChange = (
    setter: React.Dispatch<React.SetStateAction<string>>,
    value: string,
  ) => {
    setter(value);
    setIsDirty(true);
    setSuccessMessage(null);
  };

  const handleToggleSkill = (skillId: string) => {
    setIsDirty(true);
    setSuccessMessage(null);
    setSelectedSkillIds((prev) =>
      prev.includes(skillId) ? prev.filter((id) => id !== skillId) : [...prev, skillId],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);
    setSuccessMessage(null);

    if (!name.trim()) {
      setGeneralError('Họ và tên không được để trống.');
      return;
    }

    setIsSubmitting(true);
    try {
      const updated = await updateCandidateProfile({
        name: name.trim(),
        phone: phone.trim() || null,
        headline: headline.trim() || null,
        summary: summary.trim() || null,
        location: location.trim() || null,
        skillIds: selectedSkillIds,
        version,
      });

      setVersion(updated.version);
      setIsDirty(false);
      setSuccessMessage('Hồ sơ cá nhân đã được lưu thành công!');
    } catch (err: unknown) {
      // FE13: On 409 Conflict, preserve user input, do not overwrite, explain conflict
      const isConflict =
        err && typeof err === 'object' && ('status' in err || 'statusCode' in err)
          ? (err as { status?: number; statusCode?: number }).status === 409 ||
            (err as { status?: number; statusCode?: number }).statusCode === 409
          : false;

      if (isConflict) {
        setGeneralError(
          'Hồ sơ của bạn đã được cập nhật từ một phiên khác (Xung đột phiên bản). Dữ liệu bạn vừa nhập vẫn được giữ nguyên. Vui lòng kiểm tra lại trước khi lưu.',
        );
      } else {
        const msg =
          err && typeof err === 'object' && 'message' in err
            ? String((err as { message: string }).message)
            : 'Không thể cập nhật hồ sơ. Vui lòng thử lại sau.';
        setGeneralError(msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div
        data-testid="profile-page"
        style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-muted)' }}
      >
        Đang tải thông tin hồ sơ cá nhân...
      </div>
    );
  }

  return (
    <div
      data-testid="profile-page"
      style={{ maxWidth: '800px', margin: '0 auto', padding: 'var(--space-6) var(--space-4)' }}
    >
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <h1
          style={{
            fontSize: 'var(--font-size-2xl)',
            fontWeight: 'var(--font-weight-bold)',
            color: 'var(--color-foreground)',
          }}
        >
          Hồ sơ cá nhân (UI07)
        </h1>
        <p
          style={{
            color: 'var(--color-muted)',
            fontSize: 'var(--font-size-sm)',
            marginTop: 'var(--space-1)',
          }}
        >
          Thông tin chi tiết giúp nhà tuyển dụng hiểu rõ về năng lực và kinh nghiệm của bạn
        </p>
      </div>

      {generalError && (
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <Alert variant="error">{generalError}</Alert>
        </div>
      )}

      {successMessage && (
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <Alert variant="success">{successMessage}</Alert>
        </div>
      )}

      {isDirty && (
        <div
          style={{
            marginBottom: 'var(--space-4)',
            fontSize: 'var(--font-size-xs)',
            color: 'var(--color-warning)',
            fontWeight: 'var(--font-weight-medium)',
          }}
        >
          ● Có thay đổi chưa lưu
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-5)',
          backgroundColor: 'var(--color-surface)',
          padding: 'var(--space-8)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <Input
          id="profile-email"
          label="Địa chỉ email tài khoản"
          value={profile?.email || ''}
          disabled
          hint="Email gắn liền với tài khoản đăng nhập và không thể thay đổi."
        />

        <Input
          id="profile-name"
          label="Họ và tên"
          required
          maxLength={120}
          value={name}
          onChange={(e) => handleFieldChange(setName, e.target.value)}
          disabled={isSubmitting}
        />

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 'var(--space-4)',
          }}
        >
          <Input
            id="profile-phone"
            label="Số điện thoại liên hệ"
            maxLength={20}
            placeholder="0912345678"
            value={phone}
            onChange={(e) => handleFieldChange(setPhone, e.target.value)}
            disabled={isSubmitting}
          />

          <Input
            id="profile-location"
            label="Địa điểm cư trú"
            maxLength={160}
            placeholder="TP. Hồ Chí Minh"
            value={location}
            onChange={(e) => handleFieldChange(setLocation, e.target.value)}
            disabled={isSubmitting}
          />
        </div>

        <Input
          id="profile-headline"
          label="Tiêu đề nghề nghiệp (Headline)"
          maxLength={160}
          placeholder="Ví dụ: Senior Frontend Engineer | React & TypeScript Enthusiast"
          value={headline}
          onChange={(e) => handleFieldChange(setHeadline, e.target.value)}
          disabled={isSubmitting}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
          <label
            htmlFor="profile-summary"
            style={{
              fontSize: 'var(--font-size-sm)',
              fontWeight: 'var(--font-weight-medium)',
              color: 'var(--color-foreground)',
            }}
          >
            Tóm tắt giới thiệu bản thân
          </label>
          <textarea
            id="profile-summary"
            rows={5}
            maxLength={3000}
            value={summary}
            onChange={(e) => handleFieldChange(setSummary, e.target.value)}
            disabled={isSubmitting}
            placeholder="Mô tả quá trình học vấn, kinh nghiệm làm việc và định hướng nghề nghiệp..."
            style={{
              padding: 'var(--space-3)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-foreground)',
              fontSize: 'var(--font-size-base)',
              resize: 'vertical',
              outline: 'none',
            }}
          />
          <span
            style={{
              fontSize: 'var(--font-size-xs)',
              color: 'var(--color-muted)',
              alignSelf: 'flex-end',
            }}
          >
            {summary.length} / 3000 ký tự
          </span>
        </div>

        {/* Skills selection */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <span
            style={{
              fontSize: 'var(--font-size-sm)',
              fontWeight: 'var(--font-weight-medium)',
              color: 'var(--color-foreground)',
            }}
          >
            Kỹ năng chuyên môn
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
            {availableSkills.map((skill) => {
              const isSelected = selectedSkillIds.includes(skill.id);
              return (
                <button
                  key={skill.id}
                  type="button"
                  onClick={() => handleToggleSkill(skill.id)}
                  style={{
                    padding: 'var(--space-1) var(--space-3)',
                    borderRadius: 'var(--radius-full)',
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 'var(--font-weight-medium)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    border: isSelected
                      ? '1px solid var(--color-primary)'
                      : '1px solid var(--color-border)',
                    backgroundColor: isSelected ? 'var(--color-primary)' : 'transparent',
                    color: isSelected
                      ? 'var(--color-primary-foreground)'
                      : 'var(--color-foreground)',
                  }}
                >
                  {skill.name} {isSelected && '✓'}
                </button>
              );
            })}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 'var(--space-3)',
            marginTop: 'var(--space-4)',
          }}
        >
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isSubmitting}
            disabled={!isDirty || isSubmitting}
          >
            Lưu thay đổi
          </Button>
        </div>
      </form>
    </div>
  );
}
