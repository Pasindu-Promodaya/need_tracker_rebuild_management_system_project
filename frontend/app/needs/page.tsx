'use client';

import { Suspense } from 'react';
import NeedsContent from './NeedsContent';
import { PageLoading } from '@/components/LoadingSpinner';

export default function NeedsPage() {
  return (
    <Suspense fallback={<PageLoading />}>
      <NeedsContent />
    </Suspense>
  );
}
