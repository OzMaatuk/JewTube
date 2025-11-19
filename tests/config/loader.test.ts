import { ConfigurationValidationError } from '@/lib/config/errors';
import { clearConfigCache, loadConfig, validateConfig } from '@/lib/config/loader';
import { beforeEach, describe, expect, it } from 'vitest';

describe('Configuration Loader', () => {
  beforeEach(() => {
    clearConfigCache();
  });

  it('should load valid configuration file', () => {
    const config = loadConfig('./config/children.example.yaml');
    expect(config.deployment.id).toBe('children-content');
    expect(config.branding.appName).toBe('Kids Safe Videos');
  });

  it('should validate configuration schema', () => {
    const validConfig = {
      deployment: {
        id: 'test-deployment',
        name: 'Test',
        domain: 'test.com',
      },
      branding: {
        appName: 'Test App',
        logo: '/logo.png',
        favicon: '/favicon.ico',
        colorScheme: {
          primary: '#FF0000',
          secondary: '#00FF00',
          background: '#FFFFFF',
          text: '#000000',
          accent: '#0000FF',
        },
      },
      content: {
        sources: [{ type: 'channel', id: 'UC123' }],
        refreshInterval: 30,
        manualApprovalMode: false,
      },
      filters: {
        enabled: true,
        sensitivity: 'moderate',
        rules: [],
        dryRunMode: false,
      },
      privacy: {
        coppaCompliant: false,
        gdprCompliant: true,
        disableTracking: false,
      },
      features: {
        enableSearch: false,
        enableComments: false,
        enableSharing: true,
        enablePlaylists: false,
      },
      api: {
        youtubeApiKey: 'test-key',
        rateLimit: {
          requestsPerDay: 10000,
          requestsPerMinute: 100,
          burstLimit: 150,
        },
      },
    };

    expect(() => validateConfig(validConfig)).not.toThrow();
  });

  it('should reject invalid configuration', () => {
    const invalidConfig = {
      deployment: {
        id: 'INVALID ID', // Should be lowercase with hyphens
        name: 'Test',
        domain: 'test.com',
      },
    };

    expect(() => validateConfig(invalidConfig)).toThrow(ConfigurationValidationError);
  });
});
