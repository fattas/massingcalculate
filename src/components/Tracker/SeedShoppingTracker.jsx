import { useState, useEffect } from 'react';
import TrackerCard from './TrackerCard';
import ItemSearch from '../Common/ItemSearch';
import ConfirmModal from '../Common/ConfirmModal';
import { useLocalStorage, useSavedPlans } from '../../hooks/useLocalStorage';
import { createDefaultPlan } from '../../data/growtopiaItems';
import { formatNumber, fmtWL, formatRupiah, calculateCost } from '../../utils/calculations';
import { FiShoppingCart, FiPlus, FiDownload, FiTrash2, FiCheck, FiX, FiFolder } from 'react-icons/fi';

export default function SeedShoppingTracker({ onNavigateToPlanner }) {
  const [currentPlan, setCurrentPlan] = useLocalStorage('gt-current-plan', createDefaultPlan());
  const { plans: savedPlans, savePlan } = useSavedPlans();
  const [showClearAllConfirm, setShowClearAllConfirm] = useState(false);

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
    showNotification(`Target "${newTracker.name}" berhasil dibuat!`);
  };

  // Update a tracker card
  const handleUpdateTracker = (updated) => {
    const updatedList = trackers.map((t) => (t.id === updated.id ? updated : t));
    updateTrackers(updatedList);
  };

  // Delete a tracker card
  const handleDeleteTracker = (trackerId) => {
    const updatedList = trackers.filter((t) => t.id !== trackerId);
    updateTrackers(updatedList);
  };

  // Clear all trackers in this plan
  const handleClearAll = () => {
    updateTrackers([]);
    setShowClearAllConfirm(false);
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
    showNotification(`Berhasil memuat ${created.length} bahan dari plan!`);
  };

  // Apply tracked purchases to Massing Planner with auto-categorization by price
  const handleApplyToPlanner = ({ cardName, totalQty, totalCostWL, purchases, groupedPurchases: passedGrouped, stepIndex, seedSlot }) => {
    if (!currentPlan) return;

    const newSteps = [...(currentPlan.steps || [])];
    if (!newSteps[stepIndex]) {
      alert(`Step ${stepIndex + 1} tidak ditemukan.`);
      return;
    }

    const step = { ...newSteps[stepIndex] };

    if (!purchases || purchases.length === 0) {
      alert('Belum ada riwayat pembelian untuk tracker ini.');
      return;
    }

    // Group purchases by price & format
    let grouped = passedGrouped;
    if (!grouped || grouped.length === 0) {
      const groupsMap = new Map();
      purchases.forEach((p) => {
        const price = parseFloat(p.price) || 0;
        const format = p.priceFormat || 'perWL';
        const key = `${price}_${format}`;
        if (!groupsMap.has(key)) {
          groupsMap.set(key, { price, priceFormat: format, qty: 0, count: 0, firstIndex: groupsMap.size });
        }
        const entry = groupsMap.get(key);
        entry.qty += parseInt(p.qty) || 0;
        entry.count += 1;
      });
      grouped = Array.from(groupsMap.values()).sort((a, b) => {
        if (b.qty !== a.qty) return b.qty - a.qty;
        return a.firstIndex - b.firstIndex;
      });
    }

    if (grouped.length === 0) return;

    // Highest qty batch is Primary, others are Extra batches
    const primaryBatch = grouped[0];
    const extraBatches = grouped.slice(1).map((g) => ({
      id: Date.now().toString() + Math.random().toString(36).substring(2, 6),
      qty: g.qty,
      price: g.price,
      priceFormat: g.priceFormat || 'perWL',
    }));

    if (seedSlot === 'seed1') {
      step.seedName1 = cardName || step.seedName1;
      step.seed1Qty = primaryBatch.qty;
      step.seed1Price = primaryBatch.price;
      step.seed1PriceFormat = primaryBatch.priceFormat || 'perWL';
      step.seed1ExtraPurchases = extraBatches;
    } else {
      step.seedName2 = cardName || step.seedName2;
      step.seed2Qty = primaryBatch.qty;
      step.seed2Price = primaryBatch.price;
      step.seed2PriceFormat = primaryBatch.priceFormat || 'perWL';
      step.seed2ExtraPurchases = extraBatches;
    }

    if (!step.seedsPlanted || parseInt(step.seedsPlanted) === 0) {
      step.seedsPlanted = totalQty;
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

    showNotification(
      `Berhasil dikirim ke Step ${stepIndex + 1} (${seedSlot === 'seed1' ? 'Seed 1' : 'Seed 2'})!`
    );
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
      {/* Top Header Card */}
      <div className="bg-gray-800 border border-gray-700/80 rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <FiShoppingCart className="text-emerald-400 w-5 h-5" />
              Tracker Pembelian Seed
            </h2>

            {/* Plan Selector */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-gray-400">Terhubung:</span>
              <div className="flex items-center gap-1.5 bg-gray-750 px-2.5 py-1 rounded-lg border border-gray-650">
                <FiFolder className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                <select
                  value={currentPlan?.id || ''}
                  onChange={(e) => handleSwitchPlan(e.target.value)}
                  className="bg-transparent text-white font-bold text-xs focus:outline-none cursor-pointer pr-1"
                >
                  {allPlanOptions.map((p) => (
                    <option key={p.id} value={p.id} className="bg-gray-800 text-white">
                      {p.name || 'Untitled Plan'} ({p.steps?.length || 0} steps)
                    </option>
                  ))}
                </select>
              </div>
              <span className="text-xs text-gray-500">
                • {trackers.length} target
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleImportFromPlanner}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
              title="Ambil bahan Seed 1 & Seed 2 dari plan ini"
            >
              <FiDownload className="w-3.5 h-3.5" />
              <span>Import dari Plan</span>
            </button>
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <FiPlus className="w-3.5 h-3.5" />
              <span>+ Tambah Target</span>
            </button>
            {trackers.length > 0 && (
              <button
                type="button"
                onClick={() => setShowClearAllConfirm(true)}
                className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-700/60 rounded-lg transition-colors"
                title="Hapus semua target di plan ini"
              >
                <FiTrash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Global Notification Banner */}
        {notice && (
          <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 font-medium flex items-center justify-between gap-2 animate-fade-in">
            <div className="flex items-center gap-2">
              <FiCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{notice}</span>
            </div>
            {onNavigateToPlanner && (
              <button
                type="button"
                onClick={onNavigateToPlanner}
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold text-xs transition-colors flex-shrink-0"
              >
                Ke Massing Planner ➔
              </button>
            )}
          </div>
        )}

        {/* Summary Metric Cards */}
        {trackers.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-gray-700/70">
            <div className="p-3 bg-gray-750/50 rounded-xl border border-gray-700/70">
              <span className="text-[11px] text-gray-400 block mb-0.5">Total Target</span>
              <span className="text-base sm:text-lg font-bold text-white">{formatNumber(totalAllTarget)}</span>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/25">
              <span className="text-[11px] text-emerald-300 block mb-0.5">Sudah Terbeli</span>
              <span className="text-base sm:text-lg font-bold text-emerald-400">{formatNumber(totalAllQty)}</span>
            </div>
            <div className="p-3 bg-yellow-500/10 rounded-xl border border-yellow-500/25">
              <span className="text-[11px] text-yellow-300 block mb-0.5">Sisa Belum Terbeli</span>
              <span className="text-base sm:text-lg font-bold text-yellow-400">
                {formatNumber(Math.max(0, totalAllTarget - totalAllQty))}
              </span>
            </div>
            <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/25">
              <span className="text-[11px] text-red-300 block mb-0.5">Total Modal Keluar</span>
              <span className="text-base sm:text-lg font-bold text-red-400">{fmtWL(totalAllCostWL)} WL</span>
            </div>
          </div>
        )}
      </div>

      {/* Grid of Tracker Cards */}
      {trackers.length === 0 ? (
        <div className="p-12 bg-gray-800 border border-dashed border-gray-700/80 rounded-2xl text-center space-y-3">
          <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center mx-auto text-xl">
            <FiShoppingCart className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-sm font-bold text-white">Belum Ada Target Belanja</h3>
            <p className="text-xs text-gray-400">
              Klik <strong>Import dari Plan</strong> untuk langsung memuat bahan dari plan, atau buat target manual.
            </p>
          </div>
          <div className="flex flex-wrap justify-center items-center gap-2 pt-2">
            <button
              type="button"
              onClick={handleImportFromPlanner}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <FiDownload className="w-3.5 h-3.5" />
              <span>Import dari Plan</span>
            </button>
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <FiPlus className="w-3.5 h-3.5" />
              <span>+ Buat Manual</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {trackers.map((tracker) => (
            <TrackerCard
              key={tracker.id}
              card={tracker}
              onUpdate={handleUpdateTracker}
              onDelete={handleDeleteTracker}
              onApplyToPlanner={handleApplyToPlanner}
              plannerSteps={currentPlan?.steps || []}
              onNavigateToPlanner={onNavigateToPlanner}
            />
          ))}
        </div>
      )}

      {/* Modal: Add New Tracker */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-gray-700">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FiPlus className="text-emerald-400" /> Tambah Target Belanja
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTracker} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-gray-400 mb-1">Nama Item / Seed</label>
                <ItemSearch
                  value={newItemName}
                  onChange={(item) => setNewItemName(item ? item.name : '')}
                  placeholder="Cari item..."
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-gray-400 mb-1">Target Beli</label>
                  <input
                    type="number"
                    value={newTargetQty}
                    onChange={(e) => setNewTargetQty(e.target.value)}
                    placeholder="2000"
                    className="w-full px-2.5 py-1.5 bg-gray-700 border border-gray-600 rounded-lg text-white text-xs focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-medium text-gray-400 mb-1">Harga Bawaan</label>
                  <div className="flex gap-1">
                    <input
                      type="number"
                      value={newDefaultPrice}
                      onChange={(e) => setNewDefaultPrice(e.target.value)}
                      placeholder="15"
                      className="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded-lg text-white text-xs"
                    />
                    <select
                      value={newPriceFormat}
                      onChange={(e) => setNewPriceFormat(e.target.value)}
                      className="px-1.5 py-1.5 bg-gray-700 border border-gray-600 rounded-lg text-[11px] text-white"
                    >
                      <option value="perWL">/ WL</option>
                      <option value="each">each</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 bg-gray-700 hover:bg-gray-650 text-gray-300 rounded-lg text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!newItemName.trim()}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold"
                >
                  Tambah Target
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Clearing All Trackers */}
      <ConfirmModal
        isOpen={showClearAllConfirm}
        onClose={() => setShowClearAllConfirm(false)}
        onConfirm={handleClearAll}
        title="Hapus Semua Target Belanja?"
        message={`Apakah Anda yakin ingin menghapus semua target belanja untuk plan "${currentPlan?.name || 'ini'}"?`}
        confirmText="Ya, Hapus Semua"
        cancelText="Batal"
      />
    </div>
  );
}
