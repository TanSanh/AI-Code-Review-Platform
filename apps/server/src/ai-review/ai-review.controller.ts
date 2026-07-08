import {
  Controller,
  Post,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUserId } from '../common/decorators/current-user.decorator';
import { AiQaService } from './ai-qa.service';
import { AskQuestionDto } from './dto/ask-question.dto';

@ApiTags('ai-review')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reviews')
export class AiReviewController {
  constructor(private readonly aiQaService: AiQaService) {}

  @Post(':reviewId/ask')
  @ApiOperation({ summary: 'Ask AI a question about the review' })
  async askQuestion(
    @Param('reviewId') reviewId: string,
    @Body() dto: AskQuestionDto,
    @CurrentUserId() userId: string,
  ) {
    return this.aiQaService.askQuestion(reviewId, userId, dto.question);
  }

  @Post(':reviewId/ai/fix/:issueId')
  @ApiOperation({ summary: 'Get AI-generated fix for a specific issue' })
  async fixIssue(
    @Param('reviewId') reviewId: string,
    @Param('issueId') issueId: string,
    @CurrentUserId() userId: string,
  ) {
    return this.aiQaService.fixIssue(reviewId, issueId, userId);
  }
}
