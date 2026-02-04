import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { ConsumerGroupsService } from './consumer-groups.service';
import { BasketScheduleConfig } from './entities/basket-schedule-config.entity';
import { BasketScheduleVote, BasketScheduleVoteStatus } from './entities/basket-schedule-vote.entity';
import { BasketScheduleAssignment } from './entities/basket-schedule-assignment.entity';
import { User } from '../users/entities/user.entity';
import { BasketScheduleConfigDto } from './dto/basket-schedule-config.dto';
import { BasketScheduleCalendarResponseDto } from './dto/basket-schedule-calendar-response.dto';

@Injectable()
export class BasketScheduleService {
  constructor(
    @InjectRepository(BasketScheduleConfig)
    private readonly configRepo: Repository<BasketScheduleConfig>,
    @InjectRepository(BasketScheduleVote)
    private readonly voteRepo: Repository<BasketScheduleVote>,
    @InjectRepository(BasketScheduleAssignment)
    private readonly assignmentRepo: Repository<BasketScheduleAssignment>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly consumerGroupsService: ConsumerGroupsService,
  ) {}

  async getConfig(groupId: string): Promise<{ preferredWeekday: number | null; preferredTime: string | null }> {
    const config = await this.configRepo.findOne({ where: { consumerGroupId: groupId } });
    return {
      preferredWeekday: config?.preferredWeekday ?? null,
      preferredTime: config?.preferredTime ?? null,
    };
  }

  async upsertConfig(
    groupId: string,
    dto: BasketScheduleConfigDto,
  ): Promise<{ preferredWeekday: number | null; preferredTime: string | null }> {
    await this.consumerGroupsService.findById(groupId);
    let config = await this.configRepo.findOne({ where: { consumerGroupId: groupId } });
    if (!config) {
      config = this.configRepo.create({ consumerGroupId: groupId });
    }
    if (dto.preferredWeekday !== undefined) config.preferredWeekday = dto.preferredWeekday;
    if (dto.preferredTime !== undefined) config.preferredTime = dto.preferredTime;
    await this.configRepo.save(config);
    return { preferredWeekday: config.preferredWeekday, preferredTime: config.preferredTime };
  }

  private toDateOnly(date: Date): string {
    return date.toISOString().slice(0, 10);
  }

  async getCalendar(
    groupId: string,
    year: number,
    month: number,
    requestUserEmail: string,
  ): Promise<BasketScheduleCalendarResponseDto> {
    await this.consumerGroupsService.findById(groupId);
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);
    const startStr = this.toDateOnly(start);
    const endStr = this.toDateOnly(end);

    const config = await this.getConfig(groupId);
    const votes = await this.voteRepo.find({
      where: {
        consumerGroupId: groupId,
        date: Between(startStr, endStr),
      },
    });
    const assignments = await this.assignmentRepo.find({
      where: {
        consumerGroupId: groupId,
        date: Between(startStr, endStr),
      },
    });

    const emails = new Set<string>();
    votes.forEach((v) => emails.add(v.userEmail));
    assignments.forEach((a) => emails.add(a.assignedUserEmail));
    const users = await this.userRepo.find({
      where: Array.from(emails).map((email) => ({ email })),
      select: ['email', 'name', 'surname'],
    });
    const nameByEmail = new Map(users.map((u) => [u.email, [u.name, u.surname].filter(Boolean).join(' ').trim() || u.email]));

    return {
      config,
      votes: votes.map((v) => ({
        date: v.date,
        userEmail: v.userEmail,
        userName: nameByEmail.get(v.userEmail),
        status: v.status as 'yes' | 'no' | 'if_needed',
      })),
      assignments: assignments.map((a) => ({
        date: a.date,
        assignedUserEmail: a.assignedUserEmail,
        assignedUserName: nameByEmail.get(a.assignedUserEmail),
      })),
    };
  }

  async setVote(
    groupId: string,
    userEmail: string,
    date: string,
    status: BasketScheduleVoteStatus,
    requestUserEmail: string,
  ): Promise<void> {
    await this.consumerGroupsService.findById(groupId);
    const isManager = await this.consumerGroupsService.isManager(requestUserEmail, groupId);
    const normalizedRequest = requestUserEmail.toLowerCase().trim();
    const normalizedVoteFor = userEmail.toLowerCase().trim();
    if (!isManager && normalizedRequest !== normalizedVoteFor) {
      throw new ForbiddenException('You can only set your own vote');
    }
    const dateOnly = date.slice(0, 10);
    let entity = await this.voteRepo.findOne({
      where: { consumerGroupId: groupId, userEmail: userEmail, date: dateOnly },
    });
    if (!entity) {
      entity = this.voteRepo.create({
        consumerGroupId: groupId,
        userEmail: userEmail,
        date: dateOnly,
        status,
      });
    } else {
      entity.status = status;
    }
    await this.voteRepo.save(entity);
  }

  async clearVote(groupId: string, userEmail: string, date: string, requestUserEmail: string): Promise<void> {
    await this.consumerGroupsService.findById(groupId);
    const isManager = await this.consumerGroupsService.isManager(requestUserEmail, groupId);
    const normalizedRequest = requestUserEmail.toLowerCase().trim();
    const normalizedVoteFor = userEmail.toLowerCase().trim();
    if (!isManager && normalizedRequest !== normalizedVoteFor) {
      throw new ForbiddenException('You can only clear your own vote');
    }
    const dateOnly = date.slice(0, 10);
    await this.voteRepo.delete({
      consumerGroupId: groupId,
      userEmail: userEmail,
      date: dateOnly,
    });
  }

  async setAssignment(
    groupId: string,
    date: string,
    assignedUserEmail: string,
  ): Promise<void> {
    await this.consumerGroupsService.findById(groupId);
    const dateOnly = date.slice(0, 10);
    let assignment = await this.assignmentRepo.findOne({
      where: { consumerGroupId: groupId, date: dateOnly },
    });
    if (!assignment) {
      assignment = this.assignmentRepo.create({
        consumerGroupId: groupId,
        date: dateOnly,
        assignedUserEmail: assignedUserEmail,
      });
    } else {
      assignment.assignedUserEmail = assignedUserEmail;
    }
    await this.assignmentRepo.save(assignment);
  }

  async clearAssignment(groupId: string, date: string): Promise<void> {
    await this.consumerGroupsService.findById(groupId);
    const dateOnly = date.slice(0, 10);
    await this.assignmentRepo.delete({
      consumerGroupId: groupId,
      date: dateOnly,
    });
  }

  async getPreparers(groupId: string): Promise<Array<{ userEmail: string; name: string }>> {
    const members = await this.consumerGroupsService.getMembers(groupId);
    return members
      .filter((m) => m.isPreparer)
      .map((m) => ({
        userEmail: m.userEmail,
        name: (m as { name?: string }).name ?? m.userEmail,
      }));
  }
}
