import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AskQuestionDto {
  @ApiProperty({ example: 'Why is this SQL injection a problem?' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  question: string;
}
