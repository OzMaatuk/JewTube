import { getConfig } from '@/lib/config';
import Link from 'next/link';

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
  const gdprCompliant = config?.privacy.gdprCompliant ?? true;
  const disableTracking = config?.privacy.disableTracking ?? false;

  return (
    <footer className="mt-auto border-t bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* Brand */}
          <div>
            <h3 className="mb-2 text-lg font-semibold" style={{ color: 'var(--primary)' }}>
              {appName}
            </h3>
            <p className="text-sm text-gray-600">
              Curated video content for {deploymentName}
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="mb-2 text-sm font-semibold">Legal</h4>
            <ul className="space-y-1 text-sm">
              <li>
                <Link href="/privacy" className="text-gray-600 hover:text-primary">
                  Privacy Policy
                </Link>
              </li>
              {coppaCompliant && (
                <li>
                  <span className="text-xs text-gray-500">COPPA Compliant</span>
                </li>
              )}
              {gdprCompliant && (
                <li>
                  <span className="text-xs text-gray-500">GDPR Compliant</span>
                </li>
              )}
            </ul>
          </div>

          {/* Info */}
          <div>
            <h4 className="mb-2 text-sm font-semibold">Information</h4>
            <p className="text-xs text-gray-500">Content is curated and filtered for safety.</p>
            {disableTracking && (
              <p className="mt-2 text-xs text-gray-500">🔒 No tracking or analytics</p>
            )}
          </div>
        </div>

        <div className="mt-8 border-t pt-4 text-center text-sm text-gray-500">
          © {currentYear} {appName}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
