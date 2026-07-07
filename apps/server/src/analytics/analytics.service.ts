import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview(userId: string) {
    const [
      totalReviews,
      completedReviews,
      totalIssues,
      resolvedIssues,
      avgScore,
      languageStats,
    ] = await Promise.all([
      this.prisma.review.count({ where: { authorId: userId } }),
      this.prisma.review.count({ where: { authorId: userId, status: 'COMPLETED' } }),
      this.prisma.issue.count({ where: { review: { authorId: userId } } }),
      this.prisma.issue.count({ where: { review: { authorId: userId }, isResolved: true } }),
      this.prisma.review.aggregate({ where: { authorId: userId, score: { not: null } }, _avg: { score: true } }),
      this.prisma.review.groupBy({ by: ['language'], where: { authorId: userId }, _count: true }),
    ]);

    return {
      totalReviews,
      completedReviews,
      pendingReviews: totalReviews - completedReviews,
      totalIssues,
      resolvedIssues,
      unresolvedIssues: totalIssues - resolvedIssues,
      averageScore: Math.round(avgScore._avg.score || 0),
      languageDistribution: languageStats.map((stat: any) => ({
        language: stat.language,
        count: stat._count,
      })),
    };
  }

  async getTrends(userId: string) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const reviews = await this.prisma.review.findMany({
      where: { authorId: userId, createdAt: { gte: thirtyDaysAgo }, score: { not: null } },
      select: { createdAt: true, score: true },
      orderBy: { createdAt: 'asc' },
    });

    const grouped: Record<string, number[]> = {};
    for (const review of reviews) {
      const date = review.createdAt.toISOString().split('T')[0];
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(review.score!);
    }

    return Object.entries(grouped).map(([date, scores]) => ({
      date,
      avgScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
      reviewCount: scores.length,
    }));
  }

  async getLanguages(userId: string) {
    const stats = await this.prisma.review.groupBy({
      by: ['language'],
      where: { authorId: userId },
      _count: true,
      _avg: { score: true },
    });

    return stats.map((stat: any) => ({
      language: stat.language,
      count: stat._count,
      averageScore: Math.round(stat._avg.score || 0),
    }));
  }
}
