# Configuration Guide

This guide explains all configuration options for the YouTube Wrapper Platform.

## Configuration File Format

Configuration files can be in YAML or JSON format. YAML is recommended for better readability.

**Location**: `config/deployment.yaml` (or specify with `CONFIG_FILE` environment variable)

## Configuration Structure

### Deployment

Identifies the deployment instance.

```yaml
deployment:
  id: 'unique-deployment-id' # Lowercase alphanumeric with hyphens
  name: 'Display Name' # Human-readable name
  domain: 'example.com' # Domain where deployed
```

### Branding

Customizes the visual appearance.

```yaml
branding:
  appName: 'My Video App'
  logo: '/public/logos/logo.png'
  favicon: '/public/favicons/favicon.ico'
  colorScheme:
    primary: '#FF6B6B' # Main brand color
    secondary: '#4ECDC4' # Secondary color
    background: '#FFFFFF' # Background color
    text: '#2C3E50' # Text color
    accent: '#FFD93D' # Accent color
  customCSS: | # Optional custom CSS
    .custom-class { color: red; }
```

### Content

Defines video sources and refresh behavior.

```yaml
content:
  refreshInterval: 30 # Minutes between content updates (5-1440)
  manualApprovalMode: false # Require manual approval for new videos
  sources:
    - type: 'channel' # YouTube channel
      id: 'UCChannelID'

    - type: 'playlist' # YouTube playlist
      id: 'PLPlaylistID'

    - type: 'video' # Individual video
      id: 'VideoID'

    - type: 'search' # Search query
      params:
        q: 'search terms'
        maxResults: 50
        videoDuration: 'short' # short, medium, long
```

### Filters

Controls content filtering.

```yaml
filters:
  enabled: true
  sensitivity: 'strict' # strict, moderate, permissive
  dryRunMode: false # Log filters without applying
  rules:
    - id: 'unique-rule-id'
      type: 'metadata' # See filter types below
      conditions:
        - field: 'duration'
          operator: 'lt' # equals, contains, regex, gt, lt, in
          value: 600
      action: 'block' # block or allow
      logic: 'AND' # AND or OR (for multiple conditions)
```

#### Filter Types

1. **metadata**: Video properties (title, description, duration, views, etc.)
2. **content**: Content characteristics (category, rating, language, captions)
3. **source**: Channel-level rules (verified status, subscriber count)
4. **pattern**: Keyword and regex matching
5. **behavioral**: Engagement signals (likes, comments, ratings)
6. **temporal**: Time-based rules (upload date, content age)
7. **allowlist**: Explicit list of allowed content
8. **blocklist**: Explicit list of blocked content
9. **external**: Third-party API integration
10. **ml**: Machine learning-based filtering

### Privacy

Compliance and privacy settings.

```yaml
privacy:
  coppaCompliant: true # COPPA compliance for children
  gdprCompliant: true # GDPR compliance
  disableTracking: false # Disable all analytics
  ageGate:
    enabled: true
    minimumAge: 13
    verificationMethod: 'simple' # simple or date-of-birth
    redirectUrl: 'https://...' # Optional redirect for underage
```

### Features

Enable/disable platform features.

```yaml
features:
  enableSearch: true # Allow users to search videos (now implemented)
  enableComments: false # Show video comments (coming soon)
  enableSharing: true # Allow sharing videos
  enablePlaylists: true # Enable playlist creation (now implemented)
```

### API

YouTube API configuration.

```yaml
api:
  youtubeApiKey: '${YOUTUBE_API_KEY}' # Use env var for security
  rateLimit:
    requestsPerDay: 10000
    requestsPerMinute: 100
    burstLimit: 150
```

## Environment Variables

Sensitive data should be stored in environment variables and referenced in config:

```yaml
api:
  youtubeApiKey: '${YOUTUBE_API_KEY}'
```

**Required Environment Variables:**

- `YOUTUBE_API_KEY` - Your YouTube Data API key
- `UPSTASH_REDIS_REST_URL` - Redis connection URL (optional)
- `UPSTASH_REDIS_REST_TOKEN` - Redis auth token (optional)

## Configuration Validation

Validate your configuration before deployment:

```bash
npm run validate-config config/deployment.yaml
```

## Hot Reload

In development mode, configuration changes are automatically detected and reloaded without restarting the application.

## Examples

See example configurations in the `config/` directory:

- `children.example.yaml` - Kids content
- `education.example.yaml` - Educational content
- `religious.example.yaml` - Faith-based content

## Best Practices

1. **Use environment variables** for all sensitive data
2. **Start with strict filtering** and relax as needed
3. **Test filters in dry-run mode** before applying
4. **Use manual approval mode** for sensitive deployments
5. **Keep refresh intervals reasonable** (30-60 minutes recommended)
6. **Monitor API quota usage** to avoid rate limits
7. **Document custom filter rules** with clear IDs and comments
