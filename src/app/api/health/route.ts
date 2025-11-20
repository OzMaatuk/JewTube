import { getRedisClient } from '@/lib/cache';
import { getConfig } from '@/lib/config';
import { NextResponse } from 'next/server';

/**
 * GET /api/health
 * Health check endpoint for monitoring
 */
export async function GET() {
  try {
    const config = getConfig();
    const redis = getRedisClient();

    // Check Redis connection
    let redisStatus = 'not_configured';
    if (redis) {
      try {
        await redis.ping();
        redisStatus = 'healthy';
      } catch {
        redisStatus = 'unhealthy';
      }
    }

    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      deployment: {
        id: config.deployment.id,
        name: config.deployment.name,
      },
      services: {
        redis: redisStatus,
        config: 'healthy',
      },
      uptime: process.uptime(),
    };

    return NextResponse.json(health);
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    );
  }
}
