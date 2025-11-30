'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, Suspense } from 'react';
import * as redditPixel from '@/lib/reddit-pixel';

function RedditPixelTrackerInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Initialize Reddit Pixel on mount
  useEffect(() => {
    redditPixel.init();
    redditPixel.pageVisit();
  }, []);

  // Track page visits on route changes
  useEffect(() => {
    redditPixel.pageVisit();
  }, [pathname, searchParams]);

  return null;
}

export function RedditPixelTracker() {
  return (
    <Suspense fallback={null}>
      <RedditPixelTrackerInner />
    </Suspense>
  );
}

export default RedditPixelTracker;
