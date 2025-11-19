import { getConfig } from '@/lib/config';
import { getLogger } from '@/lib/logger';
import { NextResponse } from 'next/server';

const logger = getLogger('api-config');

export const revalidate = 3600; // Cache for 1 hour

/**
 * GET /api/config/public
 * Get public configuration (branding, features, privacy)
 * Excludes sensitive data like API keys
 */
export async function GET() {
  try {
    const config = getConfig();

    // Return only public configuration
    const publicConfig = {
      deployment: {
        id: config.deployment.id,
        name: config.deployment.name,
      },
      branding: {
        appName: config.branding.appName,
        logo: config.branding.logo,
        favicon: config.branding.favicon,
        colorScheme: config.branding.colorScheme,
      },
      features: config.features,
      privacy: {
        coppaCompliant: config.privacy.coppaCompliant,
        gdprCompliant: config.privacy.gdprCompliant,
        disableTracking: config.privacy.disableTracking,
        ageGate: config.privacy.ageGate,
      },
    };

    return NextResponse.json(publicConfig);
  } catch (error) {
    logger.error({ error }, 'Failed to get public config');

    return NextResponse.json(
      {
        error: 'Failed to load configuration',
      },
      { status: 500 }
    );
  }
}
