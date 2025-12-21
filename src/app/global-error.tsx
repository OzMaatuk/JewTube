'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Something went wrong!</h1>
      <p>{error?.message || 'An unexpected error occurred'}</p>
    </div>
  );
}