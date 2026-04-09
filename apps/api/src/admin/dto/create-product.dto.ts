import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  MinLength,
} from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ example: 'shokoladny-tort' })
  @IsString()
  @MinLength(2)
  slug!: string;

  @ApiProperty({ example: 'Шоколадный торт' })
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  composition?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiProperty({ description: 'Price per kg in kopecks', example: 80000 })
  @IsInt()
  @Min(0)
  pricePerKg!: number;

  @ApiPropertyOptional({ example: '1.0' })
  @IsOptional()
  @IsString()
  minWeight?: string;

  @ApiPropertyOptional({ example: '5.0' })
  @IsOptional()
  @IsString()
  maxWeight?: string;

  @ApiPropertyOptional({ example: '0.5' })
  @IsOptional()
  @IsString()
  weightStep?: string;

  @ApiPropertyOptional({ description: 'Category UUID' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }: { value: unknown }) => value === 'true' || value === true)
  isAvailable?: boolean;
}

export class UpdateProductDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  slug?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  composition?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  pricePerKg?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  minWeight?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  maxWeight?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  weightStep?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }: { value: unknown }) => value === 'true' || value === true)
  isAvailable?: boolean;
}
