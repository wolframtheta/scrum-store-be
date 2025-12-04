import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import { ConsumerGroupResponseDto } from './consumer-group-response.dto';

/**
 * Role information from user_consumer_group relationship
 */
export class UserGroupRole {
  @ApiProperty({ example: true, description: 'User can purchase from this group' })
  @Expose()
  isClient: boolean;

  @ApiProperty({ example: false, description: 'User can manage this group' })
  @Expose()
  isManager: boolean;

  @ApiProperty({ example: true, description: 'This is the user\'s default group' })
  @Expose()
  isDefault: boolean;
}

/**
 * Consumer Group with user role information
 */
@Exclude()
export class ConsumerGroupWithRoleResponseDto extends ConsumerGroupResponseDto {
  @ApiProperty({ 
    description: 'User role in this group',
    type: UserGroupRole
  })
  @Expose()
  @Type(() => UserGroupRole)
  role: UserGroupRole;

  constructor(partial: Partial<ConsumerGroupWithRoleResponseDto>) {
    super(partial);
    Object.assign(this, partial);
  }
}


