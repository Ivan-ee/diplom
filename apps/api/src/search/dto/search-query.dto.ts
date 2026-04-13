import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsString, IsOptional, Max, Min, MinLength } from 'class-validator';

export class SearchQueryDto {
  @ApiProperty({ description: 'Search query string', example: 'шоколадный торт' })
  @IsString()
  @MinLength(1)
  q!: string;

  @ApiPropertyOptional({ description: 'Max number of results (1–20)', default: 6, minimum: 1, maximum: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(20)
  limit?: number = 6;
}
