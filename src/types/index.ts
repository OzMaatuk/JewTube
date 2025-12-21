// Re-export config types from schema
import type { FilterCondition, FilterRule } from '@/lib/config/schema';
export type { FilterCondition, FilterRule };

// Core data models
export interface Video {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  thumbnailHigh?: string;
  channelId: string;
  channelName: string;
  channelThumbnail?: string;
  publishedAt: Date;
  duration: number; // seconds
  viewCount: number;
  likeCount?: number;
  commentCount?: number;
  tags: string[];
  categoryId: string;
  categoryName: string;
  defaultLanguage?: string;
  defaultAudioLanguage?: string;
  contentRating: ContentRating;
  hasClosedCaptions: boolean;
  isLiveContent: boolean;
  metadata: VideoMetadata;
}

export interface VideoMetadata {
  fetchedAt: Date;
  sourceType: 'channel' | 'playlist' | 'video' | 'search';
  sourceId: string;
  filterResults?: FilterResult[];
}

export interface ContentRating {
  ytRating?: string;
  madeForKids: boolean;
  ageRestricted: boolean;
}

export interface Channel {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  subscriberCount: number;
  videoCount: number;
  verified: boolean;
  customUrl?: string;
}

export interface Playlist {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  channelId: string;
  channelName: string;
  itemCount: number;
  publishedAt: Date;
}

// User-created playlists
export interface UserPlaylist {
  id: string;
  title: string;
  description: string;
  videos: string[]; // video IDs
  createdAt: Date;
  updatedAt: Date;
}

// Configuration models
export interface DeploymentConfig {
  deployment: {
    id: string;
    name: string;
    domain: string;
  };

  branding: {
    appName: string;
    logo: string;
    favicon: string;
    colorScheme: ColorScheme;
    customCSS?: string;
  };

  content: {
    sources: ContentSource[];
    refreshInterval: number; // minutes
    manualApprovalMode: boolean;
  };

  filters: {
    enabled: boolean;
    sensitivity: 'strict' | 'moderate' | 'permissive';
    rules: Array<FilterRule>;
    dryRunMode: boolean;
  };

  privacy: {
    coppaCompliant: boolean;
    gdprCompliant: boolean;
    disableTracking: boolean;
    ageGate?: AgeGateConfig;
  };

  features: {
    enableSearch: boolean;
    enableComments: boolean;
    enableSharing: boolean;
    enablePlaylists: boolean;
  };

  api: {
    youtubeApiKey: string;
    rateLimit: RateLimitConfig;
  };
}

export interface ColorScheme {
  primary: string;
  secondary: string;
  background: string;
  text: string;
  accent: string;
}

export interface ContentSource {
  type: 'channel' | 'playlist' | 'video' | 'search';
  id: string;
  params?: Record<string, unknown>;
}

export interface FilterResult {
  passed: boolean;
  reason?: string;
  ruleId: string;
}

export interface AgeGateConfig {
  enabled: boolean;
  minimumAge: number;
  verificationMethod: 'simple' | 'date-of-birth';
  redirectUrl?: string;
}

export interface RateLimitConfig {
  requestsPerDay: number;
  requestsPerMinute: number;
  burstLimit: number;
}

// Query parameters
export interface VideoQueryParams {
  page?: number;
  limit?: number;
  category?: string;
  q?: string;
}
