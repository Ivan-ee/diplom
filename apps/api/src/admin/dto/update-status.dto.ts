import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export enum OrderStatus {
  CREATED = 'created',
  ACCEPTED = 'accepted',
  PREPARING = 'preparing',
  READY = 'ready',
  PICKED_UP = 'picked_up',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export class UpdateOrderStatusDto {
  @ApiProperty({ enum: OrderStatus })
  @IsEnum(OrderStatus)
  status!: OrderStatus;
}
