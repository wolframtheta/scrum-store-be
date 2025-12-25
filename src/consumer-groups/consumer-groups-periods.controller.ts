import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PeriodsService } from '../periods/periods.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { IsMemberGuard } from '../core/guards/is-member.guard';
import { ShowcasePeriodDto } from '../periods/dto/showcase-response.dto';

@ApiTags('consumer-groups')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, IsMemberGuard)
@Controller('consumer-groups/:id/supply-schedules')
export class ConsumerGroupsPeriodsController {
  constructor(private readonly periodsService: PeriodsService) {}

  @Get('showcase')
  @ApiOperation({ summary: 'Get open periods for showcase (aparador)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Open periods with articles retrieved successfully',
    type: [ShowcasePeriodDto]
  })
  getShowcase(@Param('id') consumerGroupId: string): Promise<ShowcasePeriodDto[]> {
    return this.periodsService.getShowcasePeriods(consumerGroupId);
  }

  @Get('periods/all')
  @ApiOperation({ summary: 'Get all periods for a consumer group, optionally filtered by supplier' })
  @ApiResponse({ status: 200, description: 'Periods retrieved successfully' })
  findAll(
    @Param('id') consumerGroupId: string,
    @Query('supplierId') supplierId?: string,
  ) {
    return this.periodsService.findAll(consumerGroupId, supplierId);
  }

  @Get('periods')
  @ApiOperation({ summary: 'Get all periods for a consumer group, optionally filtered by supplier' })
  @ApiResponse({ status: 200, description: 'Periods retrieved successfully' })
  findAllAlt(
    @Param('id') consumerGroupId: string,
    @Query('supplierId') supplierId?: string,
  ) {
    return this.periodsService.findAll(consumerGroupId, supplierId);
  }
}

