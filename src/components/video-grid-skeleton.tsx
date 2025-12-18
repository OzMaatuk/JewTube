const SKELETON_ITEMS = Array.from({ length: 12 }, (_, i) => i);

export function VideoGridSkeleton() {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '32px', justifyContent: 'center' }}>
      {SKELETON_ITEMS.map((i) => (
        <VideoCardSkeleton key={`skeleton-${i}`} />
      ))}
    </div>
  );
}

function VideoCardSkeleton() {
  return (
    <div style={{ overflow: 'hidden', borderRadius: '16px', backgroundColor: 'white', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)', border: '1px solid #f3f4f6', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}>
      {/* Icon skeleton */}
      <div style={{ height: '128px', backgroundColor: '#f3f4f6' }} />

      {/* Content skeleton */}
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ height: '20px', backgroundColor: '#f3f4f6', borderRadius: '4px' }} />
          <div style={{ height: '20px', width: '75%', backgroundColor: '#f3f4f6', borderRadius: '4px' }} />
        </div>
        <div style={{ height: '16px', width: '50%', backgroundColor: '#f3f4f6', borderRadius: '4px' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ height: '16px', width: '33%', backgroundColor: '#f3f4f6', borderRadius: '4px' }} />
          <div style={{ height: '16px', width: '25%', backgroundColor: '#f3f4f6', borderRadius: '4px' }} />
        </div>
        <div style={{ height: '24px', width: '25%', backgroundColor: '#f3f4f6', borderRadius: '9999px' }} />
      </div>
    </div>
  );
}
