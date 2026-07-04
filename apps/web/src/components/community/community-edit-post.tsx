'use client';

import React, { useState, useRef } from 'react';
import { X, Save, ImagePlus, Trash2, Link as LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/contexts/language-context';
import { type TranslationKey } from '@/lib/i18n';

interface EditPostData {
  id: string;
  title: string;
  content: string;
  language: string | null;
  tags: string | null;
  imageUrl: string | null;
  reviewId?: string | null;
}

interface ReviewOption {
  id: string;
  title: string;
  language: string;
}

interface CommunityEditPostProps {
  open: boolean;
  post: EditPostData | null;
  reviews?: ReviewOption[];
  onClose: () => void;
  onSubmit: (id: string, data: {
    title: string;
    content: string;
    language?: string;
    tags?: string;
    imageUrl?: string;
    reviewId?: string;
  }) => Promise<void>;
}

const LANGUAGES = [
  'TypeScript', 'JavaScript', 'Python', 'Java', 'Go', 'Rust',
  'C#', 'C++', 'PHP', 'Ruby', 'Swift', 'Kotlin', 'SQL', 'Other',
];

export function CommunityEditPost({ open, post, reviews = [], onClose, onSubmit }: CommunityEditPostProps) {
  const { t } = useLanguage();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [language, setLanguage] = useState('');
  const [tags, setTags] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [reviewId, setReviewId] = useState('');
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastInitId = useRef<string | null>(null);

  // Initialize form when dialog opens with a new post
  if (post && open && post.id !== lastInitId.current) {
    lastInitId.current = post.id;
    setTitle(post.title);
    setContent(post.content);
    const lang = (post.language || '').trim();
    const matchedLang = LANGUAGES.find(
      (l) => l.toLowerCase() === lang.toLowerCase()
    );
    setLanguage(matchedLang || lang);
    setTags(post.tags || '');
    setImageUrl(post.imageUrl || '');
    setImagePreview(post.imageUrl || '');
    setReviewId(post.reviewId || '');
  }

  // Reset when dialog closes
  if (!open && lastInitId.current) {
    lastInitId.current = null;
  }

  if (!open || !post) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || content.trim().length < 10) return;

    setSaving(true);
    try {
      await onSubmit(post.id, {
        title: title.trim(),
        content: content.trim(),
        language: language || undefined,
        tags: tags.trim() || undefined,
        imageUrl: imageUrl || undefined,
        reviewId: reviewId || undefined,
      });
      onClose();
    } catch {
      // Error handled by parent
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    if (file.size > 5 * 1024 * 1024) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setImagePreview(base64);
      setImageUrl(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImageUrl('');
    setImagePreview('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg rounded-card border border-parchment bg-white shadow-xl dark:border-[#1e2d44] dark:bg-[#1a2332]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-parchment px-6 py-4 dark:border-[#1e2d44]">
          <h2 className="text-heading-card font-semibold text-charcoal dark:text-gray-100">
            {t('community.editPost')}
          </h2>
          <button
            onClick={onClose}
            className="text-charcoal/40 transition-colors hover:text-charcoal dark:text-gray-500 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          {/* Title */}
          <div>
            <Label className="mb-1.5 text-body font-medium text-charcoal dark:text-gray-200">
              {t('community.titleLabel')} *
            </Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('community.titlePlaceholder')}
              maxLength={200}
              required
              className="border-parchment bg-white text-charcoal placeholder:text-charcoal/30 dark:border-[#1e2d44] dark:bg-[#111827] dark:text-gray-100 dark:placeholder:text-gray-600"
            />
          </div>

          {/* Content */}
          <div>
            <Label className="mb-1.5 text-body font-medium text-charcoal dark:text-gray-200">
              {t('community.contentLabel')} *
            </Label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t('community.contentPlaceholder')}
              rows={6}
              minLength={10}
              maxLength={10000}
              required
              className="w-full rounded-button border border-parchment bg-white px-3 py-2 text-body text-charcoal placeholder:text-charcoal/30 focus:border-amethyst focus:outline-none focus:ring-1 focus:ring-amethyst/30 dark:border-[#1e2d44] dark:bg-[#111827] dark:text-gray-100 dark:placeholder:text-gray-600 dark:focus:border-[#4b5563] dark:focus:ring-[#4b5563]/30"
            />
            <p className="mt-1 text-right text-xs text-charcoal/30 dark:text-gray-600">
              {content.length}/10000
            </p>
          </div>

          {/* Language + Tags */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5 text-body font-medium text-charcoal dark:text-gray-200">
                {t('community.languageLabel')}
              </Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="border-parchment bg-white text-charcoal dark:border-[#1e2d44] dark:bg-[#111827] dark:text-gray-100">
                  <SelectValue placeholder={t('community.selectLanguage')} />
                </SelectTrigger>
                <SelectContent className="border-parchment bg-white dark:border-[#1e2d44] dark:bg-[#1a2332]">
                  {LANGUAGES.map((lang) => (
                    <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1.5 text-body font-medium text-charcoal dark:text-gray-200">
                {t('community.tagsLabel')}
              </Label>
              <Input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder={t('community.tagsPlaceholder')}
                maxLength={500}
                className="border-parchment bg-white text-charcoal placeholder:text-charcoal/30 dark:border-[#1e2d44] dark:bg-[#111827] dark:text-gray-100 dark:placeholder:text-gray-600"
              />
            </div>
          </div>

          {/* Image Upload */}
          <div>
            <Label className="mb-1.5 flex items-center gap-1.5 text-body font-medium text-charcoal dark:text-gray-200">
              <ImagePlus className="h-3.5 w-3.5" />
              {t('community.attachImage')}
            </Label>
            {imagePreview ? (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="max-h-64 w-full rounded-button object-contain border border-parchment dark:border-[#1e2d44]"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex h-24 w-full items-center justify-center rounded-button border-2 border-dashed border-parchment bg-cream/30 text-charcoal/40 transition-colors hover:border-amethyst/50 hover:text-amethyst dark:border-[#1e2d44] dark:bg-[#111827] dark:text-gray-500 dark:hover:border-[#4b5563]/50 dark:hover:text-[#9ca3af]"
              >
                <div className="text-center">
                  <ImagePlus className="mx-auto mb-1 h-6 w-6" />
                  <p className="text-xs">{t('community.clickToUpload')}</p>
                </div>
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>

          {/* Attach Review */}
          {reviews.length > 0 && (
            <div>
              <Label className="mb-1.5 flex items-center gap-1.5 text-body font-medium text-charcoal dark:text-gray-200">
                <LinkIcon className="h-3.5 w-3.5" />
                {t('community.attachReview')}
              </Label>
              <Select value={reviewId} onValueChange={setReviewId}>
                <SelectTrigger className="border-parchment bg-white text-charcoal dark:border-[#1e2d44] dark:bg-[#111827] dark:text-gray-100">
                  <SelectValue placeholder={t('community.selectReview')} />
                </SelectTrigger>
                <SelectContent className="border-parchment bg-white dark:border-[#1e2d44] dark:bg-[#1a2332]">
                  {reviews.map((review) => (
                    <SelectItem key={review.id} value={review.id}>
                      {review.title} ({review.language})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={saving}
              className="text-charcoal/60 dark:text-gray-400"
            >
              {t('community.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={saving || !title.trim() || content.trim().length < 10}
              className="bg-amethyst text-white hover:bg-amethyst/90 dark:bg-[#4b5563] dark:hover:bg-[#4b5563]/90"
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  {t('community.saving')}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  {t('community.updatePost')}
                </span>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
