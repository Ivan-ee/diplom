import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsIn,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IngredientType } from './update-ingredient.dto';

export class CreateIngredientDto {
  @ApiProperty({ enum: IngredientType })
  @IsEnum(IngredientType)
  type!: IngredientType;

  @ApiProperty()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ description: 'Price per kg in kopecks (for base/filling/coating)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  pricePerKg?: number;

  @ApiPropertyOptional({ description: 'Price per unit in kopecks (for decoration)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  pricePerUnit?: number;

  @ApiPropertyOptional({ description: 'Stable visual/model key used by the web 3D registry' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  visualKey?: string;

  @ApiPropertyOptional({
    description: 'Decoration category',
    enum: ['berries', 'chocolate', 'toppers', 'flowers', 'figures', 'candle'],
  })
  @IsOptional()
  @IsIn(['berries', 'chocolate', 'toppers', 'flowers', 'figures', 'candle'])
  category?: 'berries' | 'chocolate' | 'toppers' | 'flowers' | 'figures' | 'candle';

  @ApiPropertyOptional({ description: 'Sort order' })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({ description: 'Is available' })
  @IsOptional()
  isAvailable?: boolean;
}
