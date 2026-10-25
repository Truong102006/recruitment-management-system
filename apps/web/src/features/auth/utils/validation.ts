export function getUtf8ByteLength(str: string): number {
  return new TextEncoder().encode(str).length;
}

export function validateEmail(email: string): string | null {
  const trimmed = email.trim();
  if (!trimmed) {
    return 'Vui lòng nhập địa chỉ email';
  }
  if (trimmed.length > 254) {
    return 'Email không được vượt quá 254 ký tự';
  }
  const emailRegex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (!emailRegex.test(trimmed)) {
    return 'Địa chỉ email không đúng định dạng';
  }
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) {
    return 'Vui lòng nhập mật khẩu';
  }
  if (password.length < 10) {
    return 'Mật khẩu phải chứa ít nhất 10 ký tự';
  }
  const byteLength = getUtf8ByteLength(password);
  if (byteLength > 72) {
    return `Mật khẩu quá dài (${byteLength} byte). Độ dài tối đa cho phép là 72 byte.`;
  }
  return null;
}

export function validateFullName(name: string): string | null {
  const normalized = name.normalize('NFC').trim();
  if (!normalized) {
    return 'Vui lòng nhập họ và tên';
  }
  if (normalized.length > 120) {
    return 'Họ và tên không được vượt quá 120 ký tự';
  }
  return null;
}

export function validatePasswordConfirm(password: string, confirm: string): string | null {
  if (!confirm) {
    return 'Vui lòng xác nhận lại mật khẩu';
  }
  if (password !== confirm) {
    return 'Mật khẩu xác nhận không khớp với mật khẩu đã nhập';
  }
  return null;
}

/**
 * Chống Open Redirect: Chỉ chấp nhận đường dẫn nội bộ bắt đầu bằng '/' và không bắt đầu bằng '//' hoặc '/\'
 */
export function sanitizeReturnTo(returnTo: string | null | undefined, fallback = '/jobs'): string {
  if (!returnTo) return fallback;
  const decoded = decodeURIComponent(returnTo).trim();
  if (decoded.startsWith('/') && !decoded.startsWith('//') && !decoded.startsWith('/\\')) {
    if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(decoded)) {
      return decoded;
    }
  }
  return fallback;
}
