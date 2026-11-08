import { useState, useRef, useEffect, useCallback } from 'react';
import { searchItems } from '../../data/growtopiaItems';
import ItemIcon from './ItemIcon';
import { useLanguage } from '../../i18n/LanguageContext';
import { FiSearch, FiX } from 'react-icons/fi';

export default function ItemSearch({ value, onChange, placeholder, className = "" }) {
  const { t } = useLanguage();
  const searchPlaceholder = placeholder || t('common_search');

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
    debounceRef.current = setTimeout(() => {
      try {
        const items = searchItems(val, 10);
        setResults(items);
        setIsOpen(true);
      } catch {
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 80);
  }, []);

  const handleSelect = (item) => {
    setQuery(item.name);
    setIsOpen(false);
    onChange(item);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (results.length > 0 && isOpen) {
        handleSelect(results[0]);
      } else if (query.trim()) {
        handleSelect({ name: query.trim(), isManual: true });
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    onChange(null);
  };

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <div className="relative">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
            else if (query.trim().length >= 2) handleSearch(query);
          }}
          onKeyDown={handleKeyDown}
          placeholder={searchPlaceholder}
          className="w-full pl-10 pr-10 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
        />
        {isLoading && (
          <div className="absolute right-10 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-gray-500 border-t-emerald-400 rounded-full animate-spin"></div>
          </div>
        )}
        {query && (
          <button onClick={handleClear} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
            <FiX className="w-4 h-4" />
          </button>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl max-h-60 overflow-y-auto">
          {results.map((item) => (
            <div
              key={item.id}
              onClick={() => handleSelect(item)}
              className="flex items-center gap-3 px-3 py-2 hover:bg-gray-700 cursor-pointer transition-colors"
            >
              <ItemIcon name={item.name} size={32} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white font-medium truncate">{item.name}</p>
                <p className="text-xs text-gray-400">
                  Rarity: {item.rarity || '?'} {item.hitsToBreak ? `• ${item.hitsToBreak} hits` : ''}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
