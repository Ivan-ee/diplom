import { IsDateString, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateOrderDto {
  @ApiPropertyOptional({ description: 'Pickup date (ISO)' })
  @IsOptional()
  @IsDateString()
  pickupDate?: string;

  @ApiPropertyOptional({ enum: ['morning', 'day', 'evening'] })
  @IsOptional()
  @IsIn(['morning', 'day', 'evening'])
  pickupTimeSlot?: 'morning' | 'day' | 'evening';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  comment?: string;
}
