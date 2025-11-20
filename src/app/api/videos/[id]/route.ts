import { ContentNotFoundError } from '@/lib/errors';
import { getLogger, logApiCall } from '@/lib/logger';
import { getContentService } from '@/lib/services';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const logger = getLogger('api-video-detail');

export const revalidate = 600; // Revalidate every 10 minutes

/**
 * GET /api/videos/[id]
 * Get single video details
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const start = Date.now();
  const resolvedParams = await params;
  const videoId = resolvedParams.id;

  try {
    // Validate video ID format (YouTube video IDs are 11 characters)
    if (!videoId || videoId.length !== 11) {
      throw new ContentNotFoundError('Video', videoId);
    }

    // Get content service
    const contentService = getContentService();

    // Fetch video
    const video = await contentService.getVideoById(videoId);

    if (!video) {
      throw new ContentNotFoundError('Video', videoId);
    }

    const duration = Date.now() - start;
    logApiCall(`/api/videos/${videoId}`, 'GET', 200, duration);

    return NextResponse.json(video);
  } catch (error) {
    const duration = Date.now() - start;
    const statusCode = error instanceof ContentNotFoundError ? 404 : 500;

    logApiCall(`/api/videos/${videoId}`, 'GET', statusCode, duration, {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    logger.error({ videoId, error }, 'Failed to fetch video');

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch video',
      },
      { status: statusCode }
    );
  }
}
