import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  IsOptional,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
export class AdminMutationDto {
  @IsInt() @Min(0) version!: number;
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason!: string;
}
export class RecoverOwnerDto {
  @IsInt() @Min(0) companyVersion!: number;
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason!: string;
  @IsUUID('4') targetUserId!: string;
  @IsInt() @Min(0) targetMemberVersion!: number;
}
export class AdminListDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(50) limit = 20;
  @IsOptional() @IsString() @MaxLength(50) status?: string;
}

export class AdminCompanyDecisionDto extends AdminMutationDto {
  @IsIn(['APPROVED', 'REJECTED', 'SUSPENDED']) status!: 'APPROVED' | 'REJECTED' | 'SUSPENDED';
}
export class AdminUserDecisionDto extends AdminMutationDto {
  @IsIn(['ACTIVE', 'LOCKED']) status!: 'ACTIVE' | 'LOCKED';
}
