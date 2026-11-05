import { useState } from 'react';
import MassingPlanner from './components/Planner/MassingPlanner';
import InventoryManager from './components/Inventory/InventoryManager';
import SeedShoppingTracker from './components/Tracker/SeedShoppingTracker';
import { FiClipboard, FiPackage, FiGitBranch, FiShoppingCart } from 'react-icons/fi';

const TABS = [
  { id: 'planner', label: 'Massing Planner', icon: FiClipboard },
  { id: 'shopping', label: 'Tracker Belanja', icon: FiShoppingCart },
  { id: 'inventory', label: 'Inventory', icon: FiPackage },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('planner');

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Top Navbar */}
      <nav className="bg-gray-800 border-b border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                <FiGitBranch className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-base font-bold text-white leading-tight">GT Massing Calculator</h1>
                <p className="text-[10px] text-gray-500 leading-tight">Growtopia Profit & Loss Tracker</p>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex items-center gap-1">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-green-600 text-white shadow-lg shadow-green-600/20'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Currency Display */}
            <div className="hidden md:flex items-center gap-4 text-xs text-gray-400">
              <div className="flex items-center gap-1">
                <span className="w-4 h-4 bg-yellow-500 rounded-sm flex items-center justify-center text-[8px] font-bold text-black">W</span>
                <span>World Lock</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-4 h-4 bg-blue-500 rounded-sm flex items-center justify-center text-[8px] font-bold text-white">D</span>
                <span>= 100 WL</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-4 h-4 bg-purple-500 rounded-sm flex items-center justify-center text-[8px] font-bold text-white">B</span>
                <span>= 100 DL</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'planner' && <MassingPlanner />}
        {activeTab === 'shopping' && (
          <SeedShoppingTracker onNavigateToPlanner={() => setActiveTab('planner')} />
        )}
        {activeTab === 'inventory' && <InventoryManager />}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-4 text-center text-xs text-gray-600">
        GT Massing Calculator • Data tersimpan di browser Anda (localStorage) • Tidak ada database eksternal
      </footer>
    </div>
  );
}

