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
import { CreateCompanyService } from '../services/create-company.service';
import { CompanyService } from '../services/company.service';
import { CreateCompanyDto, UpdateCompanyDto, ResubmitCompanyDto } from '../dto/company.dto';
import { CurrentActor } from '../../../common/decorators/actor.decorator';
import { SessionGuard } from '../../../common/guards/session.guard';
import { CsrfGuard } from '../../../common/guards/csrf.guard';
import type { Actor } from '../../../../../../libs/contracts/backend';
import type { CompanyDto } from '../../../../../../libs/contracts/public';

@Controller('companies')
@UseGuards(SessionGuard, CsrfGuard)
export class CompaniesController {
  constructor(
    private readonly createCompanyService: CreateCompanyService,
    private readonly companyService: CompanyService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  public async createCompany(
    @CurrentActor() actor: Actor,
    @Body() dto: CreateCompanyDto,
  ): Promise<CompanyDto> {
    return this.createCompanyService.createCompany(actor, dto);
  }

  @Get(':id')
  public async getCompanyDetail(
    @CurrentActor() actor: Actor,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<CompanyDto> {
    return this.companyService.getCompanyDetail(actor, id);
  }

  @Patch(':id')
  public async updateCompany(
    @CurrentActor() actor: Actor,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdateCompanyDto,
  ): Promise<CompanyDto> {
    return this.companyService.updateCompany(actor, id, dto);
  }

  @Post(':id/resubmit')
  @HttpCode(HttpStatus.OK)
  public async resubmitCompany(
    @CurrentActor() actor: Actor,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: ResubmitCompanyDto,
  ): Promise<CompanyDto> {
    return this.companyService.resubmitCompany(actor, id, dto);
  }
}
