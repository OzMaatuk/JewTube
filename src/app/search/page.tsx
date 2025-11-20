import { Footer } from '@/components/footer';
import { Header } from '@/components/header';

export default function SearchPage() {
  return (
    <>
      <Header />
      <main className="flex-1" style={{ backgroundColor: '#f9fafb' }}>
        <div className="container mx-auto px-4 py-16">
          <div className="mx-auto max-w-3xl">
            <div 
              className="rounded-lg p-12 text-center"
              style={{ 
                background: 'linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%)',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
              }}
            >
              <div className="mb-6" style={{ fontSize: '4rem' }}>🔍</div>
              <h1 className="mb-4 text-4xl font-bold" style={{ color: '#111827' }}>Search</h1>
              <p className="mb-8 text-lg" style={{ color: '#374151' }}>
                Video search functionality will be available here soon. You'll be able to find
                videos by title, channel, or topic.
              </p>
              <div 
                className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium"
                style={{ 
                  backgroundColor: 'white',
                  color: '#4b5563',
                  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                }}
              >
                <span 
                  className="animate-pulse rounded-full"
                  style={{ 
                    height: '8px',
                    width: '8px',
                    backgroundColor: '#6366f1'
                  }}
                ></span>
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
