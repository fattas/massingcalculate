import { useState, useMemo } from 'react';
import { getItemSpriteURL } from '../../data/growtopiaItems';

export default function ItemIcon({ name, id: explicitId, size = 32, className = '' }) {
  const [failed, setFailed] = useState(false);

  // Synchronous resolution of CDN sprite URL
  const spriteUrl = useMemo(() => {
    if (explicitId !== undefined && explicitId !== null) {
      return getItemSpriteURL(explicitId);
    }
    if (!name) return null;
    return getItemSpriteURL(name);
  }, [name, explicitId]);

  if (!name && (explicitId === undefined || explicitId === null)) {
    return null;
  }

  // Fallback: colored letter icon if sprite resolution or loading failed
  if (failed || !spriteUrl) {
    const displayName = name || (explicitId !== undefined ? `ID ${explicitId}` : '?');
    const letter = displayName[0].toUpperCase();
    const hue = displayName.split('').reduce((h, c) => h + c.charCodeAt(0), 0) % 360;
    return (
      <div
        className={`rounded flex items-center justify-center flex-shrink-0 select-none ${className}`}
        style={{
          width: size,
          height: size,
          backgroundColor: `hsl(${hue}, 40%, 25%)`,
          border: `1px solid hsl(${hue}, 40%, 35%)`,
        }}
        title={displayName}
      >
        <span
          className="font-bold text-gray-300"
          style={{ fontSize: size * 0.45 }}
        >
          {letter}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0 bg-black/40 border border-gray-700/60 p-0.5 shadow-sm ${className}`}
      style={{ width: size, height: size }}
      title={name || `Item #${explicitId}`}
    >
      <img
        src={spriteUrl}
        alt={name || 'item'}
        className="w-full h-full object-contain"
        style={{ imageRendering: 'pixelated' }}
        onError={() => setFailed(true)}
        loading="lazy"
      />
    </div>
  );
}
