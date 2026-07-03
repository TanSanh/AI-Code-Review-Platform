'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Trash2, Reply, ChevronDown, ChevronUp } from 'lucide-react';
import { useLanguage } from '@/contexts/language-context';
import { useAuth } from '@/contexts/auth-context';
import { type TranslationKey } from '@/lib/i18n';

interface CommentAuthor {
  id: string;
  name: string;
  avatarUrl: string | null;
}

export interface CommunityComment {
  id: string;
  content: string;
  parentId: string | null;
  author: CommentAuthor;
  createdAt: string;
  replies?: CommunityComment[];
}

interface CommunityCommentSectionProps {
  postId: string;
  comments: CommunityComment[];
  onAdd: (content: string, parentId?: string) => Promise<void>;
  onDelete: (commentId: string) => Promise<void>;
  currentUserId: string;
}

const REPLIES_COLLAPSE_THRESHOLD = 2;

/** Flatten ALL nested replies to a single flat list. */
function flattenAllReplies(replies: CommunityComment[]): CommunityComment[] {
  const result: CommunityComment[] = [];
  const walk = (list: CommunityComment[]) => {
    for (const c of list) {
      result.push(c);
      if (c.replies?.length) walk(c.replies);
    }
  };
  walk(replies);
  return result;
}

/** Count all descendants recursively. */
function countAllReplies(comment: CommunityComment): number {
  let count = comment.replies?.length || 0;
  for (const r of comment.replies || []) count += countAllReplies(r);
  return count;
}

function formatTimeAgo(dateString: string, t: (key: TranslationKey) => string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMin < 1) return t('community.justNow');
  if (diffMin < 60) return `${diffMin} ${t('community.minutesAgo')}`;
  if (diffHours < 24) return `${diffHours} ${t('community.hoursAgo')}`;
  return `${diffDays} ${t('community.daysAgo')}`;
}

function getInitial(name: string): string {
  return name.charAt(0).toUpperCase();
}

/** Facebook-style curved connector SVG. */
function CurvedConnector() {
  return (
    <svg width="40" height="24" viewBox="0 0 40 24" fill="none" className="shrink-0" aria-hidden="true">
      <path
        d="M 16 0 V 12 Q 16 24 28 24 H 40"
        stroke="currentColor"
        strokeWidth="2"
        className="text-gray-200 dark:text-[#33355a]/80"
      />
    </svg>
  );
}

/** Avatar component used everywhere. */
function Avatar({ author }: { author: CommentAuthor }) {
  return author.avatarUrl ? (
    <img src={author.avatarUrl} alt={author.name} className="h-8 w-8 rounded-full object-cover" />
  ) : (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amethyst/10 text-xs font-semibold text-amethyst dark:bg-[#714cb6]/20 dark:text-[#cbb7fb]">
      {getInitial(author.name)}
    </div>
  );
}

/** Inline reply input used by both top-level and reply comments. */
function ReplyInput({
  onSubmit,
  placeholder,
}: {
  onSubmit: (content: string) => Promise<void>;
  placeholder: string;
}) {
  const { t } = useLanguage();
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit(content.trim());
      setContent('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-2 flex items-center gap-2">
      <input
        type="text"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
          }
        }}
        placeholder={placeholder}
        className="flex-1 rounded-full border border-parchment bg-cream/50 px-4 py-2 text-sm text-charcoal placeholder:text-charcoal/30 focus:border-amethyst focus:outline-none focus:ring-1 focus:ring-amethyst/30 dark:border-[#33355a] dark:bg-[#1a1b2e] dark:text-gray-100 dark:placeholder:text-gray-600 dark:focus:border-[#714cb6]"
      />
      <button
        onClick={handleSubmit}
        disabled={submitting || !content.trim()}
        className="text-sm font-semibold text-amethyst transition-colors hover:text-amethyst/80 disabled:opacity-40 dark:text-[#cbb7fb] dark:hover:text-[#cbb7fb]/80"
      >
        {t('community.send')}
      </button>
    </div>
  );
}

