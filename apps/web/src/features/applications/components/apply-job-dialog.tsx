import React, { useState } from 'react';
import { Dialog } from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Alert } from '../../../components/ui/alert';
import { apiClient } from '../../../lib/http/api-client';

export interface ApplyJobDialogProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string;
  jobTitle: string;
  companyName: string;
  onSuccess?: () => void;
}

export function ApplyJobDialog({
  isOpen,
  onClose,
  jobId,
  jobTitle,
  companyName,
  onSuccess,
}: ApplyJobDialogProps) {
  const [cvId, setCvId] = useState<string>('cv-default-1');
  const [coverLetter, setCoverLetter] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  // FE17: Stable idempotency key for retries
  const [idempotencyKey] = useState<string>(() => {
    return 'apply-' + Math.random().toString(36).substring(2, 15) + '-' + Date.now();
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cvId) {
      setError('Vui lòng chọn hoặc tải lên một bản CV để ứng tuyển');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await apiClient.post(
        `/api/jobs/${encodeURIComponent(jobId)}/applications`,
        {
          cvId,
          coverLetter: coverLetter.trim() || undefined,
        },
        {
          idempotencyKey,
        },
      );

      setIsSuccess(true);
      if (onSuccess) onSuccess();
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : 'Nộp hồ sơ ứng tuyển thất bại. Vui lòng kiểm tra lại kết nối và thử lại.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={`Ứng tuyển vị trí: ${jobTitle}`}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <p style={{ color: 'var(--color-muted)', fontSize: 'var(--font-size-sm)' }}>
          Doanh nghiệp: <strong>{companyName}</strong>
        </p>

        {isSuccess ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-4) 0' }}>
            <div
              style={{
                fontSize: '32px',
                color: 'var(--color-success)',
                marginBottom: 'var(--space-2)',
              }}
            >
              ✓
            </div>
            <h3
              style={{
                fontSize: 'var(--font-size-lg)',
                fontWeight: 'var(--font-weight-bold)',
                marginBottom: 'var(--space-2)',
              }}
            >
              Nộp hồ sơ thành công!
            </h3>
            <p
              style={{
                color: 'var(--color-muted)',
                fontSize: 'var(--font-size-sm)',
                marginBottom: 'var(--space-4)',
              }}
            >
              Hồ sơ ứng tuyển của bạn đã được gửi đến nhà tuyển dụng. Bạn có thể theo dõi tiến độ
              trong mục Hồ sơ đã ứng tuyển.
            </p>
            <Button variant="primary" onClick={onClose}>
              Đóng
            </Button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}
          >
            {error && <Alert variant="error">{error}</Alert>}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
              <label
                htmlFor="apply-cv"
                style={{
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 'var(--font-weight-medium)',
                  color: 'var(--color-foreground)',
                }}
              >
                Chọn CV ứng tuyển <span style={{ color: 'var(--color-destructive)' }}>*</span>
              </label>
              <select
                id="apply-cv"
                value={cvId}
                onChange={(e) => setCvId(e.target.value)}
                disabled={isSubmitting}
                style={{
                  padding: 'var(--space-2) var(--space-3)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-surface)',
                  color: 'var(--color-foreground)',
                  fontSize: 'var(--font-size-base)',
                  minHeight: '40px',
                  outline: 'none',
                }}
              >
                <option value="cv-default-1">CV Chính - Software Engineer (PDF)</option>
                <option value="cv-alt-2">CV Tiếng Anh - Fullstack Developer (PDF)</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
              <label
                htmlFor="apply-cover-letter"
                style={{
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 'var(--font-weight-medium)',
                  color: 'var(--color-foreground)',
                }}
              >
                Thư giới thiệu (Cover Letter)
              </label>
              <textarea
                id="apply-cover-letter"
                rows={4}
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                maxLength={3000}
                placeholder="Giới thiệu ngắn gọn kinh nghiệm và lý do bạn phù hợp với vị trí này..."
                disabled={isSubmitting}
                style={{
                  padding: 'var(--space-2) var(--space-3)',
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
                {coverLetter.length} / 3000 ký tự
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 'var(--space-2)',
                marginTop: 'var(--space-2)',
              }}
            >
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Hủy bỏ
              </Button>
              <Button type="submit" variant="primary" isLoading={isSubmitting}>
                Gửi hồ sơ
              </Button>
            </div>
          </form>
        )}
      </div>
    </Dialog>
  );
}
