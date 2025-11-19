import pino from 'pino';

// Get deployment ID from config (will be set after config loads)
let deploymentId = 'unknown';

export function setDeploymentId(id: string) {
  deploymentId = id;
}

// Create base logger instance
export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  base: {
    env: process.env.NODE_ENV || 'development',
  },
  formatters: {
    level: (label) => {
      return { level: label };
    },
    bindings: () => {
      return { deploymentId };
    },
  },
  transport:
    process.env.NODE_ENV === 'development'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname',
            singleLine: false,
          },
        }
      : undefined,
  // Redact sensitive information
  redact: {
    paths: [
      'apiKey',
      'password',
      'token',
      'secret',
      'authorization',
      '*.apiKey',
      '*.password',
      '*.token',
      '*.secret',
      'api.youtubeApiKey',
      'req.headers.authorization',
      'req.headers.cookie',
    ],
    remove: true,
  },
});

/**
 * Get a child logger with additional context
 */
export function getLogger(context?: string | Record<string, unknown>) {
  if (typeof context === 'string') {
    return logger.child({ context });
  }
  return context ? logger.child(context) : logger;
}

/**
 * Log performance metrics
 */
export function logPerformance(
  operation: string,
  duration: number,
  metadata?: Record<string, unknown>
) {
  logger.info(
    {
      operation,
      duration,
      ...metadata,
    },
    `${operation} completed in ${duration}ms`
  );
}

/**
 * Log filter action
 */
export function logFilterAction(
  videoId: string,
  videoTitle: string,
  ruleId: string,
  action: 'blocked' | 'allowed',
  reason?: string
) {
  logger.info(
    {
      videoId,
      videoTitle,
      ruleId,
      action,
      reason,
      category: 'filter',
    },
    `Video ${action}: ${videoTitle}`
  );
}

/**
 * Log API call
 */
export function logApiCall(
  endpoint: string,
  method: string,
  statusCode: number,
  duration: number,
  metadata?: Record<string, unknown>
) {
  const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';

  logger[level](
    {
      endpoint,
      method,
      statusCode,
      duration,
      category: 'api',
      ...metadata,
    },
    `${method} ${endpoint} ${statusCode} (${duration}ms)`
  );
}

/**
 * Log YouTube API call
 */
export function logYouTubeApiCall(
  operation: string,
  success: boolean,
  duration: number,
  metadata?: Record<string, unknown>
) {
  const level = success ? 'info' : 'error';

  logger[level](
    {
      operation,
      success,
      duration,
      category: 'youtube-api',
      ...metadata,
    },
    `YouTube API ${operation}: ${success ? 'success' : 'failed'} (${duration}ms)`
  );
}

/**
 * Log cache operation
 */
export function logCacheOperation(
  operation: 'hit' | 'miss' | 'set' | 'delete',
  key: string,
  metadata?: Record<string, unknown>
) {
  logger.debug(
    {
      operation,
      key,
      category: 'cache',
      ...metadata,
    },
    `Cache ${operation}: ${key}`
  );
}

/**
 * Log configuration event
 */
export function logConfigEvent(
  event: 'loaded' | 'reloaded' | 'validation-error',
  message: string,
  metadata?: Record<string, unknown>
) {
  const level = event === 'validation-error' ? 'error' : 'info';

  logger[level](
    {
      event,
      category: 'config',
      ...metadata,
    },
    message
  );
}

/**
 * Create request logger middleware helper
 */
export function createRequestLogger() {
  return (req: Request) => {
    const start = Date.now();
    const url = new URL(req.url);

    logger.info(
      {
        method: req.method,
        path: url.pathname,
        query: Object.fromEntries(url.searchParams),
        category: 'request',
      },
      'Request received'
    );

    return () => {
      const duration = Date.now() - start;
      logPerformance('request', duration, {
        method: req.method,
        path: url.pathname,
      });
    };
  };
}

// Export default logger
export default logger;
