import {
  Controller,
  Get,
  Patch,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

import { IssueService } from './issue.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUserId } from '../common/decorators/current-user.decorator';

@ApiTags('issues')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reviews/:reviewId/issues')
export class IssueController {
  constructor(private readonly issueService: IssueService) {}

  @Get()
  @ApiOperation({ summary: 'List issues for a review' })
  async findAll(
    @Param('reviewId') reviewId: string,
    @CurrentUserId() userId: string,
  ) {
    return this.issueService.findAll(reviewId, userId);
  }

  @Patch(':issueId')
  @ApiOperation({ summary: 'Resolve or unresolve an issue' })
  async toggleResolve(
    @Param('reviewId') reviewId: string,
    @Param('issueId') issueId: string,
    @CurrentUserId() userId: string,
  ) {
    return this.issueService.toggleResolve(reviewId, issueId, userId);
  }
}
