import { ContentNotFoundError } from '@/lib/errors';
import { getLogger } from '@/lib/logger';
import { YouTubeClient } from '@/lib/youtube/client';
import { normalizeVideo, normalizeVideos } from '@/lib/youtube/normalizer';
import type { ContentItem, ContentSource } from '@/types';
import type { IContentSourceAdapter } from './content-source';

const logger = getLogger('youtube-source');

/**
 * YouTube content source adapter
 */
export class YouTubeVideoSource implements IContentSourceAdapter {
  providerName = 'youtube';
  private client: YouTubeClient;

  constructor(apiKey: string) {
    this.client = new YouTubeClient(apiKey);
  }

  /**
   * Fetch content from a YouTube source
   */
  async fetchContent(source: ContentSource): Promise<ContentItem[]> {
    if (!this.validateSource(source)) {
      throw new Error(`Invalid YouTube source: ${JSON.stringify(source)}`);
    }

    logger.info({ source }, 'Fetching videos from YouTube source');

    try {
      let ytVideos: Awaited<ReturnType<YouTubeClient['fetchChannelVideos']>>;

      switch (source.type) {
        case 'channel': {
          ytVideos = await this.client.fetchChannelVideos(source.id);
          break;
        }

        case 'playlist': {
          ytVideos = await this.client.fetchPlaylistVideos(source.id);
          break;
        }

        case 'video': {
          const video = await this.client.fetchVideoById(source.id);
          ytVideos = video ? [video] : [];
          break;
        }

        case 'search': {
          const query = (source.params?.q as string) || '';
          const searchParams = { ...source.params };
          searchParams.q = undefined;
          ytVideos = await this.client.searchVideos(
            query,
            searchParams,
            (source.params?.maxResults as number) || 50
          );
          break;
        }

        default:
          throw new Error(`Unsupported YouTube source type: ${source.type}`);
      }

      // Normalize videos to our data model
      const items = normalizeVideos(ytVideos, source.type, source.id);

      logger.info(
        { source, count: items.length },
        `Fetched ${items.length} items from YouTube source`
      );

      return items;
    } catch (error) {
      const isNotFound = error instanceof Error && 'statusCode' in error && (error as any).statusCode === 404;
      if (isNotFound) {
        logger.warn({ source, message: (error as Error).message }, 'YouTube source not found');
      } else {
        logger.error({ source, error }, 'Failed to fetch items from YouTube source');
      }
      throw error;
    }
  }

  /**
   * Fetch a single item by ID
   */
  async fetchItemDetails(itemId: string): Promise<ContentItem | null> {
    try {
      const ytVideo = await this.client.fetchVideoById(itemId);

      if (!ytVideo) {
        return null; // Not found on YouTube, normal for other sources
      }

      return normalizeVideo(ytVideo, 'video', itemId);
    } catch (error) {
      const isNotFound = error instanceof Error && 'statusCode' in error && (error as any).statusCode === 404;
      if (!isNotFound) {
        logger.error({ itemId, error }, 'Failed to fetch YouTube video details');
      }
      return null;
    }
  }

  /**
   * Validate if a content source is valid for YouTube
   */
  validateSource(source: ContentSource): boolean {
    // Check if platform is explicitly 'youtube' or undefined (default)
    if (source.platform && source.platform !== 'youtube') {
      return false;
    }

    if (!source.id && source.type !== 'search') {
      return false;
    }

    if (source.type === 'search' && !source.params?.q) {
      return false;
    }

    return ['channel', 'playlist', 'video', 'search'].includes(source.type);
  }

  /**
   * Get YouTube client for advanced operations
   */
  getClient(): YouTubeClient {
    return this.client;
  }
}
