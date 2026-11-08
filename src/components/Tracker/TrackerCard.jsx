import { useState } from 'react';
import ItemIcon from '../Common/ItemIcon';
import ItemSearch from '../Common/ItemSearch';
import ConfirmModal from '../Common/ConfirmModal';
import { fmtWL, calculateCost } from '../../utils/calculations';
import { useLanguage } from '../../i18n/LanguageContext';
import { FiTrash2, FiPlus, FiEdit2, FiCheck, FiX, FiSend, FiClock } from 'react-icons/fi';

export default function TrackerCard({
  card,
  onUpdate,
  onDelete,
  onApplyToPlanner,
  plannerSteps = [],
}) {
  const { t, formatNumberLocalized } = useLanguage();
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

  // Modal confirmation states
  const [purchaseToDelete, setPurchaseToDelete] = useState(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showDeleteCardConfirm, setShowDeleteCardConfirm] = useState(false);

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
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
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

  // Clear all purchases
  const handleClearPurchases = () => {
    onUpdate({
      ...card,
      purchases: [],
    });
    setShowResetConfirm(false);
  };

  // Group purchases by price & format for auto-categorization
  const groupedPurchases = (() => {
    const map = new Map();
    purchases.forEach((p) => {
      const price = parseFloat(p.price) || 0;
      const format = p.priceFormat || 'perWL';
      const key = `${price}_${format}`;
      if (!map.has(key)) {
        map.set(key, { price, priceFormat: format, qty: 0, count: 0, firstIndex: map.size });
      }
      const item = map.get(key);
      item.qty += parseInt(p.qty) || 0;
      item.count += 1;
    });
    return Array.from(map.values()).sort((a, b) => {
      if (b.qty !== a.qty) return b.qty - a.qty;
      return a.firstIndex - b.firstIndex;
    });
  })();

  // Handle Apply to Massing Planner
  const handleConfirmApply = () => {
    if (onApplyToPlanner) {
      onApplyToPlanner({
        cardId: card.id,
        cardName: card.name,
        totalQty,
        totalCostWL,
        purchases,
        groupedPurchases,
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
    <div className="bg-gray-800 border border-gray-700/80 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between animate-fade-in">
      {/* Top Header Section */}
      <div className="p-4 bg-gray-750/50 border-b border-gray-700/70">
        {isEditing ? (
          <div className="space-y-2.5">
            <div>
              <label className="block text-[11px] font-medium text-gray-400 mb-1">{t('tracker_modal_item_label')}</label>
              <ItemSearch
                value={editName}
                onChange={(item) => setEditName(item ? item.name : '')}
                placeholder={t('common_search')}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-medium text-gray-400 mb-1">{t('tracker_modal_target_label')}</label>
                <input
                  type="number"
                  value={editTarget || ''}
                  onChange={(e) => setEditTarget(e.target.value)}
                  placeholder="2000"
                  className="w-full px-2.5 py-1.5 bg-gray-700 border border-gray-600 rounded-lg text-white text-xs focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-gray-400 mb-1">{t('tracker_modal_default_price')}</label>
                <div className="flex gap-1">
                  <input
                    type="number"
                    value={editPrice || ''}
                    onChange={(e) => setEditPrice(e.target.value)}
                    placeholder="3"
                    className="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded-lg text-white text-xs"
                  />
                  <select
                    value={editFormat}
                    onChange={(e) => setEditFormat(e.target.value)}
                    className="px-1.5 py-1.5 bg-gray-700 border border-gray-600 rounded-lg text-[11px] text-white"
                  >
                    <option value="perWL">{t('unit_per_wl')}</option>
                    <option value="each">{t('unit_wl_each')}</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-2.5 py-1 bg-gray-700 text-gray-300 rounded text-xs flex items-center gap-1"
              >
                <FiX className="w-3.5 h-3.5" /> {t('common_cancel')}
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold flex items-center gap-1"
              >
                <FiCheck className="w-3.5 h-3.5" /> {t('common_save')}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <ItemIcon name={card.name} size={38} className="rounded-lg shadow shrink-0" />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-white text-sm truncate">
                    {card.name || t('common_optional')}
                  </h3>
                  {isCompleted && (
                    <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 px-1.5 py-0.2 rounded border border-emerald-500/30">
                      {t('common_done')}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400">
                  Target: <strong className="text-gray-200">{formatNumberLocalized(targetQty)} {t('common_seeds')}</strong>
                  {card.defaultPrice > 0 && (
                    <span className="text-gray-400 ml-1.5">
                      • {card.defaultPrice} {card.defaultPriceFormat === 'each' ? t('unit_wl_each') : t('unit_per_wl')}
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
                className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700/70 rounded-lg transition-colors"
                title={t('common_edit')}
              >
                <FiEdit2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteCardConfirm(true)}
                className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                title={t('common_delete')}
              >
                <FiTrash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Progress Bar & Counter */}
        {!isEditing && (
          <div className="mt-3 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-300">
                {t('tracker_purchased')}: <strong className="text-emerald-400">{formatNumberLocalized(totalQty)}</strong>
                {targetQty > 0 && (
                  <span className="text-gray-400 font-normal"> / {formatNumberLocalized(targetQty)}</span>
                )}
              </span>
              <span className="font-bold text-white bg-gray-700 px-1.5 py-0.2 rounded text-[11px]">
                {progressPercent}%
              </span>
            </div>

            <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  isCompleted ? 'bg-emerald-500' : 'bg-gradient-to-r from-blue-500 to-emerald-500'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] pt-0.5">
              <span className={remaining > 0 ? 'text-yellow-400 font-medium' : 'text-emerald-400 font-semibold'}>
                {remaining > 0 ? `${t('tracker_remaining_seeds')} ${formatNumberLocalized(remaining)} ${t('common_seeds')}` : t('tracker_target_reached')}
              </span>
              <span className="text-gray-400">
                {t('common_cost')}: <strong className="text-yellow-400">{fmtWL(totalCostWL)} WL</strong>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Main Content: Add Purchase Form & Presets */}
      <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
        <form onSubmit={handleAddPurchase} className="space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-2">
            <div>
              <input
                type="number"
                value={inputQty}
                onChange={(e) => setInputQty(e.target.value)}
                placeholder={t('tracker_add_qty_placeholder')}
                className="w-full px-2.5 py-1.5 bg-gray-700/80 border border-gray-600 rounded-lg text-white font-semibold text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder-gray-500"
              />
            </div>

            <div className="flex gap-1">
              <input
                type="number"
                value={inputPrice}
                onChange={(e) => setInputPrice(e.target.value)}
                placeholder={t('common_price')}
                className="w-20 px-2 py-1.5 bg-gray-700/80 border border-gray-600 rounded-lg text-white text-xs text-center focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <select
                value={inputFormat}
                onChange={(e) => setInputFormat(e.target.value)}
                className="px-1.5 py-1.5 bg-gray-700/80 border border-gray-600 rounded-lg text-xs text-white focus:outline-none"
              >
                <option value="perWL">{t('unit_per_wl')}</option>
                <option value="each">{t('unit_wl_each')}</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={!inputQty || parseInt(inputQty) <= 0}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-lg text-xs transition-colors flex items-center justify-center gap-1 shadow-sm"
            >
              <FiPlus className="w-3.5 h-3.5" /> {t('common_add')}
            </button>
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            {[50, 100, 200, 500, 1000].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handlePresetClick(num)}
                className="px-2 py-0.5 bg-gray-700/70 hover:bg-gray-700 hover:text-white border border-gray-655 text-gray-300 rounded text-[11px] transition-colors font-medium active:scale-95"
              >
                +{formatNumberLocalized(num)}
              </button>
            ))}
            {remaining > 0 && remaining !== 50 && remaining !== 100 && remaining !== 200 && remaining !== 500 && (
              <button
                type="button"
                onClick={() => handlePresetClick(remaining)}
                className="px-2 py-0.5 bg-yellow-500/15 hover:bg-yellow-500/25 text-yellow-300 border border-yellow-500/30 rounded text-[11px] transition-colors font-semibold active:scale-95"
                title={t('tracker_remaining')}
              >
                {t('tracker_remaining')} ({formatNumberLocalized(remaining)})
              </button>
            )}
          </div>
        </form>

        {/* Purchase History */}
        <div className="pt-2 border-t border-gray-700/70 space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span className="font-semibold text-gray-300 flex items-center gap-1">
              <FiClock className="w-3.5 h-3.5 text-blue-400" />
              {t('tracker_history_title')} ({purchases.length})
            </span>
            {purchases.length > 0 && (
              <button
                type="button"
                onClick={() => setShowResetConfirm(true)}
                className="text-[11px] text-red-400 hover:underline"
              >
                {t('tracker_reset_history')}
              </button>
            )}
          </div>

          {purchases.length === 0 ? (
            <div className="p-2.5 bg-gray-750/30 rounded-lg text-center text-xs text-gray-500 border border-dashed border-gray-700">
              {t('tracker_no_history')}
            </div>
          ) : (
            <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin scrollbar-thumb-gray-600">
              {[...purchases].reverse().map((item, index) => {
                const cost = calculateCost(item.qty, item.price, item.priceFormat || 'perWL');
                const originalIndex = purchases.length - index;
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2 bg-gray-750/50 hover:bg-gray-750 rounded-lg text-xs border border-gray-700/60 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[10px] text-gray-400 font-bold bg-gray-800 px-1.5 py-0.5 rounded">
                        #{originalIndex}
                      </span>
                      <span className="font-bold text-emerald-400">
                        +{formatNumberLocalized(item.qty)}
                      </span>
                      {item.price > 0 && (
                        <span className="text-gray-400 text-[11px]">
                          @ {item.price} {item.priceFormat === 'each' ? t('unit_wl_each') : t('unit_per_wl')}
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
                        onClick={() => setPurchaseToDelete({ item, originalIndex })}
                        className="p-1 text-gray-400 hover:text-red-400 rounded transition-colors"
                        title={t('common_delete')}
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

        {/* Footer: Send to Massing Planner Button & Drawer */}
        <div className="pt-2 border-t border-gray-700/70">
          {!showApplyMenu ? (
            <button
              type="button"
              onClick={() => setShowApplyMenu(true)}
              disabled={totalQty === 0}
              className="w-full py-2 px-3 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              title={t('tracker_send_to_planner')}
            >
              <FiSend className="w-3.5 h-3.5 text-blue-400" />
              <span>{t('tracker_send_to_planner')}</span>
            </button>
          ) : (
            <div className="p-3 bg-blue-500/10 border border-blue-500/25 rounded-xl space-y-2.5 text-xs animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-blue-300 flex items-center gap-1.5">
                  <FiSend className="w-3.5 h-3.5" />
                  {t('tracker_send_modal_title')}
                </span>
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
                  <label className="block text-[10px] text-gray-400 mb-0.5">{t('tracker_select_step')}</label>
                  <select
                    value={selectedStepIndex}
                    onChange={(e) => setSelectedStepIndex(parseInt(e.target.value) || 0)}
                    className="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-xs text-white"
                  >
                    {(plannerSteps.length > 0 ? plannerSteps : [{ id: 'default', name: 'Step 1' }]).map(
                      (s, idx) => (
                        <option key={s.id || idx} value={idx}>
                          {t('common_step')} {idx + 1} {s.name ? `(${s.name})` : ''}
                        </option>
                      )
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 mb-0.5">{t('tracker_seed_position')}</label>
                  <select
                    value={selectedSeedSlot}
                    onChange={(e) => setSelectedSeedSlot(e.target.value)}
                    className="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-xs text-white"
                  >
                    <option value="seed1">{t('seed_1_label')}</option>
                    <option value="seed2">{t('seed_2_label')}</option>
                  </select>
                </div>
              </div>

              {/* Grouped Batches Preview */}
              {groupedPurchases.length > 0 && (
                <div className="p-2 bg-gray-800/80 rounded-lg space-y-1 text-[11px] border border-gray-700">
                  <span className="text-gray-400 block font-medium">{t('tracker_auto_category')}</span>
                  <div className="space-y-0.5">
                    <div className="flex justify-between text-emerald-400">
                      <span>• {t('tracker_primary_batch')} ({groupedPurchases[0].count} {t('tracker_times_bought')}):</span>
                      <span className="font-bold">
                        {formatNumberLocalized(groupedPurchases[0].qty)} @ {groupedPurchases[0].price} {groupedPurchases[0].priceFormat === 'each' ? t('unit_wl_each') : t('unit_per_wl')}
                      </span>
                    </div>
                    {groupedPurchases.slice(1).map((g, gIdx) => (
                      <div key={gIdx} className="flex justify-between text-yellow-400">
                        <span>• {t('tracker_extra_batch')} #{gIdx + 1} ({g.count} {t('tracker_times_bought')}):</span>
                        <span className="font-bold">
                          {formatNumberLocalized(g.qty)} @ {g.price} {g.priceFormat === 'each' ? t('unit_wl_each') : t('unit_per_wl')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-gray-400">
                  {t('common_total')}: <strong className="text-white">{formatNumberLocalized(totalQty)} {t('common_seeds')}</strong>
                </span>
                <button
                  type="button"
                  onClick={handleConfirmApply}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-xs transition-colors flex items-center gap-1 shadow-sm"
                >
                  <FiCheck className="w-3.5 h-3.5" />
                  <span>{applySuccess ? t('common_applied') : t('common_apply')}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal for Resetting Purchase History */}
      <ConfirmModal
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={handleClearPurchases}
        title={`${t('confirm_reset_history_title')} (${card.name})`}
        message={t('confirm_reset_history_msg')}
        confirmText={t('common_yes_delete')}
        cancelText={t('common_cancel')}
      />

      {/* Confirmation Modal for Deleting Tracker Card */}
      <ConfirmModal
        isOpen={showDeleteCardConfirm}
        onClose={() => setShowDeleteCardConfirm(false)}
        onConfirm={() => {
          onDelete(card.id);
          setShowDeleteCardConfirm(false);
        }}
        title={`${t('confirm_delete_tracker_title')} ("${card.name}")`}
        message={t('confirm_delete_tracker_msg')}
        confirmText={t('common_yes_delete')}
        cancelText={t('common_cancel')}
      />

      {/* Confirmation Modal for Deleting Individual Purchase */}
      <ConfirmModal
        isOpen={Boolean(purchaseToDelete)}
        onClose={() => setPurchaseToDelete(null)}
        onConfirm={() => {
          if (purchaseToDelete) {
            onUpdate({
              ...card,
              purchases: purchases.filter((p) => p.id !== purchaseToDelete.item.id),
            });
            setPurchaseToDelete(null);
          }
        }}
        title={t('confirm_delete_batch_title')}
        message={`${t('confirm_delete_batch_msg')} #${purchaseToDelete?.originalIndex} (+${formatNumberLocalized(purchaseToDelete?.item.qty || 0)} seeds @ ${purchaseToDelete?.item.price || 0} ${purchaseToDelete?.item.priceFormat === 'each' ? 'WL each' : '/WL'})?`}
        confirmText={t('common_yes_delete')}
        cancelText={t('common_cancel')}
      />
    </div>
  );
}
