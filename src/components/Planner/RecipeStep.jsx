import { useState } from 'react';
import ItemSearch from '../Common/ItemSearch';
import ItemIcon from '../Common/ItemIcon';
import ConfirmModal from '../Common/ConfirmModal';
import { calculateStep, fmtWL } from '../../utils/calculations';
import { useLanguage } from '../../i18n/LanguageContext';
import { FiTrash2, FiChevronDown, FiChevronUp, FiCpu, FiPlus, FiClock, FiCopy, FiCheck, FiArrowRight } from 'react-icons/fi';

function PriceInput({ price, priceFormat, onPriceChange, onFormatChange, placeholder }) {
  const { t } = useLanguage();
  return (
    <div className="flex gap-1.5 items-center">
      <div className="flex-1 min-w-[70px]">
        <input
          type="number"
          value={price || ''}
          onChange={(e) => onPriceChange(parseFloat(e.target.value) || 0)}
          placeholder={placeholder || t('common_price')}
          className="w-full px-2.5 py-1.5 bg-gray-700/80 border border-gray-600 rounded-lg text-white text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
      </div>
      <select
        value={priceFormat}
        onChange={(e) => onFormatChange(e.target.value)}
        className="px-2 py-1.5 bg-gray-700/80 border border-gray-600 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 min-w-[85px] cursor-pointer"
      >
        <option value="perWL">{t('unit_per_wl')}</option>
        <option value="each">{t('unit_wl_each')}</option>
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
  const { t, formatTimeLocalized, formatNumberLocalized } = useLanguage();
  const isExpanded = step.isExpanded !== undefined ? Boolean(step.isExpanded) : true;
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

  // Calculate costs for Seed 1
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

  // Calculate costs for Seed 2
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

  // Fuel Pack cost
  const fuelQty = step.fuelNeeded || 0;
  const fuelPrice = step.fuelPrice || step.fuelCostPerUnit || 0;
  const fuelPriceFormat = step.fuelPriceFormat || (step.fuelCostPerUnit > 0 ? 'each' : 'perWL');
  const fuelCost = fuelPrice > 0 && fuelQty > 0
    ? (fuelPriceFormat === 'each' ? fuelQty * fuelPrice : fuelQty / fuelPrice)
    : 0;

  // Localized TM break time
  const formattedBreakTime = results.tmBreakTime?.totalSeconds
    ? formatTimeLocalized(results.tmBreakTime.totalSeconds)
    : `0 ${t('time_seconds')}`;

  return (
    <div
      className={`border rounded-xl overflow-hidden transition-all duration-200 animate-fade-in shadow-sm ${
        step.isCompleted
          ? 'bg-gray-800/95 border-emerald-500/50 ring-1 ring-emerald-500/20'
          : 'bg-gray-800 border-gray-700/80 hover:border-gray-650'
      }`}
    >
      {/* Header */}
      <div
        className={`flex items-center justify-between px-4 py-3 cursor-pointer select-none transition-colors ${
          step.isCompleted ? 'bg-emerald-950/25 hover:bg-emerald-950/40' : 'bg-gray-800 hover:bg-gray-750/70'
        }`}
        onClick={() => handleFieldChange('isExpanded', !isExpanded)}
      >
        <div className="flex items-center gap-3 min-w-0">
          {/* Step Number Badge */}
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 transition-colors ${
              step.isCompleted
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
            }`}
          >
            {step.isCompleted ? <FiCheck className="w-3.5 h-3.5 stroke-[3]" /> : index + 1}
          </div>

          {/* Step Info */}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className={`text-sm font-semibold truncate ${step.isCompleted ? 'text-emerald-300' : 'text-white'}`}>
                {step.name || `${t('common_step')} ${index + 1}`}
              </h3>
              {step.isCompleted && (
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {t('common_done')}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 truncate flex items-center gap-1.5">
              <span>{step.resultItemName || t('common_optional')}</span>
              {step.useTM && (
                <>
                  <span className="text-gray-600">•</span>
                  <span className="text-blue-400 font-medium">{step.tmCount || 1} TM</span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Right Header: Actions */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Toggle Done Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleFieldChange('isCompleted', !step.isCompleted);
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all active:scale-95 ${
              step.isCompleted
                ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30'
                : 'bg-gray-700/60 border border-gray-600/70 text-gray-300 hover:text-white hover:bg-gray-700'
            }`}
            title={step.isCompleted ? t('common_unmark') : t('common_mark_done')}
          >
            <span
              className={`w-3.5 h-3.5 rounded flex items-center justify-center border transition-colors ${
                step.isCompleted
                  ? 'bg-emerald-500 border-emerald-400 text-white'
                  : 'border-gray-500 bg-gray-800'
              }`}
            >
              {step.isCompleted && <FiCheck className="w-2.5 h-2.5 stroke-[3]" />}
            </span>
            <span className="hidden sm:inline">
              {step.isCompleted ? t('common_done') : t('common_mark_done')}
            </span>
          </button>

          {onDuplicate && (
            <button
              onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
              className="p-1.5 text-gray-400 hover:text-amber-300 hover:bg-gray-700/70 rounded-lg transition-colors"
              title={t('common_duplicate')}
            >
              <FiCopy className="w-3.5 h-3.5" />
            </button>
          )}

          {!isOnly && (
            <button
              onClick={(e) => { e.stopPropagation(); onRemove(); }}
              className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              title={t('common_delete')}
            >
              <FiTrash2 className="w-3.5 h-3.5" />
            </button>
          )}

          <div className="p-1 text-gray-400">
            {isExpanded ? <FiChevronUp className="w-4 h-4" /> : <FiChevronDown className="w-4 h-4" />}
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-4 border-t border-gray-700/80 space-y-4">
          {/* Step Name Input */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">{t('step_name_label')}</label>
            <input
              type="text"
              value={step.name}
              onChange={(e) => handleFieldChange('name', e.target.value)}
              placeholder={t('step_name_placeholder')}
              className="w-full px-3 py-2 bg-gray-700/80 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Connect from Previous Step Prompt */}
          {prevStepSeeds > 0 && onApplyPrevStep && (
            <div className="flex items-center justify-between p-2.5 bg-blue-500/10 border border-blue-500/25 rounded-lg text-xs">
              <span className="text-blue-300">
                📦 {t('prev_step_result')} {index}: <strong className="text-white">{formatNumberLocalized(prevStepSeeds)} {t('common_seeds')}</strong>
              </span>
              <button
                type="button"
                onClick={() => onApplyPrevStep(prevStepSeeds)}
                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded font-medium transition-colors"
                title={t('use_in_this_step')}
              >
                {t('use_in_this_step')}
              </button>
            </div>
          )}

          {/* Splicing Recipe: Seed 1 & Seed 2 */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-3 items-stretch">
            {/* Seed 1 Card */}
            <div className="p-3 bg-gray-750/40 rounded-xl border border-gray-700/70 flex flex-col justify-between space-y-3">
              <div className="space-y-2.5">
                {/* Search Item */}
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">{t('seed_1_label')}</label>
                  <div className="flex items-center gap-2">
                    {step.seedName1 && (
                      <ItemIcon name={step.seedName1} size={36} className="rounded-lg shadow-sm shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <ItemSearch
                        value={step.seedName1}
                        onChange={(item) => handleItemSelect('seedName1', item)}
                        placeholder={t('seed_1_placeholder')}
                      />
                    </div>
                  </div>
                </div>

                {/* Primary Batch */}
                <div className="p-2.5 bg-gray-700/40 rounded-lg border border-gray-650/60 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-gray-300">
                      {t('primary_purchase')}
                    </span>
                    {primarySeed1Cost > 0 && (
                      <span className="text-yellow-400 font-semibold text-[11px]">
                        {fmtWL(primarySeed1Cost)} WL
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <input
                        type="number"
                        value={step.seed1Qty || ''}
                        onChange={(e) => handleFieldChange('seed1Qty', parseInt(e.target.value) || 0)}
                        placeholder={t('qty_seed_placeholder')}
                        className="w-full px-2.5 py-1.5 bg-gray-700/80 border border-gray-600 rounded-lg text-white text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <PriceInput
                        price={step.seed1Price}
                        priceFormat={step.seed1PriceFormat}
                        onPriceChange={(v) => handleFieldChange('seed1Price', v)}
                        onFormatChange={(v) => handleFieldChange('seed1PriceFormat', v)}
                        placeholder={t('common_price')}
                      />
                    </div>
                  </div>
                </div>

                {/* Dynamic Extra Batches */}
                {seed1ExtraList.map((extra, idx) => {
                  const extraCost = extra.price > 0 && extra.qty > 0
                    ? (extra.priceFormat === 'each' ? extra.qty * extra.price : extra.qty / extra.price)
                    : 0;
                  return (
                    <div key={extra.id} className="p-2.5 bg-gray-700/30 border border-gray-650/50 rounded-lg space-y-2 animate-fade-in">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-emerald-400 text-[11px]">
                          {t('extra_batch_title')} #{idx + 1}
                        </span>
                        <div className="flex items-center gap-2">
                          {extraCost > 0 && (
                            <span className="text-yellow-400 font-semibold text-[11px]">
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
                            title={t('common_delete')}
                          >
                            <FiTrash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="number"
                          value={extra.qty || ''}
                          onChange={(e) => handleUpdateSeed1Extra(extra.id, 'qty', parseInt(e.target.value) || 0)}
                          placeholder={t('qty_seed_placeholder')}
                          className="w-full px-2.5 py-1.5 bg-gray-700/80 border border-gray-600 rounded-lg text-white text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                        <PriceInput
                          price={extra.price}
                          priceFormat={extra.priceFormat || 'perWL'}
                          onPriceChange={(v) => handleUpdateSeed1Extra(extra.id, 'price', v)}
                          onFormatChange={(v) => handleUpdateSeed1Extra(extra.id, 'priceFormat', v)}
                          placeholder={t('common_price')}
                        />
                      </div>
                    </div>
                  );
                })}

                {/* Add Extra Batch Button */}
                <button
                  type="button"
                  onClick={handleAddSeed1Extra}
                  className="w-full py-1.5 px-2 bg-gray-700/30 hover:bg-gray-700/60 border border-dashed border-gray-600 text-gray-400 hover:text-emerald-400 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                >
                  <FiPlus className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{t('add_purchase_batch')} (Seed 1)</span>
                </button>
              </div>

              {/* Seed 1 Total Strip */}
              {(totalSeed1Qty > 0 || totalSeed1Cost > 0) && (
                <div className="pt-2 border-t border-gray-700/70 flex items-center justify-between text-xs">
                  <span className="text-gray-300">
                    {t('common_total')}: <strong className="text-white">{formatNumberLocalized(totalSeed1Qty)} {t('common_seeds')}</strong>
                  </span>
                  <span className="text-yellow-400 font-bold">
                    {fmtWL(totalSeed1Cost)} WL
                  </span>
                </div>
              )}
            </div>

            {/* Plus Divider */}
            <div className="flex items-center justify-center text-xl text-emerald-400 font-bold py-1 md:py-0 select-none">
              +
            </div>

            {/* Seed 2 Card */}
            <div className="p-3 bg-gray-750/40 rounded-xl border border-gray-700/70 flex flex-col justify-between space-y-3">
              <div className="space-y-2.5">
                {/* Search Item */}
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">{t('seed_2_label')}</label>
                  <div className="flex items-center gap-2">
                    {step.seedName2 && (
                      <ItemIcon name={step.seedName2} size={36} className="rounded-lg shadow-sm shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <ItemSearch
                        value={step.seedName2}
                        onChange={(item) => handleItemSelect('seedName2', item)}
                        placeholder={t('seed_2_placeholder')}
                      />
                    </div>
                  </div>
                </div>

                {/* Primary Batch */}
                <div className="p-2.5 bg-gray-700/40 rounded-lg border border-gray-650/60 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-gray-300">
                      {t('primary_purchase')}
                    </span>
                    {primarySeed2Cost > 0 && (
                      <span className="text-yellow-400 font-semibold text-[11px]">
                        {fmtWL(primarySeed2Cost)} WL
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <input
                        type="number"
                        value={step.seed2Qty || ''}
                        onChange={(e) => handleFieldChange('seed2Qty', parseInt(e.target.value) || 0)}
                        placeholder={t('qty_seed_placeholder')}
                        className="w-full px-2.5 py-1.5 bg-gray-700/80 border border-gray-600 rounded-lg text-white text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <PriceInput
                        price={step.seed2Price}
                        priceFormat={step.seed2PriceFormat}
                        onPriceChange={(v) => handleFieldChange('seed2Price', v)}
                        onFormatChange={(v) => handleFieldChange('seed2PriceFormat', v)}
                        placeholder={t('common_price')}
                      />
                    </div>
                  </div>
                </div>

                {/* Dynamic Extra Batches */}
                {seed2ExtraList.map((extra, idx) => {
                  const extraCost = extra.price > 0 && extra.qty > 0
                    ? (extra.priceFormat === 'each' ? extra.qty * extra.price : extra.qty / extra.price)
                    : 0;
                  return (
                    <div key={extra.id} className="p-2.5 bg-gray-700/30 border border-gray-650/50 rounded-lg space-y-2 animate-fade-in">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-emerald-400 text-[11px]">
                          {t('extra_batch_title')} #{idx + 1}
                        </span>
                        <div className="flex items-center gap-2">
                          {extraCost > 0 && (
                            <span className="text-yellow-400 font-semibold text-[11px]">
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
                            title={t('common_delete')}
                          >
                            <FiTrash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="number"
                          value={extra.qty || ''}
                          onChange={(e) => handleUpdateSeed2Extra(extra.id, 'qty', parseInt(e.target.value) || 0)}
                          placeholder={t('qty_seed_placeholder')}
                          className="w-full px-2.5 py-1.5 bg-gray-700/80 border border-gray-600 rounded-lg text-white text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                        <PriceInput
                          price={extra.price}
                          priceFormat={extra.priceFormat || 'perWL'}
                          onPriceChange={(v) => handleUpdateSeed2Extra(extra.id, 'price', v)}
                          onFormatChange={(v) => handleUpdateSeed2Extra(extra.id, 'priceFormat', v)}
                          placeholder={t('common_price')}
                        />
                      </div>
                    </div>
                  );
                })}

                {/* Add Extra Batch Button */}
                <button
                  type="button"
                  onClick={handleAddSeed2Extra}
                  className="w-full py-1.5 px-2 bg-gray-700/30 hover:bg-gray-700/60 border border-dashed border-gray-600 text-gray-400 hover:text-emerald-400 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                >
                  <FiPlus className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{t('add_purchase_batch')} (Seed 2)</span>
                </button>
              </div>

              {/* Seed 2 Total Strip */}
              {(totalSeed2Qty > 0 || totalSeed2Cost > 0) && (
                <div className="pt-2 border-t border-gray-700/70 flex items-center justify-between text-xs">
                  <span className="text-gray-300">
                    {t('common_total')}: <strong className="text-white">{formatNumberLocalized(totalSeed2Qty)} {t('common_seeds')}</strong>
                  </span>
                  <span className="text-yellow-400 font-bold">
                    {fmtWL(totalSeed2Cost)} WL
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Result Item Card */}
          <div className="p-3 bg-gray-750/30 rounded-xl border border-gray-700/60 space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-400 flex-shrink-0">
                <FiArrowRight className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <ItemSearch
                  value={step.resultItemName}
                  onChange={(item) => handleItemSelect('resultItemName', item)}
                  placeholder={t('splicing_result_header')}
                />
              </div>
              {step.resultItemName && (
                <ItemIcon name={step.resultItemName} size={36} className="rounded-lg shadow-sm shrink-0" />
              )}
            </div>

            {results.seedsAfterHarvest > 0 && (
              <div className="flex items-center justify-between pt-2 border-t border-gray-700/50 text-xs">
                <span className="text-gray-400 font-medium">
                  {t('estimated_seeds_harvest')}
                </span>
                <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  {formatNumberLocalized(results.seedsAfterHarvest)} {t('common_seeds')}
                </span>
              </div>
            )}
          </div>

          {/* Parameters Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-gray-400">{t('trees_planted_label')}</label>
                {totalSeed1Qty > 0 && totalSeed2Qty > 0 && !step.seedsPlanted && (
                  <button
                    type="button"
                    onClick={() => handleFieldChange('seedsPlanted', Math.min(totalSeed1Qty, totalSeed2Qty))}
                    className="text-[10px] text-emerald-400 hover:underline"
                  >
                    Max: {formatNumberLocalized(Math.min(totalSeed1Qty, totalSeed2Qty))}
                  </button>
                )}
              </div>
              <input
                type="number"
                value={step.seedsPlanted || ''}
                onChange={(e) => handleFieldChange('seedsPlanted', parseInt(e.target.value) || 0)}
                placeholder={totalSeed1Qty > 0 && totalSeed2Qty > 0 ? `${Math.min(totalSeed1Qty, totalSeed2Qty)}` : '0'}
                className="w-full px-3 py-2 bg-gray-700/80 border border-gray-600 rounded-lg text-white text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">{t('seed_loss_label')}</label>
              <input
                type="number"
                value={step.seedLossPercent || ''}
                onChange={(e) => handleFieldChange('seedLossPercent', parseFloat(e.target.value) || 0)}
                placeholder="21"
                className="w-full px-3 py-2 bg-gray-700/80 border border-gray-600 rounded-lg text-white text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">{t('hits_per_block_label')}</label>
              <input
                type="number"
                value={step.hitsPerBlock || ''}
                onChange={(e) => handleFieldChange('hitsPerBlock', parseInt(e.target.value) || 1)}
                placeholder="4"
                className="w-full px-3 py-2 bg-gray-700/80 border border-gray-600 rounded-lg text-white text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Fuel Pack Card */}
          <div className="p-3 bg-gray-750/30 rounded-xl border border-gray-700/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-300">{t('fuel_pack_title')}</span>
              {fuelCost > 0 && (
                <span className="text-xs text-yellow-400 font-semibold">
                  {t('fuel_cost_label')} {fmtWL(fuelCost)} WL
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <input
                  type="number"
                  value={step.fuelNeeded || ''}
                  onChange={(e) => handleFieldChange('fuelNeeded', parseInt(e.target.value) || 0)}
                  placeholder={t('fuel_qty_placeholder')}
                  className="w-full px-3 py-1.5 bg-gray-700/80 border border-gray-600 rounded-lg text-white text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div>
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
                  placeholder={t('fuel_price_placeholder')}
                />
              </div>
            </div>
          </div>

          {/* Tesseract Manipulator (TM) Section */}
          <div className="p-3.5 bg-gray-750/30 rounded-xl border border-gray-700/60 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FiCpu className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-semibold text-white">{t('tm_title')}</span>
              </div>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={step.useTM}
                  onChange={(e) => handleFieldChange('useTM', e.target.checked)}
                  className="w-4 h-4 text-emerald-500 bg-gray-700 border-gray-600 rounded focus:ring-emerald-500 cursor-pointer"
                />
                <span className="text-xs text-gray-300">{t('tm_use_checkbox')}</span>
              </label>
            </div>

            {step.useTM && (
              <div className="space-y-3 pt-1">
                {/* TM Configuration Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">{t('tm_count_label')}</label>
                    <input
                      type="number"
                      value={step.tmCount || ''}
                      onChange={(e) => handleFieldChange('tmCount', Math.max(1, parseInt(e.target.value) || 1))}
                      min="1"
                      placeholder="8"
                      className="w-full px-3 py-1.5 bg-gray-700/80 border border-gray-600 rounded-lg text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">{t('tm_ratio_label')}</label>
                    <input
                      type="number"
                      step="0.01"
                      value={step.tmBlockMultiplier ?? 2.77}
                      onChange={(e) => handleFieldChange('tmBlockMultiplier', parseFloat(e.target.value) || 0)}
                      placeholder="2.77"
                      className="w-full px-3 py-1.5 bg-gray-700/80 border border-gray-600 rounded-lg text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* TM Output Stats (Block, Gems, Break Time) */}
                {results.tmEstimatedBlocks > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {/* Block Card */}
                    <div className="p-2.5 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                      <span className="text-[11px] text-yellow-300 font-medium block mb-0.5">{t('tm_est_blocks')}</span>
                      <p className="text-base font-bold text-yellow-400">
                        {formatNumberLocalized(results.tmEstimatedBlocks)} {t('common_blocks')}
                      </p>
                      <span className="text-[10px] text-gray-400 block mt-0.5">
                        ≈ {formatNumberLocalized(Math.ceil(results.tmEstimatedBlocks / (step.tmCount || 1)))} / TM
                      </span>
                    </div>

                    {/* Gems Card */}
                    <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/20 rounded-lg flex flex-col justify-between">
                      <div>
                        <span className="text-[11px] text-cyan-300 font-medium block mb-0.5">{t('tm_gems_needed')}</span>
                        <p className="text-base font-bold text-cyan-400">
                          {formatNumberLocalized(results.tmGemsNeeded)} {t('common_gems')}
                        </p>
                      </div>
                      {step.tmGemsAmount !== results.tmGemsNeeded && (
                        <button
                          type="button"
                          onClick={() => handleFieldChange('tmGemsAmount', results.tmGemsNeeded)}
                          className="mt-1 px-2 py-0.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-[10px] font-medium transition-colors w-fit"
                        >
                          {t('tm_copy_to_modal')}
                        </button>
                      )}
                    </div>

                    {/* Break Time Card */}
                    <div className="p-2.5 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                      <span className="text-[11px] text-purple-300 font-medium flex items-center gap-1 mb-0.5">
                        <FiClock className="w-3 h-3 text-purple-400" /> {t('tm_break_time')}
                      </span>
                      <p className="text-sm font-bold text-purple-300">
                        {formattedBreakTime}
                      </p>
                      <span className="text-[10px] text-gray-400 block mt-0.5">
                        {step.tmCount || 1} {t('tm_parallel_suffix')}
                      </span>
                    </div>
                  </div>
                )}

                {/* Modal Beli Gems */}
                <div className="pt-2 border-t border-gray-700/60 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-gray-300">{t('tm_modal_title')}</span>
                    {step.tmGemsCostWL > 0 && (
                      <span className="text-yellow-400 font-semibold">
                        {fmtWL(step.tmGemsCostWL)} WL
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <input
                        type="number"
                        value={step.tmGemsAmount || ''}
                        onChange={(e) => handleFieldChange('tmGemsAmount', parseInt(e.target.value) || 0)}
                        placeholder={t('tm_gems_amount_placeholder')}
                        className="w-full px-3 py-1.5 bg-gray-700/80 border border-gray-600 rounded-lg text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <input
                        type="number"
                        value={step.tmGemsCostWL || ''}
                        onChange={(e) => handleFieldChange('tmGemsCostWL', parseFloat(e.target.value) || 0)}
                        placeholder={t('tm_gems_wl_placeholder')}
                        className="w-full px-3 py-1.5 bg-gray-700/80 border border-gray-600 rounded-lg text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Step Results Summary */}
          {step.seedsPlanted > 0 && (
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="p-3 bg-gray-750/50 rounded-xl border border-gray-700/60 text-center">
                <span className="text-[11px] text-gray-400 block mb-0.5">{t('step_remaining_seeds')}</span>
                <span className="text-base font-bold text-emerald-400">{formatNumberLocalized(results.seedsAfterHarvest)}</span>
              </div>
              <div className="p-3 bg-gray-750/50 rounded-xl border border-gray-700/60 text-center">
                <span className="text-[11px] text-gray-400 block mb-0.5">{t('step_cost')}</span>
                <span className="text-base font-bold text-red-400">{fmtWL(results.totalCostWL)} WL</span>
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">{t('step_notes_label')}</label>
            <input
              type="text"
              value={step.notes}
              onChange={(e) => handleFieldChange('notes', e.target.value)}
              placeholder={t('step_notes_placeholder')}
              className="w-full px-3 py-2 bg-gray-700/80 border border-gray-600 rounded-lg text-white text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>
      )}

      {/* Confirmation Modal for Extra Purchase Deletion */}
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
        title={t('confirm_delete_batch_title')}
        message={`${t('confirm_delete_batch_msg')} (${extraToDelete?.qty || 0} seeds @ ${extraToDelete?.price || 0} ${extraToDelete?.priceFormat === 'each' ? 'WL each' : '/ WL'})?`}
        confirmText={t('common_yes_delete')}
        cancelText={t('common_cancel')}
      />
    </div>
  );
}
