// Re-export config types from schema
import type { FilterCondition, FilterRule } from '@/lib/config/schema';
export type { FilterCondition, FilterRule };

// Core data models
// Core data models
export interface ContentItem {
  id: string;
  title: string;
  description: string;
  type: 'video' | 'audio'; // Added to distinguish content type
  platform: string;        // Added to distinguish source platform (youtube, rss, etc)
  url: string;            // Added for direct access
  thumbnail: string;
  thumbnailHigh?: string; // Optional, mainly for video
  channelId?: string;     // Made optional as not all sources have channels
  channelName?: string;   // Made optional
  channelThumbnail?: string;
  publishedAt: Date;
  duration: number; // seconds
  viewCount?: number; // Made optional
  likeCount?: number;
  commentCount?: number;
  tags: string[];
  categoryId?: string; // Made optional
  categoryName?: string; // Made optional
  defaultLanguage?: string;
  defaultAudioLanguage?: string;
  contentRating?: ContentRating; // Made optional
  hasClosedCaptions?: boolean;
  isLiveContent?: boolean;
  metadata: ContentMetadata; // Renamed from VideoMetadata
}

// Backward compatibility alias
export type Video = ContentItem;

export interface ContentMetadata {
  fetchedAt: Date;
  sourceType: string; // Generalized from 'channel'|'playlist'...
  sourceId: string;
  filterResults?: FilterResult[];
}

export interface VideoMetadata extends ContentMetadata { }

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
  videos: string[]; // This should probably be contentIds, but keeping compatibility
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
    vimeoAccessToken?: string;
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
  platform: string; // e.g. 'youtube', 'rss'
  type: string;     // e.g. 'channel', 'playlist', 'feed'
  id: string;       // identifier
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
