import { Footer } from '@/components/footer';
import { Header } from '@/components/header';
import { PlaylistGrid } from '@/components/playlist-grid';

export const dynamic = 'force-dynamic';

export default function PlaylistsPage() {
  return (
    <>
      <Header />
      <main style={{ flex: 1, background: 'linear-gradient(to bottom, #f0f9ff, #ffffff, #f0fdf4)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px', paddingTop: '64px', paddingBottom: '64px' }}>
          <div style={{ maxWidth: '768px', margin: '0 auto', marginBottom: '48px' }}>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <h1 style={{ marginBottom: '16px', fontSize: '36px', fontWeight: 'bold', color: '#1f2937' }}>My Playlists</h1>
              <p style={{ fontSize: '18px', color: '#374151' }}>
                Create and manage your personal video playlists
              </p>
            </div>
          </div>
          <PlaylistGrid />
        </div>
      </main>
      <Footer />
    </>
  );
}
