import { useState, useEffect } from 'react';
import TrackerCard from './TrackerCard';
import ItemSearch from '../Common/ItemSearch';
import { useLocalStorage, useSavedPlans } from '../../hooks/useLocalStorage';
import { createDefaultPlan } from '../../data/growtopiaItems';
import { formatNumber, fmtWL, formatRupiah, calculateCost } from '../../utils/calculations';
import { FiShoppingCart, FiPlus, FiDownload, FiTrash2, FiCheck, FiX, FiFolder } from 'react-icons/fi';

export default function SeedShoppingTracker() {
  const [currentPlan, setCurrentPlan] = useLocalStorage('gt-current-plan', createDefaultPlan());
  const { plans: savedPlans, savePlan } = useSavedPlans();

  // Combine saved plans + current plan into selectable list
  const allPlansMap = new Map();
  if (currentPlan && currentPlan.id) {
    allPlansMap.set(currentPlan.id, currentPlan);
  }
  savedPlans.forEach((p) => {
    allPlansMap.set(p.id, p);
  });
  const allPlanOptions = Array.from(allPlansMap.values());

  // Current active plan's shopping trackers
  const trackers = currentPlan?.shoppingTrackers || [];

  // Update trackers specifically for the current active plan
  const updateTrackers = (newTrackers) => {
    const updatedPlan = {
      ...currentPlan,
      shoppingTrackers: newTrackers,
      updatedAt: new Date().toISOString(),
    };
    setCurrentPlan(updatedPlan);
    if (savedPlans.some((p) => p.id === currentPlan.id)) {
      savePlan(updatedPlan);
    }
  };

  // Switch active plan
  const handleSwitchPlan = (planId) => {
    const target = allPlanOptions.find((p) => p.id === planId);
    if (target) {
      setCurrentPlan(target);
      showNotification(`Beralih ke plan "${target.name || 'Untitled Plan'}"`);
    }
  };

  // One-time legacy migration from global 'gt-shopping-trackers' if present
  useEffect(() => {
    try {
      const legacy = window.localStorage.getItem('gt-shopping-trackers');
      if (legacy) {
        const parsed = JSON.parse(legacy);
        if (Array.isArray(parsed) && parsed.length > 0 && (!currentPlan.shoppingTrackers || currentPlan.shoppingTrackers.length === 0)) {
          updateTrackers(parsed);
          window.localStorage.removeItem('gt-shopping-trackers');
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // New tracker form modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newTargetQty, setNewTargetQty] = useState('');
  const [newDefaultPrice, setNewDefaultPrice] = useState('');
  const [newPriceFormat, setNewPriceFormat] = useState('perWL');

  // Notice notification
  const [notice, setNotice] = useState('');

  const showNotification = (msg) => {
    setNotice(msg);
    setTimeout(() => setNotice(''), 3000);
  };

  // Add new custom tracker
  const handleCreateTracker = (e) => {
    if (e) e.preventDefault();
    if (!newItemName.trim()) return;

    const newTracker = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 6),
      name: newItemName.trim(),
      targetQty: parseInt(newTargetQty) || 2000,
      defaultPrice: parseFloat(newDefaultPrice) || 0,
      defaultPriceFormat: newPriceFormat || 'perWL',
      purchases: [],
      createdAt: new Date().toISOString(),
    };

    updateTrackers([...trackers, newTracker]);
    setNewItemName('');
    setNewTargetQty('');
    setNewDefaultPrice('');
    setShowAddModal(false);
    showNotification(`Target "${newTracker.name}" berhasil dibuat untuk ${currentPlan.name || 'plan ini'}!`);
  };

  // Update a tracker card
  const handleUpdateTracker = (updated) => {
    const updatedList = trackers.map((t) => (t.id === updated.id ? updated : t));
    updateTrackers(updatedList);
  };

  // Delete a tracker card
  const handleDeleteTracker = (trackerId) => {
    const target = trackers.find((t) => t.id === trackerId);
    if (window.confirm(`Hapus tracker untuk "${target?.name || 'item ini'}" dari plan ini?`)) {
      const updatedList = trackers.filter((t) => t.id !== trackerId);
      updateTrackers(updatedList);
    }
  };

  // Clear all trackers in this plan
  const handleClearAll = () => {
    if (window.confirm(`Yakin ingin menghapus semua catatan tracker belanja pada plan "${currentPlan.name || 'ini'}"?`)) {
      updateTrackers([]);
    }
  };

  // Import items from current active plan
  const handleImportFromPlanner = () => {
    if (!currentPlan || !currentPlan.steps || currentPlan.steps.length === 0) {
      alert('Plan ini belum memiliki step massing.');
      return;
    }

    const created = [];
    currentPlan.steps.forEach((step, idx) => {
      // Seed 1
      if (step.seedName1) {
        created.push({
          id: `step-${idx}-seed1-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          name: step.seedName1,
          targetQty: step.seed1Qty || step.seedsPlanted || 2000,
          defaultPrice: step.seed1Price || 0,
          defaultPriceFormat: step.seed1PriceFormat || 'perWL',
          purchases: [],
          stepIndex: idx,
          seedSlot: 'seed1',
        });
      }
      // Seed 2
      if (step.seedName2) {
        created.push({
          id: `step-${idx}-seed2-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          name: step.seedName2,
          targetQty: step.seed2Qty || step.seedsPlanted || 2000,
          defaultPrice: step.seed2Price || 0,
          defaultPriceFormat: step.seed2PriceFormat || 'perWL',
          purchases: [],
          stepIndex: idx,
          seedSlot: 'seed2',
        });
      }
    });

    if (created.length === 0) {
      alert(`Plan "${currentPlan.name}" belum memiliki nama Seed 1 atau Seed 2. Tentukan nama seed terlebih dahulu di Massing Planner.`);
      return;
    }

    updateTrackers([...trackers, ...created]);
    showNotification(`Berhasil mengambil ${created.length} bahan dari plan "${currentPlan.name}"!`);
  };

  // Apply tracked purchases to Massing Planner
  const handleApplyToPlanner = ({ cardName, totalQty, totalCostWL, purchases, stepIndex, seedSlot }) => {
    if (!currentPlan) return;

    const newSteps = [...(currentPlan.steps || [])];
    if (!newSteps[stepIndex]) {
      alert(`Step ${stepIndex + 1} tidak ditemukan di plan ini.`);
      return;
    }

    const step = { ...newSteps[stepIndex] };

    if (purchases.length === 0) {
      alert('Belum ada pembelian yang dicatat pada tracker ini.');
      return;
    }

    const first = purchases[0];
    const extras = purchases.slice(1).map((p) => ({
      id: p.id || Date.now().toString() + Math.random().toString(36).substr(2, 4),
      qty: p.qty,
      price: p.price,
      priceFormat: p.priceFormat || 'perWL',
    }));

    if (seedSlot === 'seed1') {
      step.seedName1 = cardName || step.seedName1;
      step.seed1Qty = first.qty;
      step.seed1Price = first.price;
      step.seed1PriceFormat = first.priceFormat || 'perWL';
      step.seed1ExtraPurchases = extras;
    } else {
      step.seedName2 = cardName || step.seedName2;
      step.seed2Qty = first.qty;
      step.seed2Price = first.price;
      step.seed2PriceFormat = first.priceFormat || 'perWL';
      step.seed2ExtraPurchases = extras;
    }

    newSteps[stepIndex] = step;
    const updatedPlan = {
      ...currentPlan,
      steps: newSteps,
      updatedAt: new Date().toISOString(),
    };

    setCurrentPlan(updatedPlan);
    if (savedPlans.some((p) => p.id === currentPlan.id)) {
      savePlan(updatedPlan);
    }

    showNotification(`Berhasil disalin ke Step ${stepIndex + 1} (${seedSlot === 'seed1' ? 'Seed 1' : 'Seed 2'}) di plan "${currentPlan.name}"!`);
  };

  // Grand totals across all trackers in this plan
  let totalAllQty = 0;
  let totalAllTarget = 0;
  let totalAllCostWL = 0;

  trackers.forEach((t) => {
    totalAllTarget += parseInt(t.targetQty) || 0;
    (t.purchases || []).forEach((p) => {
      totalAllQty += parseInt(p.qty) || 0;
      totalAllCostWL += calculateCost(p.qty, p.price, p.priceFormat || 'perWL');
    });
  });

  const wlRate = currentPlan?.wlToIdrRate || 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Bar */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <FiShoppingCart className="text-green-400 w-6 h-6" />
              Tracker Pembelian Seed
            </h2>

            {/* Plan Selector & Badge */}
            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              <span className="text-xs text-gray-400">Terhubung ke Plan:</span>
              <div className="flex items-center gap-1.5 bg-gray-750 px-2.5 py-1 rounded-lg border border-gray-650">
                <FiFolder className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                <select
                  value={currentPlan?.id || ''}
                  onChange={(e) => handleSwitchPlan(e.target.value)}
                  className="bg-transparent text-white font-bold text-xs focus:outline-none cursor-pointer pr-1"
                  title="Pilih plan massing untuk melihat tracker belanjanya"
                >
                  {allPlanOptions.map((p) => (
                    <option key={p.id} value={p.id} className="bg-gray-800 text-white">
                      {p.name || 'Untitled Plan'} ({p.steps?.length || 0} steps)
                    </option>
                  ))}
                </select>
              </div>
              <span className="text-[11px] text-gray-400">
                • {trackers.length} target belanja
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleImportFromPlanner}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
              title={`Ambil bahan Seed 1 & Seed 2 dari plan "${currentPlan?.name || 'ini'}" otomatis`}
            >
              <FiDownload className="w-4 h-4" />
              <span>Import dari Plan Ini</span>
            </button>
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="px-3.5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <FiPlus className="w-4 h-4" />
              <span>+ Tambah Target</span>
            </button>
            {trackers.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded-lg transition-colors"
                title="Hapus semua tracker pada plan ini"
              >
                <FiTrash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Global Notification Banner */}
        {notice && (
          <div className="p-2.5 bg-green-500/10 border border-green-500/30 rounded-lg text-xs text-green-300 font-medium flex items-center gap-2 animate-fade-in">
            <FiCheck className="w-4 h-4 text-green-400" />
            <span>{notice}</span>
          </div>
        )}

        {/* Summary Metric Cards */}
        {trackers.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-gray-700/80">
            <div className="p-3 bg-gray-750/70 rounded-xl border border-gray-700">
              <span className="text-[11px] text-gray-400 block mb-0.5">Total Target Seed</span>
              <span className="text-lg font-bold text-white">{formatNumber(totalAllTarget)}</span>
              <span className="text-[10px] text-gray-500 block">seeds di plan ini</span>
            </div>
            <div className="p-3 bg-green-500/10 rounded-xl border border-green-500/30">
              <span className="text-[11px] text-green-300 block mb-0.5">Sudah Terbeli</span>
              <span className="text-lg font-bold text-green-400">{formatNumber(totalAllQty)}</span>
              <span className="text-[10px] text-gray-400 block">
                {totalAllTarget > 0 ? `${Math.min(100, Math.round((totalAllQty / totalAllTarget) * 100))}% tercapai` : 'seeds'}
              </span>
            </div>
            <div className="p-3 bg-yellow-500/10 rounded-xl border border-yellow-500/30">
              <span className="text-[11px] text-yellow-300 block mb-0.5">Sisa Belum Terbeli</span>
              <span className="text-lg font-bold text-yellow-400">
                {formatNumber(Math.max(0, totalAllTarget - totalAllQty))}
              </span>
              <span className="text-[10px] text-gray-400 block">seeds lagi</span>
            </div>
            <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/30">
              <span className="text-[11px] text-red-300 block mb-0.5">Total Modal Keluar</span>
              <span className="text-lg font-bold text-red-400">{fmtWL(totalAllCostWL)} WL</span>
              {wlRate > 0 && totalAllCostWL > 0 && (
                <span className="text-[10px] text-gray-400 block">
                  ≈ Rp {formatRupiah(totalAllCostWL * wlRate)}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Grid of Tracker Cards */}
      {trackers.length === 0 ? (
        <div className="p-12 bg-gray-800 border border-dashed border-gray-700 rounded-2xl text-center space-y-4">
          <div className="w-16 h-16 bg-green-500/10 text-green-400 rounded-2xl flex items-center justify-center mx-auto text-2xl">
            <FiShoppingCart className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-base font-bold text-white">Belum Ada Target Belanja untuk Plan "{currentPlan?.name || 'Ini'}"</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Klik <strong>Import dari Plan Ini</strong> untuk langsung memuat bahan Seed 1 & Seed 2 dari plan ini, atau buat target belanja baru secara manual.
            </p>
          </div>
          <div className="flex flex-wrap justify-center items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleImportFromPlanner}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors shadow-sm"
            >
              <FiDownload className="w-4 h-4" />
              <span>Import dari Plan "{currentPlan?.name || 'Aktif'}"</span>
            </button>
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors shadow-sm"
            >
              <FiPlus className="w-4 h-4" />
              <span>+ Buat Target Manual</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {trackers.map((tracker) => (
            <TrackerCard
              key={tracker.id}
              card={tracker}
              onUpdate={handleUpdateTracker}
              onDelete={handleDeleteTracker}
              onApplyToPlanner={handleApplyToPlanner}
              plannerSteps={currentPlan?.steps || []}
            />
          ))}
        </div>
      )}

      {/* Modal: Add New Tracker */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-gray-700">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FiPlus className="text-green-400" /> Tambah Target Belanja ({currentPlan?.name})
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTracker} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Nama Item / Seed <span className="text-red-400">*</span>
                </label>
                <ItemSearch
                  value={newItemName}
                  onChange={(item) => setNewItemName(item ? item.name : '')}
                  placeholder="Cari seed (cth: Dreamstone Block Seed)..."
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Target Jumlah Beli (seeds) <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  value={newTargetQty}
                  onChange={(e) => setNewTargetQty(e.target.value)}
                  placeholder="Contoh: 2641"
                  required
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Harga Beli Estimasi / Bawaan (opsional)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={newDefaultPrice}
                    onChange={(e) => setNewDefaultPrice(e.target.value)}
                    placeholder="Contoh: 3"
                    className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <select
                    value={newPriceFormat}
                    onChange={(e) => setNewPriceFormat(e.target.value)}
                    className="px-2 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white focus:outline-none min-w-[100px]"
                  >
                    <option value="perWL">qty / WL</option>
                    <option value="each">WL each</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-650 text-gray-300 rounded-lg text-xs font-medium transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!newItemName.trim() || !newTargetQty}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm"
                >
                  Simpan Target
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
