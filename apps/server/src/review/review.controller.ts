import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { ReviewService } from './review.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReviewFilterDto } from './dto/review-filter.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUserId } from '../common/decorators/current-user.decorator';

@ApiTags('reviews')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reviews')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post()
  @ApiOperation({ summary: 'Submit code for AI review' })
  async create(
    @Body() createReviewDto: CreateReviewDto,
    @CurrentUserId() userId: string,
  ) {
    return this.reviewService.create(userId, createReviewDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all reviews' })
  async findAll(
    @CurrentUserId() userId: string,
    @Query() filters: ReviewFilterDto,
  ) {
    return this.reviewService.findAll(userId, filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get review detail with issues' })
  async findOne(
    @Param('id') id: string,
    @CurrentUserId() userId: string,
  ) {
    return this.reviewService.findOne(id, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a review' })
  async remove(
    @Param('id') id: string,
    @CurrentUserId() userId: string,
  ) {
    return this.reviewService.remove(id, userId);
  }

  @Post(':id/review')
  @ApiOperation({ summary: 'Trigger AI re-review' })
  async reReview(
    @Param('id') id: string,
    @CurrentUserId() userId: string,
  ) {
    return this.reviewService.reReview(id, userId);
  }
}
