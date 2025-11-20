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
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="text-6xl mb-4">💥</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Critical Error</h1>
            <p className="text-gray-600 mb-6">
              A critical error occurred. Please refresh the page or contact support if the problem
              persists.
            </p>
            <button
              type="button"
              onClick={reset}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
