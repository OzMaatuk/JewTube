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
    <footer style={{ marginTop: 'auto', borderTop: '2px solid #e5e7eb', background: 'linear-gradient(to right, #f9fafb, #ffffff)' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px', paddingTop: '64px', paddingBottom: '64px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '48px' }}>
          {/* Brand */}
          <div>
            <h3 style={{ fontSize: '30px', fontWeight: 'bold', marginBottom: '16px', background: 'linear-gradient(to right, #2563eb, #10b981)', backgroundClip: 'text', WebkitBackgroundClip: 'text', color: 'transparent' }}>
              {appName}
            </h3>
            <p style={{ fontSize: '16px', color: '#6b7280', lineHeight: '1.6' }}>
              Curated video content for {deploymentName}
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', marginBottom: '16px' }}>Legal</h4>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <li>
                <Link href="/privacy" style={{ fontSize: '16px', color: '#6b7280', transition: 'color 0.2s', fontWeight: '500' }} className="hover:text-blue-600">
                  Privacy Policy
                </Link>
              </li>
              {coppaCompliant && (
                <li>
                  <span style={{ display: 'inline-flex', alignItems: 'center', padding: '6px 12px', borderRadius: '9999px', fontSize: '14px', fontWeight: '600', backgroundColor: '#dcfce7', color: '#166534' }}>
                    ✓ COPPA Compliant
                  </span>
                </li>
              )}
              {gdprCompliant && (
                <li>
                  <span style={{ display: 'inline-flex', alignItems: 'center', padding: '6px 12px', borderRadius: '9999px', fontSize: '14px', fontWeight: '600', backgroundColor: '#dcfce7', color: '#166534' }}>
                    ✓ GDPR Compliant
                  </span>
                </li>
              )}
            </ul>
          </div>

          {/* Info */}
          <div>
            <h4 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', marginBottom: '16px' }}>Information</h4>
            <p style={{ fontSize: '16px', color: '#6b7280', marginBottom: '16px' }}>Content is curated and filtered for safety.</p>
            {disableTracking && (
              <p style={{ display: 'inline-flex', alignItems: 'center', padding: '6px 12px', borderRadius: '9999px', fontSize: '14px', fontWeight: '600', backgroundColor: '#dbeafe', color: '#1e40af' }}>
                🔒 No tracking or analytics
              </p>
            )}
          </div>
        </div>

        <div style={{ marginTop: '48px', borderTop: '1px solid #e5e7eb', paddingTop: '32px', textAlign: 'center' }}>
          <p style={{ fontSize: '16px', color: '#6b7280' }}>
            © {currentYear} {appName}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
