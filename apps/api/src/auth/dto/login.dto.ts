import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'anna@example.com' })
  @IsEmail({}, { message: 'Invalid email address' })
  email!: string;

  @ApiProperty()
  @IsString()
  password!: string;
}
