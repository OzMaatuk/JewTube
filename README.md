# YouTube Wrapper Platform

A modular, configuration-driven platform for creating audience-specific YouTube content applications with built-in content filtering and safety features.

## Features

- 🎯 **Configuration-Driven**: Deploy multiple audience-specific apps without code changes
- 🛡️ **Content Safety**: 10 types of configurable filters for safe content curation
- ⚡ **High Performance**: Next.js 15 with ISR, Server Components, and edge caching
- 📱 **Cross-Platform**: Responsive web app with PWA support
- 🔒 **Privacy First**: COPPA and GDPR compliant with configurable tracking
- 🚀 **Free Hosting**: Deploy on Vercel, Cloudflare Pages, or Netlify for $0/month
- 🔍 **Advanced Search**: Full-text search across video titles, descriptions, channels, and tags
- 📚 **Personal Playlists**: Create and manage custom video playlists with local storage

## Quick Start

### Prerequisites

- Node.js 20+ LTS
- YouTube Data API key
- (Optional) Upstash Redis account for caching

### Option 1: Dev Container (Recommended)

The easiest way to get started is using the dev container:

1. Install [Docker Desktop](https://www.docker.com/products/docker-desktop) and [VS Code](https://code.visualstudio.com/)
2. Install the [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)
3. Clone the repository and open in VS Code
4. Press `F1` → **Dev Containers: Reopen in Container**
5. Create `.env.local` with your YouTube API key
6. Run `npm run dev`

See [.devcontainer/README.md](./.devcontainer/README.md) for more details.

### Option 2: Local Installation

```bash
# Clone the repository
git clone https://github.com/your-org/youtube-wrapper-platform.git
cd youtube-wrapper-platform

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env and add your YouTube API key
```

### Configuration

Create a configuration file in `config/` directory:

```yaml
# config/children.yaml
deployment:
  id: 'children-content'
  name: 'Kids Safe Videos'
  domain: 'kids.example.com'

branding:
  appName: 'Kids Safe Videos'
  logo: '/public/logos/kids-logo.png'
  favicon: '/public/favicons/kids-favicon.ico'
  colorScheme:
    primary: '#FF6B6B'
    secondary: '#4ECDC4'
    background: '#FFFFFF'
    text: '#2C3E50'

content:
  refreshInterval: 30
  sources:
    - type: 'channel'
      id: 'UCbCmjCuTUZos6Inko4u57UQ'

filters:
  enabled: true
  sensitivity: 'strict'
  rules:
    - id: 'kids-only'
      type: 'content'
      conditions:
        - field: 'madeForKids'
          operator: 'equals'
          value: true
      action: 'allow'
```

### Development

```bash
# Start development server
npm run dev

# Open http://localhost:3000

# Run tests
npm test

# Run tests with coverage
npm test -- --coverage

# Type checking
npm run type-check

# Linting and formatting
npm run lint
npm run format
```

### Deployment

See [DEPLOYMENT.md](./docs/DEPLOYMENT.md) for detailed deployment instructions.

## Project Structure

```
youtube-wrapper-platform/
├── app/                    # Next.js App Router pages
├── components/             # React components
├── lib/                    # Core business logic
│   ├── config/            # Configuration loader
│   ├── services/          # Content & filter services
│   └── utils.ts           # Utility functions
├── types/                  # TypeScript type definitions
├── config/                 # Deployment configurations
└── public/                 # Static assets
```

## Documentation

- [Configuration Guide](./docs/CONFIGURATION.md)
- [Filter Types](./docs/FILTERS.md)
- [Deployment Guide](./docs/DEPLOYMENT.md)
- [API Reference](./docs/API.md)

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript 5.3+
- **Styling**: TailwindCSS 4.0
- **Caching**: Upstash Redis
- **Validation**: Zod
- **Logging**: Pino
- **Testing**: Vitest + Playwright

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.
