import { ValidationError } from '@/lib/errors';
import { getLogger, logApiCall } from '@/lib/logger';
import { getContentService } from '@/lib/services';
import { type NextRequest, NextResponse } from 'next/server';

const logger = getLogger('api-videos');

export const revalidate = 300; // Revalidate every 5 minutes

/**
 * GET /api/videos
 * Get filtered video feed with pagination
 */
export async function GET(request: NextRequest) {
  const start = Date.now();
  const searchParams = request.nextUrl.searchParams;

  try {
    // Parse and validate query parameters
    const page = Number.parseInt(searchParams.get('page') || '1', 10);
    const limit = Number.parseInt(searchParams.get('limit') || '20', 10);
    const category = searchParams.get('category') || undefined;

    // Validate parameters
    if (page < 1 || page > 1000) {
      throw new ValidationError('Invalid page number', ['Page must be between 1 and 1000']);
    }

    if (limit < 1 || limit > 100) {
      throw new ValidationError('Invalid limit', ['Limit must be between 1 and 100']);
    }

    // Get content service
    const contentService = getContentService();

    // Fetch videos
    const videos = await contentService.getVideos({
      page,
      limit,
      category,
    });

    const duration = Date.now() - start;
    logApiCall('/api/videos', 'GET', 200, duration, {
      page,
      limit,
      category,
      count: videos.length,
    });

    return NextResponse.json({
      videos,
      page,
      limit,
      total: videos.length,
      hasMore: videos.length === limit,
    });
  } catch (error) {
    const duration = Date.now() - start;
    const statusCode = error instanceof ValidationError ? 400 : 500;

    logApiCall('/api/videos', 'GET', statusCode, duration, {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    logger.error({ error }, 'Failed to fetch videos');

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch videos',
      },
      { status: statusCode }
    );
  }
}
