import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class BasketScheduleConfigDto {
  @ApiPropertyOptional({ description: 'Preferred weekday (0=Sunday .. 6=Saturday)', minimum: 0, maximum: 6 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(6)
  preferredWeekday?: number | null;

  @ApiPropertyOptional({ description: 'Preferred time to meet (e.g. 10:00)' })
  @IsOptional()
  @IsString()
  preferredTime?: string | null;
}

export class BasketScheduleConfigResponseDto {
  preferredWeekday: number | null;
  preferredTime: string | null;
}
