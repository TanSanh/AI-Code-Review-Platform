import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { StaticAnalyzerService } from './static-analyzer.service';
import { SecurityScannerService } from './security-scanner.service';
import { LlmAnalyzerService } from './llm-analyzer.service';
import { CommentGateway } from '../comment/comment.gateway';
import { NotificationService } from '../notification/notification.service';

export interface ReviewIssue {
  severity: 'ERROR' | 'WARNING' | 'INFO' | 'SUGGESTION';
  category: 'BUG' | 'SECURITY' | 'PERFORMANCE' | 'MAINTAINABILITY' | 'STYLE';
  line: number;
  column?: number;
  endLine?: number;
  message: string;
  suggestion?: string;
  confidence: number;
  aiModel: 'static' | 'security' | 'llm';
}

@Injectable()
export class AiReviewService {
  private readonly logger = new Logger(AiReviewService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly staticAnalyzer: StaticAnalyzerService,
    private readonly securityScanner: SecurityScannerService,
    private readonly llmAnalyzer: LlmAnalyzerService,
    private readonly commentGateway: CommentGateway,
    private readonly notificationService: NotificationService,
  ) {}

  async analyzeReview(reviewId: string, code: string, language: string) {
    this.logger.log(`Starting AI review for review ${reviewId}`);

    await this.prisma.review.update({
      where: { id: reviewId },
      data: { status: 'REVIEWING' },
    });

    try {
      const staticIssues = await this.staticAnalyzer.analyze(code, language);
      const securityIssues = await this.securityScanner.scan(code, language);
      const llmResult = await this.llmAnalyzer.analyze(code, language);

      const allIssues: ReviewIssue[] = staticIssues.concat(securityIssues).concat(llmResult.issues);

      const deduplicated = this.deduplicateIssues(allIssues);
      const score = this.calculateScore(deduplicated);

      await this.prisma.issue.createMany({
        data: deduplicated.map((issue) => ({
          reviewId,
          severity: issue.severity,
          category: issue.category,
          line: issue.line,
          column: issue.column,
          endLine: issue.endLine,
          message: issue.message,
          suggestion: issue.suggestion,
          confidence: issue.confidence,
          aiModel: issue.aiModel,
        })),
      });

      const updatedReview = await this.prisma.review.update({
        where: { id: reviewId },
        data: {
          status: 'COMPLETED',
          score,
          completedAt: new Date(),
        },
        include: { issues: true },
      });

      this.commentGateway.broadcastReviewCompleted(reviewId, updatedReview);

      // Send notification to review author
      const review = await this.prisma.review.findUnique({
        where: { id: reviewId },
        select: { authorId: true, title: true },
      });

      if (review) {
        await this.notificationService.create({
          type: 'review_completed',
          title: 'Review hoàn thành',
          message: `Review "${review.title}" đã hoàn thành với điểm ${score}/100`,
          link: `/review/${reviewId}`,
          targetId: reviewId,
          targetType: 'review',
          recipientId: review.authorId,
        });
      }

      this.logger.log(
        `AI review completed for ${reviewId}: ${deduplicated.length} issues, score: ${score}`,
      );

      return updatedReview;
    } catch (error) {
      this.logger.error(`AI review failed for ${reviewId}`, error);
      await this.prisma.review.update({
        where: { id: reviewId },
        data: { status: 'FAILED' },
      });
      throw error;
    }
  }

  private deduplicateIssues(issues: ReviewIssue[]): ReviewIssue[] {
    const seen = new Map<string, ReviewIssue>();

    for (const issue of issues) {
      const key = `${issue.line}-${issue.category}-${issue.message.slice(0, 50)}`;

      if (!seen.has(key)) {
        seen.set(key, issue);
      } else {
        const existing = seen.get(key)!;
        if (issue.confidence > existing.confidence) {
          seen.set(key, issue);
        }
      }
    }

    return Array.from(seen.values()).sort((a, b) => {
      const severityOrder = { ERROR: 0, WARNING: 1, INFO: 2, SUGGESTION: 3 };
      return severityOrder[a.severity] - severityOrder[b.severity] || a.line - b.line;
    });
  }

  private calculateScore(issues: ReviewIssue[]): number {
    let score = 100;

    for (const issue of issues) {
      switch (issue.severity) {
        case 'ERROR': score -= 15; break;
        case 'WARNING': score -= 8; break;
        case 'INFO': score -= 3; break;
        case 'SUGGESTION': score -= 1; break;
      }
    }

    return Math.max(0, Math.min(100, score));
  }
}
