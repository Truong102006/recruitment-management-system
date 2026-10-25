import { apiClient } from '../../lib/http/api-client';
import type {
  RegisterRequest,
  RegisterResponse,
  LoginRequest,
  LoginResponse,
  VerifyEmailRequest,
  ResendVerificationRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  UserRole,
} from '@rms/contracts/public';

export interface GenericAuthResponse {
  message: string;
}

export type RegisterDto = RegisterRequest;
export type LoginDto = LoginRequest;
export type ResetPasswordDto = ResetPasswordRequest;

export async function registerUser(
  dto: RegisterDto,
): Promise<RegisterResponse | GenericAuthResponse> {
  const normalizedEmail = dto.email.trim().toLowerCase();
  const normalizedFullName = dto.fullName.normalize('NFC').trim();

  const allowedRoles: UserRole[] = ['CANDIDATE', 'RECRUITER'];
  if (dto.role && !allowedRoles.includes(dto.role)) {
    throw new Error('Vai trò người dùng không hợp lệ');
  }

  return apiClient.post<RegisterResponse | GenericAuthResponse>('/api/auth/register', {
    fullName: normalizedFullName,
    email: normalizedEmail,
    password: dto.password, // BR18: Do not trim or normalize password
    role: dto.role || 'CANDIDATE',
  });
}

export async function loginUser(dto: LoginDto): Promise<LoginResponse> {
  const normalizedEmail = dto.email.trim().toLowerCase();
  return apiClient.post<LoginResponse>('/api/auth/login', {
    email: normalizedEmail,
    password: dto.password,
  });
}

export async function verifyEmailToken(token: string): Promise<GenericAuthResponse> {
  const payload: VerifyEmailRequest = { token };
  return apiClient.post<GenericAuthResponse>('/api/auth/verify-email', payload);
}

export async function resendVerificationEmail(email: string): Promise<GenericAuthResponse> {
  const normalizedEmail = email.trim().toLowerCase();
  const payload: ResendVerificationRequest = { email: normalizedEmail };
  return apiClient.post<GenericAuthResponse>('/api/auth/resend-verification', payload);
}

export async function requestForgotPassword(email: string): Promise<GenericAuthResponse> {
  const normalizedEmail = email.trim().toLowerCase();
  const payload: ForgotPasswordRequest = { email: normalizedEmail };
  return apiClient.post<GenericAuthResponse>('/api/auth/forgot-password', payload);
}

export async function resetPasswordWithToken(dto: ResetPasswordDto): Promise<GenericAuthResponse> {
  const payload: ResetPasswordRequest = {
    token: dto.token,
    newPassword: dto.newPassword,
  };
  return apiClient.post<GenericAuthResponse>('/api/auth/reset-password', payload);
}
