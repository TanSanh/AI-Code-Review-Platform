import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async getPublicProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        bio: true,
        avatarUrl: true,
        createdAt: true,
        _count: {
          select: {
            reviews: true,
            comments: true,
            communityPosts: true,
            communityComments: true,
          },
        },
      },
    });

    if (!user) throw new NotFoundException('User not found');

    // Calculate total likes received on user's posts
    const likesResult = await this.prisma.communityLike.aggregate({
      where: {
        post: { authorId: userId },
      },
      _count: true,
    });

    return {
      ...user,
      totalLikes: likesResult._count,
    };
  }

  async getUserPosts(userId: string, page = 1, limit = 10) {
    // Verify user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) throw new NotFoundException('User not found');

    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      this.prisma.communityPost.findMany({
        where: { authorId: userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          author: { select: { id: true, name: true, avatarUrl: true } },
          review: {
            select: { id: true, title: true, language: true, score: true },
          },
          _count: { select: { likes: true, comments: true } },
        },
      }),
      this.prisma.communityPost.count({ where: { authorId: userId } }),
    ]);

    return {
      data: posts.map((post) => ({
        ...post,
        likeCount: post._count.likes,
        commentCount: post._count.comments,
        _count: undefined,
      })),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }
}
