'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PlaylistManager } from '@/lib/playlist-manager';
import type { UserPlaylist } from '@/types';

export function PlaylistGrid() {
  const [playlists, setPlaylists] = useState<UserPlaylist[]>(() => PlaylistManager.getPlaylists());
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');

  const handleCreatePlaylist = () => {
    if (newTitle.trim()) {
      PlaylistManager.createPlaylist(newTitle.trim(), newDescription.trim());
      setPlaylists(PlaylistManager.getPlaylists());
      setNewTitle('');
      setNewDescription('');
      setShowCreateForm(false);
    }
  };

  const handleDeletePlaylist = (id: string) => {
    if (confirm('Are you sure you want to delete this playlist?')) {
      PlaylistManager.deletePlaylist(id);
      setPlaylists(PlaylistManager.getPlaylists());
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#1f2937' }}>
          Your Playlists ({playlists.length})
        </h2>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          style={{
            padding: '12px 24px',
            borderRadius: '8px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'background-color 0.2s',
          }}
          onMouseOver={(e) => ((e.target as HTMLElement).style.backgroundColor = '#2563eb')}
          onMouseOut={(e) => ((e.target as HTMLElement).style.backgroundColor = '#3b82f6')}
        >
          {showCreateForm ? 'Cancel' : 'Create Playlist'}
        </button>
      </div>

      {showCreateForm && (
        <div style={{ marginBottom: '32px', padding: '24px', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
          <h3 style={{ marginBottom: '16px', fontSize: '20px', fontWeight: '600' }}>Create New Playlist</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <input
              type="text"
              placeholder="Playlist title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              style={{
                padding: '12px',
                borderRadius: '8px',
                border: '2px solid #e5e7eb',
                fontSize: '16px',
                outline: 'none',
              }}
            />
            <textarea
              placeholder="Description (optional)"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              rows={3}
              style={{
                padding: '12px',
                borderRadius: '8px',
                border: '2px solid #e5e7eb',
                fontSize: '16px',
                outline: 'none',
                resize: 'vertical',
              }}
            />
            <button
              onClick={handleCreatePlaylist}
              style={{
                padding: '12px 24px',
                borderRadius: '8px',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                alignSelf: 'flex-start',
              }}
            >
              Create
            </button>
          </div>
        </div>
      )}

      {playlists.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📚</div>
          <p style={{ fontSize: '18px', color: '#6b7280', marginBottom: '24px' }}>
            You haven&apos;t created any playlists yet.
          </p>
          <button
            onClick={() => setShowCreateForm(true)}
            style={{
              padding: '12px 24px',
              borderRadius: '8px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            Create Your First Playlist
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
          {playlists.map((playlist) => (
            <div key={playlist.id} style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', overflow: 'hidden' }}>
              <div style={{ padding: '24px' }}>
                <Link href={`/playlists/${playlist.id}`}>
                  <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#1f2937', marginBottom: '8px', cursor: 'pointer' }}>
                    {playlist.title}
                  </h3>
                </Link>
                {playlist.description && (
                  <p style={{ color: '#6b7280', marginBottom: '16px' }}>{playlist.description}</p>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', color: '#6b7280' }}>
                    {playlist.videos.length} video{playlist.videos.length !== 1 ? 's' : ''}
                  </span>
                  <button
                    onClick={() => handleDeletePlaylist(playlist.id)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      backgroundColor: '#ef4444',
                      color: 'white',
                      border: 'none',
                      fontSize: '14px',
                      cursor: 'pointer',
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}