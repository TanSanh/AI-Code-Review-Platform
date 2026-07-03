import { Module } from '@nestjs/common';
import { AiReviewService } from './ai-review.service';
import { StaticAnalyzerService } from './static-analyzer.service';
import { SecurityScannerService } from './security-scanner.service';
import { LlmAnalyzerService } from './llm-analyzer.service';
import { CommentModule } from '../comment/comment.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [CommentModule, NotificationModule],
  providers: [
    AiReviewService,
    StaticAnalyzerService,
    SecurityScannerService,
    LlmAnalyzerService,
  ],
  exports: [AiReviewService],
})
export class AiReviewModule {}
