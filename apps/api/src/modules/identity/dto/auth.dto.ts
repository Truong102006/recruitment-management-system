import { IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { CodePointLength, NormalizeText } from '../../../common/validation/text';

export class RegisterDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsEmail({}, { message: 'email must be an email' })
  @IsNotEmpty()
  email!: string;

  @IsString()
  @MinLength(10, { message: 'password must be at least 10 characters long' })
  password!: string;

  @NormalizeText()
  @IsString()
  @IsNotEmpty()
  @CodePointLength(1, 120)
  fullName!: string;

  @IsOptional()
  @IsIn(['CANDIDATE', 'RECRUITER'], { message: 'role must be CANDIDATE or RECRUITER' })
  role?: 'CANDIDATE' | 'RECRUITER';
}

export class LoginDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsEmail({}, { message: 'email must be an email' })
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;
}

export class VerifyEmailDto {
  @IsString()
  @IsNotEmpty()
  token!: string;
}

export class ResendVerificationDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsEmail({}, { message: 'email must be an email' })
  @IsNotEmpty()
  email!: string;
}

export class ForgotPasswordDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsEmail({}, { message: 'email must be an email' })
  @IsNotEmpty()
  email!: string;
}

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty()
  token!: string;

  @IsString()
  @MinLength(10, { message: 'newPassword must be at least 10 characters long' })
  newPassword!: string;
}
