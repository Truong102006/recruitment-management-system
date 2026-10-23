import { Controller, Get, UseGuards } from '@nestjs/common';
import { JobReadService } from '../services/job-read.service';
import { SkillDto } from '../dto/job.dto';
import { PublicRoute } from '../../../common/decorators/public-route.decorator';
import { SessionGuard } from '../../../common/guards/session.guard';

@Controller('skills')
@UseGuards(SessionGuard)
export class SkillsController {
  constructor(private readonly jobReadService: JobReadService) {}

  @PublicRoute()
  @Get()
  public async listSkills(): Promise<SkillDto[]> {
    return this.jobReadService.getActiveSkills();
  }
}
