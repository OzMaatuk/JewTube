import { Footer } from '@/components/footer';
import { Header } from '@/components/header';
import { SearchForm } from '@/components/search-form';
import { VideoGrid } from '@/components/video-grid';
import { getContentService } from '@/lib/services';

export const dynamic = 'force-dynamic';

interface SearchPageProps {
  searchParams: { q?: string };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const searchParamsResolved = await searchParams;
  const query = searchParamsResolved.q || '';
  let videos: any[] = [];

  if (query) {
    const contentService = getContentService();
    videos = await contentService.getVideos({ q: query, limit: 50 });
  }

  return (
    <>
      <Header />
      <main style={{ flex: 1, background: 'linear-gradient(to bottom, #f0f9ff, #ffffff, #f0fdf4)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px', paddingTop: '64px', paddingBottom: '64px' }}>
          <div style={{ maxWidth: '768px', margin: '0 auto', marginBottom: '48px' }}>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <h1 style={{ marginBottom: '16px', fontSize: '36px', fontWeight: 'bold', color: '#1f2937' }}>Search Videos</h1>
              <p style={{ fontSize: '18px', color: '#374151' }}>
                Find videos by title, description, channel, or tags
              </p>
            </div>
            <SearchForm />
          </div>

          {query && (
            <div>
              <h2 style={{ marginBottom: '24px', fontSize: '24px', fontWeight: '600', color: '#1f2937' }}>
                Search results for &quot;{query}&quot;
              </h2>
              {videos.length > 0 ? (
                <VideoGrid videos={videos} />
              ) : (
                <div style={{ textAlign: 'center', padding: '48px', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                  <p style={{ fontSize: '18px', color: '#6b7280' }}>No videos found matching your search.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
