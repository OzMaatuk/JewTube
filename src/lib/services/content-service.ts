import { ContentAggregator } from '@/lib/content/aggregator';
import { createFilterEngine } from '@/lib/filters';
import { getLogger } from '@/lib/logger';
import type { DeploymentConfig, Video, VideoQueryParams } from '@/types';
import { unstable_cache } from 'next/cache';
import { cache } from 'react';

const logger = getLogger('content-service');

/**
 * Content service
 * Integrates content aggregation and filtering
 */
export class ContentService {
  private aggregator: ContentAggregator;
  private filterEngine: ReturnType<typeof createFilterEngine>;
  private config: DeploymentConfig;

  constructor(config: DeploymentConfig) {
    this.config = config;
    this.aggregator = new ContentAggregator(config);
    this.filterEngine = createFilterEngine(config);
  }

  /**
   * Get filtered videos with pagination
   * Uses React cache for request-level deduplication
   */
  getVideos = cache(async (params: VideoQueryParams = {}): Promise<Video[]> => {
    return this.getVideosWithCache(params);
  });

  /**
   * Get videos with Next.js cache
   */
  private async getVideosWithCache(params: VideoQueryParams): Promise<Video[]> {
    return unstable_cache(
      async () => {
        // Fetch videos from aggregator
        const videos = await this.aggregator.getVideos(params);

        // Apply filters
        const { passed } = await this.filterEngine.filterVideos(videos);

        return passed;
      },
      ['videos', JSON.stringify(params), this.config.deployment.id],
      {
        revalidate: this.config.content.refreshInterval * 60, // Convert minutes to seconds
        tags: ['videos', `deployment:${this.config.deployment.id}`],
      }
    )();
  }

  /**
   * Get a single video by ID
   */
  async getVideoById(videoId: string): Promise<Video | null> {
    const video = await this.aggregator.getVideoById(videoId);

    if (!video) {
      return null;
    }

    // Check if video passes filters
    const { passed } = await this.filterEngine.filterVideos([video]);

    return passed.length > 0 ? passed[0] : null;
  }

  /**
   * Refresh content cache
   */
  async refreshContent(): Promise<void> {
    const { revalidateTag } = await import('next/cache');
    revalidateTag('videos', 'fetch');
    revalidateTag(`deployment:${this.config.deployment.id}`, 'fetch');
    logger.info('Content cache invalidated');
  }

  /**
   * Get content statistics
   */
  async getStats() {
    const stats = await this.aggregator.getStats();
    const filterStats = this.filterEngine.getStats();

    return {
      ...stats,
      filters: filterStats,
    };
  }
}
