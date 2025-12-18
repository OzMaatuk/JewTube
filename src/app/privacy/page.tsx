import { Footer } from '@/components/footer';
import { Header } from '@/components/header';
import { getConfig } from '@/lib/config';

export const dynamic = 'force-dynamic'; // Disable static generation

export default function PrivacyPage() {
  let config;
  try {
    config = getConfig();
  } catch (error) {
    // During build, config might not be available
    // Use defaults to allow build to proceed
    console.warn('Config not available for privacy page, using defaults:', error);
    config = null;
  }

  // Default values when config is not available
  const appName = config?.branding.appName || 'Video Platform';
  const coppaCompliant = config?.privacy.coppaCompliant ?? false;
  const gdprCompliant = config?.privacy.gdprCompliant ?? true;
  const disableTracking = config?.privacy.disableTracking ?? false;

  return (
    <>
      <Header />
      <main style={{ flex: 1, background: 'linear-gradient(to bottom, #f0f9ff, #ffffff, #f0fdf4)' }}>
        <div style={{ maxWidth: '896px', margin: '0 auto', padding: '0 16px', paddingTop: '32px', paddingBottom: '32px' }}>
          <h1 style={{ marginBottom: '24px', fontSize: '30px', fontWeight: 'bold', color: '#1f2937' }}>Privacy Policy</h1>

          <div style={{ maxWidth: 'none', lineHeight: '1.75', color: '#374151' }}>
            <section style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '8px' }}>Introduction</h2>
              <p style={{ marginBottom: '16px' }}>
                {appName} is committed to protecting your privacy. This policy
                explains how we handle your information.
              </p>
            </section>

            {coppaCompliant && (
              <section style={{ marginBottom: '24px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '8px' }}>COPPA Compliance</h2>
                <p style={{ marginBottom: '16px' }}>
                  This service is compliant with the Children&apos;s Online Privacy Protection Act
                  (COPPA). We do not collect personal information from children under 13 without
                  parental consent.
                </p>
              </section>
            )}

            {gdprCompliant && (
              <section style={{ marginBottom: '24px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '8px' }}>GDPR Compliance</h2>
                <p style={{ marginBottom: '16px' }}>
                  We comply with the General Data Protection Regulation (GDPR) for users in the
                  European Union. You have the right to access, correct, or delete your personal
                  data.
                </p>
              </section>
            )}

            <section style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '8px' }}>Data Collection</h2>
              {disableTracking ? (
                <p style={{ marginBottom: '16px' }}>
                  We do not collect any personal data or use tracking technologies. Your privacy is
                  fully protected.
                </p>
              ) : (
                <p style={{ marginBottom: '16px' }}>
                  We may collect anonymous usage data to improve our service. This data cannot be
                  used to identify you personally.
                </p>
              )}
            </section>

            <section style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '8px' }}>Content Safety</h2>
              <p style={{ marginBottom: '16px' }}>
                All video content is curated and filtered for safety. We use automated filters to
                ensure appropriate content for our audience.
              </p>
            </section>

            <section style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '8px' }}>Third-Party Services</h2>
              <p style={{ marginBottom: '16px' }}>
                Videos are hosted on YouTube. When you watch a video, YouTube&apos;s privacy policy also
                applies. We do not control YouTube&apos;s data collection practices.
              </p>
            </section>

            <section style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '8px' }}>Contact</h2>
              <p style={{ marginBottom: '16px' }}>
                If you have questions about this privacy policy, please contact us through our
                website.
              </p>
            </section>

            <p style={{ fontSize: '14px', color: '#6b7280' }}>Last updated: {new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
