import { cache } from '@/lib/cache';
import { getLogger, logPerformance } from '@/lib/logger';
import type { DeploymentConfig, Video, VideoQueryParams } from '@/types';
import { type IVideoSource, videoSourceRegistry } from './video-source';
import { YouTubeVideoSource } from './youtube-source';

const logger = getLogger('content-aggregator');

/**
 * Content aggregator service
 * Fetches and combines videos from multiple sources
 */
export class ContentAggregator {
  private config: DeploymentConfig;
  private videoSource: IVideoSource;

  constructor(config: DeploymentConfig) {
    this.config = config;

    // Initialize YouTube source
    this.videoSource = new YouTubeVideoSource(config.api.youtubeApiKey);

    // Register in global registry for extensibility
    videoSourceRegistry.register(this.videoSource);
  }

  /**
   * Aggregate content from all configured sources
   */
  async aggregateContent(): Promise<Video[]> {
    const start = Date.now();
    logger.info('Starting content aggregation');

    try {
      const allVideos: Video[] = [];

      // Fetch videos from each source
      for (const source of this.config.content.sources) {
        try {
          const videos = await this.videoSource.fetchVideos(source);
          allVideos.push(...videos);

          logger.info(
            { source, count: videos.length },
            `Fetched ${videos.length} videos from source`
          );
        } catch (error) {
          logger.error({ source, error }, 'Failed to fetch from source');
          // Continue with other sources even if one fails
        }
      }

      // Deduplicate videos
      const uniqueVideos = this.deduplicateVideos(allVideos);

      // Sort by published date (newest first)
      uniqueVideos.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());

      const duration = Date.now() - start;
      logPerformance('content-aggregation', duration, {
        sources: this.config.content.sources.length,
        totalVideos: allVideos.length,
        uniqueVideos: uniqueVideos.length,
      });

      logger.info(
        {
          totalVideos: allVideos.length,
          uniqueVideos: uniqueVideos.length,
          duration,
        },
        'Content aggregation completed'
      );

      return uniqueVideos;
    } catch (error) {
      const duration = Date.now() - start;
      logger.error({ error, duration }, 'Content aggregation failed');
      throw error;
    }
  }

  /**
   * Get videos with pagination
   */
  async getVideos(params: VideoQueryParams = {}): Promise<Video[]> {
    const { page = 1, limit = 20, category } = params;

    // Try to get from cache first
    const cacheKey = `videos:${page}:${limit}:${category || 'all'}`;
    const cached = await cache.get<Video[]>(cacheKey, this.config.deployment.id);

    if (cached) {
      logger.debug({ cacheKey }, 'Returning cached videos');
      return cached;
    }

    // Fetch fresh content
    const allVideos = await this.aggregateContent();

    // Filter by category if specified
    let filteredVideos = allVideos;
    if (category) {
      filteredVideos = allVideos.filter((video) => video.categoryName === category);
    }

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedVideos = filteredVideos.slice(startIndex, endIndex);

    // Cache the result
    const ttl = this.config.content.refreshInterval * 60; // Convert minutes to seconds
    await cache.set(cacheKey, paginatedVideos, ttl, this.config.deployment.id);

    return paginatedVideos;
  }

  /**
   * Get a single video by ID
   */
  async getVideoById(videoId: string): Promise<Video | null> {
    // Try cache first
    const cacheKey = `video:${videoId}`;
    const cached = await cache.get<Video>(cacheKey, this.config.deployment.id);

    if (cached) {
      logger.debug({ videoId }, 'Returning cached video');
      return cached;
    }

    // Fetch from source
    try {
      const video = await this.videoSource.fetchVideoDetails(videoId);

      if (video) {
        // Cache for 10 minutes
        await cache.set(cacheKey, video, 600, this.config.deployment.id);
      }

      return video;
    } catch (error) {
      logger.error({ videoId, error }, 'Failed to fetch video by ID');
      return null;
    }
  }

  /**
   * Deduplicate videos by ID
   */
  private deduplicateVideos(videos: Video[]): Video[] {
    const seen = new Set<string>();
    const unique: Video[] = [];

    for (const video of videos) {
      if (!seen.has(video.id)) {
        seen.add(video.id);
        unique.push(video);
      }
    }

    const duplicates = videos.length - unique.length;
    if (duplicates > 0) {
      logger.info({ duplicates }, `Removed ${duplicates} duplicate videos`);
    }

    return unique;
  }

  /**
   * Refresh content cache
   */
  async refreshCache(): Promise<void> {
    logger.info('Refreshing content cache');

    try {
      // Clear existing cache
      await cache.deletePattern('videos:*', this.config.deployment.id);

      // Fetch fresh content
      await this.aggregateContent();

      logger.info('Content cache refreshed successfully');
    } catch (error) {
      logger.error({ error }, 'Failed to refresh content cache');
      throw error;
    }
  }

  /**
   * Get content statistics
   */
  async getStats(): Promise<{
    totalVideos: number;
    sources: number;
    categories: string[];
  }> {
    const videos = await this.aggregateContent();
    const categories = [...new Set(videos.map((v) => v.categoryName))];

    return {
      totalVideos: videos.length,
      sources: this.config.content.sources.length,
      categories,
    };
  }

  /**
   * Warm cache on startup
   */
  async warmCache(): Promise<void> {
    logger.info('Warming cache...');
    const start = Date.now();

    try {
      // Pre-fetch first page
      await this.getVideos({ page: 1, limit: 20 });

      const duration = Date.now() - start;
      logger.info({ duration }, `Cache warmed in ${duration}ms`);
    } catch (error) {
      logger.error({ error }, 'Failed to warm cache');
    }
  }
}
