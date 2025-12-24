import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VideoPlayer } from '../../src/components/video-player';
import { AudioOnlyProvider } from '../../src/lib/audio-only-context';

// Mock Next.js router
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock the YouTube API
const mockYouTubePlayer = {
  playVideo: vi.fn(),
  pauseVideo: vi.fn(),
  stopVideo: vi.fn(),
  seekTo: vi.fn(),
  setVolume: vi.fn(),
  getVolume: vi.fn().mockReturnValue(50),
  getCurrentTime: vi.fn().mockReturnValue(30),
  getDuration: vi.fn().mockReturnValue(180),
  getPlayerState: vi.fn(),
  destroy: vi.fn()
};

const mockYT = {
  Player: vi.fn().mockImplementation(() => mockYouTubePlayer)
};

// Mock window.YT
Object.defineProperty(window, 'YT', {
  value: mockYT,
  writable: true
});

const mockVideo = {
  id: 'test-video-id',
  title: 'Test Video',
  description: 'Test Description',
  thumbnail: 'test-thumbnail.jpg',
  duration: 600, // 10 minutes in seconds
  viewCount: 1000,
  publishedAt: new Date('2023-01-01'),
  channelId: 'test-channel-id',
  channelName: 'Test Channel',
  tags: [],
  categoryId: 'test-category',
  categoryName: 'Test Category',
  likeCount: 100,
  commentCount: 50,
  contentRating: {
    madeForKids: false,
    ageRestricted: false,
  },
  hasClosedCaptions: true,
  isLiveContent: false,
  metadata: {
    fetchedAt: new Date(),
    sourceType: 'channel' as const,
    sourceId: 'test-channel-id',
  },
};

describe('VideoPlayer Audio-Only Mode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset window.youtubePlayer
    delete (window as any).youtubePlayer;
  });

  it('should render without crashing in audio-only mode', () => {
    expect(() => {
      render(
        <AudioOnlyProvider>
          <VideoPlayer video={mockVideo} />
        </AudioOnlyProvider>
      );
    }).not.toThrow();
  });

  it('should render audio controls container', () => {
    render(
      <AudioOnlyProvider>
        <VideoPlayer video={mockVideo} />
      </AudioOnlyProvider>
    );

    // Check if the audio controls container is rendered
    const audioControls = document.querySelector('[style*="display: flex"][style*="flex-direction: column"]');
    expect(audioControls).toBeInTheDocument();
  });
});