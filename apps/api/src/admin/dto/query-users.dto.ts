import { IsIn, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class QueryUsersDto extends PaginationDto {
  @ApiPropertyOptional({ enum: ['user', 'admin'] })
  @IsOptional()
  @IsIn(['user', 'admin'])
  role?: 'user' | 'admin';

  @ApiPropertyOptional({ description: 'Search by name or email' })
  @IsOptional()
  @IsString()
  search?: string;
}
