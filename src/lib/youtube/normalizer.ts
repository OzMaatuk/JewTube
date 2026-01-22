import { getLogger } from '@/lib/logger';
import type { ContentItem, ContentRating, Video, VideoMetadata } from '@/types';
import type { youtube_v3 } from 'googleapis';

const logger = getLogger('youtube-normalizer');

/**
 * Normalize YouTube API video response to our ContentItem model
 */
export function normalizeVideo(
  ytVideo: youtube_v3.Schema$Video,
  sourceType: string = 'video',
  sourceId = ''
): ContentItem {
  const snippet = ytVideo.snippet;
  const contentDetails = ytVideo.contentDetails;
  const statistics = ytVideo.statistics;
  const status = ytVideo.status;

  if (!snippet || !ytVideo.id) {
    throw new Error('Invalid video data: missing required fields');
  }

  // Construct YouTube URL
  const url = `https://www.youtube.com/watch?v=${ytVideo.id}`;

  return {
    id: ytVideo.id,
    title: snippet.title || 'Untitled',
    description: snippet.description || '',
    type: 'video',
    platform: 'youtube',
    url,
    thumbnail: snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url || '',
    thumbnailHigh: snippet.thumbnails?.high?.url || snippet.thumbnails?.maxres?.url || undefined,
    channelId: snippet.channelId || '',
    channelName: snippet.channelTitle || 'Unknown Channel',
    channelThumbnail: undefined, // Will be fetched separately if needed
    publishedAt: snippet.publishedAt ? new Date(snippet.publishedAt) : new Date(),
    duration: parseDuration(contentDetails?.duration || 'PT0S'),
    viewCount: Number.parseInt(statistics?.viewCount || '0', 10),
    likeCount: Number.parseInt(statistics?.likeCount || '0', 10),
    commentCount: Number.parseInt(statistics?.commentCount || '0', 10),
    tags: snippet.tags || [],
    categoryId: snippet.categoryId || '0',
    categoryName: getCategoryName(snippet.categoryId || '0'),
    defaultLanguage: snippet.defaultLanguage || undefined,
    defaultAudioLanguage: snippet.defaultAudioLanguage || undefined,
    contentRating: normalizeContentRating(contentDetails, status),
    hasClosedCaptions: contentDetails?.caption === 'true',
    isLiveContent: snippet.liveBroadcastContent === 'live',
    metadata: {
      fetchedAt: new Date(),
      sourceType,
      sourceId,
    },
  };
}

/**
 * Normalize content rating information
 */
function normalizeContentRating(
  contentDetails?: youtube_v3.Schema$VideoContentDetails | null,
  status?: youtube_v3.Schema$VideoStatus | null
): ContentRating {
  return {
    ytRating: contentDetails?.contentRating?.ytRating || undefined,
    madeForKids: status?.madeForKids || false,
    ageRestricted: contentDetails?.contentRating?.ytRating === 'ytAgeRestricted',
  };
}

/**
 * Parse ISO 8601 duration to seconds
 * Format: PT#H#M#S (e.g., PT1H30M15S = 1 hour, 30 minutes, 15 seconds)
 */
export function parseDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);

  if (!match) {
    logger.warn({ duration }, 'Failed to parse duration');
    return 0;
  }

  const hours = Number.parseInt(match[1] || '0', 10);
  const minutes = Number.parseInt(match[2] || '0', 10);
  const seconds = Number.parseInt(match[3] || '0', 10);

  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Get category name from category ID
 * YouTube category IDs: https://developers.google.com/youtube/v3/docs/videoCategories/list
 */
export function getCategoryName(categoryId: string): string {
  const categories: Record<string, string> = {
    '1': 'Film & Animation',
    '2': 'Autos & Vehicles',
    '10': 'Music',
    '15': 'Pets & Animals',
    '17': 'Sports',
    '18': 'Short Movies',
    '19': 'Travel & Events',
    '20': 'Gaming',
    '21': 'Videoblogging',
    '22': 'People & Blogs',
    '23': 'Comedy',
    '24': 'Entertainment',
    '25': 'News & Politics',
    '26': 'Howto & Style',
    '27': 'Education',
    '28': 'Science & Technology',
    '29': 'Nonprofits & Activism',
    '30': 'Movies',
    '31': 'Anime/Animation',
    '32': 'Action/Adventure',
    '33': 'Classics',
    '34': 'Comedy',
    '35': 'Documentary',
    '36': 'Drama',
    '37': 'Family',
    '38': 'Foreign',
    '39': 'Horror',
    '40': 'Sci-Fi/Fantasy',
    '41': 'Thriller',
    '42': 'Shorts',
    '43': 'Shows',
    '44': 'Trailers',
  };

  return categories[categoryId] || 'Unknown';
}

/**
 * Normalize channel data
 */
export function normalizeChannel(ytChannel: youtube_v3.Schema$Channel) {
  const snippet = ytChannel.snippet;
  const statistics = ytChannel.statistics;
  const status = ytChannel.status;

  if (!snippet || !ytChannel.id) {
    throw new Error('Invalid channel data: missing required fields');
  }

  return {
    id: ytChannel.id,
    name: snippet.title || 'Unknown Channel',
    description: snippet.description || '',
    thumbnail: snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url || '',
    subscriberCount: Number.parseInt(statistics?.subscriberCount || '0', 10),
    videoCount: Number.parseInt(statistics?.videoCount || '0', 10),
    verified: status?.isLinked || false,
    customUrl: snippet.customUrl,
  };
}

/**
 * Normalize playlist data
 */
export function normalizePlaylist(ytPlaylist: youtube_v3.Schema$Playlist) {
  const snippet = ytPlaylist.snippet;
  const contentDetails = ytPlaylist.contentDetails;

  if (!snippet || !ytPlaylist.id) {
    throw new Error('Invalid playlist data: missing required fields');
  }

  return {
    id: ytPlaylist.id,
    title: snippet.title || 'Untitled Playlist',
    description: snippet.description || '',
    thumbnail: snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url || '',
    channelId: snippet.channelId || '',
    channelName: snippet.channelTitle || 'Unknown Channel',
    itemCount: contentDetails?.itemCount || 0,
    publishedAt: snippet.publishedAt ? new Date(snippet.publishedAt) : new Date(),
  };
}

/**
 * Batch normalize videos
 */
export function normalizeVideos(
  ytVideos: youtube_v3.Schema$Video[],
  sourceType: string = 'video',
  sourceId = ''
): ContentItem[] {
  return ytVideos
    .map((ytVideo) => {
      try {
        return normalizeVideo(ytVideo, sourceType, sourceId);
      } catch (error) {
        logger.error(
          {
            videoId: ytVideo.id,
            error: error instanceof Error ? error.message : 'Unknown error',
          },
          'Failed to normalize video'
        );
        return null;
      }
    })
    .filter((contentItem): contentItem is ContentItem => contentItem !== null);
}
