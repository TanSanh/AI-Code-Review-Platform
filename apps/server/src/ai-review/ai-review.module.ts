import { Module } from '@nestjs/common';
import { AiReviewService } from './ai-review.service';
import { AiQaService } from './ai-qa.service';
import { AiReviewController } from './ai-review.controller';
import { StaticAnalyzerService } from './static-analyzer.service';
import { SecurityScannerService } from './security-scanner.service';
import { LlmAnalyzerService } from './llm-analyzer.service';
import { CommentModule } from '../comment/comment.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [CommentModule, NotificationModule],
  controllers: [AiReviewController],
  providers: [
    AiReviewService,
    AiQaService,
    StaticAnalyzerService,
    SecurityScannerService,
    LlmAnalyzerService,
  ],
  exports: [AiReviewService, AiQaService],
})
export class AiReviewModule {}
