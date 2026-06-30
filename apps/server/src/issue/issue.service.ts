import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class IssueService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(reviewId: string, userId: string) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
      select: { authorId: true },
    });

    if (!review) throw new NotFoundException('Review not found');
    if (review.authorId !== userId) throw new ForbiddenException('Access denied');

    return this.prisma.issue.findMany({
      where: { reviewId },
      orderBy: [{ severity: 'asc' }, { line: 'asc' }],
    });
  }

  async toggleResolve(reviewId: string, issueId: string, userId: string) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
      select: { authorId: true },
    });

    if (!review) throw new NotFoundException('Review not found');
    if (review.authorId !== userId) throw new ForbiddenException('Access denied');

    const issue = await this.prisma.issue.findUnique({
      where: { id: issueId },
      select: { id: true, reviewId: true, isResolved: true },
    });

    if (!issue || issue.reviewId !== reviewId) {
      throw new NotFoundException('Issue not found');
    }

    return this.prisma.issue.update({
      where: { id: issueId },
      data: {
        isResolved: !issue.isResolved,
        resolvedBy: !issue.isResolved ? userId : null,
      },
    });
  }
}
