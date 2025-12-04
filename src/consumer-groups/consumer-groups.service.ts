import { Injectable, NotFoundException, ConflictException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { ConsumerGroup } from './entities/consumer-group.entity';
import { UserConsumerGroup } from './entities/user-consumer-group.entity';
import { User } from '../users/entities/user.entity';
import { GroupInvitation } from './entities/group-invitation.entity';
import { CreateConsumerGroupDto } from './dto/create-consumer-group.dto';
import { UpdateConsumerGroupDto } from './dto/update-consumer-group.dto';
import { ConsumerGroupResponseDto } from './dto/consumer-group-response.dto';
import { ConsumerGroupWithRoleResponseDto } from './dto/consumer-group-with-role-response.dto';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import * as crypto from 'crypto';

@Injectable()
export class ConsumerGroupsService {
  private readonly logger = new Logger(ConsumerGroupsService.name);

  constructor(
    @InjectRepository(ConsumerGroup)
    private readonly consumerGroupRepository: Repository<ConsumerGroup>,
    @InjectRepository(UserConsumerGroup)
    private readonly userConsumerGroupRepository: Repository<UserConsumerGroup>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(GroupInvitation)
    private readonly invitationRepository: Repository<GroupInvitation>,
  ) {}

  async create(createDto: CreateConsumerGroupDto, managerEmail: string): Promise<ConsumerGroupResponseDto> {
    // Check if group with this email already exists
    const existingGroup = await this.consumerGroupRepository.findOne({
      where: { email: createDto.email },
    });

    if (existingGroup) {
      throw new ConflictException('Group with this email already exists');
    }

    // Create group
    const group = this.consumerGroupRepository.create(createDto);
    const savedGroup = await this.consumerGroupRepository.save(group);

    // Add creator as manager
    const userGroup = this.userConsumerGroupRepository.create({
      userEmail: managerEmail,
      consumerGroupId: savedGroup.id,
      isClient: true,
      isManager: true,
      isDefault: true, // First group is default
    });

    await this.userConsumerGroupRepository.save(userGroup);

    return new ConsumerGroupResponseDto(savedGroup);
  }

  async findAll(): Promise<ConsumerGroupResponseDto[]> {
    const groups = await this.consumerGroupRepository.find();
    return groups.map(group => new ConsumerGroupResponseDto(group));
  }

  async findById(id: string): Promise<ConsumerGroupResponseDto> {
    const group = await this.consumerGroupRepository.findOne({ where: { id } });
    
    if (!group) {
      throw new NotFoundException(`Consumer group with ID ${id} not found`);
    }

    return new ConsumerGroupResponseDto(group);
  }

  async findByUser(userEmail: string): Promise<ConsumerGroupWithRoleResponseDto[]> {
    const userGroups = await this.userConsumerGroupRepository.find({
      where: { userEmail },
      relations: ['consumerGroup'],
    });

    return userGroups.map(ug => new ConsumerGroupWithRoleResponseDto({
      ...ug.consumerGroup,
      role: {
        isClient: ug.isClient,
        isManager: ug.isManager,
        isDefault: ug.isDefault,
      }
    }));
  }

  async findManagerGroups(userEmail: string): Promise<ConsumerGroupResponseDto[]> {
    const userGroups = await this.userConsumerGroupRepository.find({
      where: { userEmail, isManager: true },
      relations: ['consumerGroup'],
    });

    return userGroups.map(ug => new ConsumerGroupResponseDto(ug.consumerGroup));
  }

  async update(id: string, updateDto: UpdateConsumerGroupDto): Promise<ConsumerGroupResponseDto> {
    const group = await this.consumerGroupRepository.findOne({ where: { id } });

    if (!group) {
      throw new NotFoundException(`Consumer group with ID ${id} not found`);
    }

    // Check if email is being changed and if it conflicts
    if (updateDto.email && updateDto.email !== group.email) {
      const existingGroup = await this.consumerGroupRepository.findOne({
        where: { email: updateDto.email },
      });

      if (existingGroup) {
        throw new ConflictException('Group with this email already exists');
      }
    }

    Object.assign(group, updateDto);
    const updatedGroup = await this.consumerGroupRepository.save(group);

    return new ConsumerGroupResponseDto(updatedGroup);
  }

  async delete(id: string): Promise<void> {
    const group = await this.consumerGroupRepository.findOne({ where: { id } });

    if (!group) {
      throw new NotFoundException(`Consumer group with ID ${id} not found`);
    }

    await this.consumerGroupRepository.remove(group);
  }

  async addMember(groupId: string, userEmail: string, isClient = true, isManager = false): Promise<void> {
    // Normalitzar l'email (lowercase per evitar problemes de majúscules/minúscules)
    const normalizedEmail = userEmail.toLowerCase().trim();
    
    // Check if group exists
    const group = await this.consumerGroupRepository.findOne({ where: { id: groupId } });
    if (!group) {
      throw new NotFoundException(`Consumer group with ID ${groupId} not found`);
    }

    // Check if user exists
    const user = await this.userRepository.findOne({ where: { email: normalizedEmail } });
    if (!user) {
      throw new NotFoundException(`No s'ha trobat cap usuari amb el correu ${normalizedEmail}`);
    }

    // Check if user is already a member
    const existing = await this.userConsumerGroupRepository.findOne({
      where: { userEmail: normalizedEmail, consumerGroupId: groupId },
    });

    if (existing) {
      throw new ConflictException('User is already a member of this group');
    }

    // Check if user has any groups (to set default)
    const userGroupsCount = await this.userConsumerGroupRepository.count({
      where: { userEmail: normalizedEmail },
    });

    const userGroup = this.userConsumerGroupRepository.create({
      userEmail: normalizedEmail,
      consumerGroupId: groupId,
      isClient,
      isManager,
      isDefault: userGroupsCount === 0, // Set as default if it's the first group
    });

    await this.userConsumerGroupRepository.save(userGroup);
  }

  async removeMember(groupId: string, userEmail: string): Promise<void> {
    const userGroup = await this.userConsumerGroupRepository.findOne({
      where: { userEmail, consumerGroupId: groupId },
    });

    if (!userGroup) {
      throw new NotFoundException('User is not a member of this group');
    }

    await this.userConsumerGroupRepository.remove(userGroup);
  }

  async updateMemberRole(groupId: string, userEmail: string, isClient: boolean, isManager: boolean): Promise<void> {
    // Normalitzar l'email (lowercase per evitar problemes de majúscules/minúscules)
    const normalizedEmail = userEmail.toLowerCase().trim();
    
    // Buscar amb consulta case-insensitive per compatibilitat amb emails antics
    const userGroup = await this.userConsumerGroupRepository
      .createQueryBuilder('ucg')
      .where('LOWER(ucg.userEmail) = LOWER(:userEmail)', { userEmail: normalizedEmail })
      .andWhere('ucg.consumerGroupId = :groupId', { groupId })
      .getOne();

    if (!userGroup) {
      // Debug: buscar tots els membres del grup per veure quins emails hi ha
      const allMembers = await this.userConsumerGroupRepository.find({
        where: { consumerGroupId: groupId },
      });
      const memberEmails = allMembers.map(m => m.userEmail);
      throw new NotFoundException(
        `User with email "${normalizedEmail}" is not a member of this group. ` +
        `Group members: ${memberEmails.join(', ')}`
      );
    }

    userGroup.isClient = isClient;
    userGroup.isManager = isManager;

    await this.userConsumerGroupRepository.save(userGroup);
  }

  async setDefaultGroup(userEmail: string, groupId: string): Promise<void> {
    // Check if user is member of the group
    const userGroup = await this.userConsumerGroupRepository.findOne({
      where: { userEmail, consumerGroupId: groupId },
    });

    if (!userGroup) {
      throw new NotFoundException('User is not a member of this group');
    }

    // Remove default from all user groups
    await this.userConsumerGroupRepository.update(
      { userEmail, isDefault: true },
      { isDefault: false },
    );

    // Set new default
    userGroup.isDefault = true;
    await this.userConsumerGroupRepository.save(userGroup);
  }

  async getMembers(groupId: string) {
    const members = await this.userConsumerGroupRepository.find({
      where: { consumerGroupId: groupId },
      relations: ['user'],
    });

    return members.map(member => ({
      userEmail: member.userEmail,
      email: member.userEmail, // Mantenir compatibilitat
      name: member.user.name,
      surname: member.user.surname,
      phone: member.user.phone,
      profileImage: member.user.profileImage,
      isClient: member.isClient,
      isManager: member.isManager,
      joinedAt: member.joinedAt,
    }));
  }

  async isManager(userEmail: string, groupId: string): Promise<boolean> {
    // Normalitzar l'email (lowercase per evitar problemes de majúscules/minúscules)
    const normalizedEmail = userEmail.toLowerCase().trim();
    
    this.logger.debug(`Checking if ${normalizedEmail} is manager of group ${groupId}`);
    
    // Usar consulta case-insensitive per compatibilitat amb emails antics
    const userGroup = await this.userConsumerGroupRepository
      .createQueryBuilder('ucg')
      .where('LOWER(ucg.userEmail) = LOWER(:userEmail)', { userEmail: normalizedEmail })
      .andWhere('ucg.consumerGroupId = :groupId', { groupId })
      .andWhere('ucg.isManager = :isManager', { isManager: true })
      .getOne();

    this.logger.debug(`Result: ${JSON.stringify(userGroup)}`);
    const result = !!userGroup;
    this.logger.debug(`isManager returning: ${result}`);

    return result;
  }

  async isMember(userEmail: string, groupId: string): Promise<boolean> {
    // Normalitzar l'email (lowercase per evitar problemes de majúscules/minúscules)
    const normalizedEmail = userEmail.toLowerCase().trim();
    
    // Usar consulta case-insensitive per compatibilitat amb emails antics
    const userGroup = await this.userConsumerGroupRepository
      .createQueryBuilder('ucg')
      .where('LOWER(ucg.userEmail) = LOWER(:userEmail)', { userEmail: normalizedEmail })
      .andWhere('ucg.consumerGroupId = :groupId', { groupId })
      .getOne();

    return !!userGroup;
  }

  async updateImage(groupId: string, imageUrl: string): Promise<ConsumerGroupResponseDto> {
    const group = await this.consumerGroupRepository.findOne({ where: { id: groupId } });

    if (!group) {
      throw new NotFoundException(`Consumer group with ID ${groupId} not found`);
    }

    group.image = imageUrl;
    const updatedGroup = await this.consumerGroupRepository.save(group);

    return new ConsumerGroupResponseDto(updatedGroup);
  }

  isOpen(groupId: string): boolean {
    // TODO: Implement based on opening schedule
    return true;
  }

  // ============ ADMIN METHODS ============

  async findAllAdmin(options: {
    page: number;
    limit: number;
    search?: string;
    isActive?: boolean;
  }) {
    const query = this.consumerGroupRepository.createQueryBuilder('group');

    // Search by name
    if (options.search) {
      query.where('group.name ILIKE :search', { search: `%${options.search}%` });
    }

    // Filter by active status
    if (options.isActive !== undefined) {
      query.andWhere('group.isActive = :isActive', { isActive: options.isActive });
    }

    // Pagination
    const skip = (options.page - 1) * options.limit;
    query.skip(skip).take(options.limit);

    // Get total count and data
    const [groups, total] = await query.getManyAndCount();

    return {
      data: groups.map(group => new ConsumerGroupResponseDto(group)),
      meta: {
        total,
        page: options.page,
        limit: options.limit,
        totalPages: Math.ceil(total / options.limit),
      },
    };
  }

  async findByIdAdmin(id: string) {
    const group = await this.consumerGroupRepository.findOne({ 
      where: { id },
    });

    if (!group) {
      throw new NotFoundException(`Consumer group with ID ${id} not found`);
    }

    // Get members count
    const membersCount = await this.userConsumerGroupRepository.count({
      where: { consumerGroupId: id },
    });

    // Get managers count
    const managersCount = await this.userConsumerGroupRepository.count({
      where: { consumerGroupId: id, isManager: true },
    });

    return {
      ...new ConsumerGroupResponseDto(group),
      stats: {
        totalMembers: membersCount,
        totalManagers: managersCount,
      },
    };
  }

  async updateStatus(id: string, isActive: boolean): Promise<void> {
    const group = await this.consumerGroupRepository.findOne({ where: { id } });

    if (!group) {
      throw new NotFoundException(`Consumer group with ID ${id} not found`);
    }

    group.isActive = isActive;
    await this.consumerGroupRepository.save(group);
  }

  async getGroupStatistics(id: string) {
    const group = await this.consumerGroupRepository.findOne({ where: { id } });

    if (!group) {
      throw new NotFoundException(`Consumer group with ID ${id} not found`);
    }

    // Get total members
    const totalMembers = await this.userConsumerGroupRepository.count({
      where: { consumerGroupId: id },
    });

    // Get active members (members who have made purchases in last 30 days)
    // TODO: Calculate from sales when sales module is complete

    // Get total articles
    // TODO: Get from articles module

    // Get total sales
    // TODO: Get from sales module

    return {
      groupId: id,
      groupName: group.name,
      totalMembers,
      activeMembers: 0, // TODO
      totalArticles: 0, // TODO
      totalSales: 0, // TODO
      salesThisMonth: 0, // TODO
      pendingPayments: 0, // TODO
    };
  }

  // ===== INVITATIONS =====

  async createInvitation(dto: CreateInvitationDto, invitedBy: string): Promise<GroupInvitation> {
    // Validar que consumerGroupId existeix
    if (!dto.consumerGroupId) {
      throw new BadRequestException('consumerGroupId is required');
    }

    // Verify group exists
    const group = await this.consumerGroupRepository.findOne({ where: { id: dto.consumerGroupId } });
    if (!group) {
      throw new NotFoundException(`Group with ID ${dto.consumerGroupId} not found`);
    }

    // Generate unique token
    const token = crypto.randomBytes(32).toString('hex');

    // Calculate expiration date (0 or undefined = never expires)
    const expirationDays = dto.expirationDays ?? 0;
    let expiresAt: Date | null = null;

    if (expirationDays > 0) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expirationDays);
    }

    const invitation = this.invitationRepository.create({
      token,
      consumerGroupId: dto.consumerGroupId,
      invitedBy,
      invitedEmail: dto.invitedEmail,
      isManager: dto.isManager ?? false,
      isClient: dto.isClient ?? true,
      expiresAt,
    });

    return this.invitationRepository.save(invitation);
  }

  async validateInvitation(token: string): Promise<GroupInvitation> {
    const invitation = await this.invitationRepository.findOne({
      where: { token },
    });

    if (!invitation) {
      throw new NotFoundException('Invitació no trobada');
    }

    if (invitation.isUsed) {
      throw new BadRequestException('Aquesta invitació ja ha estat utilitzada');
    }

    if (invitation.expiresAt && new Date() > invitation.expiresAt) {
      throw new BadRequestException('Aquesta invitació ha caducat');
    }

    return invitation;
  }

  async useInvitation(token: string, userEmail: string): Promise<void> {
    const invitation = await this.validateInvitation(token);

    // If invitation was for specific email, validate it
    if (invitation.invitedEmail && invitation.invitedEmail !== userEmail) {
      throw new BadRequestException('Aquesta invitació és per a un altre usuari');
    }

    // Add user to group
    await this.addMember(
      invitation.consumerGroupId,
      userEmail,
      invitation.isClient,
      invitation.isManager
    );

    // Mark invitation as used
    invitation.isUsed = true;
    invitation.usedBy = userEmail;
    invitation.usedAt = new Date();
    await this.invitationRepository.save(invitation);
  }

  async cleanupExpiredInvitations(): Promise<number> {
    const result = await this.invitationRepository.delete({
      expiresAt: LessThan(new Date()),
      isUsed: false,
    });

    return result.affected || 0;
  }
}

