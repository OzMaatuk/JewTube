# Docker Configuration

This project uses Alpine Linux-based Docker images for both development and production environments, providing smaller image sizes and better security.

## Image Sizes Comparison

- **Alpine-based**: ~150-200 MB
- **Debian-based**: ~900-1000 MB

## Development Container

The devcontainer uses `node:20-alpine` with essential development tools:

- Git
- SSH client
- Bash shell
- Docker CLI
- Docker Compose

### Starting the Dev Container

1. Open the project in VS Code
2. Click "Reopen in Container" when prompted
3. Wait for the container to build and start (first time takes ~2 minutes)
4. Run `npm run dev` to start the development server

**Note**: `node_modules` is stored in a Docker volume for better performance and to avoid permission issues between host and container.

## Production Container

The production Dockerfile uses a multi-stage build with Alpine:

### Build Stages

1. **deps**: Installs production dependencies
2. **builder**: Builds the Next.js application
3. **runner**: Creates the minimal runtime image

### Alpine-Specific Tweaks

- `libc6-compat`: Required for Node.js native modules compatibility
- `curl`: Required for health checks
- Non-root user (`nextjs`) for security
- Minimal attack surface with only runtime dependencies

## Docker Compose

### Development

```bash
docker-compose -f .devcontainer/docker-compose.yml up
```

Includes:
- App container with development tools
- Redis container for caching

### Production

```bash
docker-compose up
```

Runs multiple deployments:
- `app-children`: Port 3001
- `app-education`: Port 3002
- `redis`: Port 6379

## Building Images

### Development
```bash
docker build -f .devcontainer/Dockerfile -t youtube-wrapper-dev .
```

### Production
```bash
docker build -t youtube-wrapper-prod .
```

## Health Checks

The production container includes a health check that pings `/api/health` every 30 seconds.

## Security Features

- Non-root user execution
- Minimal Alpine base image
- Read-only configuration volumes
- No unnecessary packages
- Security headers in middleware

## Optimization Tips

1. Use `.dockerignore` to exclude unnecessary files
2. Leverage Docker layer caching
3. Use `npm ci` instead of `npm install`
4. Multi-stage builds to minimize final image size
5. Alpine Linux for smaller base images
