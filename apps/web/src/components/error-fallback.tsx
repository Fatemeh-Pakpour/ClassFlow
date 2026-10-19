"use client";

import Link from 'next/link';
import { errorCss, styles } from './error-fallback.styles';

export function ErrorFallback({ variant, retry }: { variant: 'page' | 'global'; retry: () => void }) {
  const global = variant === 'global';
  return (
    <main className={styles.screen} data-variant={variant}>
      <style>{errorCss}</style>
      <div className={styles.brand}>class<span>Flow</span></div>
      <section className={styles.card} aria-labelledby="error-title">
        <div className={styles.icon} aria-hidden="true">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            {global
              ? <><path d="m12 3 10 17H2L12 3Z" /><path d="M12 9v4m0 3h.01" /></>
              : <><rect x="4" y="3" width="16" height="18" rx="3" /><path d="M8 8h8m-8 4h5m-5 4h3" /></>}
          </svg>
        </div>
        <p className={styles.eyebrow}>{global ? 'Application unavailable' : 'Page unavailable'}</p>
        <h1 id="error-title">{global ? 'ClassFlow couldn’t start.' : 'This page hit a snag.'}</h1>
        <p className={styles.description}>{global
          ? 'Something interrupted the application before it could load. Try again, or come back in a little while.'
          : 'We couldn’t finish loading this page. Try again to pick up where you left off, or head back home.'}</p>
        <div className={styles.actions}>
          <button className={styles.primary} onClick={retry}>Try again <span aria-hidden="true">↻</span></button>
          {global
            ? <button className={styles.secondary} onClick={() => window.location.reload()}>Reload application</button>
            : <Link className={styles.secondary} href="/">Back to home</Link>}
        </div>
        <p className={styles.note}>If this keeps happening, please try again later.</p>
      </section>
      <p className={styles.footer}>A little pause. We’ll help you get back on track.</p>
    </main>
  );
}
