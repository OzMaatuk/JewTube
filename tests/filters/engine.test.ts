import { FilterEngine } from '@/lib/filters/engine';
import { ContentFilter, MetadataFilter, PatternFilter } from '@/lib/filters/types';
import type { DeploymentConfig, Video } from '@/types';
import { describe, expect, it } from 'vitest';

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
    sources: [],
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

const createTestVideo = (overrides?: Partial<Video>): Video => ({
  id: 'test123',
  title: 'Test Video',
  description: 'Test description',
  type: 'video' as const,
  platform: 'youtube',
  url: 'https://www.youtube.com/watch?v=test123',
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
  ...overrides,
});

describe('FilterEngine', () => {
  it('should allow all videos when no rules configured', async () => {
    const engine = new FilterEngine(mockConfig);
    engine.registerFilter(new MetadataFilter());

    const videos = [createTestVideo()];
    const { passed, blocked } = await engine.filterVideos(videos);

    expect(passed.length).toBe(1);
    expect(blocked.length).toBe(0);
  });

  it('should block videos matching block rule', async () => {
    const configWithRules = {
      ...mockConfig,
      filters: {
        ...mockConfig.filters,
        rules: [
          {
            id: 'block-long-videos',
            type: 'metadata' as const,
            conditions: [
              {
                field: 'duration',
                operator: 'gt' as const,
                value: 600,
              },
            ],
            action: 'block' as const,
          },
        ],
      },
    };

    const engine = new FilterEngine(configWithRules);
    engine.registerFilter(new MetadataFilter());

    const videos = [createTestVideo({ duration: 700 })];
    const { passed, blocked } = await engine.filterVideos(videos);

    expect(passed.length).toBe(0);
    expect(blocked.length).toBe(1);
  });

  it('should require allow rule conditions', async () => {
    const configWithRules = {
      ...mockConfig,
      filters: {
        ...mockConfig.filters,
        rules: [
          {
            id: 'kids-only',
            type: 'content' as const,
            conditions: [
              {
                field: 'madeForKids',
                operator: 'equals' as const,
                value: true,
              },
            ],
            action: 'allow' as const,
          },
        ],
      },
    };

    const engine = new FilterEngine(configWithRules);
    engine.registerFilter(new ContentFilter());

    const videos = [
      createTestVideo({ contentRating: { madeForKids: true, ageRestricted: false } }),
      createTestVideo({ contentRating: { madeForKids: false, ageRestricted: false } }),
    ];

    const { passed, blocked } = await engine.filterVideos(videos);

    expect(passed.length).toBe(1);
    expect(blocked.length).toBe(1);
    expect(passed[0].contentRating?.madeForKids).toBe(true);
  });

  it('should support dry-run mode', async () => {
    const configWithDryRun = {
      ...mockConfig,
      filters: {
        ...mockConfig.filters,
        dryRunMode: true,
        rules: [
          {
            id: 'block-test',
            type: 'pattern' as const,
            conditions: [
              {
                field: 'title',
                operator: 'contains' as const,
                value: 'bad',
              },
            ],
            action: 'block' as const,
          },
        ],
      },
    };

    const engine = new FilterEngine(configWithDryRun);
    engine.registerFilter(new PatternFilter());

    const videos = [createTestVideo({ title: 'Bad video' })];
    const { passed, blocked } = await engine.filterVideos(videos);

    // In dry-run mode, all videos pass but blocks are logged
    expect(passed.length).toBe(1);
    expect(blocked.length).toBe(1);
  });
});
