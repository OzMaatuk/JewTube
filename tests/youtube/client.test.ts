import { YouTubeAPIError } from '@/lib/errors';
import { YouTubeClient } from '@/lib/youtube/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock googleapis
vi.mock('googleapis', () => ({
  google: {
    youtube: vi.fn(() => ({
      channels: {
        list: vi.fn(),
      },
      videos: {
        list: vi.fn(),
      },
      playlistItems: {
        list: vi.fn(),
      },
      search: {
        list: vi.fn(),
      },
    })),
  },
}));

describe('YouTubeClient', () => {
  let client: YouTubeClient;

  beforeEach(() => {
    client = new YouTubeClient('test-api-key');
  });

  describe('fetchVideoById', () => {
    it('should fetch a single video successfully', async () => {
      const mockVideo = {
        id: 'test123',
        snippet: {
          title: 'Test Video',
          description: 'Test description',
        },
      };

      // Mock the API response
      const mockList = vi.fn().mockResolvedValue({
        data: {
          items: [mockVideo],
        },
      });

      // @ts-ignore - accessing private property for testing
      client.youtube.videos.list = mockList;

      const result = await client.fetchVideoById('test123');

      expect(result).toEqual(mockVideo);
      expect(mockList).toHaveBeenCalledWith({
        part: ['snippet', 'contentDetails', 'statistics', 'status'],
        id: ['test123'],
      });
    });

    it('should return null for non-existent video', async () => {
      const mockList = vi.fn().mockResolvedValue({
        data: {
          items: [],
        },
      });

      // @ts-ignore
      client.youtube.videos.list = mockList;

      const result = await client.fetchVideoById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('fetchVideosByIds', () => {
    it('should handle batch requests for multiple videos', async () => {
      const videoIds = Array.from({ length: 75 }, (_, i) => `video${i}`);
      const mockVideos = videoIds.map((id) => ({ id }));

      const mockList = vi
        .fn()
        .mockResolvedValueOnce({
          data: { items: mockVideos.slice(0, 50) },
        })
        .mockResolvedValueOnce({
          data: { items: mockVideos.slice(50, 75) },
        });

      // @ts-ignore
      client.youtube.videos.list = mockList;

      const result = await client.fetchVideosByIds(videoIds);

      expect(result.length).toBe(75);
      expect(mockList).toHaveBeenCalledTimes(2);
    });

    it('should return empty array for empty input', async () => {
      const result = await client.fetchVideosByIds([]);
      expect(result).toEqual([]);
    });
  });

  describe('error handling', () => {
    it('should handle quota exceeded errors', async () => {
      const mockList = vi.fn().mockRejectedValue({
        code: 403,
        message: 'quotaExceeded',
      });

      // @ts-ignore
      client.youtube.videos.list = mockList;

      await expect(client.fetchVideoById('test')).rejects.toThrow(YouTubeAPIError);
    });

    it('should handle rate limit errors', async () => {
      const mockList = vi.fn().mockRejectedValue({
        code: 429,
        message: 'Rate limit exceeded',
      });

      // @ts-ignore
      client.youtube.videos.list = mockList;

      await expect(client.fetchVideoById('test')).rejects.toThrow(YouTubeAPIError);
    });
  });

  describe('quota tracking', () => {
    it('should track quota usage', () => {
      const usage = client.getQuotaUsage();

      expect(usage).toHaveProperty('used');
      expect(usage).toHaveProperty('limit');
      expect(usage).toHaveProperty('remaining');
      expect(usage.remaining).toBe(usage.limit - usage.used);
    });
  });
});
