import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { CalculatePriceDto } from '../../constructor/dto/calculate.dto';

export enum PickupTimeSlot {
  MORNING = 'morning',
  DAY = 'day',
  EVENING = 'evening',
}

export enum OrderItemType {
  PRODUCT = 'product',
  CONSTRUCTOR = 'constructor',
}

export class CreateOrderItemDto {
  @ApiProperty({ enum: OrderItemType })
  @IsEnum(OrderItemType)
  type!: OrderItemType;

  @ApiPropertyOptional({ description: 'Required when type is "product"' })
  @ValidateIf((o: CreateOrderItemDto) => o.type === OrderItemType.PRODUCT)
  @IsUUID()
  productId?: string;

  @ApiPropertyOptional({ description: 'Required when type is "constructor"' })
  @ValidateIf((o: CreateOrderItemDto) => o.type === OrderItemType.CONSTRUCTOR)
  @ValidateNested()
  @Type(() => CalculatePriceDto)
  cakeConfig?: CalculatePriceDto;

  @ApiProperty({
    description: 'Weight in integer tenths of kg (e.g. 20 = 2.0 kg)',
    example: 20,
  })
  @IsInt()
  @Min(5)
  weight!: number;

  @ApiProperty({ description: 'Number of items', default: 1 })
  @IsInt()
  @Min(1)
  quantity!: number;

  @ApiPropertyOptional({ maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  inscription?: string;

  @ApiPropertyOptional({ description: 'MinIO screenshot URL for constructor cakes' })
  @IsOptional()
  @IsString()
  screenshotUrl?: string;
}

export class CreateOrderDto {
  @ApiProperty({ example: '2026-04-20', description: 'Pickup date ISO string' })
  @IsDateString()
  pickupDate!: string;

  @ApiProperty({ enum: PickupTimeSlot })
  @IsEnum(PickupTimeSlot)
  pickupTimeSlot!: PickupTimeSlot;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  comment?: string;

  @ApiProperty({ type: [CreateOrderItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];
}
