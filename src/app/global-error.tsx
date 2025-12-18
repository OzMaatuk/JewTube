'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to external service if configured
    console.error('Global error:', error);
  }, [error]);

  return (
    // biome-ignore lint/a11y/useHtmlLang: Global error boundary requires html/body tags
    <html>
      <body>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb', padding: '16px' }}>
          <div style={{ maxWidth: '448px', width: '100%', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)', padding: '24px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>💥</div>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px' }}>Critical Error</h1>
            <p style={{ color: '#6b7280', marginBottom: '24px' }}>
              A critical error occurred. Please refresh the page or contact support if the problem
              persists.
            </p>
            <button
              type="button"
              onClick={reset}
              style={{ backgroundColor: '#2563eb', color: 'white', padding: '8px 24px', borderRadius: '8px', transition: 'background-color 0.2s', border: 'none', cursor: 'pointer' }}
            >
              Try Again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
