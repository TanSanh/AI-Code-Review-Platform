import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CommunityGateway } from './community.gateway';
import { NotificationService } from '../notification/notification.service';
import { CreatePostDto } from './dto/create-post.dto';
import { CommunityFilterDto } from './dto/community-filter.dto';
import { CreateCommunityCommentDto } from './dto/create-community-comment.dto';

@Injectable()
export class CommunityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: CommunityGateway,
    private readonly notificationService: NotificationService,
  ) {}

  async findAll(userId: string, filters: CommunityFilterDto) {
    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 20, 50);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (filters.language) {
      where.language = filters.language;
    }

    if (filters.authorId) {
      where.authorId = filters.authorId;
    }

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { content: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const orderBy =
      filters.sort === 'popular'
        ? { likeCount: 'desc' as const }
        : { createdAt: 'desc' as const };

    const [posts, total] = await Promise.all([
      this.prisma.communityPost.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          author: { select: { id: true, name: true, avatarUrl: true } },
          review: {
            select: { id: true, title: true, language: true, score: true },
          },
          _count: { select: { likes: true, comments: true } },
        },
      }),
      this.prisma.communityPost.count({ where }),
    ]);

    // Check which posts the current user has liked
    const userLikes = await this.prisma.communityLike.findMany({
      where: { userId, postId: { in: posts.map((p) => p.id) } },
      select: { postId: true },
    });
    const likedPostIds = new Set(userLikes.map((l) => l.postId));

    const postsWithLikeStatus = posts.map((post) => ({
      ...post,
      isLiked: likedPostIds.has(post.id),
      likeCount: post._count.likes,
      commentCount: post._count.comments,
      _count: undefined,
    }));

    return {
      data: postsWithLikeStatus,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string, userId: string) {
    const post = await this.prisma.communityPost.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true, bio: true } },
        review: {
          select: { id: true, title: true, language: true, score: true },
        },
        _count: { select: { likes: true, comments: true } },
      },
    });

    if (!post) throw new NotFoundException('Post not found');

    const [userLike, comments] = await Promise.all([
      this.prisma.communityLike.findUnique({
        where: { userId_postId: { userId, postId: id } },
      }),
      this.getComments(id),
    ]);

    return {
      ...post,
      comments,
      isLiked: !!userLike,
      likeCount: post._count.likes,
      commentCount: post._count.comments,
      _count: undefined,
    };
  }

  async create(userId: string, dto: CreatePostDto) {
    // If reviewId provided, verify it belongs to the user and is public
    if (dto.reviewId) {
      const review = await this.prisma.review.findUnique({
        where: { id: dto.reviewId },
        select: { authorId: true, isPublic: true },
      });
      if (!review || review.authorId !== userId) {
        throw new NotFoundException('Review not found');
      }
      if (!review.isPublic) {
        throw new ForbiddenException('Cannot attach private review to post');
      }
    }

    const post = await this.prisma.communityPost.create({
      data: {
        title: dto.title,
        content: dto.content,
        language: dto.language,
        tags: dto.tags,
        imageUrl: dto.imageUrl || null,
        authorId: userId,
        reviewId: dto.reviewId || null,
      },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } },
        _count: { select: { likes: true, comments: true } },
      },
    });

    return {
      ...post,
      isLiked: false,
      likeCount: post._count.likes,
      commentCount: post._count.comments,
      _count: undefined,
    };
  }

  async update(id: string, userId: string, dto: CreatePostDto) {
    const post = await this.prisma.communityPost.findUnique({
      where: { id },
      select: { authorId: true },
    });
    if (!post) throw new NotFoundException('Post not found');
    if (post.authorId !== userId) throw new ForbiddenException('Only owner can edit');

    // If reviewId provided, verify it is public
    if (dto.reviewId) {
      const review = await this.prisma.review.findUnique({
        where: { id: dto.reviewId },
        select: { authorId: true, isPublic: true },
      });
      if (!review || review.authorId !== userId) {
        throw new NotFoundException('Review not found');
      }
      if (!review.isPublic) {
        throw new ForbiddenException('Cannot attach private review to post');
      }
    }

    const updated = await this.prisma.communityPost.update({
      where: { id },
      data: {
        title: dto.title,
        content: dto.content,
        language: dto.language || null,
        tags: dto.tags || null,
        imageUrl: dto.imageUrl || null,
        reviewId: dto.reviewId || null,
      },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } },
        review: {
          select: { id: true, title: true, language: true, score: true },
        },
        _count: { select: { likes: true, comments: true } },
      },
    });

    const userLike = await this.prisma.communityLike.findUnique({
      where: { userId_postId: { userId, postId: id } },
    });

    return {
      ...updated,
      isLiked: !!userLike,
      likeCount: updated._count.likes,
      commentCount: updated._count.comments,
      _count: undefined,
    };
  }

  async remove(id: string, userId: string) {
    const post = await this.prisma.communityPost.findUnique({
      where: { id },
      select: { authorId: true },
    });
    if (!post) throw new NotFoundException('Post not found');
    if (post.authorId !== userId) throw new ForbiddenException('Only owner can delete');

    await this.prisma.communityComment.deleteMany({ where: { postId: id } });
    await this.prisma.communityLike.deleteMany({ where: { postId: id } });
    await this.prisma.communityPost.delete({ where: { id } });

    return { message: 'Post deleted successfully' };
  }

  async toggleLike(id: string, userId: string) {
    const post = await this.prisma.communityPost.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!post) throw new NotFoundException('Post not found');

    const existingLike = await this.prisma.communityLike.findUnique({
      where: { userId_postId: { userId, postId: id } },
    });

    if (existingLike) {
      // Unlike
      await this.prisma.$transaction([
        this.prisma.communityLike.delete({
          where: { id: existingLike.id },
        }),
        this.prisma.communityPost.update({
          where: { id },
          data: { likeCount: { decrement: 1 } },
        }),
      ]);
      return { isLiked: false };
    } else {
      // Like
      await this.prisma.$transaction([
        this.prisma.communityLike.create({
          data: { userId, postId: id },
        }),
        this.prisma.communityPost.update({
          where: { id },
          data: { likeCount: { increment: 1 } },
        }),
      ]);

      // Get post author for notification
      const post = await this.prisma.communityPost.findUnique({
        where: { id },
        select: { authorId: true, title: true },
      });

      // Send notification
      if (post) {
        await this.notificationService.create({
          type: 'post_like',
          title: 'Thích bài viết',
          message: 'đã thích bài viết của bạn',
          link: `/community/${id}`,
          actorId: userId,
          targetId: id,
          targetType: 'post',
          recipientId: post.authorId,
        });
      }

      return { isLiked: true };
    }
  }

  async getComments(postId: string) {
    const post = await this.prisma.communityPost.findUnique({
      where: { id: postId },
      select: { id: true },
    });
    if (!post) throw new NotFoundException('Post not found');

    const flat = await this.prisma.communityComment.findMany({
      where: { postId },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    return this.buildCommentTree(flat);
  }

  async createComment(postId: string, userId: string, dto: CreateCommunityCommentDto) {
    const post = await this.prisma.communityPost.findUnique({
      where: { id: postId },
      select: { id: true },
    });
    if (!post) throw new NotFoundException('Post not found');

    // If replying to a comment, verify parent exists
    if (dto.parentId) {
      const parentComment = await this.prisma.communityComment.findUnique({
        where: { id: dto.parentId },
        select: { id: true, postId: true },
      });
      if (!parentComment || parentComment.postId !== postId) {
        throw new NotFoundException('Parent comment not found');
      }
    }

    const [comment] = await this.prisma.$transaction([
      this.prisma.communityComment.create({
        data: {
          content: dto.content,
          postId,
          authorId: userId,
          parentId: dto.parentId || null,
        },
        include: {
          author: { select: { id: true, name: true, avatarUrl: true } },
        },
      }),
      this.prisma.communityPost.update({
        where: { id: postId },
        data: { commentCount: { increment: 1 } },
      }),
    ]);

    // Broadcast to other clients viewing this post
    this.gateway.broadcastComment(postId, {
      ...comment,
      postId,
    });

    // Send notifications
    const postWithAuthor = await this.prisma.communityPost.findUnique({
      where: { id: postId },
      select: { authorId: true, title: true },
    });

    if (dto.parentId) {
      // Reply to comment - notify parent comment author
      const parentComment = await this.prisma.communityComment.findUnique({
        where: { id: dto.parentId },
        select: { authorId: true },
      });

      if (parentComment) {
        await this.notificationService.create({
          type: 'comment_reply',
          title: 'Trả lời bình luận',
          message: 'đã trả lời bình luận của bạn',
          link: `/community/${postId}`,
          actorId: userId,
          targetId: postId,
          targetType: 'comment',
          recipientId: parentComment.authorId,
        });
      }
    } else if (postWithAuthor) {
      // New comment on post - notify post author
      await this.notificationService.create({
        type: 'post_comment',
        title: 'Bình luận mới',
        message: 'đã bình luận về bài viết của bạn',
        link: `/community/${postId}`,
        actorId: userId,
        targetId: postId,
        targetType: 'post',
        recipientId: postWithAuthor.authorId,
      });
    }

    return comment;
  }

  async removeComment(postId: string, commentId: string, userId: string) {
    const comment = await this.prisma.communityComment.findUnique({
      where: { id: commentId },
      select: { authorId: true, postId: true },
    });
    if (!comment) throw new NotFoundException('Comment not found');
    if (comment.postId !== postId) throw new NotFoundException('Comment not found');
    if (comment.authorId !== userId) throw new ForbiddenException('Only owner can delete');

    // Count comments being deleted (the comment + its replies)
    const repliesCount = await this.prisma.communityComment.count({
      where: { parentId: commentId },
    });

    await this.prisma.$transaction([
      this.prisma.communityComment.deleteMany({
        where: { OR: [{ id: commentId }, { parentId: commentId }] },
      }),
      this.prisma.communityPost.update({
        where: { id: postId },
        data: { commentCount: { decrement: repliesCount + 1 } },
      }),
    ]);

    // Broadcast deletion to other clients
    this.gateway.broadcastCommentDeleted(postId, commentId);

    return { message: 'Comment deleted' };
  }

  /**
   * Build a threaded comment tree from a flat list.
   * Supports unlimited nesting depth.
   */
  private buildCommentTree(flat: any[]) {
    const map = new Map<string, any>();
    const roots: any[] = [];
    for (const c of flat) {
      map.set(c.id, { ...c, replies: [] });
    }
    for (const c of flat) {
      const node = map.get(c.id)!;
      if (c.parentId && map.has(c.parentId)) {
        map.get(c.parentId)!.replies.push(node);
      } else {
        roots.push(node);
      }
    }
    // Return top-level comments in descending order (newest first)
    return roots.reverse();
  }
}
