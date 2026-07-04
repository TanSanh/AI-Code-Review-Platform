'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Code2, Upload } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import { useLanguage } from '@/contexts/language-context';

const languages = [
  { id: 'typescript', name: 'TypeScript' },
  { id: 'javascript', name: 'JavaScript' },
  { id: 'python', name: 'Python' },
  { id: 'java', name: 'Java' },
  { id: 'go', name: 'Go' },
  { id: 'rust', name: 'Rust' },
  { id: 'php', name: 'PHP' },
  { id: 'ruby', name: 'Ruby' },
];

export default function NewReviewPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { t } = useLanguage();

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [authLoading, user, router]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [language, setLanguage] = useState('');
  const [fileName, setFileName] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.createReview({
        title,
        description: description || undefined,
        language,
        fileName,
        code,
      });

      router.push(`/review/${response.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('newReview.failedCreate'));
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCode(content);
      setFileName(file.name);

      // Auto-detect language from extension
      const ext = file.name.split('.').pop()?.toLowerCase();
      const langMap: Record<string, string> = {
        ts: 'typescript',
        tsx: 'typescript',
        js: 'javascript',
        jsx: 'javascript',
        py: 'python',
        java: 'java',
        go: 'go',
        rs: 'rust',
        php: 'php',
        rb: 'ruby',
      };
      if (ext && langMap[ext]) {
        setLanguage(langMap[ext]);
      }
    };
    reader.readAsText(file);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0b1120]">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mysteria" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#0b1120]">

      <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-display-section text-charcoal dark:text-gray-50">{t('newReview.title')}</h1>
          <p className="text-body text-charcoal/60 dark:text-gray-400 mt-2">
            {t('newReview.subtitle')}
          </p>
        </div>

        <Card className="card-super">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-3 rounded-button bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 text-sm">
                  {error}
                </div>
              )}

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">{t('newReview.titleLabel')}</Label>
                <Input
                  id="title"
                  placeholder={t('newReview.titlePlaceholder')}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">{t('newReview.descLabel')}</Label>
                <Input
                  id="description"
                  placeholder={t('newReview.descPlaceholder')}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {/* Language & File Name */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('newReview.language')}</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('newReview.selectLanguage')} />
                    </SelectTrigger>
                    <SelectContent>
                      {languages.map((lang) => (
                        <SelectItem key={lang.id} value={lang.id}>
                          {lang.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fileName">{t('newReview.fileName')}</Label>
                  <Input
                    id="fileName"
                    placeholder={t('newReview.filePlaceholder')}
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* File Upload */}
              <div className="space-y-2">
                <Label>{t('newReview.uploadFile')}</Label>
                <div className="flex items-center gap-4">
                  <label className="flex-1">
                    <input
                      type="file"
                      className="hidden"
                      accept=".ts,.tsx,.js,.jsx,.py,.java,.go,.rs,.php,.rb"
                      onChange={handleFileUpload}
                    />
                    <div className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-parchment dark:border-[#1e2d44] rounded-card cursor-pointer hover:border-lavender transition-colors">
                      <Upload className="h-5 w-5 text-charcoal/40 dark:text-gray-500" />
                      <span className="text-sm text-charcoal/60 dark:text-gray-400">{t('newReview.chooseFile')}</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Code Input */}
              <div className="space-y-2">
                <Label htmlFor="code">{t('newReview.code')}</Label>
                <textarea
                  id="code"
                  placeholder={t('newReview.codePlaceholder')}
                  className="w-full h-64 p-4 font-mono text-sm bg-charcoal dark:bg-[#0d0e1a] text-green-400 rounded-card border-0 resize-none focus:outline-none focus:ring-2 focus:ring-lavender"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                />
              </div>

              {/* Submit */}
              <div className="flex justify-end gap-4">
                <Button type="button" variant="ghost" onClick={() => router.back()}>
                  {t('newReview.cancel')}
                </Button>
                <Button type="submit" variant="cream" disabled={loading || !language}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('newReview.analyzing')}
                    </>
                  ) : (
                    <>
                      <Code2 className="mr-2 h-4 w-4" />
                      {t('newReview.startReview')}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
