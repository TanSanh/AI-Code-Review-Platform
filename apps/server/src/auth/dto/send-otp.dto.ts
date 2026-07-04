import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendOtpDto {
  @ApiProperty({ example: 'name@gmail.com' })
  @IsEmail({}, { message: 'Invalid email format' })
  email: string;
}
