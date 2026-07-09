'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ArrowLeft,
  RefreshCw,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Info,
  Lightbulb,
  Wand2,
  Loader2,
} from 'lucide-react';
import { api } from '@/lib/api';
import { formatDate, getScoreColor } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';
import { useLanguage } from '@/contexts/language-context';
import { useReviewSocket } from '@/hooks/use-socket';
import { CodeEditor } from '@/components/code-editor/code-editor';
import { CodeDiff } from '@/components/code-editor/code-diff';
import { toast } from 'sonner';

interface Issue {
  id: string;
  severity: string;
  category: string;
  line: number;
  message: string;
  suggestion?: string;
  confidence: number;
  aiModel: string;
  isResolved: boolean;
}

interface Review {
  id: string;
  title: string;
  description?: string;
  language: string;
  fileName: string;
  originalCode: string;
  status: string;
  score: number | null;
  createdAt: string;
  completedAt?: string;
  issues: Issue[];
}

const severityConfig: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  ERROR: { icon: AlertTriangle, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-500/15' },
  WARNING: { icon: AlertTriangle, color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-500/15' },
  INFO: { icon: Info, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-500/15' },
  SUGGESTION: { icon: Lightbulb, color: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-50 dark:bg-gray-500/15' },
};

export default function ReviewDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { t } = useLanguage();

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [authLoading, user, router]);

  const [review, setReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);
  const [reReviewing, setReReviewing] = useState(false);
  const [reviewStatus, setReviewStatus] = useState<string>('');
  const [fixingIssueId, setFixingIssueId] = useState<string | null>(null);
  const [fixedCode, setFixedCode] = useState<string | null>(null);
  const [showFixDiff, setShowFixDiff] = useState(false);

  const handleReviewCompleted = useCallback((updatedReview: unknown) => {
    const data = updatedReview as Review;
    setReview(data);
    setReviewStatus('completed');
  }, []);

  const { isConnected } = useReviewSocket({
    reviewId: params.id as string,
    onReviewCompleted: handleReviewCompleted,
  });

  useEffect(() => {
    if (authLoading) return;

    const fetchReview = async () => {
      try {
        const data = await api.getReview(params.id as string) as Review;
        setReview(data);
        setReviewStatus(data.status);
      } catch (err) {
        console.error('Failed to fetch review:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchReview();
  }, [params.id, authLoading]);

  const handleReReview = async () => {
    if (!review) return;
    setReReviewing(true);
    setReviewStatus('REVIEWING');
    try {
      await api.reReview(review.id);
      // Review will be updated via WebSocket
    } catch (err) {
      console.error('Failed to re-review:', err);
      setReviewStatus(review.status);
    } finally {
      setReReviewing(false);
    }
  };

  const handleDelete = async () => {
    if (!review || !confirm(t('reviewDetail.deleteConfirm'))) return;
    try {
      await api.deleteReview(review.id);
      router.push('/dashboard');
    } catch (err) {
      console.error('Failed to delete review:', err);
    }
  };

  const handleToggleIssue = async (issueId: string) => {
    if (!review) return;
    try {
      await api.toggleIssue(review.id, issueId);
      setReview({
        ...review,
        issues: review.issues.map((issue) =>
          issue.id === issueId ? { ...issue, isResolved: !issue.isResolved } : issue
        ),
      });
    } catch (err) {
      console.error('Failed to toggle issue:', err);
    }
  };

  const handleFixIssue = async (issueId: string) => {
    if (!review) return;
    setFixingIssueId(issueId);
    setShowFixDiff(false);
    try {
      const result = await api.fixIssueCode(review.id, issueId);
      setFixedCode(result.fixedCode);
      setShowFixDiff(true);
    } catch {
      toast.error(t('reviewDetail.fixFailed'));
    } finally {
      setFixingIssueId(null);
    }
  };

  const handleFixAll = async () => {
    if (!review) return;
    const unresolved = review.issues.filter((i) => !i.isResolved);
    if (unresolved.length === 0) return;
    setFixingIssueId('all');
    setShowFixDiff(false);
    try {
      // Fix the first unresolved issue as representative
      const result = await api.fixIssueCode(review.id, unresolved[0].id);
      setFixedCode(result.fixedCode);
      setShowFixDiff(true);
    } catch {
      toast.error(t('reviewDetail.fixFailed'));
    } finally {
      setFixingIssueId(null);
    }
  };

  const handleAcceptChange = async () => {
    if (!review || !fixedCode) return;
    try {
      // Mark all unresolved issues as resolved
      for (const issue of review.issues.filter((i) => !i.isResolved)) {
        await api.toggleIssue(review.id, issue.id);
      }
      setReview({
        ...review,
        issues: review.issues.map((i) => ({ ...i, isResolved: true })),
      });
      setShowFixDiff(false);
      setFixedCode(null);
      toast.success(t('reviewDetail.changeAccepted'));
    } catch {
      toast.error(t('reviewDetail.fixFailed'));
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0b1120]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mysteria" />
          </div>
        </div>
      </div>
    );
  }

  if (!review) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0b1120]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <p className="text-body text-charcoal/60 dark:text-gray-400">{t('reviewDetail.notFound')}</p>
        </div>
      </div>
    );
  }

  const resolvedCount = review.issues.filter((i) => i.isResolved).length;
  const unresolvedIssues = review.issues.filter((i) => !i.isResolved);

  return (
    <div className="min-h-screen bg-white dark:bg-[#0b1120]">
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('reviewDetail.back')}
          </Button>
        </div>

        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-display-section text-charcoal dark:text-gray-100">{review.title}</h1>
            <p className="text-body text-charcoal/60 dark:text-gray-400 mt-2">
              {review.language} • {review.fileName} • {formatDate(review.createdAt)}
            </p>
            {/* WebSocket status */}
            <div className="flex items-center gap-2 mt-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-caption text-charcoal/40 dark:text-gray-500">
                {isConnected ? t('reviewDetail.realtimeConnected') : t('reviewDetail.disconnected')}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handleReReview}
              disabled={reReviewing}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${reReviewing ? 'animate-spin' : ''}`} />
              {t('reviewDetail.reReview')}
            </Button>
            <Button variant="ghost" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        </div>

        {/* Reviewing Status Banner */}
        {reviewStatus === 'REVIEWING' && (
          <div className="mb-6 p-4 bg-lavender/20 border border-lavender rounded-card flex items-center gap-3 dark:bg-[#1e2d44]/50 dark:border-[#2e4060]">
            <RefreshCw className="h-5 w-5 text-amethyst dark:text-gray-400 animate-spin" />
            <span className="text-body text-charcoal dark:text-gray-200">
              {t('reviewDetail.aiAnalyzing')}
            </span>
          </div>
        )}

        {/* Score Card */}
        {review.score !== null && (
          <Card className="card-super mb-8">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-caption text-charcoal/60 dark:text-gray-400">{t('reviewDetail.qualityScore')}</p>
                  <p className={`text-4xl font-bold ${getScoreColor(review.score)}`}>
                    {review.score}
                    <span className="text-lg text-charcoal/40 dark:text-gray-500">/100</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-caption text-charcoal/60 dark:text-gray-400">{t('reviewDetail.issues')}</p>
                  <p className="text-body-heading font-semibold dark:text-gray-100">
                    {resolvedCount}/{review.issues.length} {t('reviewDetail.resolved')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Code Panel - Monaco Editor */}
          <div>
            <Card className="card-super">
              <CardHeader>
                <CardTitle className="text-body-heading">{t('reviewDetail.sourceCode')}</CardTitle>
              </CardHeader>
              <CardContent>
                <CodeEditor
                  code={review.originalCode}
                  language={review.language}
                  issues={review.issues}
                  readOnly={true}
                  height="500px"
                />
              </CardContent>
            </Card>
          </div>

          {/* Issues Panel */}
          <div>
            <Card className="card-super">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-body-heading">
                  {t('reviewDetail.issuesUnresolved').replace('{count}', String(unresolvedIssues.length))}
                </CardTitle>
                {unresolvedIssues.length > 1 && (
                  <button
                    onClick={handleFixAll}
                    disabled={fixingIssueId !== null}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-amethyst text-white hover:bg-amethyst/90 dark:bg-gray-300 dark:text-gray-900 dark:hover:bg-white disabled:opacity-50 transition-colors"
                  >
                    {fixingIssueId === 'all' ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Wand2 className="h-3.5 w-3.5" />
                    )}
                    {fixingIssueId === 'all' ? t('reviewDetail.fixing') : t('reviewDetail.fixAll')}
                  </button>
                )}
              </CardHeader>
              <CardContent>
                {review.issues.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <p className="text-body text-charcoal/60 dark:text-gray-400">{t('reviewDetail.noIssues')}</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[500px] overflow-y-auto">
                    {review.issues.map((issue) => {
                      const config = severityConfig[issue.severity] || severityConfig.INFO;
                      const Icon = config.icon;

                      return (
                        <div
                          key={issue.id}
                          className={`p-4 rounded-card border border-gray-200 dark:border-[#1e2d44] ${
                            issue.isResolved ? 'opacity-50' : ''
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`p-1.5 rounded-badge ${config.bg}`}>
                              <Icon className={`h-4 w-4 ${config.color}`} />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`text-micro ${config.color}`}>
                                  {issue.severity}
                                </span>
                                <span className="text-micro text-charcoal/40 dark:text-gray-500">
                                  {t('reviewDetail.line').replace('{line}', String(issue.line))}
                                </span>
                              </div>
                              <p className="text-body text-charcoal dark:text-gray-200 mb-2">{issue.message}</p>
                              {issue.suggestion && (
                                <p className="text-caption text-charcoal/60 dark:text-gray-400 italic">
                                  💡 {issue.suggestion}
                                </p>
                              )}
                              <div className="flex items-center gap-4 mt-3">
                                <button
                                  onClick={() => handleToggleIssue(issue.id)}
                                  className={`text-caption ${
                                    issue.isResolved
                                      ? 'text-green-600 dark:text-green-400 hover:text-green-700'
                                      : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-200'
                                  }`}
                                >
                                  {issue.isResolved ? t('reviewDetail.resolvedStatus') : t('reviewDetail.markResolved')}
                                </button>
                                {!issue.isResolved && (
                                  <button
                                    onClick={() => handleFixIssue(issue.id)}
                                    disabled={fixingIssueId === issue.id}
                                    className="text-caption text-amethyst hover:text-mysteria dark:text-gray-300 dark:hover:text-gray-100 disabled:opacity-50"
                                  >
                                    {fixingIssueId === issue.id ? (
                                      <Loader2 className="h-3 w-3 animate-spin inline mr-1" />
                                    ) : (
                                      <Wand2 className="h-3 w-3 inline mr-1" />
                                    )}
                                    {fixingIssueId === issue.id ? t('reviewDetail.fixing') : t('reviewDetail.fix')}
                                  </button>
                                )}
                                <span className="text-micro text-gray-300 dark:text-gray-600">
                                  {issue.aiModel}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Code Diff View */}
        {showFixDiff && fixedCode && review && (
          <CodeDiff
            originalCode={review.originalCode}
            fixedCode={fixedCode}
            language={review.language}
            onClose={() => { setShowFixDiff(false); setFixedCode(null); }}
            onAccept={handleAcceptChange}
            onReReview={() => { setShowFixDiff(false); setFixedCode(null); handleReReview(); }}
          />
        )}
      </main>
    </div>
  );
}
