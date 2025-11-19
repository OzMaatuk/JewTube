import { GET } from '@/app/api/videos/route';
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Create mock service
const mockGetVideos = vi.fn();
const mockService = {
  getVideos: mockGetVideos,
};

// Mock dependencies
vi.mock('@/lib/services', () => ({
  getContentService: vi.fn(() => mockService),
}));

describe('Videos API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return videos with default pagination', async () => {
    const mockVideos = [
      {
        id: 'video1',
        title: 'Video 1',
        description: '',
        thumbnail: '',
        channelId: 'ch1',
        channelName: 'Channel 1',
        publishedAt: new Date(),
        duration: 100,
        viewCount: 1000,
        tags: [],
        categoryId: '1',
        categoryName: 'Test',
        contentRating: { madeForKids: false, ageRestricted: false },
        hasClosedCaptions: false,
        isLiveContent: false,
        metadata: { fetchedAt: new Date(), sourceType: 'channel' as const, sourceId: 'ch1' },
      },
      {
        id: 'video2',
        title: 'Video 2',
        description: '',
        thumbnail: '',
        channelId: 'ch1',
        channelName: 'Channel 1',
        publishedAt: new Date(),
        duration: 100,
        viewCount: 1000,
        tags: [],
        categoryId: '1',
        categoryName: 'Test',
        contentRating: { madeForKids: false, ageRestricted: false },
        hasClosedCaptions: false,
        isLiveContent: false,
        metadata: { fetchedAt: new Date(), sourceType: 'channel' as const, sourceId: 'ch1' },
      },
    ];

    mockGetVideos.mockResolvedValue(mockVideos);

    const request = new NextRequest('http://localhost:3000/api/videos');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.videos).toHaveLength(2);
    expect(data.videos[0].id).toBe('video1');
    expect(data.videos[1].id).toBe('video2');
    expect(data.page).toBe(1);
    expect(data.limit).toBe(20);
  });

  it('should handle pagination parameters', async () => {
    const mockVideos = [
      {
        id: 'video1',
        title: 'Video 1',
        description: '',
        thumbnail: '',
        channelId: 'ch1',
        channelName: 'Channel 1',
        publishedAt: new Date(),
        duration: 100,
        viewCount: 1000,
        tags: [],
        categoryId: '1',
        categoryName: 'Test',
        contentRating: { madeForKids: false, ageRestricted: false },
        hasClosedCaptions: false,
        isLiveContent: false,
        metadata: { fetchedAt: new Date(), sourceType: 'channel' as const, sourceId: 'ch1' },
      },
    ];

    mockGetVideos.mockResolvedValue(mockVideos);

    const request = new NextRequest('http://localhost:3000/api/videos?page=2&limit=10');
    const response = await GET(request);
    const data = await response.json();

    expect(mockGetVideos).toHaveBeenCalledWith({
      page: 2,
      limit: 10,
    });
    expect(data.page).toBe(2);
    expect(data.limit).toBe(10);
  });

  it('should handle category filter', async () => {
    const mockVideos = [
      {
        id: 'video1',
        title: 'Educational Video',
        description: '',
        thumbnail: '',
        channelId: 'ch1',
        channelName: 'Channel 1',
        publishedAt: new Date(),
        duration: 100,
        viewCount: 1000,
        tags: [],
        categoryId: '1',
        categoryName: 'Education',
        contentRating: { madeForKids: false, ageRestricted: false },
        hasClosedCaptions: false,
        isLiveContent: false,
        metadata: { fetchedAt: new Date(), sourceType: 'channel' as const, sourceId: 'ch1' },
      },
    ];

    mockGetVideos.mockResolvedValue(mockVideos);

    const request = new NextRequest('http://localhost:3000/api/videos?category=Education');
    const response = await GET(request);

    expect(mockGetVideos).toHaveBeenCalledWith({
      page: 1,
      limit: 20,
      category: 'Education',
    });
  });

  it('should validate pagination limits', async () => {
    const request = new NextRequest('http://localhost:3000/api/videos?limit=200');
    const response = await GET(request);
    const data = await response.json();

    // Should return 400 for invalid limit
    expect(response.status).toBe(400);
    expect(data.error).toBeDefined();
  });

  it('should handle errors gracefully', async () => {
    mockGetVideos.mockRejectedValue(new Error('Service error'));

    const request = new NextRequest('http://localhost:3000/api/videos');
    const response = await GET(request);

    expect(response.status).toBe(500);
  });
});
