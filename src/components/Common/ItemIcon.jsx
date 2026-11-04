import { useState, useEffect } from 'react';
import { getItemImageURL } from '../../utils/wikiApi';

export default function ItemIcon({ name, size = 32, className = "" }) {
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!name) {
      setImageUrl(null);
      setFailed(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setFailed(false);
    setImageUrl(null);

    getItemImageURL(name).then(url => {
      if (cancelled) return;
      if (url) {
        setImageUrl(url);
      } else {
        setFailed(true);
      }
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [name]);

  // Fallback: colored letter icon
  if (!name || failed || (!imageUrl && !loading)) {
    const letter = (name || '?')[0].toUpperCase();
    const hue = name ? name.split('').reduce((h, c) => h + c.charCodeAt(0), 0) % 360 : 200;
    return (
      <div
        className={`rounded flex items-center justify-center flex-shrink-0 ${className}`}
        style={{
          width: size,
          height: size,
          backgroundColor: `hsl(${hue}, 40%, 25%)`,
          border: `1px solid hsl(${hue}, 40%, 35%)`,
        }}
      >
        <span
          className="font-bold text-gray-300 select-none"
          style={{ fontSize: size * 0.45 }}
        >
          {letter}
        </span>
      </div>
    );
  }

  // Loading state
  if (loading && !imageUrl) {
    return (
      <div
        className={`bg-gray-700 rounded flex items-center justify-center flex-shrink-0 animate-pulse ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className={`rounded flex items-center justify-center overflow-hidden flex-shrink-0 ${className}`}
      style={{ width: size, height: size, backgroundColor: '#374151' }}
    >
      <img
        src={imageUrl}
        alt={name}
        className="object-contain"
        style={{ width: size, height: size }}
        onError={() => setFailed(true)}
        loading="lazy"
      />
    </div>
  );
}
