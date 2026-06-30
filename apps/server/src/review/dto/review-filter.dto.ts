import { IsOptional, IsString, IsEnum, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ReviewFilterDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({ enum: ['PENDING', 'REVIEWING', 'COMPLETED', 'FAILED'] })
  @IsOptional()
  @IsEnum(['PENDING', 'REVIEWING', 'COMPLETED', 'FAILED'])
  status?: string;

  @ApiPropertyOptional({ example: 'typescript' })
  @IsOptional()
  @IsString()
  language?: string;
}
