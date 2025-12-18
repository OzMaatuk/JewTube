import Link from 'next/link';

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function NotFound() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(to bottom, #f0f9ff, #ffffff, #f0fdf4)', padding: '16px' }}>
      <div style={{ maxWidth: '448px', width: '100%', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
        <h1 style={{ fontSize: '36px', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px' }}>404</h1>
        <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#374151', marginBottom: '16px' }}>Page Not Found</h2>
        <p style={{ color: '#6b7280', marginBottom: '24px' }}>
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          style={{ display: 'inline-block', backgroundColor: '#2563eb', color: 'white', padding: '8px 24px', borderRadius: '8px', transition: 'opacity 0.2s' }}
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
