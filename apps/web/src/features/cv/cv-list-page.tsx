import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  listCandidateCvs,
  uploadCandidateCv,
  deleteCandidateCv,
  setDefaultCandidateCv,
  type CvDto,
} from './candidate-cv.api';
import { Button } from '../../components/ui/button';
import { StatusBadge } from '../../components/ui/status-badge';
import { Alert } from '../../components/ui/alert';

export function CvListPage() {
  const [cvs, setCvs] = useState<CvDto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const fetchCvs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await listCandidateCvs();
      setCvs(data);
    } catch {
      setError('Đã xảy ra lỗi khi tải danh sách CV.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchCvs();
  }, [fetchCvs]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setSuccess(null);
    setIsUploading(true);
    setUploadProgress(20);

    // Simulate progress animation for realistic UX (FE14)
    const progressTimer = setInterval(() => {
      setUploadProgress((prev) => (prev >= 90 ? prev : prev + 30));
    }, 150);

    try {
      const newCv = await uploadCandidateCv(file);
      clearInterval(progressTimer);
      setUploadProgress(100);

      setCvs((prev) => [newCv, ...prev]);
      setSuccess(`Tải lên CV "${file.name}" thành công! Trạng thái: Đang quét an toàn.`);
    } catch (err: unknown) {
      clearInterval(progressTimer);
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : 'Tải lên CV thất bại.';
      setError(msg);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteCv = async (cv: CvDto) => {
    setError(null);
    setSuccess(null);

    // FE16: Check reference
    if (cv.applicationCount > 0) {
      setError(
        `Không thể xóa CV "${cv.fileName}" vì đang được sử dụng trong ${cv.applicationCount} hồ sơ ứng tuyển đang hoạt động.`,
      );
      return;
    }

    const confirmDelete = window.confirm(`Bạn có chắc chắn muốn xóa bản CV "${cv.fileName}"?`);
    if (!confirmDelete) return;

    try {
      await deleteCandidateCv(cv.id);
      setCvs((prev) => prev.filter((item) => item.id !== cv.id));
      setSuccess(`Đã xóa thành công CV "${cv.fileName}".`);
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : 'Không thể xóa CV.';
      setError(msg);
    }
  };

  const handleSetDefault = async (cvId: string) => {
    setError(null);
    setSuccess(null);
    try {
      await setDefaultCandidateCv(cvId);
      setCvs((prev) =>
        prev.map((c) => ({
          ...c,
          isDefault: c.id === cvId,
        })),
      );
      setSuccess('Đã cập nhật CV mặc định để nộp hồ sơ nhanh.');
    } catch {
      setError('Không thể cập nhật CV mặc định.');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return (bytes / 1024).toFixed(1) + ' KB';
    }
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div
      data-testid="cv-list-page"
      style={{ maxWidth: '960px', margin: '0 auto', padding: 'var(--space-6) var(--space-4)' }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 'var(--space-4)',
          marginBottom: 'var(--space-6)',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 'var(--font-size-2xl)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'var(--color-foreground)',
            }}
          >
            Quản lý CV cá nhân (UI08)
          </h1>
          <p
            style={{
              color: 'var(--color-muted)',
              fontSize: 'var(--font-size-sm)',
              marginTop: 'var(--space-1)',
            }}
          >
            Tải lên và lưu trữ các bản CV để dễ dàng lựa chọn khi ứng tuyển các vị trí việc làm
          </p>
        </div>

        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleFileChange}
            style={{ display: 'none' }}
            id="cv-file-upload-input"
            aria-label="Tải lên tệp CV PDF"
          />
          <Button
            variant="primary"
            onClick={() => fileInputRef.current?.click()}
            isLoading={isUploading}
          >
            + Tải lên CV mới
          </Button>
        </div>
      </div>

      {/* Upload progress indicator (FE14) */}
      {isUploading && (
        <div
          style={{
            marginBottom: 'var(--space-6)',
            backgroundColor: 'var(--color-surface)',
            padding: 'var(--space-4)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 'var(--font-size-sm)',
              marginBottom: 'var(--space-2)',
            }}
          >
            <span>Đang tải lên và quét an toàn mã độc...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div
            style={{
              width: '100%',
              height: '8px',
              backgroundColor: 'var(--color-border)',
              borderRadius: 'var(--radius-full)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${uploadProgress}%`,
                height: '100%',
                backgroundColor: 'var(--color-primary)',
                transition: 'width 0.2s ease',
              }}
            />
          </div>
        </div>
      )}

      {error && (
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      {success && (
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <Alert variant="success">{success}</Alert>
        </div>
      )}

      {/* CV List */}
      {isLoading ? (
        <div
          style={{ textAlign: 'center', padding: 'var(--space-12) 0', color: 'var(--color-muted)' }}
        >
          Đang tải danh sách CV...
        </div>
      ) : cvs.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: 'var(--space-12) var(--space-4)',
            backgroundColor: 'var(--color-surface)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-border)',
          }}
        >
          <div style={{ fontSize: '40px', marginBottom: 'var(--space-2)' }}>📄</div>
          <h2
            style={{
              fontSize: 'var(--font-size-lg)',
              fontWeight: 'var(--font-weight-semibold)',
              marginBottom: 'var(--space-2)',
            }}
          >
            Bạn chưa tải lên bản CV nào
          </h2>
          <p
            style={{
              color: 'var(--color-muted)',
              fontSize: 'var(--font-size-sm)',
              marginBottom: 'var(--space-4)',
            }}
          >
            Hỗ trợ định dạng PDF tiêu chuẩn, dung lượng tối đa 5MB.
          </p>
          <Button variant="primary" onClick={() => fileInputRef.current?.click()}>
            Tải lên CV đầu tiên
          </Button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {cvs.map((cv) => (
            <div
              key={cv.id}
              className="card"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 'var(--space-4)',
                backgroundColor: 'var(--card)',
                borderRadius: '18px',
                border: '1px solid var(--hair)',
                padding: '20px 24px',
                boxShadow: 'var(--sh-s)',
                transition: 'transform 0.3s var(--spring), box-shadow 0.25s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--color-primary-bg, rgba(37, 99, 235, 0.1))',
                    color: 'var(--color-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    fontSize: '14px',
                  }}
                >
                  PDF
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <span
                      style={{
                        fontWeight: 'var(--font-weight-bold)',
                        fontSize: 'var(--font-size-base)',
                        color: 'var(--color-foreground)',
                      }}
                    >
                      {cv.fileName}
                    </span>
                    {cv.isDefault && (
                      <span
                        style={{
                          fontSize: 'var(--font-size-xs)',
                          backgroundColor: 'var(--color-success-bg, rgba(34, 197, 94, 0.1))',
                          color: 'var(--color-success, #16a34a)',
                          padding: 'var(--space-1) var(--space-2)',
                          borderRadius: 'var(--radius-sm)',
                          fontWeight: 'var(--font-weight-medium)',
                        }}
                      >
                        Mặc định
                      </span>
                    )}
                    {/* FE14: Status badge */}
                    <StatusBadge status={cv.status} />
                  </div>

                  <div
                    style={{
                      fontSize: 'var(--font-size-xs)',
                      color: 'var(--color-muted)',
                      marginTop: 'var(--space-1)',
                    }}
                  >
                    Dung lượng: {formatFileSize(cv.fileSize)} • Tải lên:{' '}
                    {new Date(cv.uploadedAt).toLocaleDateString('vi-VN')}
                    {cv.applicationCount > 0 && ` • Đang dùng trong ${cv.applicationCount} hồ sơ`}
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                {!cv.isDefault && cv.status === 'ACTIVE' && (
                  <Button variant="outline" size="sm" onClick={() => handleSetDefault(cv.id)}>
                    Đặt mặc định
                  </Button>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => alert(`Xem trước bản CV: ${cv.fileName}`)}
                >
                  Xem
                </Button>

                <Button variant="danger" size="sm" onClick={() => handleDeleteCv(cv)}>
                  Xóa
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
