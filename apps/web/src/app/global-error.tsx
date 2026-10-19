"use client";

import { useEffect } from 'react';
import { ErrorFallback } from '@/components/error-fallback';

export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  // The fallback embeds its CSS and does not depend on the failed root layout.
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>
        <ErrorFallback variant="global" retry={retry} />
      </body>
    </html>
  );
}
