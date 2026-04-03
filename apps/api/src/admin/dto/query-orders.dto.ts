import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';

const VALID_STATUSES = [
  'created',
  'accepted',
  'preparing',
  'ready',
  'picked_up',
  'completed',
  'cancelled',
] as const;

export class QueryOrdersDto {
  @ApiPropertyOptional({
    description: 'Filter by order status',
    enum: VALID_STATUSES,
  })
  @IsOptional()
  @IsIn(VALID_STATUSES, { message: `status must be one of: ${VALID_STATUSES.join(', ')}` })
  status?: string;
}
