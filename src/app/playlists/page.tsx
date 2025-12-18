import { Footer } from '@/components/footer';
import { Header } from '@/components/header';

export const dynamic = 'force-dynamic';

export default function PlaylistsPage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-16">
          <div className="mx-auto max-w-3xl">
            <div className="rounded-2xl bg-gradient-to-br from-purple-50 to-blue-50 p-12 text-center shadow-lg">
              <div className="mb-6 text-6xl">📚</div>
              <h1 className="mb-4 text-4xl font-bold text-gray-900">Playlists</h1>
              <p className="mb-8 text-lg text-gray-700">
                Curated playlists will be available here soon. Check back later for organized
                collections of videos tailored just for you.
              </p>
              <div className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-medium text-gray-600 shadow-sm">
                <span className="h-2 w-2 animate-pulse rounded-full bg-blue-500"></span>
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
