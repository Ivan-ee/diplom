import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';

export class AddOrderItemDto {
  @ApiProperty({ description: 'Product UUID' })
  @IsUUID()
  productId!: string;

  @ApiProperty({ description: 'Weight in tenths of kg (e.g. 15 = 1.5 kg)', example: 15 })
  @IsInt()
  @Min(1)
  weight!: number;

  @ApiPropertyOptional({ description: 'Quantity', example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;

  @ApiPropertyOptional({ description: 'Inscription on cake', example: 'С днём рождения!' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  inscription?: string;
}
