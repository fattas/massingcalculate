import { useState } from 'react';
import ItemSearch from '../Common/ItemSearch';
import ItemIcon from '../Common/ItemIcon';
import ConfirmModal from '../Common/ConfirmModal';
import { calculateStep, formatNumber, fmtWL } from '../../utils/calculations';
import { FiTrash2, FiChevronDown, FiChevronUp, FiCpu, FiPlus, FiClock, FiCopy, FiCheck } from 'react-icons/fi';

function PriceInput({ price, priceFormat, onPriceChange, onFormatChange }) {
  return (
    <div className="flex gap-2 mt-1.5">
      <div className="flex-1">
        <input
          type="number"
          value={price || ''}
          onChange={(e) => onPriceChange(parseFloat(e.target.value) || 0)}
          placeholder={priceFormat === 'perWL' ? 'Contoh: 200' : 'Contoh: 3'}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>
      <select
        value={priceFormat}
        onChange={(e) => onFormatChange(e.target.value)}
        className="px-2 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-green-500 min-w-[110px]"
      >
        <option value="perWL">qty / WL</option>
        <option value="each">WL each</option>
      </select>
    </div>
  );
}

export default function RecipeStep({
  step,
  index,
  onUpdate,
  onRemove,
  onDuplicate,
  isOnly,
  prevStepSeeds = 0,
  onApplyPrevStep,
}) {
  const [expanded, setExpanded] = useState(true);
  const [extraToDelete, setExtraToDelete] = useState(null);

  const results = calculateStep(step);

  const handleFieldChange = (field, value) => {
    onUpdate({ ...step, [field]: value });
  };

  const handleItemSelect = (field, item) => {
    if (item) {
      const updates = { [field]: item.name };
      if (field === 'resultItemName' && item.hitsToBreak) {
        updates.hitsPerBlock = item.hitsToBreak;
      }
      onUpdate({ ...step, ...updates });
    } else {
      onUpdate({ ...step, [field]: '' });
    }
  };

  // Seed 1 Extra Purchases handlers
  const handleAddSeed1Extra = () => {
    const extras = Array.isArray(step.seed1ExtraPurchases) ? step.seed1ExtraPurchases : [];
    const newExtra = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 6),
      qty: 0,
      price: 0,
      priceFormat: 'perWL',
    };
    onUpdate({
      ...step,
      seed1ExtraPurchases: [...extras, newExtra],
    });
  };

  const handleUpdateSeed1Extra = (id, field, value) => {
    const extras = (step.seed1ExtraPurchases || []).map((p) => {
      if (p.id === id) {
        return { ...p, [field]: value };
      }
      return p;
    });
    onUpdate({
      ...step,
      seed1ExtraPurchases: extras,
    });
  };

  const handleRemoveSeed1Extra = (id) => {
    const extras = (step.seed1ExtraPurchases || []).filter((p) => p.id !== id);
    onUpdate({
      ...step,
      seed1ExtraPurchases: extras,
    });
  };

  // Seed 2 Extra Purchases handlers
  const handleAddSeed2Extra = () => {
    const extras = Array.isArray(step.seed2ExtraPurchases) ? step.seed2ExtraPurchases : [];
    const newExtra = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 6),
      qty: 0,
      price: 0,
      priceFormat: 'perWL',
    };
    onUpdate({
      ...step,
      seed2ExtraPurchases: [...extras, newExtra],
    });
  };

  const handleUpdateSeed2Extra = (id, field, value) => {
    const extras = (step.seed2ExtraPurchases || []).map((p) => {
      if (p.id === id) {
        return { ...p, [field]: value };
      }
      return p;
    });
    onUpdate({
      ...step,
      seed2ExtraPurchases: extras,
    });
  };

  const handleRemoveSeed2Extra = (id) => {
    const extras = (step.seed2ExtraPurchases || []).filter((p) => p.id !== id);
    onUpdate({
      ...step,
      seed2ExtraPurchases: extras,
    });
  };

  // Calculate biaya preview for each seed and its batches
  const seed1ExtraList = Array.isArray(step.seed1ExtraPurchases) ? step.seed1ExtraPurchases : [];
  const primarySeed1Qty = step.seed1Qty || (seed1ExtraList.length === 0 ? step.seedsPlanted : 0) || 0;
  const primarySeed1Cost = step.seed1Price > 0 && primarySeed1Qty > 0
    ? (step.seed1PriceFormat === 'each' ? primarySeed1Qty * step.seed1Price : primarySeed1Qty / step.seed1Price)
    : 0;

  let totalSeed1Qty = primarySeed1Qty;
  let totalSeed1Cost = primarySeed1Cost;
  seed1ExtraList.forEach((extra) => {
    const q = parseInt(extra.qty) || 0;
    totalSeed1Qty += q;
    if (extra.price > 0 && q > 0) {
      totalSeed1Cost += extra.priceFormat === 'each' ? q * extra.price : q / extra.price;
    }
  });

  const seed2ExtraList = Array.isArray(step.seed2ExtraPurchases) ? step.seed2ExtraPurchases : [];
  const primarySeed2Qty = step.seed2Qty || (seed2ExtraList.length === 0 ? step.seedsPlanted : 0) || 0;
  const primarySeed2Cost = step.seed2Price > 0 && primarySeed2Qty > 0
    ? (step.seed2PriceFormat === 'each' ? primarySeed2Qty * step.seed2Price : primarySeed2Qty / step.seed2Price)
    : 0;

  let totalSeed2Qty = primarySeed2Qty;
  let totalSeed2Cost = primarySeed2Cost;
  seed2ExtraList.forEach((extra) => {
    const q = parseInt(extra.qty) || 0;
    totalSeed2Qty += q;
    if (extra.price > 0 && q > 0) {
      totalSeed2Cost += extra.priceFormat === 'each' ? q * extra.price : q / extra.price;
    }
  });

  const fuelQty = step.fuelNeeded || 0;
  const fuelPrice = step.fuelPrice || step.fuelCostPerUnit || 0;
  const fuelPriceFormat = step.fuelPriceFormat || (step.fuelCostPerUnit > 0 ? 'each' : 'perWL');
  const fuelCost = fuelPrice > 0 && fuelQty > 0
    ? (fuelPriceFormat === 'each' ? fuelQty * fuelPrice : fuelQty / fuelPrice)
    : 0;

  return (
    <div
      className={`border rounded-xl overflow-hidden transition-all duration-200 animate-fade-in ${
        step.isCompleted
          ? 'bg-gradient-to-b from-gray-800 to-gray-800/90 border-emerald-500/60 ring-1 ring-emerald-500/20 shadow-md shadow-emerald-500/10'
          : 'bg-gray-800 border-gray-700'
      }`}
    >
      {/* Header */}
      <div
        className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-colors ${
          step.isCompleted ? 'bg-emerald-950/20 hover:bg-emerald-950/30' : 'bg-gray-800 hover:bg-gray-750'
        }`}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3 min-w-0">
          {/* Step Number with Completed Checkmark indicator */}
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0 transition-colors ${
              step.isCompleted
                ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/40'
                : 'bg-green-500/20 text-green-400'
            }`}
          >
            {step.isCompleted ? <FiCheck className="w-4 h-4 stroke-[3]" /> : index + 1}
          </div>

          {/* Step Name & Info */}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className={`text-sm font-semibold truncate ${step.isCompleted ? 'text-emerald-300' : 'text-white'}`}>
                {step.name || `Step ${index + 1}`}
              </h3>
              {step.isCompleted && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Selesai
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 truncate">
              {step.resultItemName || 'Belum ditentukan'}
              {step.useTM && ` • ${step.tmCount} TM`}
            </p>
          </div>
        </div>

        {/* Right Header: Toggle Done Button + Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Selesai / Belum Toggle Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleFieldChange('isCompleted', !step.isCompleted);
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all active:scale-95 ${
              step.isCompleted
                ? 'bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/35 shadow-sm'
                : 'bg-gray-700/80 border border-gray-600 text-gray-300 hover:text-white hover:bg-gray-700 hover:border-gray-500'
            }`}
            title={step.isCompleted ? 'Klik untuk membatalkan status selesai' : 'Klik untuk menandai step ini sudah selesai dikerjakan'}
          >
            <span
              className={`w-3.5 h-3.5 rounded flex items-center justify-center border transition-colors ${
                step.isCompleted
                  ? 'bg-emerald-500 border-emerald-400 text-white'
                  : 'border-gray-400 bg-gray-800'
              }`}
            >
              {step.isCompleted && <FiCheck className="w-2.5 h-2.5 stroke-[3]" />}
            </span>
            <span className="hidden sm:inline">
              {step.isCompleted ? 'Selesai' : 'Tandai Selesai'}
            </span>
          </button>

          {onDuplicate && (
            <button
              onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
              className="p-1.5 text-gray-400 hover:text-amber-400 hover:bg-gray-750 rounded-lg transition-colors"
              title="Duplikat step ini"
            >
              <FiCopy className="w-4 h-4" />
            </button>
          )}
          {!isOnly && (
            <button
              onClick={(e) => { e.stopPropagation(); onRemove(); }}
              className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
              title="Hapus step"
            >
              <FiTrash2 className="w-4 h-4" />
            </button>
          )}
          {expanded ? <FiChevronUp className="w-4 h-4 text-gray-400" /> : <FiChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </div>

      {/* Content */}
      {expanded && (
        <div className="p-4 border-t border-gray-700 space-y-4">
          {/* Step Name */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Nama Step</label>
            <input
              type="text"
              value={step.name}
              onChange={(e) => handleFieldChange('name', e.target.value)}
              placeholder="Contoh: Farm Chicken Seeds"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Sambungkan dari Step sebelumnya jika ada */}
          {prevStepSeeds > 0 && onApplyPrevStep && (
            <div className="flex items-center justify-between p-2.5 bg-blue-500/10 border border-blue-500/30 rounded-lg text-xs">
              <span className="text-blue-300">
                📦 Hasil Step {index}: <strong className="text-white">{formatNumber(prevStepSeeds)} seeds</strong> (after break)
              </span>
              <button
                type="button"
                onClick={() => onApplyPrevStep(prevStepSeeds)}
                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors"
                title="Gunakan sebagai Seed 1 dan Total Ditanam di Step ini"
              >
                Gunakan di Step Ini ➔
              </button>
            </div>
          )}

          {/* Splicing Recipe - Seed 1 + Seed 2 with individual prices & qty */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-3">
            {/* Seed 1 */}
            <div className="p-3 bg-gray-750/30 rounded-xl border border-gray-700/60 flex flex-col justify-between space-y-3">
              <div className="space-y-2">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Seed / Bahan 1</label>
                  <ItemSearch
                    value={step.seedName1}
                    onChange={(item) => handleItemSelect('seedName1', item)}
                    placeholder="Cari seed 1..."
                  />
                </div>

                {/* Pembelian Utama */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-medium text-gray-400">
                      Qty Beli Seed 1 {seed1ExtraList.length > 0 && <span className="text-[11px] text-gray-500">(Utama)</span>}
                    </label>
                    {primarySeed1Cost > 0 && (
                      <span className="text-[11px] text-yellow-400 font-medium">
                        {fmtWL(primarySeed1Cost)} WL
                      </span>
                    )}
                  </div>
                  <input
                    type="number"
                    value={step.seed1Qty || ''}
                    onChange={(e) => handleFieldChange('seed1Qty', parseInt(e.target.value) || 0)}
                    placeholder="Jumlah seed 1 dibeli"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <label className="block text-xs font-medium text-gray-400">
                    Harga Beli Seed 1 {seed1ExtraList.length > 0 && <span className="text-[11px] text-gray-500">(Utama)</span>}
                  </label>
                  <PriceInput
                    price={step.seed1Price}
                    priceFormat={step.seed1PriceFormat}
                    onPriceChange={(v) => handleFieldChange('seed1Price', v)}
                    onFormatChange={(v) => handleFieldChange('seed1PriceFormat', v)}
                  />
                </div>

                {/* Batch Pembelian Tambahan Dinamis */}
                {seed1ExtraList.map((extra, idx) => {
                  const extraCost = extra.price > 0 && extra.qty > 0
                    ? (extra.priceFormat === 'each' ? extra.qty * extra.price : extra.qty / extra.price)
                    : 0;
                  return (
                    <div key={extra.id} className="p-2.5 bg-gray-700/40 border border-gray-600/50 rounded-lg space-y-1.5 animate-fade-in">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-green-400">
                          Tambahan #{idx + 1}
                        </span>
                        <div className="flex items-center gap-2">
                          {extraCost > 0 && (
                            <span className="text-[11px] text-yellow-400 font-medium">
                              {fmtWL(extraCost)} WL
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() =>
                              setExtraToDelete({
                                slot: 'seed1',
                                id: extra.id,
                                index: idx + 1,
                                qty: extra.qty,
                                price: extra.price,
                                priceFormat: extra.priceFormat || 'perWL',
                                seedName: step.seedName1 || 'Seed 1',
                              })
                            }
                            className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors"
                            title="Hapus field tambahan ini"
                          >
                            <FiTrash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-400">Qty Beli Seed 1</label>
                        <input
                          type="number"
                          value={extra.qty || ''}
                          onChange={(e) => handleUpdateSeed1Extra(extra.id, 'qty', parseInt(e.target.value) || 0)}
                          placeholder="Jumlah seed 1 dibeli"
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-400">Harga Beli Seed 1</label>
                        <PriceInput
                          price={extra.price}
                          priceFormat={extra.priceFormat || 'perWL'}
                          onPriceChange={(v) => handleUpdateSeed1Extra(extra.id, 'price', v)}
                          onFormatChange={(v) => handleUpdateSeed1Extra(extra.id, 'priceFormat', v)}
                        />
                      </div>
                    </div>
                  );
                })}

                {/* Tombol Tambah Pembelian Seed 1 */}
                <button
                  type="button"
                  onClick={handleAddSeed1Extra}
                  className="w-full py-1.5 px-2 bg-gray-700/50 hover:bg-gray-700 border border-dashed border-gray-600 hover:border-green-500/50 text-gray-300 hover:text-green-400 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                  title="Tambah field qty dan harga beli untuk harga berbeda"
                >
                  <FiPlus className="w-3.5 h-3.5 text-green-400" />
                  <span>+ Tambah Pembelian Seed 1</span>
                </button>
              </div>

              {/* Total Seed 1 Ringkasan */}
              {(totalSeed1Qty > 0 || totalSeed1Cost > 0) && (
                <div className="pt-2 border-t border-gray-700/60 flex items-center justify-between text-xs">
                  <span className="text-gray-300">
                    Total: <strong className="text-white">{formatNumber(totalSeed1Qty)} seeds</strong>
                  </span>
                  <span className="text-yellow-400 font-bold">
                    Biaya: {fmtWL(totalSeed1Cost)} WL
                  </span>
                </div>
              )}
            </div>

            {/* Plus sign */}
            <div className="flex items-start justify-center text-2xl text-green-400 font-bold pt-7">+</div>

            {/* Seed 2 */}
            <div className="p-3 bg-gray-750/30 rounded-xl border border-gray-700/60 flex flex-col justify-between space-y-3">
              <div className="space-y-2">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Seed / Bahan 2</label>
                  <ItemSearch
                    value={step.seedName2}
                    onChange={(item) => handleItemSelect('seedName2', item)}
                    placeholder="Cari seed 2..."
                  />
                </div>

                {/* Pembelian Utama */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-medium text-gray-400">
                      Qty Beli Seed 2 {seed2ExtraList.length > 0 && <span className="text-[11px] text-gray-500">(Utama)</span>}
                    </label>
                    {primarySeed2Cost > 0 && (
                      <span className="text-[11px] text-yellow-400 font-medium">
                        {fmtWL(primarySeed2Cost)} WL
                      </span>
                    )}
                  </div>
                  <input
                    type="number"
                    value={step.seed2Qty || ''}
                    onChange={(e) => handleFieldChange('seed2Qty', parseInt(e.target.value) || 0)}
                    placeholder="Jumlah seed 2 dibeli"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <label className="block text-xs font-medium text-gray-400">
                    Harga Beli Seed 2 {seed2ExtraList.length > 0 && <span className="text-[11px] text-gray-500">(Utama)</span>}
                  </label>
                  <PriceInput
                    price={step.seed2Price}
                    priceFormat={step.seed2PriceFormat}
                    onPriceChange={(v) => handleFieldChange('seed2Price', v)}
                    onFormatChange={(v) => handleFieldChange('seed2PriceFormat', v)}
                  />
                </div>

                {/* Batch Pembelian Tambahan Dinamis */}
                {seed2ExtraList.map((extra, idx) => {
                  const extraCost = extra.price > 0 && extra.qty > 0
                    ? (extra.priceFormat === 'each' ? extra.qty * extra.price : extra.qty / extra.price)
                    : 0;
                  return (
                    <div key={extra.id} className="p-2.5 bg-gray-700/40 border border-gray-600/50 rounded-lg space-y-1.5 animate-fade-in">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-green-400">
                          Tambahan #{idx + 1}
                        </span>
                        <div className="flex items-center gap-2">
                          {extraCost > 0 && (
                            <span className="text-[11px] text-yellow-400 font-medium">
                              {fmtWL(extraCost)} WL
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() =>
                              setExtraToDelete({
                                slot: 'seed2',
                                id: extra.id,
                                index: idx + 1,
                                qty: extra.qty,
                                price: extra.price,
                                priceFormat: extra.priceFormat || 'perWL',
                                seedName: step.seedName2 || 'Seed 2',
                              })
                            }
                            className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors"
                            title="Hapus field tambahan ini"
                          >
                            <FiTrash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-400">Qty Beli Seed 2</label>
                        <input
                          type="number"
                          value={extra.qty || ''}
                          onChange={(e) => handleUpdateSeed2Extra(extra.id, 'qty', parseInt(e.target.value) || 0)}
                          placeholder="Jumlah seed 2 dibeli"
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-400">Harga Beli Seed 2</label>
                        <PriceInput
                          price={extra.price}
                          priceFormat={extra.priceFormat || 'perWL'}
                          onPriceChange={(v) => handleUpdateSeed2Extra(extra.id, 'price', v)}
                          onFormatChange={(v) => handleUpdateSeed2Extra(extra.id, 'priceFormat', v)}
                        />
                      </div>
                    </div>
                  );
                })}

                {/* Tombol Tambah Pembelian Seed 2 */}
                <button
                  type="button"
                  onClick={handleAddSeed2Extra}
                  className="w-full py-1.5 px-2 bg-gray-700/50 hover:bg-gray-700 border border-dashed border-gray-600 hover:border-green-500/50 text-gray-300 hover:text-green-400 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                  title="Tambah field qty dan harga beli untuk harga berbeda"
                >
                  <FiPlus className="w-3.5 h-3.5 text-green-400" />
                  <span>+ Tambah Pembelian Seed 2</span>
                </button>
              </div>

              {/* Total Seed 2 Ringkasan */}
              {(totalSeed2Qty > 0 || totalSeed2Cost > 0) && (
                <div className="pt-2 border-t border-gray-700/60 flex items-center justify-between text-xs">
                  <span className="text-gray-300">
                    Total: <strong className="text-white">{formatNumber(totalSeed2Qty)} seeds</strong>
                  </span>
                  <span className="text-yellow-400 font-bold">
                    Biaya: {fmtWL(totalSeed2Cost)} WL
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Result Item & Indikator Hasil Splicing */}
          <div className="p-3 bg-gray-700/50 rounded-lg border border-gray-600/50 space-y-2">
            <div className="flex items-center gap-3">
              <div className="text-xl">➡️</div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-400 mb-1">Hasil Splicing</label>
                <ItemSearch
                  value={step.resultItemName}
                  onChange={(item) => handleItemSelect('resultItemName', item)}
                  placeholder="Cari hasil item..."
                />
              </div>
              {step.resultItemName && (
                <ItemIcon name={step.resultItemName} size={40} />
              )}
            </div>

            {/* Indikator Hasil Splicing (After Break) */}
            {results.seedsAfterHarvest > 0 && (
              <div className="flex items-center justify-between pt-2 border-t border-gray-600/40 text-xs">
                <span className="text-gray-300 flex items-center gap-1.5 font-medium">
                  🌱 Estimasi Seed Didapat (After Break):
                </span>
                <span className="text-green-400 font-bold text-sm bg-green-500/10 px-2.5 py-0.5 rounded border border-green-500/20">
                  {formatNumber(results.seedsAfterHarvest)} <span className="text-xs font-normal text-gray-400">seeds</span>
                </span>
              </div>
            )}
          </div>

          {/* Parameters Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-gray-400">Total Seeds Ditanam</label>
                {totalSeed1Qty > 0 && totalSeed2Qty > 0 && !step.seedsPlanted && (
                  <button
                    type="button"
                    onClick={() => handleFieldChange('seedsPlanted', Math.min(totalSeed1Qty, totalSeed2Qty))}
                    className="text-[10px] text-green-400 hover:underline"
                    title="Isi dengan min(Total Seed 1, Total Seed 2)"
                  >
                    Max: {formatNumber(Math.min(totalSeed1Qty, totalSeed2Qty))}
                  </button>
                )}
              </div>
              <input
                type="number"
                value={step.seedsPlanted || ''}
                onChange={(e) => handleFieldChange('seedsPlanted', parseInt(e.target.value) || 0)}
                placeholder={totalSeed1Qty > 0 && totalSeed2Qty > 0 ? `${Math.min(totalSeed1Qty, totalSeed2Qty)}` : '0'}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <p className="text-xs text-gray-500 mt-0.5">Jumlah pohon yang ditanam</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Seed Loss (%)</label>
              <input
                type="number"
                value={step.seedLossPercent || ''}
                onChange={(e) => handleFieldChange('seedLossPercent', parseFloat(e.target.value) || 0)}
                placeholder="21"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Hits per Block</label>
              <input
                type="number"
                value={step.hitsPerBlock || ''}
                onChange={(e) => handleFieldChange('hitsPerBlock', parseInt(e.target.value) || 1)}
                placeholder="4"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          {/* Fuel Pack */}
          <div className="p-3 bg-gray-700/30 rounded-lg border border-gray-600/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-300">Fuel Pack</span>
              {fuelCost > 0 && (
                <span className="text-xs text-yellow-400 font-medium">
                  Biaya Fuel: {fmtWL(fuelCost)} WL
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Qty Beli Fuel Pack</label>
                <input
                  type="number"
                  value={step.fuelNeeded || ''}
                  onChange={(e) => handleFieldChange('fuelNeeded', parseInt(e.target.value) || 0)}
                  placeholder="Jumlah fuel pack dibeli"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Harga Beli Fuel Pack</label>
                <PriceInput
                  price={step.fuelPrice || step.fuelCostPerUnit || ''}
                  priceFormat={step.fuelPriceFormat || 'perWL'}
                  onPriceChange={(v) => {
                    onUpdate({
                      ...step,
                      fuelPrice: v,
                      fuelCostPerUnit: v,
                    });
                  }}
                  onFormatChange={(v) => handleFieldChange('fuelPriceFormat', v)}
                />
              </div>
            </div>
          </div>

          {/* TM Configuration */}
          <div className="p-3 bg-gray-700/30 rounded-lg border border-gray-600/30">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FiCpu className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-medium text-white">Tesseract Manipulator</span>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={step.useTM}
                  onChange={(e) => handleFieldChange('useTM', e.target.checked)}
                  className="w-4 h-4 text-green-500 bg-gray-700 border-gray-600 rounded focus:ring-green-500"
                />
                <span className="text-sm text-gray-300">Gunakan TM</span>
              </label>
            </div>

            {step.useTM && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Jumlah TM</label>
                  <input
                    type="number"
                    value={step.tmCount || ''}
                    onChange={(e) => handleFieldChange('tmCount', Math.max(1, parseInt(e.target.value) || 1))}
                    min="1"
                    placeholder="8"
                    className="w-32 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Estimasi Harvest Block TM, Waktu Break & Kebutuhan Gems */}
                <div className="p-3 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 border border-blue-500/30 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-blue-300 flex items-center gap-1.5">
                      ⚡ Estimasi Block & Kebutuhan TM
                    </span>
                    <span className="text-[11px] text-gray-300 bg-gray-800/80 px-2 py-0.5 rounded">
                      Acuan: {step.hitsPerBlock || 1} Hits/Block • {step.tmCount || 1} TM
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    {/* Field 1: Statis (dari sistem) */}
                    <div>
                      <label className="block text-[11px] font-medium text-gray-400 mb-1">
                        Seeds Ditanam (Pohon)
                      </label>
                      <input
                        type="text"
                        readOnly
                        value={step.seedsPlanted > 0 ? `${formatNumber(step.seedsPlanted)} seeds` : '0 seeds'}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-blue-400 font-bold text-sm cursor-not-allowed select-none"
                        title="Nilai statis dari Total Seeds Ditanam di step ini"
                      />
                      <p className="text-[10px] text-gray-500 mt-0.5">Statis (dari sistem)</p>
                    </div>

                    {/* Field 2: Acuan (Block per Tree) - Manual */}
                    <div>
                      <label className="block text-[11px] font-medium text-gray-400 mb-1">
                        Acuan (Block per Tree)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={step.tmBlockMultiplier ?? 2.77}
                        onChange={(e) => handleFieldChange('tmBlockMultiplier', parseFloat(e.target.value) || 0)}
                        placeholder="Misal: 2.77"
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-[10px] text-gray-500 mt-0.5">Manual (misal: 2.77)</p>
                    </div>
                  </div>

                  {/* Hasil Estimasi: Block, Gems, dan Waktu Break */}
                  {results.tmEstimatedBlocks > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                      {/* Estimasi Block */}
                      <div className="p-2.5 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                        <p className="text-[11px] text-yellow-300 font-medium">Estimasi Block TM</p>
                        <p className="text-base font-bold text-yellow-400">
                          {formatNumber(results.tmEstimatedBlocks)} <span className="text-xs font-normal text-gray-400">blocks</span>
                        </p>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          ≈ {formatNumber(Math.ceil(results.tmEstimatedBlocks / (step.tmCount || 1)))} block/TM
                        </p>
                      </div>

                      {/* Estimasi Gems */}
                      <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/20 rounded-lg flex flex-col justify-between">
                        <div>
                          <p className="text-[11px] text-cyan-300 font-medium">Estimasi Gems</p>
                          <p className="text-base font-bold text-cyan-400">
                            {formatNumber(results.tmGemsNeeded)} <span className="text-xs font-normal text-gray-400">gems</span>
                          </p>
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            {step.hitsPerBlock || 1} hits/block (1 hit = 1 gem)
                          </p>
                        </div>
                        {step.tmGemsAmount !== results.tmGemsNeeded && (
                          <button
                            type="button"
                            onClick={() => handleFieldChange('tmGemsAmount', results.tmGemsNeeded)}
                            className="mt-1.5 px-2 py-1 bg-cyan-600 hover:bg-cyan-700 text-white rounded text-[10px] font-medium transition-colors w-fit shadow-sm"
                            title="Salin jumlah gems ini ke field Modal Beli Gems di bawah"
                          >
                            ➔ Gunakan di Modal Gems
                          </button>
                        )}
                      </div>

                      {/* Estimasi Waktu Break */}
                      <div className="p-2.5 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                        <p className="text-[11px] text-purple-300 font-medium flex items-center gap-1">
                          <FiClock className="w-3 h-3 text-purple-400" /> Waktu Break TM
                        </p>
                        <p className="text-base font-bold text-purple-300">
                          {results.tmBreakTime?.formatted || '0 detik'}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          ~1.5 dtk/hit paralel di {step.tmCount || 1} TM
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Modal Beli Gems untuk Bahan Bakar TM */}
                <div className="pt-3 border-t border-gray-600/30">
                  <p className="text-xs font-semibold text-gray-300 mb-2">
                    Modal Beli Gems (Bahan Bakar TM)
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-medium text-gray-400">Gems</label>
                        {results.tmGemsNeeded > 0 && step.tmGemsAmount !== results.tmGemsNeeded && (
                          <button
                            type="button"
                            onClick={() => handleFieldChange('tmGemsAmount', results.tmGemsNeeded)}
                            className="text-[10px] text-cyan-400 hover:underline"
                            title="Isi dengan estimasi gems TM"
                          >
                            Pakai Estimasi: {formatNumber(results.tmGemsNeeded)}
                          </button>
                        )}
                      </div>
                      <input
                        type="number"
                        value={step.tmGemsAmount || ''}
                        onChange={(e) => handleFieldChange('tmGemsAmount', parseInt(e.target.value) || 0)}
                        placeholder="Contoh: 50000"
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-[11px] text-gray-500 mt-0.5">Jumlah gems yang dibeli</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">WL</label>
                      <input
                        type="number"
                        value={step.tmGemsCostWL || ''}
                        onChange={(e) => handleFieldChange('tmGemsCostWL', parseFloat(e.target.value) || 0)}
                        placeholder="Contoh: 25"
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-[11px] text-gray-500 mt-0.5">Modal gems (masuk hitungan keuangan)</p>
                    </div>
                  </div>
                  {step.tmGemsCostWL > 0 && (
                    <p className="text-xs text-yellow-400 mt-1.5">
                      Modal Gems TM: {fmtWL(step.tmGemsCostWL)} WL
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Step Results Summary */}
          {step.seedsPlanted > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-gray-700/30 rounded-lg text-center">
                <p className="text-xs text-gray-400">Seeds Sisa (After Break)</p>
                <p className="text-lg font-bold text-green-400">{formatNumber(results.seedsAfterHarvest)}</p>
              </div>
              <div className="p-3 bg-gray-700/30 rounded-lg text-center">
                <p className="text-xs text-gray-400">Biaya Step</p>
                <p className="text-lg font-bold text-red-400">{fmtWL(results.totalCostWL)} WL</p>
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Catatan</label>
            <input
              type="text"
              value={step.notes}
              onChange={(e) => handleFieldChange('notes', e.target.value)}
              placeholder="Catatan opsional..."
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Tambahan Pembelian Seed */}
      <ConfirmModal
        isOpen={Boolean(extraToDelete)}
        onClose={() => setExtraToDelete(null)}
        onConfirm={() => {
          if (extraToDelete) {
            if (extraToDelete.slot === 'seed1') {
              handleRemoveSeed1Extra(extraToDelete.id);
            } else {
              handleRemoveSeed2Extra(extraToDelete.id);
            }
          }
        }}
        title="Hapus Tambahan Pembelian?"
        message={`Apakah Anda yakin ingin menghapus batch Tambahan #${extraToDelete?.index} (${formatNumber(extraToDelete?.qty || 0)} seeds @ ${extraToDelete?.price || 0} ${extraToDelete?.priceFormat === 'each' ? 'WL each' : '/ WL'}) untuk ${extraToDelete?.seedName || 'seed ini'}?`}
        confirmText="Ya, Hapus"
        cancelText="Batal"
      />
    </div>
  );
}
