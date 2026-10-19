"use client";

import { useEffect } from 'react';
import { ErrorFallback } from '@/components/error-fallback';

export default function Error({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return <ErrorFallback variant="page" retry={retry} />;
}
