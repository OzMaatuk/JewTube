export type { IFilter } from './base';
export { BaseFilter } from './base';
export { FilterEngine, type FilteredVideos } from './engine';
export {
  MetadataFilter,
  ContentFilter,
  SourceFilter,
  PatternFilter,
  BehavioralFilter,
  TemporalFilter,
  AllowlistFilter,
  BlocklistFilter,
  ExternalFilter,
  MLFilter,
} from './types';

// Factory function to create and initialize filter engine
import type { DeploymentConfig } from '@/types';
import { FilterEngine } from './engine';
import {
  AllowlistFilter,
  BehavioralFilter,
  BlocklistFilter,
  ContentFilter,
  ExternalFilter,
  MLFilter,
  MetadataFilter,
  PatternFilter,
  SourceFilter,
  TemporalFilter,
} from './types';

export function createFilterEngine(config: DeploymentConfig): FilterEngine {
  const engine = new FilterEngine(config);

  // Register all filter types
  engine.registerFilter(new MetadataFilter());
  engine.registerFilter(new ContentFilter());
  engine.registerFilter(new SourceFilter());
  engine.registerFilter(new PatternFilter());
  engine.registerFilter(new BehavioralFilter());
  engine.registerFilter(new TemporalFilter());
  engine.registerFilter(new AllowlistFilter());
  engine.registerFilter(new BlocklistFilter());
  engine.registerFilter(new ExternalFilter());
  engine.registerFilter(new MLFilter());

  return engine;
}
