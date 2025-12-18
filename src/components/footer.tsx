import { getConfig } from '@/lib/config';
import Link from 'next/link';
import { FooterClient } from './footer-client';

export function Footer() {
  let config;
  try {
    config = getConfig();
  } catch (error) {
    // During build, config might not be available
    // Use defaults to allow build to proceed
    console.warn('Config not available for footer, using defaults:', error);
    config = null;
  }

  const currentYear = new Date().getFullYear();
  const appName = config?.branding.appName || 'Video Platform';
  const deploymentName = config?.deployment.name || 'Video Platform';
  const coppaCompliant = config?.privacy.coppaCompliant ?? false;
  const gdprCompliant = config?.privacy.gdprCompliant ?? false;
  const disableTracking = config?.privacy.disableTracking ?? false;

  return (
    <FooterClient
      currentYear={currentYear}
      appName={appName}
      deploymentName={deploymentName}
      coppaCompliant={coppaCompliant}
      gdprCompliant={gdprCompliant}
      disableTracking={disableTracking}
    />
  );
}
