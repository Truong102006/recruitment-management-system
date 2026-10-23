import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CompanyMembershipService } from '../services/company-membership.service';
import { AddMemberDto, UpdateMemberDto, TransferOwnerDto } from '../dto/company.dto';
import { CurrentActor } from '../../../common/decorators/actor.decorator';
import { SessionGuard } from '../../../common/guards/session.guard';
import { CsrfGuard } from '../../../common/guards/csrf.guard';
import type { Actor } from '../../../../../../libs/contracts/backend';
import type { CompanyMemberDto } from '../../../../../../libs/contracts/public';

@Controller('companies/:id')
@UseGuards(SessionGuard, CsrfGuard)
export class MembershipsController {
  constructor(private readonly membershipService: CompanyMembershipService) {}

  @Get('members')
  public async listMembers(
    @CurrentActor() actor: Actor,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<CompanyMemberDto[]> {
    return this.membershipService.listMembers(actor, id);
  }

  @Post('members')
  @HttpCode(HttpStatus.CREATED)
  public async addMember(
    @CurrentActor() actor: Actor,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: AddMemberDto,
  ): Promise<CompanyMemberDto> {
    return this.membershipService.addMember(actor, id, dto);
  }

  @Patch('members/:userId')
  public async updateMember(
    @CurrentActor() actor: Actor,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('userId', new ParseUUIDPipe({ version: '4' })) userId: string,
    @Body() dto: UpdateMemberDto,
  ): Promise<CompanyMemberDto> {
    return this.membershipService.updateMember(actor, id, userId, dto);
  }

  @Post('transfer-owner')
  @HttpCode(HttpStatus.OK)
  public async transferOwner(
    @CurrentActor() actor: Actor,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: TransferOwnerDto,
  ): Promise<{ success: true }> {
    await this.membershipService.transferOwner(actor, id, dto);
    return { success: true };
  }
}
