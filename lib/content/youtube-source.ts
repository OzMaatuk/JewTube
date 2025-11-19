import { ContentNotFoundError } from '@/lib/errors';
import { getLogger } from '@/lib/logger';
import { YouTubeClient } from '@/lib/youtube/client';
import { normalizeVideo, normalizeVideos } from '@/lib/youtube/normalizer';
import type { ContentSource, Video } from '@/types';
import type { IVideoSource } from './video-source';

const logger = getLogger('youtube-source');

/**
 * YouTube video source adapter
 */
export class YouTubeVideoSource implements IVideoSource {
  name = 'youtube';
  private client: YouTubeClient;

  constructor(apiKey: string) {
    this.client = new YouTubeClient(apiKey);
  }

  /**
   * Fetch videos from a YouTube content source
   */
  async fetchVideos(source: ContentSource): Promise<Video[]> {
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
          throw new Error(`Unsupported source type: ${source.type}`);
      }

      // Normalize videos to our data model
      const videos = normalizeVideos(ytVideos, source.type, source.id);

      logger.info(
        { source, count: videos.length },
        `Fetched ${videos.length} videos from YouTube source`
      );

      return videos;
    } catch (error) {
      logger.error({ source, error }, 'Failed to fetch videos from YouTube source');
      throw error;
    }
  }

  /**
   * Fetch a single video by ID
   */
  async fetchVideoDetails(videoId: string): Promise<Video | null> {
    try {
      const ytVideo = await this.client.fetchVideoById(videoId);

      if (!ytVideo) {
        throw new ContentNotFoundError('Video', videoId);
      }

      return normalizeVideo(ytVideo, 'video', videoId);
    } catch (error) {
      logger.error({ videoId, error }, 'Failed to fetch video details');
      throw error;
    }
  }

  /**
   * Validate if a content source is valid for YouTube
   */
  validateSource(source: ContentSource): boolean {
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
