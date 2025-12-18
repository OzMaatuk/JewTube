import { getConfig } from '@/lib/config';
import Image from 'next/image';
import Link from 'next/link';

export function Header() {
  let config;
  try {
    config = getConfig();
  } catch (error) {
    // During build, config might not be available
    // Use defaults to allow build to proceed
    console.warn('Config not available for header, using defaults:', error);
    config = null;
  }

  const appName = config?.branding.appName || 'Video Platform';
  const logo = config?.branding.logo;
  const enableSearch = config?.features.enableSearch ?? false;
  const enablePlaylists = config?.features.enablePlaylists ?? false;

  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 50, width: '100%', borderBottom: '2px solid #e5e7eb', backgroundColor: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(16px)', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', height: '96px', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '16px', transform: 'scale(1)', transition: 'transform 0.2s' }} className="hover:scale-105">
          {logo && (
            <Image
              src={logo}
              alt={appName}
              width={48}
              height={48}
              style={{ height: '48px', width: '48px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
            />
          )}
          <span style={{ fontSize: '30px', fontWeight: 'bold', background: 'linear-gradient(to right, #2563eb, #10b981)', backgroundClip: 'text', WebkitBackgroundClip: 'text', color: 'transparent' }}>
            {appName}
          </span>
        </Link>

        <nav style={{ display: 'none', alignItems: 'center', gap: '40px' }} className="md:flex">
          <Link
            href="/"
            style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', transition: 'all 0.2s', padding: '8px 0', position: 'relative' }}
            className="hover:text-blue-600 nav-link"
          >
            Home
            <span style={{ position: 'absolute', bottom: '-1px', left: 0, width: 0, height: '2px', backgroundColor: '#2563eb', transition: 'width 0.2s', borderRadius: '2px' }}></span>
          </Link>
          {enableSearch && (
            <Link
              href="/search"
              style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', transition: 'all 0.2s', padding: '8px 0', position: 'relative' }}
              className="hover:text-blue-600 nav-link"
            >
              Search
              <span style={{ position: 'absolute', bottom: '-1px', left: 0, width: 0, height: '2px', backgroundColor: '#2563eb', transition: 'width 0.2s', borderRadius: '2px' }}></span>
            </Link>
          )}
          {enablePlaylists && (
            <Link
              href="/playlists"
              style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', transition: 'all 0.2s', padding: '8px 0', position: 'relative' }}
              className="hover:text-blue-600 nav-link"
            >
              Playlists
              <span style={{ position: 'absolute', bottom: '-1px', left: 0, width: 0, height: '2px', backgroundColor: '#2563eb', transition: 'width 0.2s', borderRadius: '2px' }}></span>
            </Link>
          )}
        </nav>

        {/* Mobile menu button */}
        <button style={{ display: 'none', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb', transition: 'background-color 0.2s' }} className="md:hidden hover:bg-gray-100">
          <svg style={{ width: '24px', height: '24px', color: '#374151' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
    </header>
  );
}
