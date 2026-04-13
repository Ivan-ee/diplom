import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { DiscountType } from './create-promo-code.dto';

export class UpdatePromoCodeDto {
  @ApiPropertyOptional({ description: 'Unique promo code (uppercase alphanumeric)', example: 'SPRING20' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  @Matches(/^[A-Z0-9_-]+$/, { message: 'Code must contain only uppercase letters, digits, hyphens, and underscores' })
  @Transform(({ value }: { value: unknown }) => typeof value === 'string' ? value.toUpperCase() : value)
  code?: string;

  @ApiPropertyOptional({ enum: DiscountType, description: 'Type of discount' })
  @IsOptional()
  @IsEnum(DiscountType)
  discountType?: DiscountType;

  @ApiPropertyOptional({ description: 'Discount value: percentage (1-100) or fixed amount in kopecks', example: 15 })
  @IsOptional()
  @IsInt()
  @Min(1)
  discountValue?: number;

  @ApiPropertyOptional({ description: 'Minimum order amount in kopecks to apply the code' })
  @IsOptional()
  @IsInt()
  @Min(0)
  minOrderAmount?: number;

  @ApiPropertyOptional({ description: 'Maximum discount cap in kopecks (for percentage type)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxDiscountAmount?: number;

  @ApiPropertyOptional({ description: 'Start date (ISO string)' })
  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @ApiPropertyOptional({ description: 'Expiration date (ISO string)' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiPropertyOptional({ description: 'Total usage limit' })
  @IsOptional()
  @IsInt()
  @Min(1)
  usageLimit?: number;

  @ApiPropertyOptional({ description: 'Per-user usage limit' })
  @IsOptional()
  @IsInt()
  @Min(1)
  usageLimitPerUser?: number;

  @ApiPropertyOptional({ description: 'Whether the code is active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Admin-facing description', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
