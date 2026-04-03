import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'Анна Иванова' })
  @IsString()
  @MinLength(2, { message: 'Name must be at least 2 characters' })
  name!: string;

  @ApiProperty({ example: 'anna@example.com' })
  @IsEmail({}, { message: 'Invalid email address' })
  email!: string;

  @ApiPropertyOptional({ example: '+79991234567' })
  @IsOptional()
  @Matches(/^\+7\d{10}$/, {
    message: 'Phone must match +7XXXXXXXXXX format',
  })
  phone?: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @Matches(/(?=.*[a-zA-Z])(?=.*\d)/, { message: 'Пароль должен содержать хотя бы одну букву и одну цифру' })
  password!: string;
}
