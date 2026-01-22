import type { ContentItem, ContentSource } from '@/types';

/**
 * Interface for content source adapters
 * Allows generic handling of multiple sources (YouTube, RSS, etc.)
 */
export interface IContentSourceAdapter {
    /**
     * Name of the provider (e.g., 'youtube', 'rss')
     */
    providerName: string;

    /**
     * Fetch content items from a source
     */
    fetchContent(source: ContentSource): Promise<ContentItem[]>;

    /**
     * Fetch a single item by ID
     */
    fetchItemDetails(itemId: string): Promise<ContentItem | null>;

    /**
     * Validate if a content source config is valid for this adapter
     */
    validateSource(source: ContentSource): boolean;
}

/**
 * Registry for content source adapters
 */
export class ContentSourceRegistry {
    private sources: Map<string, IContentSourceAdapter> = new Map();

    /**
     * Register a source adapter
     */
    register(source: IContentSourceAdapter): void {
        this.sources.set(source.providerName, source);
    }

    /**
     * Get an adapter by provider name
     */
    get(name: string): IContentSourceAdapter | undefined {
        return this.sources.get(name);
    }

    /**
     * Get all registered provider names
     */
    getProviderNames(): string[] {
        return Array.from(this.sources.keys());
    }

    /**
     * Check if a provider is registered
     */
    has(name: string): boolean {
        return this.sources.has(name);
    }
}

// Global registry instance
export const contentSourceRegistry = new ContentSourceRegistry();
