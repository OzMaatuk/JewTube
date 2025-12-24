import type { FilterResult, FilterRule, Video } from '@/types';

/**
 * Base filter interface
 * All filter types must implement this interface
 */
export interface IFilter {
  type: FilterRule['type'];
  evaluate(video: Video, rule: FilterRule): Promise<FilterResult>;
}

/**
 * Base filter class with common functionality
 */
export abstract class BaseFilter implements IFilter {
  abstract type: FilterRule['type'];

  abstract evaluate(video: Video, rule: FilterRule): Promise<FilterResult>;

  /**
   * Create a filter result
   */
  protected createResult(passed: boolean, ruleId: string, reason?: string): FilterResult {
    return {
      passed,
      ruleId,
      reason,
    };
  }

  /**
   * Check if a condition matches using the specified operator
   */
  protected checkCondition(value: unknown, operator: string, expected: unknown): boolean {
    switch (operator) {
      case 'equals':
        if (value == null && expected == null) return true;
        if (value == null || expected == null) return false;
        return value === expected;

      case 'contains':
        if (typeof value === 'string' && typeof expected === 'string') {
          return value.toLowerCase().includes(expected.toLowerCase());
        }
        if (Array.isArray(value)) {
          return value.includes(expected);
        }
        return false;

      case 'regex':
        if (typeof value === 'string' && typeof expected === 'string') {
          return new RegExp(expected, 'i').test(value);
        }
        return false;

      case 'gt':
        if (value == null) return false;
        return Number(value) > Number(expected);

      case 'lt':
        if (value == null) return false;
        return Number(value) < Number(expected);

      case 'in':
        if (Array.isArray(expected)) {
          return expected.includes(value);
        }
        return false;

      default:
        return false;
    }
  }

  /**
   * Evaluate multiple conditions with logic (AND/OR)
   */
  protected evaluateConditions(
    video: Video,
    rule: FilterRule,
    checkFn: (condition: FilterRule['conditions'][number]) => boolean
  ): boolean {
    const logic = rule.logic || 'AND';

    if (logic === 'OR') {
      return rule.conditions.some(checkFn);
    }

    // Default to AND
    return rule.conditions.every(checkFn);
  }
}
