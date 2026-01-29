import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { removeAccents } from '../common/utils/string.utils';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    // Normalize email for checking
    const normalizedEmail = createUserDto.email.toLowerCase().trim();
    
    // Check if user already exists (case-insensitive)
    const existingUser = await this.usersRepository
      .createQueryBuilder('user')
      .where('LOWER(user.email) = LOWER(:email)', { email: normalizedEmail })
      .getOne();

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const user = this.usersRepository.create(createUserDto);
    const savedUser = await this.usersRepository.save(user);

    return new UserResponseDto(savedUser);
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { id },
    });
  }

  async findByIdOrFail(id: string): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository
      .createQueryBuilder('user')
      .where('LOWER(user.email) = LOWER(:email)', { email })
      .addSelect('user.password')
      .getOne();
  }

  async findByEmailOrFail(email: string): Promise<User> {
    const user = await this.findByEmail(email);
    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }
    return user;
  }

  async findAll(): Promise<UserResponseDto[]> {
    const users = await this.usersRepository.find();
    return users.map(user => new UserResponseDto(user));
  }

  async update(email: string, updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    const user = await this.findByEmailOrFail(email);

    Object.assign(user, updateUserDto);
    const updatedUser = await this.usersRepository.save(user);

    return new UserResponseDto(updatedUser);
  }

  async updateProfileImage(email: string, imageUrl: string): Promise<UserResponseDto> {
    const user = await this.findByEmailOrFail(email);
    user.profileImage = imageUrl;
    const updatedUser = await this.usersRepository.save(user);

    return new UserResponseDto(updatedUser);
  }

  async remove(email: string): Promise<void> {
    const user = await this.findByEmailOrFail(email);
    await this.usersRepository.remove(user);
  }

  // ============ ADMIN METHODS ============

  async findAllAdmin(options: {
    page: number;
    limit: number;
    search?: string;
    role?: string;
    isActive?: boolean;
  }) {
    const query = this.usersRepository.createQueryBuilder('user');

    // Search by name or email (sense accents)
    if (options.search) {
      const normalizedSearch = removeAccents(options.search);
      query.where(
        `(LOWER(TRANSLATE(user.name, 'áàäâéèëêíìïîóòöôúùüûñçÁÀÄÂÉÈËÊÍÌÏÎÓÒÖÔÚÙÜÛÑÇ', 'aaaaeeeeiiiioooouuuuncAAAAEEEEIIIIOOOOUUUUNC')) LIKE LOWER(:search) OR
         LOWER(TRANSLATE(user.email, 'áàäâéèëêíìïîóòöôúùüûñçÁÀÄÂÉÈËÊÍÌÏÎÓÒÖÔÚÙÜÛÑÇ', 'aaaaeeeeiiiioooouuuuncAAAAEEEEIIIIOOOOUUUUNC')) LIKE LOWER(:search))`,
        { search: `%${normalizedSearch}%` }
      );
    }

    // Filter by role
    if (options.role) {
      query.andWhere(':role = ANY(user.roles)', { role: options.role });
    }

    // Filter by active status
    if (options.isActive !== undefined) {
      query.andWhere('user.isActive = :isActive', { isActive: options.isActive });
    }

    // Order by creation date
    query.orderBy('user.createdAt', 'DESC');

    // Pagination
    const skip = (options.page - 1) * options.limit;
    query.skip(skip).take(options.limit);

    // Get total count and data
    const [users, total] = await query.getManyAndCount();

    return {
      data: users.map(user => new UserResponseDto(user)),
      meta: {
        total,
        page: options.page,
        limit: options.limit,
        totalPages: Math.ceil(total / options.limit),
      },
    };
  }

  async findByEmailAdmin(email: string) {
    const user = await this.usersRepository.findOne({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }

    return new UserResponseDto(user);
  }

  async updateRoles(email: string, roles: string[]): Promise<void> {
    const user = await this.findByEmailOrFail(email);
    user.roles = roles as any;
    await this.usersRepository.save(user);
  }

  async updateStatus(email: string, isActive: boolean): Promise<void> {
    const user = await this.findByEmailOrFail(email);
    user.isActive = isActive;
    await this.usersRepository.save(user);
  }

  async delete(email: string): Promise<void> {
    const user = await this.findByEmailOrFail(email);
    await this.usersRepository.remove(user);
  }

  async getUserGroups(email: string) {
    // TODO: Implement with UserConsumerGroup repository
    const user = await this.findByEmailOrFail(email);
    return {
      userEmail: user.email,
      groups: [], // TODO: Query from UserConsumerGroup
    };
  }

  async getUserActivity(email: string) {
    const user = await this.findByEmailOrFail(email);
    
    return {
      userEmail: user.email,
      totalLogins: 0, // TODO: Implement login tracking
      lastActions: [], // TODO: Implement activity log
      stats: {
        totalPurchases: 0, // TODO: Query from sales
        totalSales: 0, // TODO: Query from sales if manager
      }
    };
  }

  async resetPassword(email: string): Promise<string> {
    const user = await this.findByEmailOrFail(email);
    
    // Generate temporary password (8 characters)
    const temporaryPassword = Math.random().toString(36).slice(-8);
    
    user.password = temporaryPassword; // Will be hashed by @BeforeUpdate hook
    await this.usersRepository.save(user);
    
    // TODO: Send email with temporary password
    
    return temporaryPassword;
  }

  async updatePassword(email: string, newPassword: string): Promise<void> {
    const user = await this.findByEmailOrFail(email);
    user.password = newPassword; // Will be hashed by @BeforeUpdate hook
    await this.usersRepository.save(user);
  }
}

