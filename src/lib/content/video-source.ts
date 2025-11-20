import type { ContentSource, Video } from '@/types';

/**
 * Abstract interface for video sources
 * Allows for future extensibility to other platforms (Vimeo, custom storage, etc.)
 */
export interface IVideoSource {
  /**
   * Name of the video source (e.g., 'youtube', 'vimeo')
   */
  name: string;

  /**
   * Fetch videos from a content source
   */
  fetchVideos(source: ContentSource): Promise<Video[]>;

  /**
   * Fetch a single video by ID
   */
  fetchVideoDetails(videoId: string): Promise<Video | null>;

  /**
   * Validate if a content source is valid
   */
  validateSource(source: ContentSource): boolean;
}

/**
 * Registry for video source adapters
 * Allows registering multiple video sources and retrieving them by name
 */
export class VideoSourceRegistry {
  private sources: Map<string, IVideoSource> = new Map();

  /**
   * Register a video source adapter
   */
  register(source: IVideoSource): void {
    this.sources.set(source.name, source);
  }

  /**
   * Get a video source adapter by name
   */
  get(name: string): IVideoSource | undefined {
    return this.sources.get(name);
  }

  /**
   * Get all registered source names
   */
  getSourceNames(): string[] {
    return Array.from(this.sources.keys());
  }

  /**
   * Check if a source is registered
   */
  has(name: string): boolean {
    return this.sources.has(name);
  }
}

// Global registry instance
export const videoSourceRegistry = new VideoSourceRegistry();
