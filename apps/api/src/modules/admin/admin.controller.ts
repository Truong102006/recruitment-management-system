import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentActor } from '../../common/decorators/actor.decorator';
import { SessionGuard } from '../../common/guards/session.guard';
import { CsrfGuard } from '../../common/guards/csrf.guard';
import { Actor } from '../../../../../libs/contracts/backend';
import { AdminService } from './admin.service';
import {
  AdminCompanyDecisionDto,
  AdminUserDecisionDto,
  AdminListDto,
  AdminMutationDto,
  RecoverOwnerDto,
} from './admin.dto';

@Controller('admin')
@UseGuards(SessionGuard, CsrfGuard)
export class AdminController {
  constructor(private readonly service: AdminService) {}
  @Patch('users/:id') patchUser(
    @CurrentActor() a: Actor,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdminUserDecisionDto,
  ) {
    return this.service.mutate(a, 'users', id, dto.status === 'LOCKED' ? 'lock' : 'unlock', dto);
  }
  @Patch('companies/:id') patchCompany(
    @CurrentActor() a: Actor,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdminCompanyDecisionDto,
  ) {
    return this.service.decideCompany(a, id, dto);
  }
  @Get('users') users(@CurrentActor() actor: Actor, @Query() q: AdminListDto) {
    return this.service.read(actor, 'users', q.page, q.limit, q.status);
  }
  @Get('companies') companies(@CurrentActor() actor: Actor, @Query() q: AdminListDto) {
    return this.service.read(actor, 'companies', q.page, q.limit, q.status);
  }
  @Get('jobs') jobs(@CurrentActor() actor: Actor, @Query() q: AdminListDto) {
    return this.service.read(actor, 'jobs', q.page, q.limit, q.status);
  }
  @Get('companies/:id') company(
    @CurrentActor() actor: Actor,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.companyDetail(actor, id);
  }
  @Get('companies/:id/eligible-owners') owners(
    @CurrentActor() actor: Actor,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.eligibleOwners(actor, id);
  }
  @Post('companies/:id/recover-owner') @HttpCode(200) recover(
    @CurrentActor() a: Actor,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RecoverOwnerDto,
  ) {
    return this.service.mutate(a, 'companies', id, 'recover-owner', {
      ...dto,
      version: dto.companyVersion,
    });
  }
  @Post('jobs/:id/close') @HttpCode(200) close(
    @CurrentActor() a: Actor,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdminMutationDto,
  ) {
    return this.service.mutate(a, 'jobs', id, 'close', dto);
  }
  @Post('interviews/:id/security-cancel') @HttpCode(200) cancel(
    @CurrentActor() a: Actor,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdminMutationDto,
  ) {
    return this.service.mutate(a, 'interviews', id, 'security-cancel', dto);
  }
}
