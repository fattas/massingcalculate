import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import FlagIcon from './FlagIcon';
import { FiGlobe, FiCheck, FiChevronDown } from 'react-icons/fi';

export default function LanguageSwitcher({ className = '' }) {
  const { language, setLanguage, LANGUAGES } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentLang = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  return (
    <div ref={dropdownRef} className={`relative inline-block text-left ${className}`}>
      {/* Trigger Button with Real SVG Flag */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2.5 py-1.5 bg-gray-750 hover:bg-gray-700 border border-gray-650 hover:border-gray-500 rounded-xl text-xs font-semibold text-gray-200 transition-colors shadow-sm select-none"
        title="Ganti Bahasa / Switch Language"
      >
        <FlagIcon code={currentLang.code} className="w-5 h-3.5" />
        <span className="uppercase font-bold tracking-wider">{currentLang.code}</span>
        <FiChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-52 bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl py-1.5 z-50 animate-fade-in backdrop-blur-md">
          <div className="px-3 py-1.5 border-b border-gray-700/80 flex items-center gap-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
            <FiGlobe className="w-3.5 h-3.5 text-emerald-400" />
            <span>Pilih Bahasa / Language</span>
          </div>

          <div className="max-h-64 overflow-y-auto py-1 scrollbar-thin scrollbar-thumb-gray-600">
            {LANGUAGES.map((item) => {
              const isSelected = item.code === language;
              return (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => {
                    setLanguage(item.code);
                    setIsOpen(false);
                  }}
                  className={`w-full px-3 py-2 flex items-center justify-between text-xs transition-colors text-left ${
                    isSelected
                      ? 'bg-emerald-500/15 text-emerald-400 font-bold'
                      : 'text-gray-300 hover:bg-gray-700/70 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FlagIcon code={item.code} className="w-5 h-3.5" />
                    <span className="text-xs truncate">{item.name}</span>
                  </div>
                  {isSelected && <FiCheck className="w-3.5 h-3.5 text-emerald-400 stroke-[3] flex-shrink-0 ml-2" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
