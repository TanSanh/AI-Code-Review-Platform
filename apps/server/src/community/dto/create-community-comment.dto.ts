import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCommunityCommentDto {
  @ApiProperty({ example: 'Bài viết rất hữu ích!' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  content: string;

  @ApiPropertyOptional({ description: 'Parent comment ID for threaded replies' })
  @IsOptional()
  @IsString()
  parentId?: string;
}
