import { useState, useRef, useEffect, useCallback } from 'react';
import { searchItems } from '../../data/growtopiaItems';
import { getItemImageURL } from '../../utils/wikiApi';
import { FiSearch, FiX } from 'react-icons/fi';

function ResultImage({ name, size = 32 }) {
  const [url, setUrl] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setUrl(null);
    setFailed(false);
    if (!name) return;

    getItemImageURL(name).then(u => {
      if (cancelled) return;
      if (u) setUrl(u);
      else setFailed(true);
    });

    return () => { cancelled = true; };
  }, [name]);

  if (failed || !url) {
    const letter = (name || '?')[0].toUpperCase();
    const hue = name ? name.split('').reduce((h, c) => h + c.charCodeAt(0), 0) % 360 : 200;
    return (
      <div
        className="rounded flex items-center justify-center"
        style={{
          width: size,
          height: size,
          backgroundColor: `hsl(${hue}, 40%, 25%)`,
        }}
      >
        <span className="font-bold text-gray-300 text-xs">{letter}</span>
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={name}
      className="object-contain rounded"
      style={{ width: size, height: size }}
      onError={() => setFailed(true)}
      loading="lazy"
    />
  );
}

export default function ItemSearch({ value, onChange, placeholder = "Cari item...", className = "" }) {
  const [query, setQuery] = useState(value || '');
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const wrapperRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  const handleSearch = useCallback((val) => {
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (val.trim().length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const items = await searchItems(val, 8);
        setResults(items);
        setIsOpen(true);
      } catch {
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);
  }, []);

  const handleSelect = (item) => {
    setQuery(item.name);
    setIsOpen(false);
    onChange && onChange(item);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    onChange && onChange(null);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && query.trim()) {
      setIsOpen(false);
      onChange && onChange({ name: query.trim() });
    }
  };

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <div className="relative">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => query.trim().length >= 2 && results.length > 0 && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
        />
        {isLoading && (
          <div className="absolute right-10 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-gray-500 border-t-green-400 rounded-full animate-spin"></div>
          </div>
        )}
        {query && (
          <button onClick={handleClear} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
            <FiX className="w-4 h-4" />
          </button>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-xl max-h-60 overflow-y-auto">
          {results.map((item, idx) => (
            <button
              key={`${item.name}-${idx}`}
              onClick={() => handleSelect(item)}
              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-700 transition-colors text-left"
            >
              <div className="w-8 h-8 flex-shrink-0 overflow-hidden">
                <ResultImage name={item.name} size={32} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-white truncate">{item.name}</div>
              </div>
            </button>
          ))}
        </div>
      )}

      {isOpen && query.trim().length >= 2 && results.length === 0 && !isLoading && (
        <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-xl p-4">
          <p className="text-sm text-gray-400 text-center">
            Tidak ditemukan. Tekan <kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-xs">Enter</kbd> untuk input manual.
          </p>
        </div>
      )}
    </div>
  );
}
