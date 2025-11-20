/**
 * Base application error class
 */
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode = 500,
    public code?: string,
    public metadata?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      metadata: this.metadata,
    };
  }
}

/**
 * YouTube API related errors
 */
export class YouTubeAPIError extends AppError {
  constructor(
    message: string,
    public statusCode = 500,
    public quotaExceeded = false,
    public retryable = true
  ) {
    super(message, statusCode, 'YOUTUBE_API_ERROR', { quotaExceeded, retryable });
    this.name = 'YouTubeAPIError';
  }
}

/**
 * Content not found error
 */
export class ContentNotFoundError extends AppError {
  constructor(resourceType: string, resourceId: string) {
    super(`${resourceType} not found: ${resourceId}`, 404, 'CONTENT_NOT_FOUND', {
      resourceType,
      resourceId,
    });
    this.name = 'ContentNotFoundError';
  }
}

/**
 * Filter error
 */
export class FilterError extends AppError {
  constructor(
    message: string,
    public filterId?: string
  ) {
    super(message, 500, 'FILTER_ERROR', { filterId });
    this.name = 'FilterError';
  }
}

/**
 * Cache error
 */
export class CacheError extends AppError {
  constructor(
    message: string,
    public operation?: string
  ) {
    super(message, 500, 'CACHE_ERROR', { operation });
    this.name = 'CacheError';
  }
}

/**
 * Validation error
 */
export class ValidationError extends AppError {
  constructor(
    message: string,
    public errors: string[]
  ) {
    super(message, 400, 'VALIDATION_ERROR', { errors });
    this.name = 'ValidationError';
  }
}

/**
 * Rate limit error
 */
export class RateLimitError extends AppError {
  constructor(
    message = 'Rate limit exceeded',
    public retryAfter?: number
  ) {
    super(message, 429, 'RATE_LIMIT_ERROR', { retryAfter });
    this.name = 'RateLimitError';
  }
}

/**
 * Authentication error
 */
export class AuthenticationError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR');
    this.name = 'AuthenticationError';
  }
}

/**
 * Authorization error
 */
export class AuthorizationError extends AppError {
  constructor(message = 'Insufficient permissions') {
    super(message, 403, 'AUTHORIZATION_ERROR');
    this.name = 'AuthorizationError';
  }
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: Error): boolean {
  if (error instanceof YouTubeAPIError) {
    return error.retryable && !error.quotaExceeded;
  }

  if (error instanceof AppError) {
    return error.statusCode >= 500 && error.statusCode < 600;
  }

  return false;
}

/**
 * Get retry delay with exponential backoff
 */
export function getRetryDelay(attempt: number, baseDelay = 1000): number {
  const delay = baseDelay * 2 ** attempt;
  const jitter = Math.random() * 1000;
  return Math.min(delay + jitter, 30000); // Max 30 seconds
}

/**
 * Retry function with exponential backoff
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      // Don't retry if error is not retryable
      if (!isRetryableError(lastError)) {
        throw lastError;
      }

      // Don't retry on last attempt
      if (attempt === maxRetries - 1) {
        throw lastError;
      }

      // Wait before retrying
      const delay = getRetryDelay(attempt, baseDelay);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  // This should never be reached, but TypeScript needs it
  throw new Error('Retry failed');
}

/**
 * Safe async wrapper that catches errors
 */
export async function safeAsync<T>(
  operation: () => Promise<T>,
  fallback: T,
  onError?: (error: Error) => void
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (onError) {
      onError(error as Error);
    }
    return fallback;
  }
}

/**
 * Format error for logging
 */
export function formatError(error: Error): Record<string, unknown> {
  if (error instanceof AppError) {
    return {
      name: error.name,
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      metadata: error.metadata,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    };
  }

  return {
    name: error.name,
    message: error.message,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
  };
}
