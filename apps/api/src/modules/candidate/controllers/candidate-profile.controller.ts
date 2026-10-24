import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  MaxLength,
} from 'class-validator';
import { CurrentActor } from '../../../common/decorators/actor.decorator';
import { SessionGuard } from '../../../common/guards/session.guard';
import type { Actor } from '../../../../../../libs/contracts/backend';
import type { UpdateCandidateProfileRequest } from '../../../../../../libs/contracts/public';
import { CandidateProfileService } from '../services/candidate-profile.service';

class ProfilePatchDto implements UpdateCandidateProfileRequest {
  @IsInt() @Min(0) version!: number;
  @IsOptional() @IsString() @MaxLength(120) name?: string;
  @IsOptional() @IsString() @MaxLength(20) phone?: string | null;
  @IsOptional() @IsString() @MaxLength(160) headline?: string | null;
  @IsOptional() @IsString() @MaxLength(3000) summary?: string | null;
  @IsOptional() @IsString() @MaxLength(160) location?: string | null;
  @IsOptional() @IsArray() @ArrayMaxSize(50) @IsUUID('4', { each: true }) skillIds?: string[];
}

@Controller('candidate/profile')
@UseGuards(SessionGuard)
export class CandidateProfileController {
  constructor(private readonly service: CandidateProfileService) {}
  @Get() get(@CurrentActor() actor: Actor) {
    return this.service.get(actor);
  }
  @Patch() patch(@CurrentActor() actor: Actor, @Body() dto: ProfilePatchDto) {
    return this.service.patch(actor, dto);
  }
}
