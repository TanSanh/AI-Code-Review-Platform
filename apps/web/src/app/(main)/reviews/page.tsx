'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Code2,
  Plus,
  FileCode,
  ArrowRight,
  Search,
  Filter,
} from 'lucide-react';
import { api } from '@/lib/api';
import { formatDate, getScoreColor } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';
import { useLanguage } from '@/contexts/language-context';

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

interface ReviewsResponse {
  data: Review[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function ReviewsPage() {
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
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [languageFilter, setLanguageFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (authLoading) return;

    const fetchReviews = async () => {
      setLoading(true);
      try {
        const params: { page: number; limit: number; status?: string; language?: string } = {
          page,
          limit: 10,
        };

        if (statusFilter !== 'all') params.status = statusFilter;
        if (languageFilter !== 'all') params.language = languageFilter;

        const response = await api.getReviews(params) as ReviewsResponse;
        let filteredReviews = response.data || [];

        // Client-side search filter
        if (searchQuery) {
          filteredReviews = filteredReviews.filter((r) =>
            r.title.toLowerCase().includes(searchQuery.toLowerCase())
          );
        }

        setReviews(filteredReviews);
        setTotalPages(response.meta?.totalPages || 1);
        setTotal(response.meta?.total || 0);
      } catch (err) {
        console.error('Failed to fetch reviews:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [authLoading, page, statusFilter, languageFilter, searchQuery]);

  if (authLoading) {
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
            <h1 className="text-display-section text-charcoal dark:text-gray-100">{t('reviews.title')}</h1>
            <p className="text-body text-charcoal/60 dark:text-gray-400 mt-2">
              {t('reviews.total').replace('{count}', String(total))}
            </p>
          </div>
          <Link href="/review/new">
            <Button variant="cream">
              <Plus className="mr-2 h-4 w-4" />
              {t('reviews.newReview')}
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <Card className="card-super mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-charcoal/40 dark:text-gray-500" />
                <Input
                  placeholder={t('reviews.search')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-40">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder={t('reviews.status')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('reviews.allStatus')}</SelectItem>
                  <SelectItem value="PENDING">{t('reviews.pending')}</SelectItem>
                  <SelectItem value="REVIEWING">{t('reviews.reviewing')}</SelectItem>
                  <SelectItem value="COMPLETED">{t('reviews.completed')}</SelectItem>
                  <SelectItem value="FAILED">{t('reviews.failed')}</SelectItem>
                </SelectContent>
              </Select>

              {/* Language Filter */}
              <Select value={languageFilter} onValueChange={setLanguageFilter}>
                <SelectTrigger className="w-full md:w-40">
                  <Code2 className="mr-2 h-4 w-4" />
                  <SelectValue placeholder={t('reviews.language')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('reviews.allLanguages')}</SelectItem>
                  <SelectItem value="typescript">TypeScript</SelectItem>
                  <SelectItem value="javascript">JavaScript</SelectItem>
                  <SelectItem value="python">Python</SelectItem>
                  <SelectItem value="java">Java</SelectItem>
                  <SelectItem value="go">Go</SelectItem>
                  <SelectItem value="rust">Rust</SelectItem>
                  <SelectItem value="php">PHP</SelectItem>
                  <SelectItem value="ruby">Ruby</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Reviews List */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mysteria" />
          </div>
        ) : reviews.length === 0 ? (
          <Card className="card-super">
            <CardContent className="py-16">
              <div className="text-center">
                <Code2 className="h-16 w-16 text-charcoal/20 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-body-heading text-charcoal dark:text-gray-100 mb-2">{t('reviews.noReviews')}</h3>
                <p className="text-body text-charcoal/60 dark:text-gray-400 mb-6">
                  {searchQuery || statusFilter !== 'all' || languageFilter !== 'all'
                    ? t('reviews.adjustFilters')
                    : t('reviews.createFirst')}
                </p>
                <Link href="/review/new">
                  <Button variant="cream">
                    <Plus className="mr-2 h-4 w-4" />
                    {t('reviews.createReview')}
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="space-y-4">
              {reviews.map((review) => (
                <Link
                  key={review.id}
                  href={`/review/${review.id}`}
                  className="block"
                >
                  <Card className="card-super hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-lavender/20 rounded-badge">
                            <FileCode className="h-6 w-6 text-amethyst" />
                          </div>
                          <div>
                            <h3 className="text-body-heading font-medium text-charcoal dark:text-gray-100">
                              {review.title}
                            </h3>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-caption text-charcoal/60 dark:text-gray-400">
                                {review.language}
                              </span>
                              <span className="text-caption text-charcoal/40 dark:text-gray-500">•</span>
                              <span className="text-caption text-charcoal/60 dark:text-gray-400">
                                {review._count.issues} {t('reviews.issues')}
                              </span>
                              <span className="text-caption text-charcoal/40 dark:text-gray-500">•</span>
                              <span className="text-caption text-charcoal/60 dark:text-gray-400">
                                {formatDate(review.createdAt)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          {review.score !== null && (
                            <div className="text-right">
                              <p className="text-caption text-charcoal/60 dark:text-gray-400">{t('reviews.score')}</p>
                              <p className={`text-body-heading font-semibold ${getScoreColor(review.score)}`}>
                                {review.score}/100
                              </p>
                            </div>
                          )}

                          <div className={`px-3 py-1.5 rounded-badge text-caption ${
                            review.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                            review.status === 'REVIEWING' ? 'bg-yellow-100 text-yellow-700' :
                            review.status === 'FAILED' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {review.status}
                          </div>

                          <ArrowRight className="h-5 w-5 text-charcoal/40 dark:text-gray-500" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <Button
                  variant="outline"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  {t('reviews.previous')}
                </Button>
                <span className="text-body text-charcoal px-4">
                  {t('reviews.pageOf').replace('{page}', String(page)).replace('{total}', String(totalPages))}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  {t('reviews.next')}
                </Button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
