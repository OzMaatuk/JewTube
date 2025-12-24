import { getConfig } from '@/lib/config';
import { setDeploymentId } from '@/lib/logger';
import { AudioOnlyProvider } from '@/lib/audio-only-context';
import type { Metadata, Viewport } from 'next';
import './globals.css';

export async function generateMetadata(): Promise<Metadata> {
  try {
    const config = getConfig();

    return {
      title: {
        default: config.branding.appName,
        template: `%s | ${config.branding.appName}`,
      },
      description: `Curated video content for ${config.deployment.name}`,
      icons: {
        icon: config.branding.favicon,
        apple: config.branding.favicon,
      },
      manifest: '/manifest.json',
      appleWebApp: {
        capable: true,
        statusBarStyle: 'default',
        title: config.branding.appName,
      },
      formatDetection: {
        telephone: false,
      },
      openGraph: {
        title: config.branding.appName,
        description: `Curated video content for ${config.deployment.name}`,
        type: 'website',
        locale: 'en_US',
      },
    };
  } catch (error) {
    // Return minimal metadata if config is not available
    console.warn('Config not available for metadata, using defaults');
    return {
      title: 'Video Platform',
      description: 'Curated video content',
    };
  }
}

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let config;
  try {
    config = getConfig();
    // Set deployment ID for logging
    setDeploymentId(config.deployment.id);
  } catch (error) {
    // During build, config might not be available
    // Use defaults to allow build to proceed
    console.warn('Config not available, using defaults:', error);
    config = null;
  }

  // Apply custom CSS variables from config
  const style = config ? {
    '--primary': config.branding.colorScheme.primary,
    '--secondary': config.branding.colorScheme.secondary,
    '--background': config.branding.colorScheme.background,
    '--foreground': config.branding.colorScheme.text,
    '--accent': config.branding.colorScheme.accent,
  } as React.CSSProperties & Record<string, string> : {
    // Fallback colors if config fails to load
    '--primary': '#3B82F6',
    '--secondary': '#10B981',
    '--background': '#FFFFFF',
    '--foreground': '#1F2937',
    '--accent': '#F59E0B',
  } as React.CSSProperties & Record<string, string>;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {config?.branding.customCSS && (
          <style
            // biome-ignore lint/security/noDangerouslySetInnerHtml: Custom CSS from trusted config
            dangerouslySetInnerHTML={{ __html: config.branding.customCSS }}
          />
        )}
      </head>
      <body style={style}>
        <AudioOnlyProvider>
          <div style={{ display: 'flex', minHeight: '100vh', flexDirection: 'column' }}>{children}</div>
        </AudioOnlyProvider>
      </body>
    </html>
  );
}
