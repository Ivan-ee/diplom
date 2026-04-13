import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsString, Min, MinLength } from 'class-validator';

export class ValidatePromoCodeDto {
  @ApiProperty({ description: 'Promo code to validate', example: 'SPRING20' })
  @IsString()
  @MinLength(1)
  @Transform(({ value }: { value: unknown }) => typeof value === 'string' ? value.toUpperCase() : value)
  code!: string;

  @ApiProperty({ description: 'Current cart total in kopecks', example: 350000 })
  @IsInt()
  @Min(1)
  cartTotal!: number;
}
