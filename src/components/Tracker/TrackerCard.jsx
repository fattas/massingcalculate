import { useState } from 'react';
import ItemIcon from '../Common/ItemIcon';
import ItemSearch from '../Common/ItemSearch';
import { formatNumber, fmtWL, calculateCost } from '../../utils/calculations';
import { FiTrash2, FiPlus, FiEdit2, FiCheck, FiX, FiSend, FiClock } from 'react-icons/fi';

export default function TrackerCard({
  card,
  onUpdate,
  onDelete,
  onApplyToPlanner,
  plannerSteps = [],
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(card.name);
  const [editTarget, setEditTarget] = useState(card.targetQty || 0);
  const [editPrice, setEditPrice] = useState(card.defaultPrice || 0);
  const [editFormat, setEditFormat] = useState(card.defaultPriceFormat || 'perWL');

  // Input for adding next purchase
  const [inputQty, setInputQty] = useState('');
  const [inputPrice, setInputPrice] = useState(card.defaultPrice || '');
  const [inputFormat, setInputFormat] = useState(card.defaultPriceFormat || 'perWL');

  // Modal / selector for Apply to Planner
  const [showApplyMenu, setShowApplyMenu] = useState(false);
  const [selectedStepIndex, setSelectedStepIndex] = useState(0);
  const [selectedSeedSlot, setSelectedSeedSlot] = useState('seed1');
  const [applySuccess, setApplySuccess] = useState(false);

  // Calculations
  const purchases = card.purchases || [];
  const totalQty = purchases.reduce((sum, p) => sum + (parseInt(p.qty) || 0), 0);
  const totalCostWL = purchases.reduce(
    (sum, p) => sum + calculateCost(p.qty, p.price, p.priceFormat || 'perWL'),
    0
  );
  const targetQty = parseInt(card.targetQty) || 0;
  const remaining = Math.max(0, targetQty - totalQty);
  const isCompleted = targetQty > 0 && totalQty >= targetQty;
  const progressPercent = targetQty > 0 ? Math.min(100, Math.round((totalQty / targetQty) * 100)) : 0;

  // Handle Save Edit
  const handleSaveEdit = () => {
    onUpdate({
      ...card,
      name: editName,
      targetQty: parseInt(editTarget) || 0,
      defaultPrice: parseFloat(editPrice) || 0,
      defaultPriceFormat: editFormat,
    });
    setIsEditing(false);
  };

  // Handle Add Purchase
  const handleAddPurchase = (e) => {
    if (e) e.preventDefault();
    const qty = parseInt(inputQty) || 0;
    if (qty <= 0) return;

    const price = parseFloat(inputPrice) || card.defaultPrice || 0;
    const format = inputFormat || card.defaultPriceFormat || 'perWL';

    const newPurchase = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 6),
      qty,
      price,
      priceFormat: format,
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    };

    onUpdate({
      ...card,
      purchases: [...purchases, newPurchase],
    });

    setInputQty('');
  };

  // Quick Preset Add
  const handlePresetClick = (amount) => {
    setInputQty(amount);
  };

  // Handle Remove Purchase
  const handleRemovePurchase = (purchaseId) => {
    onUpdate({
      ...card,
      purchases: purchases.filter((p) => p.id !== purchaseId),
    });
  };

  // Clear all purchases
  const handleClearPurchases = () => {
    if (window.confirm(`Yakin ingin mengosongkan semua riwayat pembelian untuk ${card.name || 'seed ini'}?`)) {
      onUpdate({
        ...card,
        purchases: [],
      });
    }
  };

  // Handle Apply to Massing Planner
  const handleConfirmApply = () => {
    if (onApplyToPlanner) {
      onApplyToPlanner({
        cardId: card.id,
        cardName: card.name,
        totalQty,
        totalCostWL,
        purchases,
        stepIndex: selectedStepIndex,
        seedSlot: selectedSeedSlot,
      });
      setApplySuccess(true);
      setTimeout(() => {
        setApplySuccess(false);
        setShowApplyMenu(false);
      }, 1500);
    }
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden shadow-lg flex flex-col justify-between animate-fade-in">
      {/* Top Bar / Header */}
      <div className="p-4 bg-gray-750/70 border-b border-gray-700/80">
        {isEditing ? (
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-medium text-gray-400 mb-1">Nama Item / Seed</label>
              <ItemSearch
                value={editName}
                onChange={(item) => setEditName(item ? item.name : '')}
                placeholder="Cari item..."
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-medium text-gray-400 mb-1">Target Beli (seeds)</label>
                <input
                  type="number"
                  value={editTarget || ''}
                  onChange={(e) => setEditTarget(e.target.value)}
                  placeholder="Misal: 2641"
                  className="w-full px-2.5 py-1.5 bg-gray-700 border border-gray-600 rounded-lg text-white text-xs focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-gray-400 mb-1">Harga Beli Bawaan</label>
                <div className="flex gap-1">
                  <input
                    type="number"
                    value={editPrice || ''}
                    onChange={(e) => setEditPrice(e.target.value)}
                    placeholder="Contoh: 3"
                    className="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded-lg text-white text-xs"
                  />
                  <select
                    value={editFormat}
                    onChange={(e) => setEditFormat(e.target.value)}
                    className="px-1.5 py-1.5 bg-gray-700 border border-gray-600 rounded-lg text-[11px] text-white"
                  >
                    <option value="perWL">/ WL</option>
                    <option value="each">each</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-2.5 py-1 bg-gray-700 text-gray-300 rounded text-xs flex items-center gap-1"
              >
                <FiX className="w-3.5 h-3.5" /> Batal
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-semibold flex items-center gap-1"
              >
                <FiCheck className="w-3.5 h-3.5" /> Simpan
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <ItemIcon name={card.name} size={40} className="rounded-lg shadow" />
              <div className="min-w-0">
                <h3 className="font-bold text-white text-sm sm:text-base truncate flex items-center gap-2">
                  <span>{card.name || 'Tanpa Nama'}</span>
                  {isCompleted && (
                    <span className="text-[10px] font-semibold bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full border border-green-500/30">
                      Selesai
                    </span>
                  )}
                </h3>
                <p className="text-xs text-gray-400">
                  Target: <strong className="text-gray-200">{formatNumber(targetQty)} seeds</strong>
                  {card.defaultPrice > 0 && (
                    <span className="text-gray-400 ml-1.5">
                      • Harga: {card.defaultPrice} {card.defaultPriceFormat === 'each' ? 'WL each' : '/ WL'}
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                type="button"
                onClick={() => {
                  setEditName(card.name);
                  setEditTarget(card.targetQty);
                  setEditPrice(card.defaultPrice);
                  setEditFormat(card.defaultPriceFormat || 'perWL');
                  setIsEditing(true);
                }}
                className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                title="Edit Target & Nama"
              >
                <FiEdit2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onDelete(card.id)}
                className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                title="Hapus Tracker"
              >
                <FiTrash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Progress Bar & Counter */}
        {!isEditing && (
          <div className="mt-3.5 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-300 font-medium">
                Terkumpul: <strong className="text-green-400 text-sm">{formatNumber(totalQty)}</strong>
                {targetQty > 0 && (
                  <span className="text-gray-400 font-normal"> / {formatNumber(targetQty)} seeds</span>
                )}
              </span>
              <span className="font-bold text-white bg-gray-700/80 px-2 py-0.5 rounded text-[11px]">
                {progressPercent}%
              </span>
            </div>

            {/* Visual Bar */}
            <div className="w-full h-2.5 bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  isCompleted ? 'bg-green-500 shadow-sm shadow-green-500/50' : 'bg-blue-500'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] pt-0.5">
              <span className={remaining > 0 ? 'text-yellow-400 font-medium' : 'text-green-400 font-semibold'}>
                {remaining > 0 ? (
                  `Kurang: ${formatNumber(remaining)} seeds lagi`
                ) : (
                  `🎉 Target tercapai! (+${formatNumber(totalQty - targetQty)} lebih)`
                )}
              </span>
              <span className="text-gray-400">
                Modal Keluar: <strong className="text-yellow-400">{fmtWL(totalCostWL)} WL</strong>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Main Action Section: Quick Add Form */}
      <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
        <form onSubmit={handleAddPurchase} className="space-y-2.5">
          <p className="text-xs font-semibold text-gray-300 flex items-center justify-between">
            <span>➕ Catat Pertambahan Beli</span>
            <span className="text-[10px] text-gray-500 font-normal">Tekan Enter atau klik Tambah</span>
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-2">
            {/* Input Qty */}
            <div>
              <input
                type="number"
                value={inputQty}
                onChange={(e) => setInputQty(e.target.value)}
                placeholder="Jumlah dibeli (cth: 200)"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-green-500 placeholder-gray-500"
                autoFocus={false}
              />
            </div>

            {/* Input Price */}
            <div className="flex gap-1">
              <input
                type="number"
                value={inputPrice}
                onChange={(e) => setInputPrice(e.target.value)}
                placeholder="Harga"
                className="w-20 px-2 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-xs text-center focus:outline-none focus:ring-2 focus:ring-green-500"
                title="Harga beli batch ini"
              />
              <select
                value={inputFormat}
                onChange={(e) => setInputFormat(e.target.value)}
                className="px-1.5 py-2 bg-gray-700 border border-gray-600 rounded-lg text-xs text-white focus:outline-none"
              >
                <option value="perWL">/ WL</option>
                <option value="each">each</option>
              </select>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!inputQty || parseInt(inputQty) <= 0}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg text-sm transition-colors flex items-center justify-center gap-1.5 shadow-sm"
            >
              <FiPlus className="w-4 h-4" /> Tambah
            </button>
          </div>

          {/* Quick Buttons Presets */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] text-gray-400 font-medium mr-1">Cepat:</span>
            {[50, 100, 200, 500, 1000].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handlePresetClick(num)}
                className="px-2 py-1 bg-gray-700 hover:bg-gray-650 hover:text-white border border-gray-600 text-gray-300 rounded text-xs transition-colors font-medium active:scale-95"
              >
                +{formatNumber(num)}
              </button>
            ))}
            {remaining > 0 && remaining !== 50 && remaining !== 100 && remaining !== 200 && remaining !== 500 && (
              <button
                type="button"
                onClick={() => handlePresetClick(remaining)}
                className="px-2 py-1 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 border border-yellow-500/40 rounded text-xs transition-colors font-semibold active:scale-95"
                title="Isi dengan sisa kekurangan agar genap target"
              >
                Sisa ({formatNumber(remaining)})
              </button>
            )}
          </div>
        </form>

        {/* Purchase History Log */}
        <div className="pt-2 border-t border-gray-700/60 space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span className="font-semibold text-gray-300 flex items-center gap-1">
              <FiClock className="w-3.5 h-3.5 text-blue-400" />
              Riwayat Pembelian ({purchases.length} transaksi)
            </span>
            {purchases.length > 0 && (
              <button
                type="button"
                onClick={handleClearPurchases}
                className="text-[11px] text-red-400 hover:underline"
              >
                Reset Riwayat
              </button>
            )}
          </div>

          {purchases.length === 0 ? (
            <div className="p-3 bg-gray-750/30 rounded-lg text-center text-xs text-gray-500 border border-dashed border-gray-700">
              Belum ada riwayat pembelian. Ketik jumlah atau klik tombol cepat di atas untuk mencatat.
            </div>
          ) : (
            <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin scrollbar-thumb-gray-600">
              {[...purchases].reverse().map((item, index) => {
                const cost = calculateCost(item.qty, item.price, item.priceFormat || 'perWL');
                const originalIndex = purchases.length - index;
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2 bg-gray-700/50 hover:bg-gray-700 rounded-lg text-xs border border-gray-650 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[10px] text-gray-400 font-bold bg-gray-800 px-1.5 py-0.5 rounded">
                        #{originalIndex}
                      </span>
                      <span className="font-bold text-green-400">
                        +{formatNumber(item.qty)} seeds
                      </span>
                      {item.price > 0 && (
                        <span className="text-gray-400 text-[11px]">
                          @ {item.price} {item.priceFormat === 'each' ? 'WL each' : '/WL'}
                        </span>
                      )}
                      {cost > 0 && (
                        <span className="text-yellow-400 font-semibold text-[11px]">
                          ({fmtWL(cost)} WL)
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {item.time && <span className="text-[10px] text-gray-500">{item.time}</span>}
                      <button
                        type="button"
                        onClick={() => handleRemovePurchase(item.id)}
                        className="p-1 text-gray-400 hover:text-red-400 rounded transition-colors"
                        title="Hapus entri ini"
                      >
                        <FiTrash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer: Send to Massing Planner Button */}
        <div className="pt-2 border-t border-gray-700/60">
          {!showApplyMenu ? (
            <button
              type="button"
              onClick={() => setShowApplyMenu(true)}
              disabled={totalQty === 0}
              className="w-full py-2 px-3 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              title="Kirim total seed dan batch belanja ini ke Massing Planner"
            >
              <FiSend className="w-3.5 h-3.5 text-blue-400" />
              <span>➔ Kirim Hasil ke Massing Planner</span>
            </button>
          ) : (
            <div className="p-2.5 bg-blue-500/10 border border-blue-500/30 rounded-lg space-y-2 text-xs animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-blue-300">Terapkan ke Massing Planner:</span>
                <button
                  type="button"
                  onClick={() => setShowApplyMenu(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <FiX className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-gray-400 mb-0.5">Pilih Step:</label>
                  <select
                    value={selectedStepIndex}
                    onChange={(e) => setSelectedStepIndex(parseInt(e.target.value) || 0)}
                    className="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-xs text-white"
                  >
                    {(plannerSteps.length > 0 ? plannerSteps : [{ id: 'default', name: 'Step 1' }]).map(
                      (s, idx) => (
                        <option key={s.id || idx} value={idx}>
                          Step {idx + 1} {s.name ? `(${s.name})` : ''}
                        </option>
                      )
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 mb-0.5">Posisi Seed:</label>
                  <select
                    value={selectedSeedSlot}
                    onChange={(e) => setSelectedSeedSlot(e.target.value)}
                    className="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-xs text-white"
                  >
                    <option value="seed1">Seed / Bahan 1</option>
                    <option value="seed2">Seed / Bahan 2</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-gray-300">
                  Total: <strong className="text-white">{formatNumber(totalQty)} seeds</strong> ({fmtWL(totalCostWL)} WL)
                </span>
                <button
                  type="button"
                  onClick={handleConfirmApply}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold text-xs transition-colors flex items-center gap-1"
                >
                  {applySuccess ? <FiCheck className="w-3.5 h-3.5 text-green-300" /> : <FiSend className="w-3 h-3" />}
                  <span>{applySuccess ? 'Tersalin!' : 'Konfirmasi Kirim'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
