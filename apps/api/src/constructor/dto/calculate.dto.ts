import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class TierConfigDto {
  @ApiProperty({ description: 'Constructor base (sponge) id' })
  @IsUUID()
  baseId!: string;

  @ApiProperty({ description: 'Constructor filling id' })
  @IsUUID()
  fillingId!: string;

  @ApiProperty({
    description: 'Tier weight in integer tenths of kg (e.g. 15 = 1.5 kg)',
    example: 15,
  })
  @IsInt()
  @Min(5)
  weight!: number;
}

export class DecorationItemDto {
  @ApiProperty({ description: 'Constructor decoration id' })
  @IsUUID()
  decorationId!: string;

  @ApiProperty({ description: 'Quantity of this decoration', example: 3 })
  @IsInt()
  @Min(1)
  quantity!: number;
}

export class CalculatePriceDto {
  @ApiProperty({
    description: 'Cake shape',
    enum: ['circle', 'square', 'heart'],
  })
  @IsIn(['circle', 'square', 'heart'])
  shape!: string;

  @ApiProperty({
    description: 'Array of tier configurations (1–3 tiers)',
    type: [TierConfigDto],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(3)
  @ValidateNested({ each: true })
  @Type(() => TierConfigDto)
  tiers!: TierConfigDto[];

  @ApiProperty({ description: 'Constructor coating id' })
  @IsUUID()
  coatingId!: string;

  @ApiPropertyOptional({
    description: 'Selected decorations with quantities',
    type: [DecorationItemDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DecorationItemDto)
  decorations?: DecorationItemDto[];

  @ApiPropertyOptional({ description: 'Inscription text on the cake' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  inscription?: string;
}
