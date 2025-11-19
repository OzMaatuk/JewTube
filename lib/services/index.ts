import { getConfig } from '@/lib/config';
import { ContentService } from './content-service';

let contentService: ContentService | null = null;

/**
 * Get or create content service singleton
 */
export function getContentService(): ContentService {
  if (!contentService) {
    const config = getConfig();
    contentService = new ContentService(config);
  }
  return contentService;
}

export { ContentService };
