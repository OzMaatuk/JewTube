'use client';

import { logger } from '@/lib/logger';
import { useEffect } from 'react';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to logging service
    logger.error(
      {
        error: {
          name: error.name,
          message: error.message,
          digest: error.digest,
          stack: error.stack,
        },
        category: 'page-error',
      },
      'Page error occurred'
    );
  }, [error]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(to bottom, #fef2f2, #ffffff, #f0fdf4)', padding: '16px' }}>
      <div style={{ maxWidth: '448px', width: '100%', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)', padding: '24px', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px' }}>Something went wrong</h1>
        <p style={{ color: '#6b7280', marginBottom: '24px' }}>
          We encountered an error while loading this page. Please try again.
        </p>
        <button
          type="button"
          onClick={reset}
          style={{ backgroundColor: '#dc2626', color: 'white', padding: '8px 24px', borderRadius: '8px', transition: 'opacity 0.2s', border: 'none', cursor: 'pointer' }}
        >
          Try Again
        </button>
        {process.env.NODE_ENV === 'development' && (
          <details style={{ marginTop: '24px', textAlign: 'left' }}>
            <summary style={{ cursor: 'pointer', fontSize: '14px', color: '#6b7280', transition: 'color 0.2s' }}
            >
              Error Details (Development Only)
            </summary>
            <pre style={{ marginTop: '8px', fontSize: '12px', backgroundColor: '#f3f4f6', padding: '16px', borderRadius: '4px', overflow: 'auto', maxHeight: '192px' }}>
              {error.message}
              {'\n\n'}
              {error.stack}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}
