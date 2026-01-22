import { YouTubeAPIError } from '@/lib/errors';
import { retryWithBackoff } from '@/lib/errors';
import { getLogger, logYouTubeApiCall } from '@/lib/logger';
import type { ContentSource } from '@/types';
import { google, type youtube_v3 } from 'googleapis';

const logger = getLogger('youtube-client');

export class YouTubeClient {
  private youtube: youtube_v3.Youtube;
  private apiKey: string;
  private quotaUsed = 0;
  private quotaLimit = 10000; // Default daily quota

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.youtube = google.youtube({
      version: 'v3',
      auth: apiKey,
    });
  }

  /**
   * Fetch videos from a channel
   */
  async fetchChannelVideos(channelId: string, maxResults = 50): Promise<youtube_v3.Schema$Video[]> {
    const start = Date.now();

    try {
      // First, get the uploads playlist ID
      const channelResponse = await retryWithBackoff(() =>
        this.youtube.channels.list({
          part: ['contentDetails'],
          id: [channelId],
        })
      );

      if (!channelResponse.data.items || channelResponse.data.items.length === 0) {
        throw new YouTubeAPIError(`Channel not found: ${channelId}`, 404, false, false);
      }

      const uploadsPlaylistId =
        channelResponse.data.items[0].contentDetails?.relatedPlaylists?.uploads;

      if (!uploadsPlaylistId) {
        throw new YouTubeAPIError(`No uploads playlist for channel: ${channelId}`, 404);
      }

      // Fetch videos from uploads playlist
      const videos = await this.fetchPlaylistVideos(uploadsPlaylistId, maxResults);

      const duration = Date.now() - start;
      logYouTubeApiCall('fetchChannelVideos', true, duration, { channelId, count: videos.length });

      return videos;
    } catch (error) {
      const duration = Date.now() - start;
      logYouTubeApiCall('fetchChannelVideos', false, duration, { channelId, error });
      throw this.handleError(error);
    }
  }

  /**
   * Fetch videos from a playlist
   */
  async fetchPlaylistVideos(
    playlistId: string,
    maxResults = 50
  ): Promise<youtube_v3.Schema$Video[]> {
    const start = Date.now();

    try {
      const videoIds: string[] = [];
      let pageToken: string | undefined;

      // Fetch all video IDs from playlist
      do {
        const response = await retryWithBackoff(() =>
          this.youtube.playlistItems.list({
            part: ['contentDetails'],
            playlistId,
            maxResults: Math.min(maxResults - videoIds.length, 50),
            pageToken,
          })
        );

        const items = response.data.items || [];
        videoIds.push(
          ...items.map((item) => item.contentDetails?.videoId).filter((id): id is string => !!id)
        );

        pageToken = response.data.nextPageToken || undefined;
      } while (pageToken && videoIds.length < maxResults);

      // Fetch video details
      const videos = await this.fetchVideosByIds(videoIds);

      const duration = Date.now() - start;
      logYouTubeApiCall('fetchPlaylistVideos', true, duration, {
        playlistId,
        count: videos.length,
      });

      return videos;
    } catch (error) {
      const duration = Date.now() - start;
      logYouTubeApiCall('fetchPlaylistVideos', false, duration, { playlistId, error });
      throw this.handleError(error);
    }
  }

  /**
   * Fetch a single video by ID
   */
  async fetchVideoById(videoId: string): Promise<youtube_v3.Schema$Video | null> {
    const start = Date.now();

    try {
      const response = await retryWithBackoff(() =>
        this.youtube.videos.list({
          part: ['snippet', 'contentDetails', 'statistics', 'status'],
          id: [videoId],
        })
      );

      const video = response.data.items?.[0] || null;

      const duration = Date.now() - start;
      logYouTubeApiCall('fetchVideoById', true, duration, { videoId, found: !!video });

      return video;
    } catch (error) {
      const duration = Date.now() - start;
      logYouTubeApiCall('fetchVideoById', false, duration, { videoId, error });
      throw this.handleError(error);
    }
  }

  /**
   * Fetch multiple videos by IDs (batch request)
   */
  async fetchVideosByIds(videoIds: string[]): Promise<youtube_v3.Schema$Video[]> {
    if (videoIds.length === 0) return [];

    const start = Date.now();
    const allVideos: youtube_v3.Schema$Video[] = [];

    try {
      // YouTube API allows up to 50 video IDs per request
      const batches = this.chunkArray(videoIds, 50);

      for (const batch of batches) {
        const response = await retryWithBackoff(() =>
          this.youtube.videos.list({
            part: ['snippet', 'contentDetails', 'statistics', 'status'],
            id: batch,
          })
        );

        allVideos.push(...(response.data.items || []));
      }

      const duration = Date.now() - start;
      logYouTubeApiCall('fetchVideosByIds', true, duration, {
        requested: videoIds.length,
        found: allVideos.length,
      });

      return allVideos;
    } catch (error) {
      const duration = Date.now() - start;
      logYouTubeApiCall('fetchVideosByIds', false, duration, { count: videoIds.length, error });
      throw this.handleError(error);
    }
  }

  /**
   * Search for videos
   */
  async searchVideos(
    query: string,
    params: Record<string, unknown> = {},
    maxResults = 50
  ): Promise<youtube_v3.Schema$Video[]> {
    const start = Date.now();

    try {
      const videoIds: string[] = [];
      let pageToken: string | undefined;

      // Search for videos
      do {
        const response = await retryWithBackoff(() =>
          this.youtube.search.list({
            part: ['id'],
            q: query,
            type: ['video'],
            maxResults: Math.min(maxResults - videoIds.length, 50),
            pageToken,
            ...params,
          })
        );

        const items = response.data.items || [];
        videoIds.push(...items.map((item) => item.id?.videoId).filter((id): id is string => !!id));

        pageToken = response.data.nextPageToken || undefined;
      } while (pageToken && videoIds.length < maxResults);

      // Fetch video details
      const videos = await this.fetchVideosByIds(videoIds);

      const duration = Date.now() - start;
      logYouTubeApiCall('searchVideos', true, duration, { query, count: videos.length });

      return videos;
    } catch (error) {
      const duration = Date.now() - start;
      logYouTubeApiCall('searchVideos', false, duration, { query, error });
      throw this.handleError(error);
    }
  }

  /**
   * Fetch channel details
   */
  async fetchChannelDetails(channelId: string): Promise<youtube_v3.Schema$Channel | null> {
    const start = Date.now();

    try {
      const response = await retryWithBackoff(() =>
        this.youtube.channels.list({
          part: ['snippet', 'statistics', 'contentDetails', 'status'],
          id: [channelId],
        })
      );

      const channel = response.data.items?.[0] || null;

      const duration = Date.now() - start;
      logYouTubeApiCall('fetchChannelDetails', true, duration, { channelId, found: !!channel });

      return channel;
    } catch (error) {
      const duration = Date.now() - start;
      logYouTubeApiCall('fetchChannelDetails', false, duration, { channelId, error });
      throw this.handleError(error);
    }
  }

  /**
   * Handle YouTube API errors
   */
  private handleError(error: unknown): YouTubeAPIError {
    if (error instanceof YouTubeAPIError) {
      return error;
    }

    const err = error as { code?: number; response?: { status?: number }; message?: string };
    const statusCode = err.code || err.response?.status || 500;
    const message = err.message || 'YouTube API error';

    // Check for quota exceeded
    const quotaExceeded =
      statusCode === 403 && (message.includes('quota') || message.includes('quotaExceeded'));

    // Check if error is retryable
    const retryable = statusCode >= 500 || statusCode === 429;

    const logMethod = statusCode === 404 ? 'warn' : 'error';
    logger[logMethod](
      {
        statusCode,
        message,
        quotaExceeded,
        retryable,
      },
      'YouTube API error'
    );

    return new YouTubeAPIError(message, statusCode, quotaExceeded, retryable);
  }

  /**
   * Chunk array into smaller arrays
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Get quota usage
   */
  getQuotaUsage(): { used: number; limit: number; remaining: number } {
    return {
      used: this.quotaUsed,
      limit: this.quotaLimit,
      remaining: this.quotaLimit - this.quotaUsed,
    };
  }
}
