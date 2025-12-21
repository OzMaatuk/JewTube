# API Reference

This document describes the REST API endpoints available in the YouTube Wrapper Platform.

## Base URL

All API endpoints are relative to your deployment's base URL.

## Authentication

Currently, no authentication is required for public endpoints. Rate limiting may apply based on your configuration.

## Endpoints

### GET /api/videos

Retrieve a list of filtered videos with optional search and pagination.

#### Query Parameters

- `page` (number, optional): Page number for pagination (default: 1)
- `limit` (number, optional): Number of videos per page (default: 20, max: 100)
- `category` (string, optional): Filter by video category
- `q` (string, optional): Search query for full-text search across titles, descriptions, channels, and tags
- `ids` (string, optional): Comma-separated list of video IDs to fetch specific videos

#### Response

```json
{
  "videos": [
    {
      "id": "string",
      "title": "string",
      "description": "string",
      "thumbnail": "string",
      "channelId": "string",
      "channelName": "string",
      "publishedAt": "2025-12-21T00:00:00.000Z",
      "duration": 3600,
      "viewCount": 1000000,
      "likeCount": 50000,
      "tags": ["string"],
      "categoryId": "string",
      "categoryName": "string",
      "contentRating": {
        "madeForKids": false,
        "ageRestricted": false
      },
      "hasClosedCaptions": true,
      "metadata": {
        "fetchedAt": "2025-12-21T00:00:00.000Z",
        "sourceType": "channel",
        "sourceId": "string"
      }
    }
  ],
  "page": 1,
  "limit": 20,
  "total": 20,
  "hasMore": true
}
```

#### Examples

Get first page of videos:

```
GET /api/videos
```

Search for videos:

```
GET /api/videos?q=javascript+tutorial
```

Get videos by category:

```
GET /api/videos?category=Education
```

Get specific videos by IDs:

```
GET /api/videos?ids=dQw4w9WgXcQ,9bZkp7q19f0
```

### GET /api/videos/[id]

Retrieve a single video by its YouTube ID.

#### Parameters

- `id` (string, required): YouTube video ID

#### Response

```json
{
  "video": {
    "id": "string",
    "title": "string",
    "description": "string",
    "thumbnail": "string",
    "channelId": "string",
    "channelName": "string",
    "publishedAt": "2025-12-21T00:00:00.000Z",
    "duration": 3600,
    "viewCount": 1000000,
    "likeCount": 50000,
    "tags": ["string"],
    "categoryId": "string",
    "categoryName": "string",
    "contentRating": {
      "madeForKids": false,
      "ageRestricted": false
    },
    "hasClosedCaptions": true,
    "metadata": {
      "fetchedAt": "2025-12-21T00:00:00.000Z",
      "sourceType": "channel",
      "sourceId": "string"
    }
  }
}
```

#### Error Responses

```json
{
  "error": "Video not found or filtered out"
}
```

### GET /api/config/public

Retrieve public configuration information for the current deployment.

#### Response

```json
{
  "deployment": {
    "id": "string",
    "name": "string",
    "domain": "string"
  },
  "branding": {
    "appName": "string",
    "logo": "string",
    "favicon": "string",
    "colorScheme": {
      "primary": "string",
      "secondary": "string",
      "background": "string",
      "text": "string",
      "accent": "string"
    }
  },
  "features": {
    "enableSearch": true,
    "enableComments": false,
    "enableSharing": true,
    "enablePlaylists": true
  }
}
```

### GET /api/health

Health check endpoint for monitoring and load balancers.

#### Response

```json
{
  "status": "ok",
  "timestamp": "2025-12-21T00:00:00.000Z",
  "version": "1.0.0"
}
```

## Error Handling

All endpoints return appropriate HTTP status codes:

- `200`: Success
- `400`: Bad Request (validation errors)
- `404`: Not Found
- `429`: Too Many Requests (rate limited)
- `500`: Internal Server Error

Error responses include an `error` field with a descriptive message:

```json
{
  "error": "Invalid page number"
}
```

## Rate Limiting

API endpoints are subject to rate limiting based on your deployment configuration. Rate limit headers are included in responses:

- `X-RateLimit-Limit`: Maximum requests per time window
- `X-RateLimit-Remaining`: Remaining requests in current window
- `X-RateLimit-Reset`: Time when the rate limit resets (Unix timestamp)

## Caching

Responses are cached according to your deployment's refresh interval configuration. Cache headers indicate cache status:

- `Cache-Control`: Cache directives
- `X-Cache-Status`: Cache hit/miss status
