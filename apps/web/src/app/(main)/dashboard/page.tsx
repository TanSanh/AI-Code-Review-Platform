'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Code2,
  Plus,
  FileCode,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
} from 'lucide-react';
import { api } from '@/lib/api';
import { formatDate, getScoreColor } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';
import { useLanguage } from '@/contexts/language-context';
import { ScoreTrendChart } from '@/components/charts/score-trend-chart';
import { LanguageDistributionChart } from '@/components/charts/language-distribution-chart';

interface Review {
  id: string;
  title: string;
  language: string;
  status: string;
  score: number | null;
  createdAt: string;
  _count: {
    issues: number;
    comments: number;
  };
}

interface Overview {
  totalReviews: number;
  completedReviews: number;
  pendingReviews: number;
  totalIssues: number;
  resolvedIssues: number;
  unresolvedIssues: number;
  averageScore: number;
  languageDistribution: LanguageData[];
}

interface TrendData {
  date: string;
  avgScore: number;
  reviewCount: number;
}

interface LanguageData {
  language: string;
  count: number;
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [authLoading, user, router]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [languages, setLanguages] = useState<LanguageData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    const fetchData = async () => {
      try {
        const [reviewsRes, overviewRes, trendsRes, languagesRes] = await Promise.all([
          api.getReviews({ limit: 10 }) as Promise<{ data: Review[] }>,
          api.getAnalyticsOverview() as Promise<Overview>,
          api.getAnalyticsTrends() as Promise<TrendData[]>,
          api.getAnalyticsLanguages() as Promise<LanguageData[]>,
        ]);
        setReviews(reviewsRes.data || []);
        setOverview(overviewRes);
        setTrends(trendsRes || []);
        setLanguages(languagesRes || []);
      } catch (err) {
        console.error('Failed to fetch data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [authLoading]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#1a1b2e]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mysteria" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#1a1b2e]">

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-display-section text-charcoal dark:text-gray-100">{t('dashboard.title')}</h1>
            <p className="text-body text-charcoal dark:text-gray-400 mt-2">
              {t('dashboard.welcome')}, {user?.name || 'User'}
            </p>
          </div>
          <Link href="/review/new">
            <Button variant="cream">
              <Plus className="mr-2 h-4 w-4" />
              {t('dashboard.newReview')}
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="card-super">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-lavender/20 rounded-badge">
                  <FileCode className="h-5 w-5 text-amethyst" />
                </div>
                <div>
                  <p className="text-caption text-charcoal dark:text-gray-400">{t('dashboard.totalReviews')}</p>
                  <p className="text-body-heading font-semibold">{overview?.totalReviews || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-super">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-badge">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-caption text-charcoal dark:text-gray-400">{t('dashboard.completedReviews')}</p>
                  <p className="text-body-heading font-semibold">{overview?.completedReviews || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-super">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-badge">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-caption text-charcoal dark:text-gray-400">{t('dashboard.issuesFound')}</p>
                  <p className="text-body-heading font-semibold">{overview?.totalIssues || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-super">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-mysteria/10 rounded-badge">
                  <Code2 className="h-5 w-5 text-mysteria" />
                </div>
                <div>
                  <p className="text-caption text-charcoal dark:text-gray-400">{t('dashboard.avgScore')}</p>
                  <p className="text-body-heading font-semibold">{overview?.averageScore || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Score Trend Chart */}
          <Card className="card-super">
            <CardHeader>
              <CardTitle className="text-body-heading">{t('dashboard.scoreTrend')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ScoreTrendChart data={trends} />
            </CardContent>
          </Card>

          {/* Language Distribution Chart */}
          <Card className="card-super">
            <CardHeader>
              <CardTitle className="text-body-heading">{t('dashboard.languageDistribution')}</CardTitle>
            </CardHeader>
            <CardContent>
              <LanguageDistributionChart data={languages} />
            </CardContent>
          </Card>
        </div>

        {/* Recent Reviews */}
        <Card className="card-super">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-body-heading">{t('dashboard.recentReviews')}</CardTitle>
            <Link href="/reviews" className="text-sm text-amethyst hover:underline">
              {t('dashboard.viewAll')}
            </Link>
          </CardHeader>
          <CardContent>
            {reviews.length === 0 ? (
              <div className="text-center py-12">
                <Code2 className="h-12 w-12 text-charcoal dark:text-gray-600 mx-auto mb-4" />
                <p className="text-body text-charcoal dark:text-gray-400 mb-4">{t('dashboard.noReviews')}</p>
                <Link href="/review/new">
                  <Button variant="cream">
                    <Plus className="mr-2 h-4 w-4" />
                    {t('dashboard.createFirst')}
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <Link
                    key={review.id}
                    href={`/review/${review.id}`}
                    className="flex items-center justify-between p-4 rounded-card border border-parchment hover:bg-cream/30 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-lavender/20 rounded-badge">
                        <FileCode className="h-5 w-5 text-amethyst" />
                      </div>
                      <div>
                        <p className="text-body font-medium text-charcoal dark:text-gray-100">{review.title}</p>
                        <p className="text-caption text-charcoal dark:text-gray-400">
                          {review.language} • {review._count.issues} {t('reviews.issues')} • {formatDate(review.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {review.score !== null && (
                        <span className={`text-body font-semibold ${getScoreColor(review.score)}`}>
                          {review.score}/100
                        </span>
                      )}
                      <div className={`px-2 py-1 rounded-badge text-micro ${
                        review.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                        review.status === 'REVIEWING' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {review.status}
                      </div>
                      <ArrowRight className="h-4 w-4 text-charcoal dark:text-gray-500" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
