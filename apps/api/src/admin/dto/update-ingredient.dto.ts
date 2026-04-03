import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsOptional, Min } from 'class-validator';

export enum IngredientType {
  BASE = 'base',
  FILLING = 'filling',
  COATING = 'coating',
  DECORATION = 'decoration',
}

/** Note: pricePerKg applies to bases/fillings/coatings; pricePerUnit applies to decorations only. */
export class UpdateIngredientDto {
  @ApiPropertyOptional({
    description: 'Price per kg in kopecks (for bases, fillings, coatings)',
    example: 50000,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  pricePerKg?: number;

  @ApiPropertyOptional({
    description: 'Price per unit in kopecks (for decorations)',
    example: 15000,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  pricePerUnit?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isAvailable?: boolean;

  @ApiProperty({ enum: IngredientType, description: 'Which ingredient table to update' })
  @IsEnum(IngredientType)
  type!: IngredientType;
}
