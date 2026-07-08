import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CommentGateway } from './comment.gateway';
import { NotificationService } from '../notification/notification.service';
import { CreateCommentDto } from './dto/create-comment.dto';

@Injectable()
export class CommentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly commentGateway: CommentGateway,
    private readonly notificationService: NotificationService,
  ) {}

  async findAll(reviewId: string, userId: string) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
      select: { authorId: true },
    });

    if (!review) throw new NotFoundException('Review not found');
    if (review.authorId !== userId) throw new ForbiddenException('Access denied');

    return this.prisma.comment.findMany({
      where: { reviewId, parentId: null },
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
    });
  }

  async create(reviewId: string, userId: string, dto: CreateCommentDto) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
      select: { authorId: true },
    });

    if (!review) throw new NotFoundException('Review not found');
    if (review.authorId !== userId) throw new ForbiddenException('Access denied');

    const comment = await this.prisma.comment.create({
      data: {
        content: dto.content,
        lineRef: dto.lineRef,
        reviewId,
        authorId: userId,
        parentId: dto.parentId,
        issueId: dto.issueId,
      },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    this.commentGateway.broadcastComment(reviewId, comment);

    // Send notification to review author
    if (review.authorId !== userId) {
      await this.notificationService.create({
        type: 'review_comment',
        title: 'Bình luận mới',
        message: 'đã bình luận về review code của bạn',
        link: `/review/${reviewId}`,
        actorId: userId,
        targetId: reviewId,
        targetType: 'review',
        recipientId: review.authorId,
      });
    }

    // If replying to a comment, notify the parent comment author
    if (dto.parentId) {
      const parentComment = await this.prisma.comment.findUnique({
        where: { id: dto.parentId },
        select: { authorId: true },
      });

      if (parentComment && parentComment.authorId !== userId) {
        await this.notificationService.create({
          type: 'comment_reply',
          title: 'Trả lời bình luận',
          message: 'đã trả lời bình luận của bạn',
          link: `/review/${reviewId}`,
          actorId: userId,
          targetId: reviewId,
          targetType: 'comment',
          recipientId: parentComment.authorId,
        });
      }
    }

    return comment;
  }

  async remove(reviewId: string, commentId: string, userId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      select: { authorId: true, reviewId: true },
    });

    if (!comment) throw new NotFoundException('Comment not found');
    if (comment.reviewId !== reviewId) throw new NotFoundException('Comment not found');
    if (comment.authorId !== userId) throw new ForbiddenException('Only owner can delete');

    await this.prisma.comment.delete({ where: { id: commentId } });

    return { message: 'Comment deleted' };
  }
}
