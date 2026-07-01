import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FileQuestion } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <FileQuestion className="mb-6 h-16 w-16 text-mysteria/40" />
      <h1 className="text-display-section mb-2 text-charcoal">404</h1>
      <p className="text-body mb-8 max-w-md text-charcoal/60">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link href="/">
        <Button variant="cream">Back to Home</Button>
      </Link>
    </div>
  );
}
