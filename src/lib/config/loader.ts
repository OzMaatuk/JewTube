import { existsSync, readFileSync, watchFile } from 'node:fs';
import { parse as parseYAML } from 'yaml';
import {
  ConfigurationError,
  ConfigurationNotFoundError,
  ConfigurationValidationError,
} from './errors';
import { type DeploymentConfig, configSchema } from './schema';

let cachedConfig: DeploymentConfig | null = null;
let configFilePath: string | null = null;
let watcherInitialized = false;

/**
 * Load configuration from file with environment variable merging
 */
export function loadConfig(filePath?: string): DeploymentConfig {
  const path = filePath || process.env.CONFIG_FILE || './config/deployment.yaml';

  // Return cached config if available and path hasn't changed
  if (cachedConfig && configFilePath === path) {
    return cachedConfig;
  }

  // Check if file exists
  if (!existsSync(path)) {
    throw new ConfigurationNotFoundError(path);
  }

  try {
    // Read file content
    const fileContent = readFileSync(path, 'utf-8');

    // Parse based on file extension
    let rawConfig: unknown;
    if (path.endsWith('.yaml') || path.endsWith('.yml')) {
      rawConfig = parseYAML(fileContent);
    } else if (path.endsWith('.json')) {
      rawConfig = JSON.parse(fileContent);
    } else {
      throw new ConfigurationError(
        'Unsupported configuration file format. Use .yaml, .yml, or .json'
      );
    }

    // Merge environment variables for sensitive data
    const configWithEnv = mergeEnvironmentVariables(rawConfig);

    // Validate configuration
    const result = configSchema.safeParse(configWithEnv);

    if (!result.success) {
      const errors = result.error.errors.map((err) => `${err.path.join('.')}: ${err.message}`);
      // During build time, log errors but allow partial config loading
      if (isBuildTime()) {
        console.warn('Configuration validation failed during build:', errors);
        // Try to extract a partial valid config for build purposes
        // This allows static page generation to proceed
        const partialConfig = extractPartialConfig(configWithEnv);
        if (partialConfig) {
          cachedConfig = partialConfig;
          configFilePath = path;
          return partialConfig;
        }
      }
      throw new ConfigurationValidationError('Configuration validation failed', errors);
    }

    // Cache the validated configuration
    cachedConfig = result.data;
    configFilePath = path;

    // Set up file watcher for hot-reload (only once)
    if (!watcherInitialized && process.env.NODE_ENV !== 'production') {
      setupConfigWatcher(path);
      watcherInitialized = true;
    }

    return cachedConfig;
  } catch (error) {
    if (error instanceof ConfigurationError) {
      throw error;
    }
    throw new ConfigurationError(
      `Failed to load configuration: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Check if we're in a Next.js build context
 */
function isBuildTime(): boolean {
  // Next.js sets NEXT_PHASE during build
  // Also check if we're in a static generation context (no runtime available)
  return (
    process.env.NEXT_PHASE === 'phase-production-build' ||
    // During static page generation, NEXT_RUNTIME is not set
    (typeof window === 'undefined' && process.env.NEXT_RUNTIME === undefined && process.env.NODE_ENV === 'production')
  );
}

/**
 * Extract a partial valid config from raw config for build-time use
 * This creates a minimal valid config structure when full validation fails
 */
function extractPartialConfig(rawConfig: unknown): DeploymentConfig | null {
  if (typeof rawConfig !== 'object' || rawConfig === null) {
    return null;
  }

  const config = rawConfig as Record<string, unknown>;

  // Extract what we can from the config file
  const deployment = config.deployment as Record<string, unknown> | undefined;
  const branding = config.branding as Record<string, unknown> | undefined;
  const privacy = config.privacy as Record<string, unknown> | undefined;
  const features = config.features as Record<string, unknown> | undefined;

  // Create a minimal valid config with defaults
  try {
    return {
      deployment: {
        id: (deployment?.id as string) || 'default-deployment',
        name: (deployment?.name as string) || 'Video Platform',
        domain: (deployment?.domain as string) || 'example.com',
      },
      branding: {
        appName: (branding?.appName as string) || 'Video Platform',
        logo: (branding?.logo as string) || '/logo.png',
        favicon: (branding?.favicon as string) || '/favicon.ico',
        colorScheme: {
          primary: (branding?.colorScheme as Record<string, unknown>)?.primary as string || '#3B82F6',
          secondary: (branding?.colorScheme as Record<string, unknown>)?.secondary as string || '#10B981',
          background: (branding?.colorScheme as Record<string, unknown>)?.background as string || '#FFFFFF',
          text: (branding?.colorScheme as Record<string, unknown>)?.text as string || '#1F2937',
          accent: (branding?.colorScheme as Record<string, unknown>)?.accent as string || '#F59E0B',
        },
        customCSS: branding?.customCSS as string | undefined,
      },
      content: {
        sources: (() => {
          const sources = (config.content as Record<string, unknown>)?.sources;
          if (Array.isArray(sources) && sources.length > 0) {
            // Filter out invalid sources and ensure all have required fields
            const validSources = sources
              .filter((s): s is Record<string, unknown> =>
                typeof s === 'object' &&
                s !== null &&
                typeof (s as Record<string, unknown>).id === 'string' &&
                typeof (s as Record<string, unknown>).type === 'string'
              )
              .map((s) => ({
                id: (s as Record<string, unknown>).id as string,
                platform: ((s as Record<string, unknown>).platform as string) || 'youtube',
                type: (s as Record<string, unknown>).type as string,
                params: (s as Record<string, unknown>).params as Record<string, unknown> | undefined,
              }));
            return validSources.length > 0
              ? validSources
              : [{ id: 'placeholder', platform: 'youtube', type: 'channel' }];
          }
          return [{ id: 'placeholder', platform: 'youtube', type: 'channel' }];
        })(),
        refreshInterval: ((config.content as Record<string, unknown>)?.refreshInterval as number) || 30,
        manualApprovalMode: ((config.content as Record<string, unknown>)?.manualApprovalMode as boolean) || false,
      },
      filters: {
        enabled: ((config.filters as Record<string, unknown>)?.enabled as boolean) ?? true,
        sensitivity: ((config.filters as Record<string, unknown>)?.sensitivity as 'strict' | 'moderate' | 'permissive') || 'moderate',
        rules: (Array.isArray((config.filters as Record<string, unknown>)?.rules)
          ? ((config.filters as Record<string, unknown>)?.rules as Array<{
            id: string;
            type: 'metadata' | 'content' | 'source' | 'pattern' | 'behavioral' | 'temporal' | 'allowlist' | 'blocklist' | 'external' | 'ml';
            conditions: Array<{
              field: string;
              operator: 'equals' | 'contains' | 'regex' | 'gt' | 'lt' | 'in';
              value?: unknown;
            }>;
            action: 'block' | 'allow';
            logic?: 'AND' | 'OR';
          }>)
          : []) as Array<{
            id: string;
            type: 'metadata' | 'content' | 'source' | 'pattern' | 'behavioral' | 'temporal' | 'allowlist' | 'blocklist' | 'external' | 'ml';
            conditions: Array<{
              field: string;
              operator: 'equals' | 'contains' | 'regex' | 'gt' | 'lt' | 'in';
              value?: unknown;
            }>;
            action: 'block' | 'allow';
            logic?: 'AND' | 'OR';
          }>,
        dryRunMode: ((config.filters as Record<string, unknown>)?.dryRunMode as boolean) || false,
      },
      privacy: {
        coppaCompliant: (privacy?.coppaCompliant as boolean) ?? false,
        gdprCompliant: (privacy?.gdprCompliant as boolean) ?? true,
        disableTracking: (privacy?.disableTracking as boolean) ?? false,
        ageGate: (privacy?.ageGate
          ? ({
            enabled: ((privacy.ageGate as Record<string, unknown>)?.enabled as boolean) ?? false,
            minimumAge: ((privacy.ageGate as Record<string, unknown>)?.minimumAge as number) ?? 13,
            verificationMethod: ((privacy.ageGate as Record<string, unknown>)?.verificationMethod as 'simple' | 'date-of-birth') || 'simple',
            redirectUrl: (privacy.ageGate as Record<string, unknown>)?.redirectUrl as string | undefined,
          } as {
            enabled: boolean;
            minimumAge: number;
            verificationMethod: 'simple' | 'date-of-birth';
            redirectUrl?: string;
          })
          : undefined),
      },
      features: {
        enableSearch: (features?.enableSearch as boolean) ?? false,
        enableComments: (features?.enableComments as boolean) ?? false,
        enableSharing: (features?.enableSharing as boolean) ?? true,
        enablePlaylists: (features?.enablePlaylists as boolean) ?? false,
        enableAudioOnly: (features?.enableAudioOnly as boolean) ?? true,
        hideAudioOnlyButton: (features?.hideAudioOnlyButton as boolean) ?? false,
      },
      api: {
        youtubeApiKey: '__BUILD_PLACEHOLDER_YOUTUBE_API_KEY__',
        rateLimit: {
          requestsPerDay: 10000,
          requestsPerMinute: 100,
          burstLimit: 150,
        },
      },
    };
  } catch {
    return null;
  }
}

/**
 * Merge environment variables into configuration
 * Replaces ${ENV_VAR} patterns with actual environment variable values
 */
function mergeEnvironmentVariables(config: unknown): unknown {
  if (typeof config === 'string') {
    // Replace ${VAR_NAME} with environment variable value
    const match = config.match(/^\$\{([^}]+)\}$/);
    if (match) {
      const envVar = match[1];
      const value = process.env[envVar];
      if (!value) {
        // During build time, use a placeholder to allow static page generation
        // The placeholder will be validated but won't break the build
        if (isBuildTime()) {
          console.warn(
            `Environment variable ${envVar} is not set during build, using placeholder`
          );
          return `__BUILD_PLACEHOLDER_${envVar}__`;
        }
        throw new ConfigurationError(`Environment variable ${envVar} is not set`);
      }
      return value;
    }
    return config;
  }

  if (Array.isArray(config)) {
    return config.map((item) => mergeEnvironmentVariables(item));
  }

  if (config !== null && typeof config === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(config)) {
      result[key] = mergeEnvironmentVariables(value);
    }
    return result;
  }

  return config;
}

/**
 * Set up file watcher for configuration hot-reload
 */
function setupConfigWatcher(path: string): void {
  watchFile(path, { interval: 5000 }, (curr, prev) => {
    if (curr.mtime !== prev.mtime) {
      console.log(`Configuration file changed, reloading: ${path}`);
      try {
        // Clear cache to force reload
        cachedConfig = null;
        loadConfig(path);
        console.log('Configuration reloaded successfully');
      } catch (error) {
        console.error('Failed to reload configuration:', error);
      }
    }
  });
}

/**
 * Get current configuration (must be loaded first)
 */
export function getConfig(): DeploymentConfig {
  if (!cachedConfig) {
    try {
      return loadConfig();
    } catch (error) {
      // During build time, config might not be available
      // Return a minimal config to allow build to proceed
      if (process.env.NODE_ENV === 'production' && !process.env.CONFIG_FILE) {
        console.warn('Config file not found during build, using minimal config');
        throw error; // Still throw to prevent invalid builds
      }
      throw error;
    }
  }
  return cachedConfig;
}

/**
 * Clear cached configuration (useful for testing)
 */
export function clearConfigCache(): void {
  cachedConfig = null;
  configFilePath = null;
}

/**
 * Validate a configuration object without loading from file
 */
export function validateConfig(config: unknown): DeploymentConfig {
  const result = configSchema.safeParse(config);

  if (!result.success) {
    const errors = result.error.errors.map((err) => `${err.path.join('.')}: ${err.message}`);
    throw new ConfigurationValidationError('Configuration validation failed', errors);
  }

  return result.data;
}
