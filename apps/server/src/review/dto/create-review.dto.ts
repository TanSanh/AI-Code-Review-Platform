import { IsString, IsNotEmpty, IsOptional, IsBoolean, MinLength, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateReviewDto {
  @ApiProperty({ example: 'Fix user authentication bug' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({ example: 'Review this login function for security issues' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiProperty({ example: 'typescript' })
  @IsString()
  @IsNotEmpty()
  language: string;

  @ApiProperty({ example: 'auth.controller.ts' })
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @ApiProperty({ example: 'export function login(email: string, password: string) { ... }' })
  @IsString()
  @IsNotEmpty()
  @MinLength(10, { message: 'Code must be at least 10 characters' })
  @MaxLength(50000, { message: 'Code must be at most 50000 characters' })
  code: string;

  @ApiPropertyOptional({ example: true, description: 'Whether this review is public' })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}
