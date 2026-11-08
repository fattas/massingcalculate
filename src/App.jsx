import { useState } from 'react';
import MassingPlanner from './components/Planner/MassingPlanner';
import InventoryManager from './components/Inventory/InventoryManager';
import SeedShoppingTracker from './components/Tracker/SeedShoppingTracker';
import LanguageSwitcher from './components/Common/LanguageSwitcher';
import { useLanguage } from './i18n/LanguageContext';
import { FiClipboard, FiPackage, FiGitBranch, FiShoppingCart } from 'react-icons/fi';

export default function App() {
  const [activeTab, setActiveTab] = useState('planner');
  const { t } = useLanguage();

  const TABS = [
    { id: 'planner', labelKey: 'tab_planner', icon: FiClipboard },
    { id: 'shopping', labelKey: 'tab_shopping', icon: FiShoppingCart },
    { id: 'inventory', labelKey: 'tab_inventory', icon: FiPackage },
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-white">
      {/* Top Navbar */}
      <nav className="bg-gray-800/90 backdrop-blur-md border-b border-gray-700/80 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14 gap-2">
            {/* Brand Logo */}
            <div className="flex items-center gap-2.5 flex-shrink-0">
              <div className="w-8 h-8 bg-emerald-500 rounded-xl flex items-center justify-center shadow-sm shadow-emerald-500/20">
                <FiGitBranch className="w-4 h-4 text-white stroke-[2.5]" />
              </div>
              <div className="hidden xs:block">
                <h1 className="text-sm font-bold text-white tracking-tight leading-none">{t('app_title')}</h1>
                <p className="text-[10px] text-gray-400 leading-tight mt-0.5">{t('app_subtitle')}</p>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex items-center gap-1 bg-gray-850 p-1 rounded-xl border border-gray-700/60">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                    activeTab === tab.id
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-gray-400 hover:text-white hover:bg-gray-750'
                  }`}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{t(tab.labelKey)}</span>
                </button>
              ))}
            </div>

            {/* Right section: Language Switcher with Flag */}
            <div className="flex items-center">
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      </nav>

      {/* Main App Content */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 flex-1">
        {activeTab === 'planner' && <MassingPlanner />}
        {activeTab === 'shopping' && (
          <SeedShoppingTracker onNavigateToPlanner={() => setActiveTab('planner')} />
        )}
        {activeTab === 'inventory' && <InventoryManager />}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800/80 py-4 text-center text-xs text-gray-500 px-4">
        {t('footer_text')}
      </footer>
    </div>
  );
}
