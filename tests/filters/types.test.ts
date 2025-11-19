import {
  ContentFilter,
  MetadataFilter,
  PatternFilter,
  SourceFilter,
  TemporalFilter,
} from '@/lib/filters/types';
import type { FilterRule, Video } from '@/types';
import { describe, expect, it } from 'vitest';

const createTestVideo = (overrides?: Partial<Video>): Video => ({
  id: 'test123',
  title: 'Test Video',
  description: 'Test description',
  thumbnail: 'https://example.com/thumb.jpg',
  channelId: 'UC123',
  channelName: 'Test Channel',
  publishedAt: new Date('2024-01-01'),
  duration: 300,
  viewCount: 1000,
  likeCount: 100,
  commentCount: 10,
  tags: ['test', 'education'],
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

describe('MetadataFilter', () => {
  const filter = new MetadataFilter();

  it('should filter by duration (greater than)', async () => {
    const rule: FilterRule = {
      id: 'long-videos',
      type: 'metadata',
      conditions: [{ field: 'duration', operator: 'gt', value: 600 }],
      action: 'block',
    };

    const shortVideo = createTestVideo({ duration: 300 });
    const longVideo = createTestVideo({ duration: 700 });

    const result1 = await filter.evaluate(shortVideo, rule);
    const result2 = await filter.evaluate(longVideo, rule);

    expect(result1.passed).toBe(true);
    expect(result2.passed).toBe(false);
  });

  it('should filter by view count', async () => {
    const rule: FilterRule = {
      id: 'popular-videos',
      type: 'metadata',
      conditions: [{ field: 'viewCount', operator: 'gt', value: 5000 }],
      action: 'allow',
    };

    const unpopularVideo = createTestVideo({ viewCount: 100 });
    const popularVideo = createTestVideo({ viewCount: 10000 });

    const result1 = await filter.evaluate(unpopularVideo, rule);
    const result2 = await filter.evaluate(popularVideo, rule);

    expect(result1.passed).toBe(false);
    expect(result2.passed).toBe(true);
  });

  it('should filter by tags (contains)', async () => {
    const rule: FilterRule = {
      id: 'education-tag',
      type: 'metadata',
      conditions: [{ field: 'tags', operator: 'contains', value: 'education' }],
      action: 'allow',
    };

    const video = createTestVideo({ tags: ['test', 'education', 'learning'] });
    const result = await filter.evaluate(video, rule);

    expect(result.passed).toBe(true);
  });
});

describe('ContentFilter', () => {
  const filter = new ContentFilter();

  it('should filter by category', async () => {
    const rule: FilterRule = {
      id: 'education-only',
      type: 'content',
      conditions: [{ field: 'categoryName', operator: 'equals', value: 'Education' }],
      action: 'allow',
    };

    const educationVideo = createTestVideo({ categoryName: 'Education' });
    const musicVideo = createTestVideo({ categoryName: 'Music' });

    const result1 = await filter.evaluate(educationVideo, rule);
    const result2 = await filter.evaluate(musicVideo, rule);

    expect(result1.passed).toBe(true);
    expect(result2.passed).toBe(false);
  });

  it('should filter by made-for-kids status', async () => {
    const rule: FilterRule = {
      id: 'kids-only',
      type: 'content',
      conditions: [{ field: 'madeForKids', operator: 'equals', value: true }],
      action: 'allow',
    };

    const kidsVideo = createTestVideo({
      contentRating: { madeForKids: true, ageRestricted: false },
    });
    const regularVideo = createTestVideo({
      contentRating: { madeForKids: false, ageRestricted: false },
    });

    const result1 = await filter.evaluate(kidsVideo, rule);
    const result2 = await filter.evaluate(regularVideo, rule);

    expect(result1.passed).toBe(true);
    expect(result2.passed).toBe(false);
  });

  it('should block age-restricted content', async () => {
    const rule: FilterRule = {
      id: 'no-age-restricted',
      type: 'content',
      conditions: [{ field: 'ageRestricted', operator: 'equals', value: true }],
      action: 'block',
    };

    const ageRestrictedVideo = createTestVideo({
      contentRating: { madeForKids: false, ageRestricted: true },
    });

    const result = await filter.evaluate(ageRestrictedVideo, rule);
    expect(result.passed).toBe(false);
  });

  it('should require closed captions', async () => {
    const rule: FilterRule = {
      id: 'captions-required',
      type: 'content',
      conditions: [{ field: 'hasClosedCaptions', operator: 'equals', value: true }],
      action: 'allow',
    };

    const withCaptions = createTestVideo({ hasClosedCaptions: true });
    const withoutCaptions = createTestVideo({ hasClosedCaptions: false });

    const result1 = await filter.evaluate(withCaptions, rule);
    const result2 = await filter.evaluate(withoutCaptions, rule);

    expect(result1.passed).toBe(true);
    expect(result2.passed).toBe(false);
  });
});

describe('PatternFilter', () => {
  const filter = new PatternFilter();

  it('should filter by title contains', async () => {
    const rule: FilterRule = {
      id: 'block-inappropriate',
      type: 'pattern',
      conditions: [{ field: 'title', operator: 'contains', value: 'inappropriate' }],
      action: 'block',
    };

    const badVideo = createTestVideo({ title: 'This is inappropriate content' });
    const goodVideo = createTestVideo({ title: 'Educational content' });

    const result1 = await filter.evaluate(badVideo, rule);
    const result2 = await filter.evaluate(goodVideo, rule);

    expect(result1.passed).toBe(false);
    expect(result2.passed).toBe(true);
  });

  it('should filter by regex pattern', async () => {
    const rule: FilterRule = {
      id: 'block-numbers-in-title',
      type: 'pattern',
      conditions: [{ field: 'title', operator: 'regex', value: '\\d{4,}' }],
      action: 'block',
    };

    const videoWithNumbers = createTestVideo({ title: 'Video 12345' });
    const videoWithoutNumbers = createTestVideo({ title: 'Educational Video' });

    const result1 = await filter.evaluate(videoWithNumbers, rule);
    const result2 = await filter.evaluate(videoWithoutNumbers, rule);

    expect(result1.passed).toBe(false);
    expect(result2.passed).toBe(true);
  });

  it('should filter description content', async () => {
    const rule: FilterRule = {
      id: 'block-spam',
      type: 'pattern',
      conditions: [{ field: 'description', operator: 'contains', value: 'spam' }],
      action: 'block',
    };

    const spamVideo = createTestVideo({ description: 'This is spam content' });
    const normalVideo = createTestVideo({ description: 'Educational description' });

    const result1 = await filter.evaluate(spamVideo, rule);
    const result2 = await filter.evaluate(normalVideo, rule);

    expect(result1.passed).toBe(false);
    expect(result2.passed).toBe(true);
  });
});

describe('SourceFilter', () => {
  const filter = new SourceFilter();

  it('should filter by channel ID', async () => {
    const rule: FilterRule = {
      id: 'trusted-channel',
      type: 'source',
      conditions: [{ field: 'channelId', operator: 'equals', value: 'UC123' }],
      action: 'allow',
    };

    const trustedVideo = createTestVideo({ channelId: 'UC123' });
    const untrustedVideo = createTestVideo({ channelId: 'UC999' });

    const result1 = await filter.evaluate(trustedVideo, rule);
    const result2 = await filter.evaluate(untrustedVideo, rule);

    expect(result1.passed).toBe(true);
    expect(result2.passed).toBe(false);
  });

  it('should filter by channel name', async () => {
    const rule: FilterRule = {
      id: 'block-channel',
      type: 'source',
      conditions: [{ field: 'channelName', operator: 'contains', value: 'Spam' }],
      action: 'block',
    };

    const spamChannel = createTestVideo({ channelName: 'Spam Channel' });
    const goodChannel = createTestVideo({ channelName: 'Educational Channel' });

    const result1 = await filter.evaluate(spamChannel, rule);
    const result2 = await filter.evaluate(goodChannel, rule);

    expect(result1.passed).toBe(false);
    expect(result2.passed).toBe(true);
  });
});

describe('TemporalFilter', () => {
  const filter = new TemporalFilter();

  it('should filter by content age (days)', async () => {
    const now = new Date();
    const oldDate = new Date(now.getTime() - 100 * 24 * 60 * 60 * 1000); // 100 days ago
    const recentDate = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000); // 10 days ago

    const rule: FilterRule = {
      id: 'recent-only',
      type: 'temporal',
      conditions: [{ field: 'publishedAt', operator: 'lt', value: 30 }], // Less than 30 days old
      action: 'allow',
    };

    const oldVideo = createTestVideo({ publishedAt: oldDate });
    const recentVideo = createTestVideo({ publishedAt: recentDate });

    const result1 = await filter.evaluate(oldVideo, rule);
    const result2 = await filter.evaluate(recentVideo, rule);

    expect(result1.passed).toBe(false);
    expect(result2.passed).toBe(true);
  });

  it('should filter by minimum age', async () => {
    const now = new Date();
    const veryRecentDate = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000); // 2 days ago
    const olderDate = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000); // 10 days ago

    const rule: FilterRule = {
      id: 'minimum-age',
      type: 'temporal',
      conditions: [{ field: 'publishedAt', operator: 'gt', value: 7 }], // More than 7 days old
      action: 'allow',
    };

    const tooRecentVideo = createTestVideo({ publishedAt: veryRecentDate });
    const oldEnoughVideo = createTestVideo({ publishedAt: olderDate });

    const result1 = await filter.evaluate(tooRecentVideo, rule);
    const result2 = await filter.evaluate(oldEnoughVideo, rule);

    expect(result1.passed).toBe(false);
    expect(result2.passed).toBe(true);
  });
});
