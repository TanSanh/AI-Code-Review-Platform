import { IsString, IsNotEmpty, IsOptional, MaxLength, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePostDto {
  @ApiProperty({ example: 'Review bug authentication trong NestJS' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiProperty({ example: 'Mình vừa review code auth và phát hiện...' })
  @IsString()
  @IsNotEmpty()
  @MinLength(10, { message: 'Content must be at least 10 characters' })
  @MaxLength(10000, { message: 'Content must be at most 10000 characters' })
  content: string;

  @ApiPropertyOptional({ example: 'typescript' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  language?: string;

  @ApiPropertyOptional({ example: 'react, auth, security' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  tags?: string;

  @ApiPropertyOptional({ description: 'Link to an existing review' })
  @IsOptional()
  @IsString()
  reviewId?: string;

  @ApiPropertyOptional({ description: 'Base64 image data for the post' })
  @IsOptional()
  @IsString()
  imageUrl?: string;
}
