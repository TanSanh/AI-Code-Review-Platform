import {
  Controller, Get, Post, Put, Delete, Param, Body, Query,
  UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

import { CommunityService } from './community.service';
import { CreatePostDto } from './dto/create-post.dto';
import { CommunityFilterDto } from './dto/community-filter.dto';
import { CreateCommunityCommentDto } from './dto/create-community-comment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUserId } from '../common/decorators/current-user.decorator';

@ApiTags('community')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('community')
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  @Get()
  @ApiOperation({ summary: 'List community posts' })
  async findAll(
    @CurrentUserId() userId: string,
    @Query() filters: CommunityFilterDto,
  ) {
    return this.communityService.findAll(userId, filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get post detail with comments' })
  async findOne(
    @Param('id') id: string,
    @CurrentUserId() userId: string,
  ) {
    return this.communityService.findOne(id, userId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new community post' })
  async create(
    @Body() dto: CreatePostDto,
    @CurrentUserId() userId: string,
  ) {
    return this.communityService.create(userId, dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a post (owner only)' })
  async update(
    @Param('id') id: string,
    @Body() dto: CreatePostDto,
    @CurrentUserId() userId: string,
  ) {
    return this.communityService.update(id, userId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a post (owner only)' })
  async remove(
    @Param('id') id: string,
    @CurrentUserId() userId: string,
  ) {
    return this.communityService.remove(id, userId);
  }

  @Post(':id/like')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Toggle like on a post' })
  async toggleLike(
    @Param('id') id: string,
    @CurrentUserId() userId: string,
  ) {
    return this.communityService.toggleLike(id, userId);
  }

  @Get(':id/comments')
  @ApiOperation({ summary: 'List comments for a post' })
  async getComments(@Param('id') id: string) {
    return this.communityService.getComments(id);
  }

  @Post(':id/comments')
  @ApiOperation({ summary: 'Add a comment to a post' })
  async createComment(
    @Param('id') id: string,
    @Body() dto: CreateCommunityCommentDto,
    @CurrentUserId() userId: string,
  ) {
    return this.communityService.createComment(id, userId, dto);
  }

  @Delete(':postId/comments/:commentId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a comment (owner only)' })
  async removeComment(
    @Param('postId') postId: string,
    @Param('commentId') commentId: string,
    @CurrentUserId() userId: string,
  ) {
    return this.communityService.removeComment(postId, commentId, userId);
  }
}
