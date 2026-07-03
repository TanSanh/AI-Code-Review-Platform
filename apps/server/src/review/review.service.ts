import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';

import { PrismaService } from '../common/prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReviewFilterDto } from './dto/review-filter.dto';
import { AiReviewService } from '../ai-review/ai-review.service';

@Injectable()
export class ReviewService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiReviewService: AiReviewService,
  ) {}

  async create(userId: string, dto: CreateReviewDto) {
    const review = await this.prisma.review.create({
      data: {
        title: dto.title,
        description: dto.description,
        language: dto.language,
        fileName: dto.fileName,
        originalCode: dto.code,
        authorId: userId,
        status: 'PENDING',
        isPublic: dto.isPublic ?? true,
      },
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    this.aiReviewService
      .analyzeReview(review.id, dto.code, dto.language)
      .catch((err) => console.error('AI Review failed:', err));

    return review;
  }

  async findAll(userId: string, filters: ReviewFilterDto) {
    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 20, 100);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { authorId: userId };

    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.language) {
      where.language = filters.language;
    }

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          author: { select: { id: true, name: true } },
          _count: { select: { issues: true, comments: true } },
        },
      }),
      this.prisma.review.count({ where }),
    ]);

    return {
      data: reviews,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, userId: string) {
    const review = await this.prisma.review.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, name: true, email: true, avatarUrl: true } },
        issues: { orderBy: [{ severity: 'asc' }, { line: 'asc' }] },
        comments: {
          where: { parentId: null },
          include: {
            author: { select: { id: true, name: true, avatarUrl: true } },
            replies: {
              include: {
                author: { select: { id: true, name: true, avatarUrl: true } },
              },
              orderBy: { createdAt: 'asc' },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!review) throw new NotFoundException('Review not found');

    // Allow access if: user is the author OR review is public
    if (review.authorId !== userId && !review.isPublic) {
      throw new ForbiddenException('Access denied');
    }

    return review;
  }

  async remove(id: string, userId: string) {
    const review = await this.prisma.review.findUnique({
      where: { id },
      select: { authorId: true },
    });

    if (!review) throw new NotFoundException('Review not found');
    if (review.authorId !== userId) throw new ForbiddenException('Only owner can delete');

    await this.prisma.comment.deleteMany({ where: { reviewId: id } });
    await this.prisma.issue.deleteMany({ where: { reviewId: id } });
    await this.prisma.review.delete({ where: { id } });

    return { message: 'Review deleted successfully' };
  }

  async reReview(id: string, userId: string) {
    const review = await this.prisma.review.findUnique({
      where: { id },
      select: { authorId: true, originalCode: true, language: true },
    });

    if (!review) throw new NotFoundException('Review not found');
    if (review.authorId !== userId) throw new ForbiddenException('Access denied');

    await this.prisma.issue.deleteMany({ where: { reviewId: id } });
    await this.prisma.review.update({
      where: { id },
      data: { status: 'PENDING', score: null, completedAt: null },
    });

    this.aiReviewService
      .analyzeReview(id, review.originalCode, review.language)
      .catch((err) => console.error('AI Re-review failed:', err));

    return { message: 'Re-review started' };
  }

  async updatePrivacy(id: string, userId: string, isPublic: boolean) {
    const review = await this.prisma.review.findUnique({
      where: { id },
      select: { authorId: true },
    });

    if (!review) throw new NotFoundException('Review not found');
    if (review.authorId !== userId) throw new ForbiddenException('Only owner can update');

    return this.prisma.review.update({
      where: { id },
      data: { isPublic },
      select: { id: true, isPublic: true },
    });
  }

  async getPublicReviewsByUser(userId: string) {
    return this.prisma.review.findMany({
      where: { authorId: userId, isPublic: true },
      select: {
        id: true,
        title: true,
        language: true,
        score: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
