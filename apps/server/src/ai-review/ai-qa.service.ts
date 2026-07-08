import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/prisma/prisma.service';
import { CommentGateway } from '../comment/comment.gateway';

@Injectable()
export class AiQaService {
  private readonly logger = new Logger(AiQaService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly commentGateway: CommentGateway,
  ) {}

  async askQuestion(reviewId: string, userId: string, question: string) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        issues: {
          orderBy: [{ severity: 'asc' }, { line: 'asc' }],
          select: {
            severity: true,
            category: true,
            line: true,
            message: true,
            suggestion: true,
          },
        },
      },
    });

    if (!review) throw new NotFoundException('Review not found');
    if (review.authorId !== userId) throw new ForbiddenException('Access denied');

    // Fetch recent comments for conversational context
    const recentComments = await this.prisma.comment.findMany({
      where: { reviewId, parentId: null },
      include: {
        author: { select: { name: true } },
        replies: {
          include: { author: { select: { name: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const answer = await this.callClaude(
      this.buildQaPrompt(review.originalCode, review.language, review.issues, recentComments, question),
    );

    // Save as bot comment
    const comment = await this.prisma.comment.create({
      data: {
        content: answer,
        isBot: true,
        reviewId,
        authorId: userId,
      },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    this.commentGateway.broadcastComment(reviewId, comment);

    return comment;
  }

  async fixIssue(reviewId: string, issueId: string, userId: string) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
      select: {
        originalCode: true,
        language: true,
        authorId: true,
      },
    });

    if (!review) throw new NotFoundException('Review not found');
    if (review.authorId !== userId) throw new ForbiddenException('Access denied');

    const issue = await this.prisma.issue.findUnique({
      where: { id: issueId },
      select: {
        id: true,
        severity: true,
        category: true,
        line: true,
        message: true,
        suggestion: true,
        reviewId: true,
      },
    });

    if (!issue || issue.reviewId !== reviewId) {
      throw new NotFoundException('Issue not found');
    }

    const fixedCode = await this.callClaude(
      this.buildFixPrompt(review.originalCode, review.language, issue),
    );

    return { fixedCode };
  }

  private async callClaude(prompt: string): Promise<string> {
    const apiKey = this.configService.get<string>('ai.anthropic_api_key');
    const model = this.configService.get<string>('ai.model', 'claude-opus-4.8');
    const baseUrl = this.configService.get<string>('ai.base_url', 'https://api.nhà cung cấp dịch vụ AI.com');

    if (!apiKey || apiKey.startsWith('pmv_')) {
      return 'AI assistant requires a valid API key. Please configure ANTHROPIC_API_KEY with a standard key (sk-ant-...) in your .env file.';
    }

    try {
      const response = await fetch(`${baseUrl}/v1/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model,
          max_tokens: 4096,
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        this.logger.error(`Claude API error: ${error}`);
        return 'Sorry, I encountered an error while processing your request.';
      }

      const data = await response.json();
      return data.content?.[0]?.text || 'No response from AI.';
    } catch (error) {
      this.logger.error('Claude API call failed', error);
      return 'Sorry, I encountered an error while processing your request.';
    }
  }

  private buildQaPrompt(
    code: string,
    language: string,
    issues: Array<{ severity: string; category: string; line: number; message: string; suggestion: string | null }>,
    comments: Array<{
      content: string;
      author: { name: string };
      replies?: Array<{ content: string; author: { name: string } }>;
    }>,
    question: string,
  ): string {
    const issueList = issues
      .map((i) => `  - [${i.severity}] Line ${i.line}: ${i.message}${i.suggestion ? ` (Fix: ${i.suggestion})` : ''}`)
      .join('\n');

    const commentContext = comments
      .map((c) => {
        const replies = c.replies?.map((r) => `    ${r.author.name}: ${r.content}`).join('\n') || '';
        return `  ${c.author.name}: ${c.content}${replies ? '\n' + replies : ''}`;
      })
      .join('\n');

    return `You are an expert code reviewer AI assistant. Answer the user's question about their ${language} code review.

## Code under review:
\`\`\`${language}
${code}
\`\`\`

## Issues found:
${issueList || '  No issues found.'}

## Recent discussion:
${commentContext || '  No previous discussion.'}

## User's question:
${question}

Provide a clear, helpful answer. If relevant, reference specific line numbers or issues. Be concise but thorough.`;
  }

  private buildFixPrompt(
    code: string,
    language: string,
    issue: { severity: string; category: string; line: number; message: string; suggestion: string | null },
  ): string {
    return `You are an expert ${language} developer. Fix the following issue in the code.

## Issue:
- Severity: ${issue.severity}
- Category: ${issue.category}
- Line: ${issue.line}
- Problem: ${issue.message}
${issue.suggestion ? `- Suggestion: ${issue.suggestion}` : ''}

## Original code:
\`\`\`${language}
${code}
\`\`\`

## Instructions:
- Return ONLY the fixed code, no explanation
- Keep all existing functionality intact
- Only fix the specific issue described
- Return the complete file content, not just the changed lines
- Do NOT wrap in markdown code blocks`;
  }
}
