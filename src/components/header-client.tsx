'use client';

import Image from 'next/image';
import Link from 'next/link';

interface HeaderClientProps {
  appName: string;
  logo?: string;
  enableSearch: boolean;
  enablePlaylists: boolean;
}

export function HeaderClient({ appName, logo, enableSearch, enablePlaylists }: HeaderClientProps) {
  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 50, width: '100%', borderBottom: '2px solid #e5e7eb', backgroundColor: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(16px)', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', height: '96px', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '16px', transform: 'scale(1)', transition: 'transform 0.2s' }}
        >
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

        <nav style={{ display: 'flex', alignItems: 'center', gap: '40px' }}>
          <Link
            href="/"
            style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', transition: 'all 0.2s', padding: '8px 0', position: 'relative' }}
          >
            Home
            <span style={{ position: 'absolute', bottom: '-1px', left: 0, width: 0, height: '2px', backgroundColor: '#2563eb', transition: 'width 0.2s', borderRadius: '2px' }}></span>
          </Link>
          {enableSearch && (
            <Link
              href="/search"
              style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', transition: 'all 0.2s', padding: '8px 0', position: 'relative' }}
            >
              Search
              <span style={{ position: 'absolute', bottom: '-1px', left: 0, width: 0, height: '2px', backgroundColor: '#2563eb', transition: 'width 0.2s', borderRadius: '2px' }}></span>
            </Link>
          )}
          {enablePlaylists && (
            <Link
              href="/playlists"
              style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', transition: 'all 0.2s', padding: '8px 0', position: 'relative' }}
            >
              Playlists
              <span style={{ position: 'absolute', bottom: '-1px', left: 0, width: 0, height: '2px', backgroundColor: '#2563eb', transition: 'width 0.2s', borderRadius: '2px' }}></span>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}