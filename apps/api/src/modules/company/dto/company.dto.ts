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
  Min,
  ValidateIf,
} from 'class-validator';
import { CodePointLength, NormalizeText } from '../../../common/validation/text';
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
  @NormalizeText()
  @IsString()
  @IsNotEmpty()
  @CodePointLength(2, 255)
  name!: string;

  @NormalizeText()
  @IsString()
  @IsNotEmpty()
  @CodePointLength(8, 50)
  taxCode!: string;

  @NormalizeText()
  @IsString()
  @IsNotEmpty()
  @CodePointLength(5, 500)
  address!: string;

  @NormalizeText()
  @IsOptional()
  @IsString()
  @CodePointLength(0, 255)
  website?: string | null;

  @NormalizeText()
  @IsOptional()
  @IsString()
  description?: string | null;
}

export class UpdateCompanyDto implements UpdateCompanyRequest {
  @NormalizeText()
  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  @CodePointLength(2, 255)
  name?: string;

  @NormalizeText()
  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  @CodePointLength(5, 500)
  address?: string;

  @NormalizeText()
  @IsOptional()
  @IsString()
  @CodePointLength(0, 255)
  website?: string | null;

  @NormalizeText()
  @IsOptional()
  @IsString()
  description?: string | null;

  @IsInt()
  @Min(0)
  version!: number;
}

export class ResubmitCompanyDto implements ResubmitCompanyRequest {
  @NormalizeText()
  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  @CodePointLength(2, 255)
  name?: string;

  @NormalizeText()
  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  @CodePointLength(5, 500)
  address?: string;

  @NormalizeText()
  @IsOptional()
  @IsString()
  @CodePointLength(0, 255)
  website?: string | null;

  @NormalizeText()
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
