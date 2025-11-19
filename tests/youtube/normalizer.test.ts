import { normalizeVideo } from '@/lib/youtube/normalizer';
import type { youtube_v3 } from 'googleapis';
import { describe, expect, it } from 'vitest';

describe('Video Normalizer', () => {
  const createMockYouTubeVideo = (
    overrides?: Partial<youtube_v3.Schema$Video>
  ): youtube_v3.Schema$Video => ({
    id: 'test123',
    snippet: {
      title: 'Test Video',
      description: 'Test description',
      channelId: 'UC123',
      channelTitle: 'Test Channel',
      publishedAt: '2024-01-01T00:00:00Z',
      thumbnails: {
        high: {
          url: 'https://example.com/thumb.jpg',
        },
      },
      tags: ['test', 'video'],
      categoryId: '27',
    },
    contentDetails: {
      duration: 'PT5M30S',
      caption: 'true',
    },
    statistics: {
      viewCount: '1000',
      likeCount: '100',
      commentCount: '10',
    },
    status: {
      madeForKids: false,
    },
    ...overrides,
  });

  it('should normalize YouTube video to internal format', () => {
    const youtubeVideo = createMockYouTubeVideo();
    const normalized = normalizeVideo(youtubeVideo, 'channel', 'UC123');

    expect(normalized.id).toBe('test123');
    expect(normalized.title).toBe('Test Video');
    expect(normalized.description).toBe('Test description');
    expect(normalized.channelId).toBe('UC123');
    expect(normalized.channelName).toBe('Test Channel');
    expect(normalized.duration).toBe(330); // 5 minutes 30 seconds
    expect(normalized.viewCount).toBe(1000);
    expect(normalized.likeCount).toBe(100);
    expect(normalized.commentCount).toBe(10);
    expect(normalized.tags).toEqual(['test', 'video']);
    expect(normalized.categoryId).toBe('27');
    expect(normalized.hasClosedCaptions).toBe(true);
    expect(normalized.contentRating.madeForKids).toBe(false);
  });

  it('should parse ISO 8601 duration correctly', () => {
    const testCases = [
      { input: 'PT1M30S', expected: 90 },
      { input: 'PT1H', expected: 3600 },
      { input: 'PT1H30M', expected: 5400 },
      { input: 'PT45S', expected: 45 },
      { input: 'PT2H15M30S', expected: 8130 },
    ];

    for (const { input, expected } of testCases) {
      const video = createMockYouTubeVideo({
        contentDetails: { duration: input },
      });
      const normalized = normalizeVideo(video, 'channel', 'UC123');
      expect(normalized.duration).toBe(expected);
    }
  });

  it('should handle missing optional fields', () => {
    const minimalVideo: youtube_v3.Schema$Video = {
      id: 'test123',
      snippet: {
        title: 'Minimal Video',
        channelId: 'UC123',
        channelTitle: 'Test Channel',
        publishedAt: '2024-01-01T00:00:00Z',
      },
    };

    const normalized = normalizeVideo(minimalVideo, 'channel', 'UC123');

    expect(normalized.description).toBe('');
    expect(normalized.tags).toEqual([]);
    expect(normalized.viewCount).toBe(0);
    expect(normalized.likeCount).toBe(0);
    expect(normalized.commentCount).toBe(0);
    expect(normalized.hasClosedCaptions).toBe(false);
  });

  it('should map category IDs to names', () => {
    const categories = [
      { id: '1', name: 'Film & Animation' },
      { id: '10', name: 'Music' },
      { id: '27', name: 'Education' },
      { id: '28', name: 'Science & Technology' },
    ];

    for (const { id, name } of categories) {
      const video = createMockYouTubeVideo({
        snippet: { categoryId: id },
      });
      const normalized = normalizeVideo(video, 'channel', 'UC123');
      expect(normalized.categoryName).toBe(name);
    }
  });

  it('should detect age-restricted content', () => {
    const ageRestrictedVideo = createMockYouTubeVideo({
      contentDetails: {
        contentRating: {
          ytRating: 'ytAgeRestricted',
        },
      },
    });

    const normalized = normalizeVideo(ageRestrictedVideo, 'channel', 'UC123');
    expect(normalized.contentRating.ageRestricted).toBe(true);
  });

  it('should detect made-for-kids content', () => {
    const kidsVideo = createMockYouTubeVideo({
      status: {
        madeForKids: true,
      },
    });

    const normalized = normalizeVideo(kidsVideo, 'channel', 'UC123');
    expect(normalized.contentRating.madeForKids).toBe(true);
  });

  it('should include metadata about source', () => {
    const video = createMockYouTubeVideo();
    const normalized = normalizeVideo(video, 'playlist', 'PL123');

    expect(normalized.metadata.sourceType).toBe('playlist');
    expect(normalized.metadata.sourceId).toBe('PL123');
    expect(normalized.metadata.fetchedAt).toBeInstanceOf(Date);
  });
});
