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
      <main className="flex-1">
        <div className="container mx-auto max-w-4xl px-4 py-8">
          <h1 className="mb-6 text-3xl font-bold">Privacy Policy</h1>

          <div className="prose prose-gray max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-semibold">Introduction</h2>
              <p>
                {appName} is committed to protecting your privacy. This policy
                explains how we handle your information.
              </p>
            </section>

            {coppaCompliant && (
              <section>
                <h2 className="text-2xl font-semibold">COPPA Compliance</h2>
                <p>
                  This service is compliant with the Children&apos;s Online Privacy Protection Act
                  (COPPA). We do not collect personal information from children under 13 without
                  parental consent.
                </p>
              </section>
            )}

            {gdprCompliant && (
              <section>
                <h2 className="text-2xl font-semibold">GDPR Compliance</h2>
                <p>
                  We comply with the General Data Protection Regulation (GDPR) for users in the
                  European Union. You have the right to access, correct, or delete your personal
                  data.
                </p>
              </section>
            )}

            <section>
              <h2 className="text-2xl font-semibold">Data Collection</h2>
              {disableTracking ? (
                <p>
                  We do not collect any personal data or use tracking technologies. Your privacy is
                  fully protected.
                </p>
              ) : (
                <p>
                  We may collect anonymous usage data to improve our service. This data cannot be
                  used to identify you personally.
                </p>
              )}
            </section>

            <section>
              <h2 className="text-2xl font-semibold">Content Safety</h2>
              <p>
                All video content is curated and filtered for safety. We use automated filters to
                ensure appropriate content for our audience.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold">Third-Party Services</h2>
              <p>
                Videos are hosted on YouTube. When you watch a video, YouTube&apos;s privacy policy also
                applies. We do not control YouTube&apos;s data collection practices.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold">Contact</h2>
              <p>
                If you have questions about this privacy policy, please contact us through our
                website.
              </p>
            </section>

            <p className="text-sm text-gray-500">Last updated: {new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
