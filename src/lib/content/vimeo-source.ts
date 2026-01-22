import { getLogger } from '@/lib/logger';
import type { ContentItem, ContentSource } from '@/types';
import type { IContentSourceAdapter } from './content-source';

const logger = getLogger('vimeo-source');

/**
 * Standard fields to request from Vimeo API for video objects
 */
const VIMEO_VIDEO_FIELDS = [
    'uri',
    'name',
    'description',
    'link',
    'duration',
    'created_time',
    'pictures.sizes',
    'user.uri',
    'user.name',
    'stats',
    'metadata.connections.likes.total',
    'metadata.connections.comments.total',
    'tags.name',
    'content_rating',
].join(',');

/**
 * Vimeo content source adapter
 */
export class VimeoContentSource implements IContentSourceAdapter {
    providerName = 'vimeo';
    private accessToken: string;

    constructor(accessToken: string) {
        this.accessToken = accessToken;
    }

    /**
     * Fetch content from a Vimeo source
     */
    async fetchContent(source: ContentSource): Promise<ContentItem[]> {
        if (!this.validateSource(source)) {
            throw new Error(`Invalid Vimeo source: ${JSON.stringify(source)}`);
        }

        logger.info({ source }, 'Fetching videos from Vimeo source');

        try {
            let vimeoVideos: any[] = [];

            switch (source.type) {
                case 'channel': {
                    vimeoVideos = await this.vimeoFetch(`/channels/${source.id}/videos`, { fields: VIMEO_VIDEO_FIELDS });
                    break;
                }

                case 'user': {
                    vimeoVideos = await this.vimeoFetch(`/users/${source.id}/videos`, { fields: VIMEO_VIDEO_FIELDS });
                    break;
                }

                case 'video': {
                    const video = await this.vimeoFetch(`/videos/${source.id}`, { fields: VIMEO_VIDEO_FIELDS });
                    vimeoVideos = video ? [video] : [];
                    break;
                }

                case 'search': {
                    const query = (source.params?.q as string) || '';
                    vimeoVideos = await this.vimeoFetch(`/videos`, {
                        query: query,
                        fields: VIMEO_VIDEO_FIELDS
                    });
                    break;
                }

                default:
                    throw new Error(`Unsupported Vimeo source type: ${source.type}`);
            }

            // Normalize videos to our data model
            const items = this.normalizeVideos(vimeoVideos, source.type, source.id);

            logger.info(
                { source, count: items.length },
                `Fetched ${items.length} items from Vimeo source`
            );

            return items;
        } catch (error) {
            logger.error({ source, error }, 'Failed to fetch items from Vimeo source');
            throw error;
        }
    }

    /**
     * Fetch a single item by ID
     */
    async fetchItemDetails(itemId: string): Promise<ContentItem | null> {
        try {
            const vimeoVideo = await this.vimeoFetch(`/videos/${itemId}`, { fields: VIMEO_VIDEO_FIELDS });

            if (!vimeoVideo) {
                return null;
            }

            return this.normalizeVideo(vimeoVideo, 'video', itemId);
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            const isNotFound = errorMsg.includes('"status":404');
            const isRateLimit = errorMsg.includes('"status":429') || errorMsg.includes('"error_code":9000');

            if (isRateLimit) {
                logger.warn({ itemId }, 'Vimeo rate limit reached, skipping fetch');
                return null;
            }

            if (!isNotFound) {
                logger.error({ itemId, error }, 'Failed to fetch vimeo video details');
            }
            return null;
        }
    }

    /**
     * Validate if a content source is valid for Vimeo
     */
    validateSource(source: ContentSource): boolean {
        if (source.platform !== 'vimeo') {
            return false;
        }

        if (!source.id && source.type !== 'search') {
            return false;
        }

        return ['channel', 'user', 'video', 'search'].includes(source.type);
    }

    /**
     * Helper to fetch from Vimeo API
     */
    private async vimeoFetch(endpoint: string, params: Record<string, string> = {}): Promise<any> {
        const url = new URL(`https://api.vimeo.com${endpoint}`);

        // Add query parameters
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined) {
                url.searchParams.append(key, value);
            }
        });

        const response = await fetch(url.toString(), {
            headers: {
                'Authorization': `Bearer ${this.accessToken}`,
                'Accept': 'application/vnd.vimeo.*+json;version=3.4'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            let error;
            try {
                error = JSON.parse(errorText);
            } catch (e) {
                error = { message: errorText };
            }
            throw new Error(`Vimeo API error: ${JSON.stringify(error)}`);
        }

        const data = await response.json();
        return data.data || data; // Channels/Users return a list in 'data', single videos return the object directly
    }

    /**
     * Normalize Vimeo video to our ContentItem model
     */
    private normalizeVideo(vimeoVideo: any, sourceType: string, sourceId: string): ContentItem {
        const id = vimeoVideo.uri.split('/').pop(); // Format is /videos/12345

        // Extract play count with fallbacks
        // Prioritize stats.plays, then try connections if available (though rare for plays)
        const viewCount = vimeoVideo.stats?.plays ?? vimeoVideo.metadata?.connections?.plays?.total ?? 0;

        return {
            id,
            title: vimeoVideo.name || 'Untitled',
            description: vimeoVideo.description || '',
            type: 'video',
            platform: 'vimeo',
            url: vimeoVideo.link,
            thumbnail: vimeoVideo.pictures?.sizes?.[2]?.link || vimeoVideo.pictures?.sizes?.[0]?.link || '',
            thumbnailHigh: vimeoVideo.pictures?.sizes?.[4]?.link || vimeoVideo.pictures?.sizes?.pop()?.link || undefined,
            channelId: vimeoVideo.user?.uri?.split('/').pop() || '',
            channelName: vimeoVideo.user?.name || 'Unknown Channel',
            publishedAt: new Date(vimeoVideo.created_time),
            duration: vimeoVideo.duration || 0,
            viewCount: Number(viewCount),
            likeCount: vimeoVideo.metadata?.connections?.likes?.total || 0,
            commentCount: vimeoVideo.metadata?.connections?.comments?.total || 0,
            tags: vimeoVideo.tags?.map((t: any) => t.name) || [],
            contentRating: {
                madeForKids: false,
                ageRestricted: vimeoVideo.content_rating?.includes('adversely') || false,
            },
            metadata: {
                fetchedAt: new Date(),
                sourceType,
                sourceId,
            },
        };
    }

    /**
     * Normalize a list of Vimeo videos
     */
    private normalizeVideos(vimeoVideos: any[], sourceType: string, sourceId: string): ContentItem[] {
        return vimeoVideos
            .map((v) => {
                try {
                    return this.normalizeVideo(v, sourceType, sourceId);
                } catch (e) {
                    logger.error({ video: v, error: e }, 'Failed to normalize Vimeo video');
                    return null;
                }
            })
            .filter((v): v is ContentItem => v !== null);
    }
}
