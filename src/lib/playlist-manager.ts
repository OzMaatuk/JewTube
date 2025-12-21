import type { UserPlaylist, Video } from '@/types';

const PLAYLISTS_KEY = 'user-playlists';

export class PlaylistManager {
  static getPlaylists(): UserPlaylist[] {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(PLAYLISTS_KEY);
      if (!stored) return [];
      const playlists = JSON.parse(stored);
      return playlists.map((p: any) => ({
        ...p,
        createdAt: new Date(p.createdAt),
        updatedAt: new Date(p.updatedAt),
      }));
    } catch (error) {
      console.error('Failed to load playlists:', error);
      return [];
    }
  }

  static savePlaylists(playlists: UserPlaylist[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(PLAYLISTS_KEY, JSON.stringify(playlists));
    } catch (error) {
      console.error('Failed to save playlists:', error);
    }
  }

  static createPlaylist(title: string, description: string = ''): UserPlaylist {
    const playlist: UserPlaylist = {
      id: `playlist-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title,
      description,
      videos: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const playlists = this.getPlaylists();
    playlists.push(playlist);
    this.savePlaylists(playlists);

    return playlist;
  }

  static updatePlaylist(id: string, updates: Partial<Pick<UserPlaylist, 'title' | 'description'>>): void {
    const playlists = this.getPlaylists();
    const index = playlists.findIndex(p => p.id === id);
    if (index !== -1) {
      playlists[index] = { ...playlists[index], ...updates, updatedAt: new Date() };
      this.savePlaylists(playlists);
    }
  }

  static deletePlaylist(id: string): void {
    const playlists = this.getPlaylists();
    const filtered = playlists.filter(p => p.id !== id);
    this.savePlaylists(filtered);
  }

  static addVideoToPlaylist(playlistId: string, videoId: string): void {
    const playlists = this.getPlaylists();
    const playlist = playlists.find(p => p.id === playlistId);
    if (playlist && !playlist.videos.includes(videoId)) {
      playlist.videos.push(videoId);
      playlist.updatedAt = new Date();
      this.savePlaylists(playlists);
    }
  }

  static removeVideoFromPlaylist(playlistId: string, videoId: string): void {
    const playlists = this.getPlaylists();
    const playlist = playlists.find(p => p.id === playlistId);
    if (playlist) {
      playlist.videos = playlist.videos.filter(id => id !== videoId);
      playlist.updatedAt = new Date();
      this.savePlaylists(playlists);
    }
  }

  static getPlaylistById(id: string): UserPlaylist | null {
    const playlists = this.getPlaylists();
    return playlists.find(p => p.id === id) || null;
  }
}