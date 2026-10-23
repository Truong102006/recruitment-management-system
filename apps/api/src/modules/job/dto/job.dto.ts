import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsIn,
  IsInt,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';

export interface SkillDto {
  id: string;
  name: string;
  category?: string | null;
  active: boolean;
}

export type JobType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP';
export type WorkplaceMode = 'ON_SITE' | 'HYBRID' | 'REMOTE';
export type JobStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED';

export class CreateJobDto {
  @IsUUID('4') companyId!: string;
  @ValidateIf((_, v) => v !== undefined) @IsString() @MaxLength(150) title?: string;
  @ValidateIf((_, v) => v !== undefined) @IsString() @MaxLength(10000) description?: string;
  @ValidateIf((_, v) => v !== undefined) @IsString() @MaxLength(255) location?: string;
  @ValidateIf((_, v) => v !== undefined) @IsInt() @Min(1) @Max(100) headcount?: number;
  @ValidateIf((_, v) => v !== undefined)
  @IsIn(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP'])
  jobType?: JobType;
  @ValidateIf((_, v) => v !== undefined)
  @IsIn(['ON_SITE', 'HYBRID', 'REMOTE'])
  workplaceMode?: WorkplaceMode;
  @IsOptional() @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) @Max(9999999999999.99) salaryMin?:
    number | null;
  @IsOptional() @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) @Max(9999999999999.99) salaryMax?:
    number | null;
  @IsOptional() @IsString() @MaxLength(10) currency?: string | null;
  @ValidateIf((_, v) => v !== undefined)
  @IsISO8601({ strict: true })
  @Matches(/T.*(?:Z|[+-][0-9]{2}:[0-9]{2})$/)
  deadline?: string;
  @ValidateIf((_, v) => v !== undefined)
  @IsArray()
  @ArrayMaxSize(50)
  @ArrayUnique()
  @IsUUID('4', { each: true })
  skillIds?: string[];
}
export class UpdateJobDto {
  @IsInt() @Min(0) version!: number;
  @ValidateIf((_, v) => v !== undefined) @IsString() @MaxLength(150) title?: string;
  @ValidateIf((_, v) => v !== undefined) @IsString() @MaxLength(10000) description?: string;
  @ValidateIf((_, v) => v !== undefined) @IsString() @MaxLength(255) location?: string;
  @ValidateIf((_, v) => v !== undefined) @IsInt() @Min(1) @Max(100) headcount?: number;
  @ValidateIf((_, v) => v !== undefined)
  @IsIn(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP'])
  jobType?: JobType;
  @ValidateIf((_, v) => v !== undefined)
  @IsIn(['ON_SITE', 'HYBRID', 'REMOTE'])
  workplaceMode?: WorkplaceMode;
  @IsOptional() @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) @Max(9999999999999.99) salaryMin?:
    number | null;
  @IsOptional() @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) @Max(9999999999999.99) salaryMax?:
    number | null;
  @IsOptional() @IsString() @MaxLength(10) currency?: string | null;
  @ValidateIf((_, v) => v !== undefined)
  @IsISO8601({ strict: true })
  @Matches(/T.*(?:Z|[+-][0-9]{2}:[0-9]{2})$/)
  deadline?: string;
  @ValidateIf((_, v) => v !== undefined)
  @IsArray()
  @ArrayMaxSize(50)
  @ArrayUnique()
  @IsUUID('4', { each: true })
  skillIds?: string[];
}
export class PublishJobDto {
  @IsInt() @Min(0) version!: number;
  @ValidateIf((_, v) => v !== undefined)
  @IsISO8601({ strict: true })
  @Matches(/T.*(?:Z|[+-][0-9]{2}:[0-9]{2})$/)
  deadline?: string;
}
export class CloseJobDto {
  @IsInt() @Min(0) version!: number;
  @IsString() @MaxLength(500) reason!: string;
}
export class JobPageQueryDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(50) pageSize?: number;
}
export class JobSearchQueryDto extends JobPageQueryDto {
  @IsOptional() @IsString() @MaxLength(200) q?: string;
  @IsOptional() @IsString() @MaxLength(255) location?: string;
  @IsOptional() @IsIn(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP']) jobType?: JobType;
  @IsOptional() @IsIn(['ON_SITE', 'HYBRID', 'REMOTE']) workplaceMode?: WorkplaceMode;
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.split(',') : value))
  @IsArray()
  @ArrayMaxSize(50)
  @ArrayUnique()
  @IsUUID('4', { each: true })
  skillIds?: string[] | string;
  @IsOptional() @IsIn(['ANY', 'ALL']) skillMatchMode?: 'ANY' | 'ALL';
  @IsOptional() @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) salaryMin?: number;
  @IsOptional() @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) salaryMax?: number;
  @IsOptional() @IsString() @MaxLength(10) currency?: string;
  @IsOptional() @IsIn(['createdAt', 'deadline', 'salaryMax']) sortBy?:
    'createdAt' | 'deadline' | 'salaryMax';
  @IsOptional() @IsIn(['asc', 'desc']) sortOrder?: 'asc' | 'desc';
}

export interface JobSummaryDto {
  id: string;
  companyId: string;
  companyName: string;
  title: string;
  location: string | null;
  jobType: JobType | null;
  workplaceMode: WorkplaceMode | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  currency?: string | null;
  deadline: string | null;
  status: JobStatus;
  skillIds: string[];
  skills: SkillDto[];
  version?: number;
  createdAt?: string;
  publishedAt?: string | null;
  closedAt?: string | null;
  closeReason?: string | null;
  isClosed?: boolean;
  acceptingApplications?: boolean;
}

export interface JobDetailDto extends JobSummaryDto {
  description: string | null;
  headcount: number | null;
  createdBy?: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}
