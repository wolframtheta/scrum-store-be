import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { UserRole } from '../entities/user.entity';

@Exclude()
export class UserResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @Expose()
  id: string;

  @ApiProperty({ example: 'user@example.com' })
  @Expose()
  email: string;

  @ApiProperty({ example: 'Juan' })
  @Expose()
  name: string;

  @ApiProperty({ example: 'García' })
  @Expose()
  surname: string;

  @ApiProperty({ example: '+34612345678', required: false })
  @Expose()
  phone?: string;

  @ApiProperty({ example: 'https://s3.amazonaws.com/bucket/profile.jpg', required: false })
  @Expose()
  profileImage?: string;

  @ApiProperty({ enum: UserRole, example: [UserRole.CLIENT], isArray: true })
  @Expose()
  roles: UserRole[];

  @ApiProperty({ example: true })
  @Expose()
  isActive: boolean;

  @ApiProperty({ required: false })
  @Expose()
  lastLogin?: Date;

  @ApiProperty()
  @Expose()
  createdAt: Date;

  @ApiProperty()
  @Expose()
  updatedAt: Date;

  constructor(partial: Partial<UserResponseDto>) {
    Object.assign(this, partial);
  }
}

