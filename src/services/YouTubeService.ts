import { authHeader } from "@/utils/authFetch";

interface YouTubeSearchResult {
  id: string;
  title: string;
  artist: string;
  duration: string;
  thumbnail: string;
  youtubeId: string;
  viewCount: string;
  publishedAt: string;
}

interface DownloadProgress {
  trackId: string;
  progress: number;
  status: 'pending' | 'downloading' | 'completed' | 'error';
  error?: string;
}

// All YouTube Data API access goes through server-side edge functions so the
// API key is never shipped to the browser.
const SEARCH_FN = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/youtube-search`;
const DOWNLOAD_FN = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/youtube-download`;

class YouTubeService {
  private async post(url: string, body: unknown): Promise<Response> {
    return fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: await authHeader(),
      },
      body: JSON.stringify(body),
    });
  }

  async searchMusic(query: string, maxResults: number = 50): Promise<YouTubeSearchResult[]> {
    try {
      const response = await this.post(SEARCH_FN, { mode: 'search', query, maxResults });
      if (!response.ok) throw new Error('YouTube search failed');

      const { search, details } = await response.json();
      const detailItems: any[] = details?.items ?? [];

      return (search?.items ?? []).map((item: any) => {
        const videoId = item.id?.videoId;
        const detail = detailItems.find((d) => d.id === videoId);
        const duration = detail ? this.formatDuration(detail.contentDetails?.duration ?? '') : '0:00';
        const viewCount = detail ? this.formatViewCount(detail.statistics?.viewCount ?? '0') : '0';

        const titleParts = (item.snippet?.title ?? '').split(' - ');
        const title = titleParts[0] || item.snippet?.title || 'Unknown';
        const artist = titleParts[1] || item.snippet?.channelTitle || 'Unknown';

        return {
          id: `youtube-${videoId}`,
          title: title.trim(),
          artist: artist.trim(),
          duration,
          thumbnail: item.snippet?.thumbnails?.high?.url ?? '',
          youtubeId: videoId,
          viewCount,
          publishedAt: item.snippet?.publishedAt ?? '',
        };
      });
    } catch (error) {
      console.error('YouTube search error');
      return [];
    }
  }

  async getTrendingMusic(region: string = 'US', maxResults: number = 50): Promise<YouTubeSearchResult[]> {
    try {
      const response = await this.post(SEARCH_FN, { mode: 'trending', region, maxResults });
      if (!response.ok) throw new Error('Failed to fetch trending music');

      const data = await response.json();

      return (data.items ?? []).map((item: any) => {
        const duration = this.formatDuration(item.contentDetails?.duration ?? '');
        const viewCount = this.formatViewCount(item.statistics?.viewCount ?? '0');

        const titleParts = (item.snippet?.title ?? '').split(' - ');
        const title = titleParts[0] || item.snippet?.title || 'Unknown';
        const artist = titleParts[1] || item.snippet?.channelTitle || 'Unknown';

        return {
          id: `youtube-${item.id}`,
          title: title.trim(),
          artist: artist.trim(),
          duration,
          thumbnail: item.snippet?.thumbnails?.high?.url ?? '',
          youtubeId: item.id,
          viewCount,
          publishedAt: item.snippet?.publishedAt ?? '',
        };
      });
    } catch (error) {
      console.error('Trending music error');
      return [];
    }
  }

  async downloadVideo(videoId: string, title: string, onProgress?: (progress: number) => void): Promise<Blob> {
    const response = await this.post(DOWNLOAD_FN, { videoId, title });
    if (!response.ok) throw new Error('Download failed');

    const contentLength = response.headers.get('Content-Length');
    let loaded = 0;
    const reader = response.body?.getReader();
    const chunks: Uint8Array[] = [];

    if (!reader) throw new Error('No response body');

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      chunks.push(value);
      loaded += value.length;

      if (onProgress && contentLength) {
        onProgress(Math.round((loaded / parseInt(contentLength)) * 100));
      }
    }

    return new Blob(chunks as BlobPart[], { type: 'audio/mpeg' });
  }

  private formatDuration(duration: string): string {
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    if (!match) return '0:00';

    const hours = parseInt(match[1] || '0');
    const minutes = parseInt(match[2] || '0');
    const seconds = parseInt(match[3] || '0');

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  private formatViewCount(viewCount: string): string {
    const count = parseInt(viewCount);
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  }
}

export const youtubeService = new YouTubeService();
export type { YouTubeSearchResult, DownloadProgress };
