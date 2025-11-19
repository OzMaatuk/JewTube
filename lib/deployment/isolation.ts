import { getLogger } from '@/lib/logger';
import type { DeploymentConfig } from '@/types';

const logger = getLogger('deployment-isolation');

/**
 * Deployment isolation utilities
 * Ensures deployments cannot access each other's data
 */
export class DeploymentIsolation {
  private deploymentId: string;

  constructor(config: DeploymentConfig) {
    this.deploymentId = config.deployment.id;
  }

  /**
   * Get cache key with deployment prefix
   */
  getCacheKey(key: string): string {
    return `${this.deploymentId}:${key}`;
  }

  /**
   * Validate access to a deployment
   */
  validateAccess(requestedDeploymentId: string): boolean {
    const hasAccess = requestedDeploymentId === this.deploymentId;

    if (!hasAccess) {
      logger.warn(
        {
          requestedDeploymentId,
          actualDeploymentId: this.deploymentId,
        },
        'Unauthorized deployment access attempt'
      );
    }

    return hasAccess;
  }

  /**
   * Get deployment ID
   */
  getDeploymentId(): string {
    return this.deploymentId;
  }

  /**
   * Check if a resource belongs to this deployment
   */
  ownsResource(resourceDeploymentId: string): boolean {
    return resourceDeploymentId === this.deploymentId;
  }
}

/**
 * Extract deployment ID from subdomain or path
 */
export function extractDeploymentId(hostname: string, pathname: string): string | null {
  // Try subdomain extraction (e.g., children.example.com -> children)
  const subdomainMatch = hostname.match(/^([^.]+)\./);
  if (subdomainMatch && subdomainMatch[1] !== 'www') {
    return subdomainMatch[1];
  }

  // Try path extraction (e.g., /deployments/children -> children)
  const pathMatch = pathname.match(/^\/deployments\/([^/]+)/);
  if (pathMatch) {
    return pathMatch[1];
  }

  return null;
}

/**
 * Validate deployment domain
 */
export function validateDeploymentDomain(config: DeploymentConfig, hostname: string): boolean {
  // Check if hostname matches configured domain
  const configDomain = config.deployment.domain.toLowerCase();
  const requestDomain = hostname.toLowerCase();

  // Exact match
  if (requestDomain === configDomain) {
    return true;
  }

  // Subdomain match (e.g., www.example.com matches example.com)
  if (requestDomain.endsWith(`.${configDomain}`)) {
    return true;
  }

  // Localhost for development
  if (
    process.env.NODE_ENV === 'development' &&
    (requestDomain.includes('localhost') || requestDomain.includes('127.0.0.1'))
  ) {
    return true;
  }

  logger.warn(
    {
      configDomain,
      requestDomain,
    },
    'Domain mismatch'
  );

  return false;
}
