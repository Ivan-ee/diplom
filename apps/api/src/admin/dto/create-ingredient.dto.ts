import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
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

  @ApiPropertyOptional({ description: 'Sort order' })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({ description: 'Is available' })
  @IsOptional()
  isAvailable?: boolean;
}
