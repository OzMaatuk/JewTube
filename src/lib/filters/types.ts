import type { FilterRule, Video } from '@/types';
import { BaseFilter } from './base';
import { getLogger } from '@/lib/logger';

const logger = getLogger('filters');

/**
 * Metadata Filter
 * Filters based on video properties (title, description, duration, views, etc.)
 */
export class MetadataFilter extends BaseFilter {
  type = 'metadata' as const;

  async evaluate(video: Video, rule: FilterRule) {
    const conditionsMatched = this.evaluateConditions(video, rule, (condition) => {
      const value = this.getVideoProperty(video, condition.field);
      return this.checkCondition(value, condition.operator, condition.value);
    });

    // For block rules, invert the result (matched = blocked = failed)
    // For allow rules, keep as is (matched = allowed = passed)
    const passed = rule.action === 'block' ? !conditionsMatched : conditionsMatched;

    return this.createResult(
      passed,
      rule.id,
      passed
        ? undefined
        : `Metadata condition ${rule.action === 'block' ? 'matched' : 'failed'}: ${rule.conditions.map((c) => c.field).join(', ')}`
    );
  }

  private getVideoProperty(video: Video, field: string): unknown {
    const fieldMap: Record<string, unknown> = {
      title: video.title,
      description: video.description,
      duration: video.duration,
      viewCount: video.viewCount,
      likeCount: video.likeCount,
      commentCount: video.commentCount,
      tags: video.tags,
    };
    return fieldMap[field];
  }
}

/**
 * Content Filter
 * Filters based on content characteristics (category, rating, language, captions)
 */
export class ContentFilter extends BaseFilter {
  type = 'content' as const;

  async evaluate(video: Video, rule: FilterRule) {
    const conditionsMatched = this.evaluateConditions(video, rule, (condition) => {
      const value = this.getContentProperty(video, condition.field);
      return this.checkCondition(value, condition.operator, condition.value);
    });

    // For block rules, invert the result (matched = blocked = failed)
    // For allow rules, keep as is (matched = allowed = passed)
    const passed = rule.action === 'block' ? !conditionsMatched : conditionsMatched;

    return this.createResult(
      passed,
      rule.id,
      passed
        ? undefined
        : `Content condition ${rule.action === 'block' ? 'matched' : 'failed'}: ${rule.conditions.map((c) => c.field).join(', ')}`
    );
  }

  private getContentProperty(video: Video, field: string): unknown {
    const fieldMap: Record<string, unknown> = {
      categoryId: video.categoryId,
      categoryName: video.categoryName,
      madeForKids: video.contentRating?.madeForKids,
      ageRestricted: video.contentRating?.ageRestricted,
      hasClosedCaptions: video.hasClosedCaptions,
      defaultLanguage: video.defaultLanguage,
      isLiveContent: video.isLiveContent,
    };
    return fieldMap[field];
  }
}

/**
 * Source Filter
 * Filters based on channel-level properties
 */
export class SourceFilter extends BaseFilter {
  type = 'source' as const;

  async evaluate(video: Video, rule: FilterRule) {
    const conditionsMatched = this.evaluateConditions(video, rule, (condition) => {
      const value = this.getSourceProperty(video, condition.field);
      return this.checkCondition(value, condition.operator, condition.value);
    });

    // For block rules, invert the result (matched = blocked = failed)
    // For allow rules, keep as is (matched = allowed = passed)
    const passed = rule.action === 'block' ? !conditionsMatched : conditionsMatched;

    return this.createResult(
      passed,
      rule.id,
      passed
        ? undefined
        : `Source condition ${rule.action === 'block' ? 'matched' : 'failed'}: ${rule.conditions.map((c) => c.field).join(', ')}`
    );
  }

  private getSourceProperty(video: Video, field: string): unknown {
    const fieldMap: Record<string, unknown> = {
      channelId: video.channelId,
      channelName: video.channelName,
      // Note: verified status would need to be fetched separately
      verified: false, // Placeholder
    };
    return fieldMap[field];
  }
}

/**
 * Pattern Filter
 * Filters using regex patterns and keyword matching
 */
export class PatternFilter extends BaseFilter {
  type = 'pattern' as const;

  async evaluate(video: Video, rule: FilterRule) {
    const conditionsMatched = this.evaluateConditions(video, rule, (condition) => {
      const value = this.getPatternProperty(video, condition.field);
      const text = String(value || '').toLowerCase();
      
      if (condition.operator === 'regex') {
        try {
          return new RegExp(String(condition.value), 'i').test(text);
        } catch (error) {
          logger.warn({ pattern: condition.value, error }, 'Invalid regex pattern, treating as literal');
          return text.includes(String(condition.value).toLowerCase());
        }
      }
      if (condition.operator === 'contains') {
        return text.includes(String(condition.value).toLowerCase());
      }
      return false;
    });

    // For block rules, invert the result (matched = blocked = failed)
    // For allow rules, keep as is (matched = allowed = passed)
    const passed = rule.action === 'block' ? !conditionsMatched : conditionsMatched;

    return this.createResult(
      passed,
      rule.id,
      passed ? undefined : `Pattern condition ${rule.action === 'block' ? 'matched' : 'failed'}: ${rule.conditions.map((c) => c.field).join(', ')}`
    );
  }

  private getPatternProperty(video: Video, field: string): unknown {
    const fieldMap: Record<string, unknown> = {
      title: video.title,
      description: video.description,
    };
    return fieldMap[field];
  }
}

