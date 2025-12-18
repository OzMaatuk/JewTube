import { Footer } from '@/components/footer';
import { Header } from '@/components/header';

export const dynamic = 'force-dynamic';

export default function SearchPage() {
  return (
    <>
      <Header />
      <main style={{ flex: 1, background: 'linear-gradient(to bottom, #f0f9ff, #ffffff, #f0fdf4)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px', paddingTop: '64px', paddingBottom: '64px' }}>
          <div style={{ maxWidth: '768px', margin: '0 auto' }}>
            <div style={{ borderRadius: '12px', background: 'linear-gradient(to bottom right, #dbeafe, #e0e7ff)', padding: '48px', textAlign: 'center', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' }}>
              <div style={{ marginBottom: '24px', fontSize: '48px' }}>🔍</div>
              <h1 style={{ marginBottom: '16px', fontSize: '36px', fontWeight: 'bold', color: '#1f2937' }}>Search</h1>
              <p style={{ marginBottom: '32px', fontSize: '18px', color: '#374151' }}>
                Video search functionality will be available here soon. You&apos;ll be able to find
                videos by title, channel, or topic.
              </p>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', borderRadius: '9999px', backgroundColor: 'white', padding: '12px 24px', fontSize: '14px', fontWeight: '500', color: '#6b7280', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' }}>
                <span style={{ height: '8px', width: '8px', borderRadius: '9999px', backgroundColor: '#6366f1', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}></span>
                Coming Soon
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
