import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IngredientType } from './update-ingredient.dto';

export class DeleteIngredientDto {
  @ApiProperty({ enum: IngredientType })
  @IsEnum(IngredientType)
  type!: IngredientType;
}
