import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty } from 'class-validator';

export class UpdateMemberRoleDto {
  @ApiProperty({ example: true, description: 'Usuario es cliente' })
  @IsBoolean()
  @IsNotEmpty()
  isClient: boolean;

  @ApiProperty({ example: false, description: 'Usuario es gestor' })
  @IsBoolean()
  @IsNotEmpty()
  isManager: boolean;

  @ApiProperty({ example: false, description: 'Usuario es preparador' })
  @IsBoolean()
  @IsNotEmpty()
  isPreparer: boolean;
}

