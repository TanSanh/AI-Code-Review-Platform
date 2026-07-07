'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [error, setError] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setError('No authentication token received');
      return;
    }

    const handleGoogleAuth = async () => {
      try {
        api.setToken(token);
        const profile = await api.getProfile();
        localStorage.setItem('token', token);
        window.location.href = '/dashboard';
      } catch {
        setError('Failed to authenticate. Please try again.');
      }
    };

    handleGoogleAuth();
  }, [searchParams, router]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center bg-gray-50 px-4 py-12 dark:bg-[#0b1120]">
        <div className="w-full max-w-md overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-xl dark:border-[#1e2d44] dark:bg-[#1a2332]">
          <p className="mb-4 text-sm text-red-600 dark:text-red-400">{error}</p>
          <button
            onClick={() => router.push('/login')}
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-white"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center bg-gray-50 px-4 py-12 dark:bg-[#0b1120]">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-xl dark:border-[#1e2d44] dark:bg-[#1a2332]">
        <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-gray-400" />
        <p className="text-sm text-gray-500 dark:text-gray-400">Completing authentication...</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center bg-gray-50 px-4 py-12 dark:bg-[#0b1120]">
        <div className="w-full max-w-md overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-xl dark:border-[#1e2d44] dark:bg-[#1a2332]">
          <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-gray-400" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}
