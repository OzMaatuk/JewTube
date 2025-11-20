import { z } from 'zod';

// Color scheme schema
export const colorSchemeSchema = z.object({
  primary: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color'),
  secondary: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color'),
  background: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color'),
  text: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color'),
  accent: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color'),
});

// Branding schema
export const brandingSchema = z.object({
  appName: z.string().min(1, 'App name is required').max(100),
  logo: z.string().min(1, 'Logo path is required'),
  favicon: z.string().min(1, 'Favicon path is required'),
  colorScheme: colorSchemeSchema,
  customCSS: z.string().optional(),
});

// Content source schema
export const contentSourceSchema = z.object({
  type: z.enum(['channel', 'playlist', 'video', 'search']),
  id: z.string().min(1, 'Source ID is required'),
  params: z.record(z.any()).optional(),
});

// Content configuration schema
export const contentSchema = z.object({
  sources: z.array(contentSourceSchema).min(1, 'At least one content source is required'),
  refreshInterval: z.number().min(5).max(1440), // 5 minutes to 24 hours
  manualApprovalMode: z.boolean().default(false),
});

// Filter condition schema
export const filterConditionSchema = z.object({
  field: z.string().min(1),
  operator: z.enum(['equals', 'contains', 'regex', 'gt', 'lt', 'in']),
  value: z.any(),
});

// Filter rule schema
export const filterRuleSchema = z.object({
  id: z.string().min(1, 'Filter rule ID is required'),
  type: z.enum([
    'metadata',
    'content',
    'source',
    'pattern',
    'behavioral',
    'temporal',
    'allowlist',
    'blocklist',
    'external',
    'ml',
  ]),
  conditions: z.array(filterConditionSchema).min(1, 'At least one condition is required'),
  action: z.enum(['block', 'allow']),
  logic: z.enum(['AND', 'OR']).optional(),
});

// Filters configuration schema
export const filtersSchema = z.object({
  enabled: z.boolean().default(true),
  sensitivity: z.enum(['strict', 'moderate', 'permissive']).default('moderate'),
  rules: z.array(filterRuleSchema).default([]),
  dryRunMode: z.boolean().default(false),
});

// Age gate configuration schema
export const ageGateSchema = z.object({
  enabled: z.boolean().default(false),
  minimumAge: z.number().min(0).max(100).default(13),
  verificationMethod: z.enum(['simple', 'date-of-birth']).default('simple'),
  redirectUrl: z.string().url().optional(),
});

// Privacy configuration schema
export const privacySchema = z.object({
  coppaCompliant: z.boolean().default(false),
  gdprCompliant: z.boolean().default(true),
  disableTracking: z.boolean().default(false),
  ageGate: ageGateSchema.optional(),
});

// Features configuration schema
export const featuresSchema = z.object({
  enableSearch: z.boolean().default(false),
  enableComments: z.boolean().default(false),
  enableSharing: z.boolean().default(true),
  enablePlaylists: z.boolean().default(false),
});

// Rate limit configuration schema
export const rateLimitSchema = z.object({
  requestsPerDay: z.number().min(100).max(1000000).default(10000),
  requestsPerMinute: z.number().min(10).max(1000).default(100),
  burstLimit: z.number().min(10).max(500).default(150),
});

// API configuration schema
export const apiSchema = z.object({
  youtubeApiKey: z
    .string()
    .min(1, 'YouTube API key is required')
    .refine(
      (val) => {
        // Allow placeholder values during build time
        if (val.startsWith('__BUILD_PLACEHOLDER_')) {
          return true;
        }
        return val.length > 0;
      },
      { message: 'YouTube API key is required' }
    ),
  rateLimit: rateLimitSchema.default({
    requestsPerDay: 10000,
    requestsPerMinute: 100,
    burstLimit: 150,
  }),
});

// Deployment configuration schema
export const deploymentSchema = z.object({
  id: z
    .string()
    .min(1, 'Deployment ID is required')
    .regex(/^[a-z0-9-]+$/, 'Deployment ID must be lowercase alphanumeric with hyphens'),
  name: z.string().min(1, 'Deployment name is required').max(200),
  domain: z.string().min(1, 'Domain is required'),
});

// Main configuration schema
export const configSchema = z.object({
  deployment: deploymentSchema,
  branding: brandingSchema,
  content: contentSchema,
  filters: filtersSchema,
  privacy: privacySchema,
  features: featuresSchema,
  api: apiSchema,
});

// Export types inferred from schemas
export type ColorScheme = z.infer<typeof colorSchemeSchema>;
export type Branding = z.infer<typeof brandingSchema>;
export type ContentSource = z.infer<typeof contentSourceSchema>;
export type Content = z.infer<typeof contentSchema>;
export type FilterCondition = z.infer<typeof filterConditionSchema>;
export type FilterRule = z.infer<typeof filterRuleSchema>;
export type Filters = z.infer<typeof filtersSchema>;
export type AgeGate = z.infer<typeof ageGateSchema>;
export type Privacy = z.infer<typeof privacySchema>;
export type Features = z.infer<typeof featuresSchema>;
export type RateLimit = z.infer<typeof rateLimitSchema>;
export type Api = z.infer<typeof apiSchema>;
export type Deployment = z.infer<typeof deploymentSchema>;
export type DeploymentConfig = z.infer<typeof configSchema>;
