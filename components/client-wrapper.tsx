'use client';

import { ErrorBoundary } from '@/components/error-boundary';
import type React from 'react';

export function ClientWrapper({ children }: { children: React.ReactNode }) {
  return <ErrorBoundary>{children}</ErrorBoundary>;
}
