import { getConfig } from '@/lib/config';
import Image from 'next/image';
import Link from 'next/link';
import { HeaderClient } from './header-client';

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
  const enableSearch = config?.features.enableSearch ?? true; // Default to true
  const enablePlaylists = config?.features.enablePlaylists ?? true; // Default to true

  return (
    <HeaderClient
      appName={appName}
      logo={logo}
      enableSearch={enableSearch}
      enablePlaylists={enablePlaylists}
    />
  );
}
