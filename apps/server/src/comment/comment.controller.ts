import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

import { CommentService } from './comment.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUserId } from '../common/decorators/current-user.decorator';

@ApiTags('comments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reviews/:reviewId/comments')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Get()
  @ApiOperation({ summary: 'List comments for a review' })
  async findAll(
    @Param('reviewId') reviewId: string,
    @CurrentUserId() userId: string,
  ) {
    return this.commentService.findAll(reviewId, userId);
  }

  @Post()
  @ApiOperation({ summary: 'Add comment' })
  async create(
    @Param('reviewId') reviewId: string,
    @Body() dto: CreateCommentDto,
    @CurrentUserId() userId: string,
  ) {
    return this.commentService.create(reviewId, userId, dto);
  }

  @Delete(':commentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete comment' })
  async remove(
    @Param('reviewId') reviewId: string,
    @Param('commentId') commentId: string,
    @CurrentUserId() userId: string,
  ) {
    return this.commentService.remove(reviewId, commentId, userId);
  }
}
