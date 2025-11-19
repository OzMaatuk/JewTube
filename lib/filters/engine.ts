import { FilterError } from '@/lib/errors';
import { getLogger, logFilterAction } from '@/lib/logger';
import type { DeploymentConfig, FilterResult, FilterRule, Video } from '@/types';
import type { IFilter } from './base';

const logger = getLogger('filter-engine');

export interface FilteredVideos {
  passed: Video[];
  blocked: Array<{ video: Video; reason: string; ruleId: string }>;
}

/**
 * Filter engine orchestrator
 * Manages all filter types and applies them to videos
 */
export class FilterEngine {
  private filters: Map<string, IFilter> = new Map();
  private config: DeploymentConfig;

  constructor(config: DeploymentConfig) {
    this.config = config;
  }

  /**
   * Register a filter
   */
  registerFilter(filter: IFilter): void {
    this.filters.set(filter.type, filter);
    logger.debug({ type: filter.type }, 'Filter registered');
  }

  /**
   * Filter a list of videos
   */
  async filterVideos(videos: Video[]): Promise<FilteredVideos> {
    if (!this.config.filters.enabled) {
      logger.info('Filtering disabled, returning all videos');
      return { passed: videos, blocked: [] };
    }

    const passed: Video[] = [];
    const blocked: Array<{ video: Video; reason: string; ruleId: string }> = [];

    for (const video of videos) {
      const result = await this.evaluateVideo(video);

      if (result.passed) {
        passed.push(video);
      } else {
        blocked.push({
          video,
          reason: result.reason || 'Blocked by filter',
          ruleId: result.ruleId,
        });

        // Log filtered video
        if (!this.config.filters.dryRunMode) {
          logFilterAction(video.id, video.title, result.ruleId, 'blocked', result.reason);
        } else {
          logFilterAction(
            video.id,
            video.title,
            result.ruleId,
            'blocked',
            `[DRY RUN] ${result.reason}`
          );
        }
      }
    }

    logger.info(
      {
        total: videos.length,
        passed: passed.length,
        blocked: blocked.length,
        dryRun: this.config.filters.dryRunMode,
      },
      'Video filtering completed'
    );

    // In dry-run mode, return all videos but log what would be filtered
    if (this.config.filters.dryRunMode) {
      return { passed: videos, blocked };
    }

    return { passed, blocked };
  }

  /**
   * Evaluate a single video against all filter rules
   */
  private async evaluateVideo(video: Video): Promise<FilterResult> {
    // If no rules, allow all videos
    if (this.config.filters.rules.length === 0) {
      return { passed: true, ruleId: 'none' };
    }

    // Apply each filter rule
    for (const rule of this.config.filters.rules) {
      const filter = this.filters.get(rule.type);

      if (!filter) {
        logger.warn({ ruleType: rule.type }, 'Filter type not registered, skipping');
        continue;
      }

      try {
        const result = await filter.evaluate(video, rule);

        // Filter already handles action logic, so if it didn't pass, block the video
        if (!result.passed) {
          return result;
        }
      } catch (error) {
        logger.error(
          {
            ruleId: rule.id,
            videoId: video.id,
            error: error instanceof Error ? error.message : 'Unknown error',
          },
          'Filter evaluation error'
        );
      }
    }

    // If we get here, video passed all filters
    return { passed: true, ruleId: 'all' };
  }

  /**
   * Test a single video against filters (for debugging)
   */
  async testVideo(video: Video): Promise<FilterResult> {
    return this.evaluateVideo(video);
  }

  /**
   * Get filter statistics
   */
  getStats(): {
    enabled: boolean;
    rulesCount: number;
    filterTypes: string[];
    sensitivity: string;
  } {
    return {
      enabled: this.config.filters.enabled,
      rulesCount: this.config.filters.rules.length,
      filterTypes: Array.from(this.filters.keys()),
      sensitivity: this.config.filters.sensitivity,
    };
  }
}
