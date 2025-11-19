import { ContentAggregator } from '@/lib/content/aggregator';
import type { DeploymentConfig, Video } from '@/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock dependencies
vi.mock('@/lib/cache', () => ({
  cache: {
    get: vi.fn(),
    set: vi.fn(),
    deletePattern: vi.fn(),
  },
}));

vi.mock('@/lib/content/youtube-source', () => ({
  YouTubeVideoSource: vi.fn().mockImplementation(() => ({
    fetchVideos: vi.fn(),
    fetchVideoDetails: vi.fn(),
  })),
}));

const mockConfig: DeploymentConfig = {
  deployment: { id: 'test', name: 'Test', domain: 'test.com' },
  branding: {
    appName: 'Test',
    logo: '/logo.png',
    favicon: '/favicon.ico',
    colorScheme: {
      primary: '#000000',
      secondary: '#000000',
      background: '#FFFFFF',
      text: '#000000',
      accent: '#000000',
    },
  },
  content: {
    sources: [
      { type: 'channel', id: 'UC123' },
      { type: 'playlist', id: 'PL456' },
    ],
    refreshInterval: 30,
    manualApprovalMode: false,
  },
  filters: {
    enabled: true,
    sensitivity: 'moderate',
    rules: [],
    dryRunMode: false,
  },
  privacy: {
    coppaCompliant: false,
    gdprCompliant: true,
    disableTracking: false,
  },
  features: {
    enableSearch: false,
    enableComments: false,
    enableSharing: true,
    enablePlaylists: false,
  },
  api: {
    youtubeApiKey: 'test-key',
    rateLimit: {
      requestsPerDay: 10000,
      requestsPerMinute: 100,
      burstLimit: 150,
    },
  },
};

const createTestVideo = (id: string): Video => ({
  id,
  title: `Video ${id}`,
  description: 'Test description',
  thumbnail: 'https://example.com/thumb.jpg',
  channelId: 'UC123',
  channelName: 'Test Channel',
  publishedAt: new Date(),
  duration: 300,
  viewCount: 1000,
  likeCount: 100,
  commentCount: 10,
  tags: ['test'],
  categoryId: '27',
  categoryName: 'Education',
  contentRating: {
    madeForKids: false,
    ageRestricted: false,
  },
  hasClosedCaptions: true,
  isLiveContent: false,
  metadata: {
    fetchedAt: new Date(),
    sourceType: 'channel',
    sourceId: 'UC123',
  },
});

describe('ContentAggregator', () => {
  let aggregator: ContentAggregator;

  beforeEach(() => {
    vi.clearAllMocks();
    aggregator = new ContentAggregator(mockConfig);
  });

  describe('aggregateContent', () => {
    it('should fetch and combine videos from multiple sources', async () => {
      const mockVideos1 = [createTestVideo('video1'), createTestVideo('video2')];
      const mockVideos2 = [createTestVideo('video3'), createTestVideo('video4')];

      // @ts-ignore - accessing private property for testing
      aggregator.videoSource.fetchVideos = vi
        .fn()
        .mockResolvedValueOnce(mockVideos1)
        .mockResolvedValueOnce(mockVideos2);

      const result = await aggregator.aggregateContent();

      expect(result.length).toBe(4);
      expect(result.map((v) => v.id)).toEqual(['video1', 'video2', 'video3', 'video4']);
    });

    it('should deduplicate videos with same ID', async () => {
      const duplicateVideo = createTestVideo('duplicate');
      const mockVideos1 = [duplicateVideo, createTestVideo('video1')];
      const mockVideos2 = [duplicateVideo, createTestVideo('video2')];

      // @ts-ignore
      aggregator.videoSource.fetchVideos = vi
        .fn()
        .mockResolvedValueOnce(mockVideos1)
        .mockResolvedValueOnce(mockVideos2);

      const result = await aggregator.aggregateContent();

      expect(result.length).toBe(3);
      expect(result.filter((v) => v.id === 'duplicate').length).toBe(1);
    });

    it('should sort videos by published date (newest first)', async () => {
      const oldVideo = createTestVideo('old');
      oldVideo.publishedAt = new Date('2024-01-01');

      const newVideo = createTestVideo('new');
      newVideo.publishedAt = new Date('2024-12-01');

      // @ts-ignore
      aggregator.videoSource.fetchVideos = vi
        .fn()
        .mockResolvedValueOnce([oldVideo])
        .mockResolvedValueOnce([newVideo]);

      const result = await aggregator.aggregateContent();

      expect(result[0].id).toBe('new');
      expect(result[1].id).toBe('old');
    });

    it('should continue with other sources if one fails', async () => {
      const mockVideos = [createTestVideo('video1')];

      // @ts-ignore
      aggregator.videoSource.fetchVideos = vi
        .fn()
        .mockRejectedValueOnce(new Error('Source 1 failed'))
        .mockResolvedValueOnce(mockVideos);

      const result = await aggregator.aggregateContent();

      expect(result.length).toBe(1);
      expect(result[0].id).toBe('video1');
    });
  });

  describe('getVideos', () => {
    it('should apply pagination correctly', async () => {
      const allVideos = Array.from({ length: 50 }, (_, i) => createTestVideo(`video${i}`));

      // @ts-ignore
      aggregator.aggregateContent = vi.fn().mockResolvedValue(allVideos);

      const page1 = await aggregator.getVideos({ page: 1, limit: 20 });
      const page2 = await aggregator.getVideos({ page: 2, limit: 20 });

      expect(page1.length).toBe(20);
      expect(page2.length).toBe(20);
      expect(page1[0].id).toBe('video0');
      expect(page2[0].id).toBe('video20');
    });

    it('should filter by category when specified', async () => {
      const educationVideo = createTestVideo('edu');
      educationVideo.categoryName = 'Education';

      const musicVideo = createTestVideo('music');
      musicVideo.categoryName = 'Music';

      // @ts-ignore
      aggregator.aggregateContent = vi.fn().mockResolvedValue([educationVideo, musicVideo]);

      const result = await aggregator.getVideos({ category: 'Education' });

      expect(result.length).toBe(1);
      expect(result[0].categoryName).toBe('Education');
    });
  });

  describe('getVideoById', () => {
    it('should fetch single video by ID', async () => {
      const mockVideo = createTestVideo('test123');

      // @ts-ignore
      aggregator.videoSource.fetchVideoDetails = vi.fn().mockResolvedValue(mockVideo);

      const result = await aggregator.getVideoById('test123');

      expect(result).toEqual(mockVideo);
    });

    it('should return null for non-existent video', async () => {
      // @ts-ignore
      aggregator.videoSource.fetchVideoDetails = vi.fn().mockResolvedValue(null);

      const result = await aggregator.getVideoById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getStats', () => {
    it('should return content statistics', async () => {
      const videos = [createTestVideo('video1'), createTestVideo('video2')];
      videos[1].categoryName = 'Music';

      // @ts-ignore
      aggregator.aggregateContent = vi.fn().mockResolvedValue(videos);

      const stats = await aggregator.getStats();

      expect(stats.totalVideos).toBe(2);
      expect(stats.sources).toBe(2);
      expect(stats.categories).toContain('Education');
      expect(stats.categories).toContain('Music');
    });
  });
});
