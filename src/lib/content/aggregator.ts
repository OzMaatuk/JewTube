import { cache } from '@/lib/cache';
import { getLogger, logPerformance } from '@/lib/logger';
import type { DeploymentConfig, ContentItem, VideoQueryParams } from '@/types';
import { contentSourceRegistry } from './content-source';
import { YouTubeVideoSource } from './youtube-source';

const logger = getLogger('content-aggregator');

/**
 * Content aggregator service
 * Fetches and combines content from multiple sources
 */
export class ContentAggregator {
  private config: DeploymentConfig;

  constructor(config: DeploymentConfig) {
    this.config = config;

    // Initialize standard adapters
    // In the future, this could be dynamic or plugin-based
    const youtubeSource = new YouTubeVideoSource(config.api.youtubeApiKey);
    contentSourceRegistry.register(youtubeSource);
  }

  /**
   * Aggregate content from all configured sources
   */
  async aggregateContent(): Promise<ContentItem[]> {
    const start = Date.now();
    logger.info('Starting content aggregation');

    try {
      const allItems: ContentItem[] = [];

      // Fetch content from each source
      for (const source of this.config.content.sources) {
        try {
          const platform = source.platform || 'youtube';
          const adapter = contentSourceRegistry.get(platform);

          if (!adapter) {
            logger.warn({ source }, `No adapter found for platform: ${platform}`);
            continue;
          }

          const items = await adapter.fetchContent(source);
          allItems.push(...items);

          logger.info(
            { source, count: items.length },
            `Fetched ${items.length} items from source`
          );
        } catch (error) {
          const isNotFound = error instanceof Error && 'statusCode' in error && (error as any).statusCode === 404;
          if (isNotFound) {
            logger.warn({ source, message: (error as Error).message }, 'Source not found, skipping');
          } else {
            logger.error({ source, error }, 'Failed to fetch from source');
          }
          // Continue with other sources even if one fails
        }
      }

      // Deduplicate items
      const uniqueItems = this.deduplicateItems(allItems);

      // Sort by published date (newest first)
      uniqueItems.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());

      const duration = Date.now() - start;
      logPerformance('content-aggregation', duration, {
        sources: this.config.content.sources.length,
        totalItems: allItems.length,
        uniqueItems: uniqueItems.length,
      });

      logger.info(
        {
          totalItems: allItems.length,
          uniqueItems: uniqueItems.length,
          duration,
        },
        'Content aggregation completed'
      );

      return uniqueItems;
    } catch (error) {
      const duration = Date.now() - start;
      logger.error({ error, duration }, 'Content aggregation failed');
      throw error;
    }
  }

  /**
   * Get videos with pagination (alias for backward compatibility)
   */
  async getVideos(params: VideoQueryParams = {}): Promise<ContentItem[]> {
    return this.getContent(params);
  }

  /**
   * Get content with pagination
   */
  async getContent(params: VideoQueryParams = {}): Promise<ContentItem[]> {
    const { page = 1, limit = 20, category, q } = params;

    // Try to get from cache first
    const cacheKey = `content:${page}:${limit}:${category || 'all'}:${q || ''}`;
    const cached = await cache.get<ContentItem[]>(cacheKey, this.config.deployment.id);

    if (cached) {
      logger.debug({ cacheKey }, 'Returning cached content');
      return cached;
    }

    // Fetch fresh content
    const allItems = await this.aggregateContent();

    // Filter by category if specified
    let filteredItems = allItems;
    if (category) {
      filteredItems = allItems.filter((item) => item.categoryName === category);
    }

    // Filter by search query if specified
    if (q) {
      const query = q.toLowerCase();
      filteredItems = filteredItems.filter((item) =>
        item.title.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        (item.channelName && item.channelName.toLowerCase().includes(query)) ||
        item.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedItems = filteredItems.slice(startIndex, endIndex);

    // Cache the result
    const ttl = this.config.content.refreshInterval * 60; // Convert minutes to seconds
    await cache.set(cacheKey, paginatedItems, ttl, this.config.deployment.id);

    return paginatedItems;
  }

  /**
   * Get a single video by ID (alias)
   */
  async getVideoById(videoId: string): Promise<ContentItem | null> {
    return this.getItemById(videoId);
  }

  /**
   * Get a single item by ID
   */
  async getItemById(itemId: string): Promise<ContentItem | null> {
    // Try cache first
    const cacheKey = `item:${itemId}`;
    const cached = await cache.get<ContentItem>(cacheKey, this.config.deployment.id);

    if (cached) {
      logger.debug({ itemId }, 'Returning cached item');
      return cached;
    }

    // Since we don't know the source of an arbitrary ID (unless we encode it in ID),
    // we might need to query all adapters or rely on the fact that IDs are unique enough?
    // OR we assume we can ask any adapter?
    // Current implementation of getVideoById in original code asked `this.videoSource.fetchVideoDetails`.
    // But now we have multiple sources.
    // If ID is valid YouTube ID, YouTube adapter might return it.
    // Strategy: ask all registered adapters until one returns it? Or check ID format?
    // Ideally, we should know the platform from the ID context, but here we only have ID.
    // For now, iterate all adapters.

    try {
      for (const providerName of contentSourceRegistry.getProviderNames()) {
        const adapter = contentSourceRegistry.get(providerName);
        if (adapter) {
          try {
            const item = await adapter.fetchItemDetails(itemId);
            if (item) {
              // Cache for 10 minutes
              await cache.set(cacheKey, item, 600, this.config.deployment.id);
              return item;
            }
          } catch (e) {
            // Ignore specific adapter errors if item not found
          }
        }
      }

      return null;
    } catch (error) {
      logger.error({ itemId, error }, 'Failed to fetch item by ID');
      return null;
    }
  }

  /**
   * Deduplicate items by ID
   */
  private deduplicateItems(items: ContentItem[]): ContentItem[] {
    const seen = new Set<string>();
    const unique: ContentItem[] = [];

    for (const item of items) {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        unique.push(item);
      }
    }

    const duplicates = items.length - unique.length;
    if (duplicates > 0) {
      logger.info({ duplicates }, `Removed ${duplicates} duplicate items`);
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
      await cache.deletePattern('content:*', this.config.deployment.id);
      await cache.deletePattern('videos:*', this.config.deployment.id); // Clear old keys too

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
    totalItems: number; // Renamed from totalVideos
    totalVideos: number; // Keep for compat
    sources: number;
    categories: string[];
  }> {
    const items = await this.aggregateContent();
    const categories = [...new Set(items.map((item) => item.categoryName || 'Unknown'))];

    return {
      totalItems: items.length,
      totalVideos: items.length, // For now, assume all are videos
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
      await this.getContent({ page: 1, limit: 20 });

      const duration = Date.now() - start;
      logger.info({ duration }, `Cache warmed in ${duration}ms`);
    } catch (error) {
      logger.error({ error }, 'Failed to warm cache');
    }
  }
}