/**
 * Behavioral Filter
 * Filters based on engagement metrics
 */
export class BehavioralFilter extends BaseFilter {
  type = 'behavioral' as const;

  async evaluate(video: Video, rule: FilterRule) {
    const conditionsMatched = this.evaluateConditions(video, rule, (condition) => {
      const value = this.getBehavioralProperty(video, condition.field);
      return this.checkCondition(value, condition.operator, condition.value);
    });

    // For block rules, invert the result (matched = blocked = failed)
    // For allow rules, keep as is (matched = allowed = passed)
    const passed = rule.action === 'block' ? !conditionsMatched : conditionsMatched;

    return this.createResult(
      passed,
      rule.id,
      passed
        ? undefined
        : `Behavioral condition ${rule.action === 'block' ? 'matched' : 'failed'}: ${rule.conditions.map((c) => c.field).join(', ')}`
    );
  }

  private getBehavioralProperty(video: Video, field: string): unknown {
    const likeRatio = video.likeCount && video.viewCount ? video.likeCount / video.viewCount : 0;

    const fieldMap: Record<string, unknown> = {
      likeRatio,
      likeCount: video.likeCount || 0,
      commentCount: video.commentCount || 0,
      commentsDisabled: !video.commentCount || video.commentCount === 0, // Fallback logic
    };
    return fieldMap[field];
  }
}

/**
 * Temporal Filter
 * Filters based on time-related properties
 */
export class TemporalFilter extends BaseFilter {
  type = 'temporal' as const;

  async evaluate(video: Video, rule: FilterRule) {
    const now = new Date();

    const conditionsMatched = this.evaluateConditions(video, rule, (condition) => {
      if (condition.field === 'publishedAt') {
        const videoDate = new Date(video.publishedAt);
        const ageInDays = (now.getTime() - videoDate.getTime()) / (1000 * 60 * 60 * 24);

        // Value is in days
        const thresholdDays = Number(condition.value);
        
        // 'lt' means less than X days old (newer content)
        // 'gt' means greater than X days old (older content)
        if (condition.operator === 'lt') {
          return ageInDays < thresholdDays;
        }
        if (condition.operator === 'gt') {
          return ageInDays > thresholdDays;
        }
      }
      return false;
    });

    // For block rules, invert the result (matched = blocked = failed)
    // For allow rules, keep as is (matched = allowed = passed)
    const passed = rule.action === 'block' ? !conditionsMatched : conditionsMatched;

    return this.createResult(
      passed,
      rule.id,
      passed ? undefined : `Temporal condition ${rule.action === 'block' ? 'matched' : 'failed'}`
    );
  }
}

/**
 * Allowlist Filter
 * Only allows explicitly listed content
 */
export class AllowlistFilter extends BaseFilter {
  type = 'allowlist' as const;

  async evaluate(video: Video, rule: FilterRule) {
    const conditionsMatched = this.evaluateConditions(video, rule, (condition) => {
      const value = this.getProperty(video, condition.field);
      return this.checkCondition(value, condition.operator, condition.value);
    });

    // For block rules, invert the result (matched = blocked = failed)
    // For allow rules, keep as is (matched = allowed = passed)
    const passed = rule.action === 'block' ? !conditionsMatched : conditionsMatched;

    return this.createResult(
      passed,
      rule.id,
      passed ? undefined : rule.action === 'block' ? 'In blocklist' : 'Not in allowlist'
    );
  }

  private getProperty(video: Video, field: string): unknown {
    const fieldMap: Record<string, unknown> = {
      videoId: video.id,
      channelId: video.channelId,
    };
    return fieldMap[field];
  }
}

/**
 * Blocklist Filter
 * Blocks explicitly listed content
 */
export class BlocklistFilter extends BaseFilter {
  type = 'blocklist' as const;

  async evaluate(video: Video, rule: FilterRule) {
    const conditionsMatched = this.evaluateConditions(video, rule, (condition) => {
      const value = this.getProperty(video, condition.field);
      return this.checkCondition(value, condition.operator, condition.value);
    });

    // For block rules, invert the result (matched = blocked = failed)
    // For allow rules, keep as is (matched = allowed = passed)
    const passed = rule.action === 'block' ? !conditionsMatched : conditionsMatched;

    return this.createResult(
      passed,
      rule.id,
      passed ? undefined : rule.action === 'block' ? 'In blocklist' : 'Not in allowlist'
    );
  }

  private getProperty(video: Video, field: string): unknown {
    const fieldMap: Record<string, unknown> = {
      videoId: video.id,
      channelId: video.channelId,
    };
    return fieldMap[field];
  }
}

/**
 * External API Filter (placeholder for future implementation)
 * Integrates with third-party content moderation services
 */
export class ExternalFilter extends BaseFilter {
  type = 'external' as const;

  async evaluate(video: Video, rule: FilterRule) {
    // Placeholder - would call external API here
    // For now, just pass all videos
    return this.createResult(true, rule.id);
  }
}

/**
 * ML Filter (placeholder for future implementation)
 * Uses machine learning for content analysis
 */
export class MLFilter extends BaseFilter {
  type = 'ml' as const;

  async evaluate(video: Video, rule: FilterRule) {
    // Placeholder - would use ML model here
    // For now, just pass all videos
    return this.createResult(true, rule.id);
  }
}
