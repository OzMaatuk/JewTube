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
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center px-4">
        <Link href="/" className="flex items-center space-x-2">
          {logo && (
            <Image
              src={logo}
              alt={appName}
              width={32}
              height={32}
              className="h-8 w-8"
            />
          )}
          <span className="text-xl font-bold" style={{ color: 'var(--primary)' }}>
            {appName}
          </span>
        </Link>

        <nav className="ml-auto flex items-center space-x-6">
          {enableSearch && (
            <Link
              href="/search"
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              Search
            </Link>
          )}
          {enablePlaylists && (
            <Link
              href="/playlists"
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              Playlists
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
