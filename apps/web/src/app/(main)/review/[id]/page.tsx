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
  MessageSquare,
} from 'lucide-react';
import { api } from '@/lib/api';
import { formatDate, getScoreColor } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';
import { useReviewSocket } from '@/hooks/use-socket';
import { CodeEditor } from '@/components/code-editor/code-editor';
import { CommentSection } from '@/components/comments/comment-section';

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
  ERROR: { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
  WARNING: { icon: AlertTriangle, color: 'text-yellow-600', bg: 'bg-yellow-50' },
  INFO: { icon: Info, color: 'text-blue-600', bg: 'bg-blue-50' },
  SUGGESTION: { icon: Lightbulb, color: 'text-purple-600', bg: 'bg-purple-50' },
};

export default function ReviewDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { loading: authLoading } = useAuth();
  const [review, setReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);
  const [reReviewing, setReReviewing] = useState(false);
  const [reviewStatus, setReviewStatus] = useState<string>('');

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
    if (!review || !confirm('Are you sure you want to delete this review?')) return;
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

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-white">
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
      <div className="min-h-screen bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <p className="text-body text-charcoal/60">Review not found</p>
        </div>
      </div>
    );
  }

  const resolvedCount = review.issues.filter((i) => i.isResolved).length;
  const unresolvedIssues = review.issues.filter((i) => !i.isResolved);

  return (
    <div className="min-h-screen bg-white">
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>

        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-display-section text-charcoal">{review.title}</h1>
            <p className="text-body text-charcoal/60 mt-2">
              {review.language} • {review.fileName} • {formatDate(review.createdAt)}
            </p>
            {/* WebSocket status */}
            <div className="flex items-center gap-2 mt-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-caption text-charcoal/40">
                {isConnected ? 'Real-time connected' : 'Disconnected'}
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
              Re-review
            </Button>
            <Button variant="ghost" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        </div>

        {/* Reviewing Status Banner */}
        {reviewStatus === 'REVIEWING' && (
          <div className="mb-6 p-4 bg-lavender/20 border border-lavender rounded-card flex items-center gap-3">
            <RefreshCw className="h-5 w-5 text-amethyst animate-spin" />
            <span className="text-body text-charcoal">
              AI is analyzing your code... The review will update automatically when complete.
            </span>
          </div>
        )}

        {/* Score Card */}
        {review.score !== null && (
          <Card className="card-super mb-8">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-caption text-charcoal/60">Code Quality Score</p>
                  <p className={`text-4xl font-bold ${getScoreColor(review.score)}`}>
                    {review.score}
                    <span className="text-lg text-charcoal/40">/100</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-caption text-charcoal/60">Issues</p>
                  <p className="text-body-heading font-semibold">
                    {resolvedCount}/{review.issues.length} resolved
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
                <CardTitle className="text-body-heading">Source Code</CardTitle>
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
              <CardHeader>
                <CardTitle className="text-body-heading">
                  Issues ({unresolvedIssues.length} unresolved)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {review.issues.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <p className="text-body text-charcoal/60">No issues found!</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[500px] overflow-y-auto">
                    {review.issues.map((issue) => {
                      const config = severityConfig[issue.severity] || severityConfig.INFO;
                      const Icon = config.icon;

                      return (
                        <div
                          key={issue.id}
                          className={`p-4 rounded-card border ${
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
                                <span className="text-micro text-charcoal/40">
                                  Line {issue.line}
                                </span>
                              </div>
                              <p className="text-body text-charcoal mb-2">{issue.message}</p>
                              {issue.suggestion && (
                                <p className="text-caption text-charcoal/60 italic">
                                  💡 {issue.suggestion}
                                </p>
                              )}
                              <div className="flex items-center gap-4 mt-3">
                                <button
                                  onClick={() => handleToggleIssue(issue.id)}
                                  className={`text-caption ${
                                    issue.isResolved
                                      ? 'text-green-600 hover:text-green-700'
                                      : 'text-charcoal/40 hover:text-charcoal'
                                  }`}
                                >
                                  {issue.isResolved ? '✓ Resolved' : 'Mark as resolved'}
                                </button>
                                <span className="text-micro text-charcoal/30">
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

            {/* Discussion - Real-time Comments */}
            <Card className="card-super mt-6">
              <CardHeader>
                <CardTitle className="text-body-heading flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Discussion
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CommentSection reviewId={review.id} />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
