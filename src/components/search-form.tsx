'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function SearchForm() {
  const [query, setQuery] = useState('');
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '600px', margin: '0 auto', marginBottom: '32px' }}>
      <div style={{ display: 'flex', gap: '16px' }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search videos, channels, or topics..."
          style={{
            flex: 1,
            padding: '12px 16px',
            borderRadius: '8px',
            border: '2px solid #e5e7eb',
            fontSize: '16px',
            outline: 'none',
            transition: 'border-color 0.2s',
          }}
          onFocus={(e) => (e.target.style.borderColor = '#3b82f6')}
          onBlur={(e) => (e.target.style.borderColor = '#e5e7eb')}
        />
        <button
          type="submit"
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
          Search
        </button>
      </div>
    </form>
  );
}