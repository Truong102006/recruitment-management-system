import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  MaxLength,
  Min,
} from 'class-validator';
import type {
  CreateCompanyRequest,
  UpdateCompanyRequest,
  ResubmitCompanyRequest,
  AddMemberRequest,
  UpdateMemberRequest,
  TransferOwnerRequest,
  MemberPermission,
} from '../../../../../../libs/contracts/public';

export class CreateCompanyDto implements CreateCompanyRequest {
  @IsString()
  @IsNotEmpty()
  @Length(2, 255)
  name!: string;

  @IsString()
  @IsNotEmpty()
  @Length(8, 50)
  taxCode!: string;

  @IsString()
  @IsNotEmpty()
  @Length(5, 500)
  address!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  website?: string | null;

  @IsOptional()
  @IsString()
  description?: string | null;
}

export class UpdateCompanyDto implements UpdateCompanyRequest {
  @IsOptional()
  @IsString()
  @Length(2, 255)
  name?: string;

  @IsOptional()
  @IsString()
  @Length(5, 500)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  website?: string | null;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsInt()
  @Min(0)
  version!: number;
}

export class ResubmitCompanyDto implements ResubmitCompanyRequest {
  @IsOptional()
  @IsString()
  @Length(2, 255)
  name?: string;

  @IsOptional()
  @IsString()
  @Length(5, 500)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  website?: string | null;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsInt()
  @Min(0)
  version!: number;
}

export class AddMemberDto implements AddMemberRequest {
  @IsEmail()
  email!: string;

  @IsIn(['RECRUITER', 'INTERVIEWER'])
  role!: 'RECRUITER' | 'INTERVIEWER';

  @IsOptional()
  @IsArray()
  @IsIn(['RECRUITER', 'INTERVIEWER'], { each: true })
  permissions?: MemberPermission[];
}

export class UpdateMemberDto implements UpdateMemberRequest {
  @IsOptional()
  @IsIn(['RECRUITER', 'INTERVIEWER'])
  role?: 'RECRUITER' | 'INTERVIEWER';

  @IsOptional()
  @IsArray()
  @IsIn(['RECRUITER', 'INTERVIEWER'], { each: true })
  permissions?: MemberPermission[];

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsInt()
  @Min(0)
  version!: number;

  @IsInt()
  @Min(0)
  companyVersion!: number;
}

export class TransferOwnerDto implements TransferOwnerRequest {
  @IsUUID()
  targetUserId!: string;

  @IsInt()
  @Min(0)
  targetMemberVersion!: number;

  @IsInt()
  @Min(0)
  companyVersion!: number;
}
