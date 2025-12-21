import { Footer } from '@/components/footer';
import { Header } from '@/components/header';
import { PlaylistDetail } from '@/components/playlist-detail';

interface PlaylistPageProps {
  params: { id: string };
}

export default async function PlaylistPage({ params }: PlaylistPageProps) {
  const paramsResolved = await params;
  return (
    <>
      <Header />
      <main style={{ flex: 1, background: 'linear-gradient(to bottom, #f0f9ff, #ffffff, #f0fdf4)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px', paddingTop: '64px', paddingBottom: '64px' }}>
          <PlaylistDetail playlistId={paramsResolved.id} />
        </div>
      </main>
      <Footer />
    </>
  );
}