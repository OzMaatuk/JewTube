'use client';

import { logger } from '@/lib/logger';
import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console and logging service
    logger.error(
      {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
        errorInfo: {
          componentStack: errorInfo.componentStack,
        },
        category: 'error-boundary',
      },
      'Error caught by boundary'
    );
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(to bottom, #fef2f2, #ffffff, #f0fdf4)', padding: '16px' }}>
          <div style={{ maxWidth: '448px', width: '100%', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)', padding: '24px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px' }}>Something went wrong</h1>
            <p style={{ color: '#6b7280', marginBottom: '24px' }}>
              We&apos;re sorry for the inconvenience. Please try refreshing the page.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              style={{ backgroundColor: '#dc2626', color: 'white', padding: '8px 24px', borderRadius: '8px', transition: 'opacity 0.2s', border: 'none', cursor: 'pointer' }}
            >
              Refresh Page
            </button>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details style={{ marginTop: '24px', textAlign: 'left' }}>
                <summary style={{ cursor: 'pointer', fontSize: '14px', color: '#6b7280', transition: 'color 0.2s' }}>
                  Error Details (Development Only)
                </summary>
                <pre style={{ marginTop: '8px', fontSize: '12px', backgroundColor: '#f3f4f6', padding: '16px', borderRadius: '4px', overflow: 'auto', maxHeight: '192px' }}>
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Simple error display component
 */
export function ErrorDisplay({
  title = 'Error',
  message = 'Something went wrong',
  onRetry,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px', textAlign: 'center' }}>
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>❌</div>
      <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#1f2937', marginBottom: '8px' }}>{title}</h2>
      <p style={{ color: '#6b7280', marginBottom: '16px' }}>{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          style={{ backgroundColor: '#dc2626', color: 'white', padding: '8px 16px', borderRadius: '4px', transition: 'opacity 0.2s', border: 'none', cursor: 'pointer' }}
        >
          Try Again
        </button>
      )}
    </div>
  );
}

/**
 * Not found display component
 */
export function NotFoundDisplay({ message = 'Content not found' }: { message?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px', textAlign: 'center' }}>
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
      <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#1f2937', marginBottom: '8px' }}>Not Found</h2>
      <p style={{ color: '#6b7280', marginBottom: '16px' }}>{message}</p>
      <a
        href="/"
        style={{ backgroundColor: '#2563eb', color: 'white', padding: '8px 16px', borderRadius: '4px', transition: 'opacity 0.2s', textDecoration: 'none', display: 'inline-block' }}
      >
        Go Home
      </a>
    </div>
  );
}
