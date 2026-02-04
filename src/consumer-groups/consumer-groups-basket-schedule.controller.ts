import {
  Controller,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { IsManagerGuard } from '../core/guards/is-manager.guard';
import { IsManagerOrPreparerGuard } from '../core/guards/is-manager-or-preparer.guard';
import { BasketScheduleService } from './basket-schedule.service';
import { BasketScheduleConfigDto } from './dto/basket-schedule-config.dto';
import { SetBasketScheduleVoteDto } from './dto/basket-schedule-vote.dto';
import { SetBasketScheduleAssignmentDto } from './dto/basket-schedule-assignment.dto';
import { BasketScheduleCalendarResponseDto } from './dto/basket-schedule-calendar-response.dto';

@ApiTags('consumer-groups')
@Controller('consumer-groups')
@ApiBearerAuth('JWT-auth')
export class ConsumerGroupsBasketScheduleController {
  constructor(private readonly basketScheduleService: BasketScheduleService) {}

  @Get(':id/basket-schedule/config')
  @UseGuards(JwtAuthGuard, IsManagerOrPreparerGuard)
  @ApiOperation({ summary: 'Get basket schedule config (manager or preparer)' })
  async getConfig(@Param('id') groupId: string) {
    return this.basketScheduleService.getConfig(groupId);
  }

  @Put(':id/basket-schedule/config')
  @UseGuards(JwtAuthGuard, IsManagerGuard)
  @ApiOperation({ summary: 'Update basket schedule config (manager only)' })
  async updateConfig(
    @Param('id') groupId: string,
    @Body() dto: BasketScheduleConfigDto,
  ) {
    return this.basketScheduleService.upsertConfig(groupId, dto);
  }

  @Get(':id/basket-schedule/calendar')
  @UseGuards(JwtAuthGuard, IsManagerOrPreparerGuard)
  @ApiOperation({ summary: 'Get calendar data for a month (votes + assignments)' })
  @ApiResponse({ status: 200, description: 'Calendar data', type: BasketScheduleCalendarResponseDto })
  async getCalendar(
    @Param('id') groupId: string,
    @Query('year') year: string,
    @Query('month') month: string,
    @Request() req: { user: { email: string } },
  ): Promise<BasketScheduleCalendarResponseDto> {
    const y = parseInt(year, 10);
    const m = parseInt(month, 10);
    if (Number.isNaN(y) || Number.isNaN(m) || m < 1 || m > 12) {
      throw new Error('Invalid year or month');
    }
    return this.basketScheduleService.getCalendar(groupId, y, m, req.user.email);
  }

  @Put(':id/basket-schedule/votes')
  @UseGuards(JwtAuthGuard, IsManagerOrPreparerGuard)
  @ApiOperation({ summary: 'Set vote for a date (preparer: own only; manager: any)' })
  async setVote(
    @Param('id') groupId: string,
    @Body() dto: SetBasketScheduleVoteDto,
    @Request() req: { user: { email: string } },
  ) {
    const targetEmail = dto.userEmail?.trim() || req.user.email;
    await this.basketScheduleService.setVote(
      groupId,
      targetEmail,
      dto.date,
      dto.status,
      req.user.email,
    );
    return { ok: true };
  }

  @Delete(':id/basket-schedule/votes')
  @UseGuards(JwtAuthGuard, IsManagerOrPreparerGuard)
  @ApiOperation({ summary: 'Clear vote for a date (own vote, or any user if manager)' })
  async clearVote(
    @Param('id') groupId: string,
    @Query('date') date: string,
    @Query('userEmail') userEmail: string | undefined,
    @Request() req: { user: { email: string } },
  ) {
    if (!date) throw new BadRequestException('date query param required');
    const targetEmail = userEmail?.trim() || req.user.email;
    await this.basketScheduleService.clearVote(groupId, targetEmail, date, req.user.email);
    return { ok: true };
  }

  @Put(':id/basket-schedule/assignments')
  @UseGuards(JwtAuthGuard, IsManagerGuard)
  @ApiOperation({ summary: 'Set who prepares on a date (manager only)' })
  async setAssignment(
    @Param('id') groupId: string,
    @Body() dto: SetBasketScheduleAssignmentDto,
  ) {
    await this.basketScheduleService.setAssignment(
      groupId,
      dto.date,
      dto.assignedUserEmail,
    );
    return { ok: true };
  }

  @Delete(':id/basket-schedule/assignments')
  @UseGuards(JwtAuthGuard, IsManagerGuard)
  @ApiOperation({ summary: 'Clear assignment for a date (manager only)' })
  async clearAssignment(
    @Param('id') groupId: string,
    @Query('date') date: string,
  ) {
    if (!date) throw new BadRequestException('date query param required');
    await this.basketScheduleService.clearAssignment(groupId, date);
    return { ok: true };
  }

  @Get(':id/basket-schedule/preparers')
  @UseGuards(JwtAuthGuard, IsManagerGuard)
  @ApiOperation({ summary: 'List preparers for assignment dropdown (manager only)' })
  async getPreparers(@Param('id') groupId: string) {
    return this.basketScheduleService.getPreparers(groupId);
  }
}