export function CommunityCommentSection({
  comments,
  onAdd,
  onDelete,
  currentUserId,
}: CommunityCommentSectionProps) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [openReplies, setOpenReplies] = useState<Set<string>>(new Set());
  const [collapsedTrees, setCollapsedTrees] = useState<Set<string>>(new Set());

  const toggleReply = (commentId: string) => {
    setOpenReplies((prev) => {
      const next = new Set(prev);
      if (next.has(commentId)) next.delete(commentId);
      else next.add(commentId);
      return next;
    });
  };

  const isReplyOpen = (commentId: string) => openReplies.has(commentId);

  const toggleCollapse = (commentId: string) => {
    setCollapsedTrees((prev) => {
      const next = new Set(prev);
      if (next.has(commentId)) next.delete(commentId);
      else next.add(commentId);
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!newComment.trim()) return;
    setSubmitting(true);
    try {
      await onAdd(newComment.trim());
      setNewComment('');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async (parentId: string, content: string) => {
    await onAdd(content, parentId);
  };

  // Author name lookup for "Trả lời [name]"
  const authorMap = useMemo(() => {
    const map = new Map<string, string>();
    const walk = (list: CommunityComment[]) => {
      for (const c of list) {
        map.set(c.id, c.author.name);
        if (c.replies?.length) walk(c.replies);
      }
    };
    walk(comments);
    return map;
  }, [comments]);

  return (
    <div>
      {/* Top-level comment form */}
      <div className="mb-4 flex gap-2">
        {user?.avatarUrl ? (
          <img src={user.avatarUrl} alt={user.name || ''} className="h-8 w-8 shrink-0 rounded-full object-cover" />
        ) : (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amethyst/10 text-xs font-semibold text-amethyst dark:bg-[#714cb6]/20 dark:text-[#cbb7fb]">
            {getInitial(currentUserId)}
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder={t('community.writeComment')}
              className="flex-1 rounded-full border border-parchment bg-cream/50 px-4 py-2 text-sm text-charcoal placeholder:text-charcoal/30 focus:border-amethyst focus:outline-none focus:ring-1 focus:ring-amethyst/30 dark:border-[#33355a] dark:bg-[#1a1b2e] dark:text-gray-100 dark:placeholder:text-gray-600 dark:focus:border-[#714cb6]"
            />
            <button
              onClick={handleSubmit}
              disabled={submitting || !newComment.trim()}
              className="text-sm font-semibold text-amethyst transition-colors hover:text-amethyst/80 disabled:opacity-40 dark:text-[#cbb7fb] dark:hover:text-[#cbb7fb]/80"
            >
              {t('community.send')}
            </button>
          </div>
        </div>
      </div>

      {/* Comments list */}
      {comments.length === 0 ? (
        <p className="py-8 text-center text-sm text-charcoal/30 dark:text-gray-600">
          {t('community.noComments')}
        </p>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => {
            const directReplies = comment.replies || [];
            const totalReplies = countAllReplies(comment);
            const shouldCollapse = totalReplies > REPLIES_COLLAPSE_THRESHOLD;
            const isCollapsed = collapsedTrees.has(comment.id);

            // Flatten ALL replies (any depth) to single flat list
            const allReplies = flattenAllReplies(directReplies);
            const visibleReplies = shouldCollapse && isCollapsed
              ? allReplies.slice(0, 1)
              : allReplies;

            return (
              <div key={comment.id}>
                {/* Top-level comment — no indentation */}
                <div className="flex gap-2">
                  <div className="w-8 shrink-0 pt-0.5">
                    <Avatar author={comment.author} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/users/${comment.author.id}`}
                        className="text-sm font-semibold text-charcoal hover:text-[#714cb6] dark:text-gray-200 dark:hover:text-[#cbb7fb] transition-colors"
                      >
                        {comment.author.name}
                      </Link>
                      <span className="text-xs text-charcoal/30 dark:text-gray-600">
                        {formatTimeAgo(comment.createdAt, t)}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[15px] leading-relaxed text-charcoal/80 dark:text-gray-300">
                      {comment.content}
                    </p>
                    <div className="mt-1 flex items-center gap-4 text-xs text-charcoal/40 dark:text-gray-500">
                      <button
                        onClick={() => toggleReply(comment.id)}
                        className="font-semibold transition-colors hover:text-amethyst dark:hover:text-[#cbb7fb]"
                      >
                        {t('community.reply')}
                      </button>
                      {comment.author.id === currentUserId && (
                        <button
                          onClick={() => onDelete(comment.id)}
                          className="font-semibold transition-colors hover:text-red-500 dark:hover:text-red-400"
                        >
                          <Trash2 className="inline h-3 w-3" />
                        </button>
                      )}
                    </div>
                    {isReplyOpen(comment.id) && (
                      <ReplyInput
                        onSubmit={(content) => handleReply(comment.id, content)}
                        placeholder={t('community.writeReplyPlaceholder')}
                      />
                    )}
                  </div>
                </div>

                {/* Flat reply list — ALL replies at same indent with curved connectors */}
                {allReplies.length > 0 && (
                  <div className="ml-10 mt-1">
                    {shouldCollapse && (
                      <button
                        onClick={() => toggleCollapse(comment.id)}
                        className="flex items-center gap-1 py-1 text-[13px] font-semibold text-charcoal/40 transition-colors hover:text-amethyst dark:text-gray-500 dark:hover:text-[#cbb7fb]"
                      >
                        {isCollapsed ? (
                          <>
                            <ChevronDown className="h-4 w-4" />
                            {t('community.viewAllReplies').replace('{count}', String(totalReplies))}
                          </>
                        ) : (
                          <>
                            <ChevronUp className="h-4 w-4" />
                            {t('community.hideReplies')}
                          </>
                        )}
                      </button>
                    )}

                    <div>
                      {visibleReplies.map((reply) => (
                        <div key={reply.id} className="flex">
                          <div className="w-10 shrink-0 flex flex-col items-center">
                            <CurvedConnector />
                          </div>
                          <div className="flex-1 min-w-0 pb-1">
                            {/* "Trả lời [name]" indicator */}
                            <div className="mb-0.5 text-xs text-charcoal/40 dark:text-gray-500">
                              <Reply className="mr-0.5 inline h-3 w-3" />
                              {t('community.reply')}{' '}
                              <span className="font-medium text-charcoal/60 dark:text-gray-400">
                                {reply.parentId ? authorMap.get(reply.parentId) || '' : ''}
                              </span>
                            </div>

                            <div className="flex gap-2">
                              <div className="w-8 shrink-0 pt-0.5">
                                <Avatar author={reply.author} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <Link
                                    href={`/users/${reply.author.id}`}
                                    className="text-sm font-semibold text-charcoal hover:text-[#714cb6] dark:text-gray-200 dark:hover:text-[#cbb7fb] transition-colors"
                                  >
                                    {reply.author.name}
                                  </Link>
                                  <span className="text-xs text-charcoal/30 dark:text-gray-600">
                                    {formatTimeAgo(reply.createdAt, t)}
                                  </span>
                                </div>
                                <p className="mt-0.5 text-[15px] leading-relaxed text-charcoal/80 dark:text-gray-300">
                                  {reply.content}
                                </p>
                                <div className="mt-1 flex items-center gap-4 text-xs text-charcoal/40 dark:text-gray-500">
                                  <button
                                    onClick={() => toggleReply(reply.id)}
                                    className="font-semibold transition-colors hover:text-amethyst dark:hover:text-[#cbb7fb]"
                                  >
                                    {t('community.reply')}
                                  </button>
                                  {reply.author.id === currentUserId && (
                                    <button
                                      onClick={() => onDelete(reply.id)}
                                      className="font-semibold transition-colors hover:text-red-500 dark:hover:text-red-400"
                                    >
                                      <Trash2 className="inline h-3 w-3" />
                                    </button>
                                  )}
                                </div>
                                {isReplyOpen(reply.id) && (
                                  <ReplyInput
                                    onSubmit={(content) => handleReply(reply.id, content)}
                                    placeholder={t('community.writeReplyPlaceholder')}
                                  />
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
