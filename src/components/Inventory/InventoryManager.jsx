import { useState } from 'react';
import { useInventory } from '../../hooks/useLocalStorage';
import ItemSearch from '../Common/ItemSearch';
import ItemIcon from '../Common/ItemIcon';
import ConfirmModal from '../Common/ConfirmModal';
import { fmtWL } from '../../utils/calculations';
import { useLanguage } from '../../i18n/LanguageContext';
import { FiPlus, FiTrash2, FiEdit3, FiShoppingCart, FiPackage, FiDollarSign, FiX, FiCheck, FiArrowDown, FiArrowUp } from 'react-icons/fi';

export default function InventoryManager() {
  const { t, formatNumberLocalized, language } = useLanguage();
  const { items, transactions, addTransaction, removeItem, updateItem, removeTransaction, getTotalAssetValue } = useInventory();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [txToDelete, setTxToDelete] = useState(null);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');

  // New transaction form
  const [txForm, setTxForm] = useState({
    type: 'buy',
    itemName: '',
    quantity: 0,
    price: 0,
    priceFormat: 'perWL',
    icon: '',
    notes: '',
  });

  const calcTxTotal = () => {
    if (!txForm.price || txForm.price <= 0 || !txForm.quantity) return 0;
    if (txForm.priceFormat === 'each') return txForm.quantity * txForm.price;
    return txForm.quantity / txForm.price;
  };

  const handleAddTransaction = () => {
    if (!txForm.itemName || txForm.quantity <= 0) return;
    addTransaction({
      ...txForm,
      pricePerWL: txForm.priceFormat === 'perWL' ? txForm.price : 0,
      totalWL: calcTxTotal(),
    });
    setTxForm({ type: 'buy', itemName: '', quantity: 0, price: 0, priceFormat: 'perWL', icon: '', notes: '' });
    setShowAddModal(false);
  };

  const handleItemSelect = (item) => {
    if (item) {
      setTxForm(prev => ({ ...prev, itemName: item.name, icon: item.name }));
    }
  };

  const totalAsset = getTotalAssetValue();

  const sortedItems = [...items].sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'quantity') return b.quantity - a.quantity;
    if (sortBy === 'value') {
      const aVal = a.price > 0 ? (a.priceFormat === 'each' ? a.quantity * a.price : a.quantity / a.price) : 0;
      const bVal = b.price > 0 ? (b.priceFormat === 'each' ? b.quantity * b.price : b.quantity / b.price) : 0;
      return bVal - aVal;
    }
    return 0;
  });

  const filteredTransactions = transactions.filter(tx => {
    if (filter === 'all') return true;
    return tx.type === filter;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-800 border border-gray-700 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <FiPackage className="w-5 h-5 text-blue-400" />
            <span className="text-xs font-semibold text-gray-400">{t('inv_total_items')}</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-white">{items.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">{formatNumberLocalized(items.reduce((s, i) => s + i.quantity, 0))} {t('inv_total_units')}</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <FiDollarSign className="w-5 h-5 text-emerald-400" />
            <span className="text-xs font-semibold text-gray-400">{t('inv_total_asset')}</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-emerald-400">{fmtWL(totalAsset)} WL</p>
          <p className="text-xs text-gray-500 mt-0.5">{t('inv_based_on_buy')}</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <FiShoppingCart className="w-5 h-5 text-yellow-400" />
            <span className="text-xs font-semibold text-gray-400">{t('inv_total_transactions')}</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-white">{transactions.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {transactions.filter(tItem => tItem.type === 'buy').length} {t('inv_filter_buy').toLowerCase()} • {transactions.filter(tItem => tItem.type === 'sell').length} {t('inv_filter_sell').toLowerCase()} • {transactions.filter(tItem => tItem.type === 'use').length} {t('inv_filter_use').toLowerCase()}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inventory List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <FiPackage className="text-blue-400" />
              {t('inv_title')}
            </h2>
            <div className="flex items-center gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-2.5 py-1.5 bg-gray-700 border border-gray-600 rounded-lg text-xs text-white focus:outline-none"
              >
                <option value="name">{t('inv_sort_name')}</option>
                <option value="quantity">{t('inv_sort_qty')}</option>
                <option value="value">{t('inv_sort_value')}</option>
              </select>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm"
              >
                <FiPlus className="w-3.5 h-3.5" /> {t('inv_btn_transaction')}
              </button>
            </div>
          </div>

          {sortedItems.length === 0 ? (
            <div className="bg-gray-800 border border-gray-700 rounded-2xl p-8 text-center space-y-1">
              <FiPackage className="w-10 h-10 text-gray-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-gray-300">{t('inv_empty_title')}</p>
              <p className="text-xs text-gray-500">{t('inv_empty_desc')}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {sortedItems.map((item) => {
                const itemValue = item.price > 0
                  ? (item.priceFormat === 'each' ? item.quantity * item.price : item.quantity / item.price)
                  : 0;
                return (
                  <div key={item.id} className="bg-gray-800 border border-gray-700 rounded-xl p-3 flex items-center gap-3">
                    <ItemIcon name={item.icon || item.name} size={38} className="rounded-lg shadow shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{item.name}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span>{t('common_qty')}: <span className="text-white font-medium">{formatNumberLocalized(item.quantity)}</span></span>
                        {item.price > 0 && (
                          <span>{t('inv_rate')} <span className="text-yellow-400">
                            {item.priceFormat === 'each' ? `${fmtWL(item.price)} ${t('unit_wl_each')}` : `${fmtWL(item.price)}${t('unit_per_wl')}`}
                          </span></span>
                        )}
                        {itemValue > 0 && (
                          <span>{t('inv_value')} <span className="text-emerald-400 font-semibold">{fmtWL(itemValue)} WL</span></span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditingItem(item)}
                        className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                        title={t('common_edit')}
                      >
                        <FiEdit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setItemToDelete(item)}
                        className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        title={t('common_delete')}
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Transaction Log */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <FiShoppingCart className="text-yellow-400" />
              {t('inv_tx_log')}
            </h2>
            <div className="flex items-center gap-1 bg-gray-800 p-1 rounded-xl border border-gray-700">
              {['all', 'buy', 'sell', 'use'].map((f) => {
                const label = f === 'all' ? t('inv_filter_all') : f === 'buy' ? t('inv_filter_buy') : f === 'sell' ? t('inv_filter_sell') : t('inv_filter_use');
                return (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                      filter === f
                        ? 'bg-emerald-600 text-white'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {filteredTransactions.length === 0 ? (
            <div className="bg-gray-800 border border-gray-700 rounded-2xl p-8 text-center space-y-1">
              <FiShoppingCart className="w-10 h-10 text-gray-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-gray-300">{t('inv_no_transactions')}</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {filteredTransactions.map((tx) => (
                <div key={tx.id} className="bg-gray-800 border border-gray-700 rounded-xl p-3 flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    tx.type === 'buy' ? 'bg-red-500/20 text-red-400' :
                    tx.type === 'sell' ? 'bg-emerald-500/20 text-emerald-400' :
                    'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {tx.type === 'buy' ? <FiArrowDown className="w-4 h-4" /> :
                     tx.type === 'sell' ? <FiArrowUp className="w-4 h-4" /> :
                     <FiPackage className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold uppercase ${
                        tx.type === 'buy' ? 'bg-red-500/20 text-red-400' :
                        tx.type === 'sell' ? 'bg-emerald-500/20 text-emerald-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {tx.type === 'buy' ? t('inv_filter_buy') : tx.type === 'sell' ? t('inv_filter_sell') : t('inv_filter_use')}
                      </span>
                      <span className="text-sm font-semibold text-white truncate">{tx.itemName}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                      <span>x{formatNumberLocalized(tx.quantity)}</span>
                      {tx.price > 0 && <span>{tx.priceFormat === 'each' ? `${fmtWL(tx.price)} ${t('unit_wl_each')}` : `${fmtWL(tx.price)}${t('unit_per_wl')}`}</span>}
                      {tx.totalWL > 0 && <span className="text-yellow-400 font-semibold">{fmtWL(tx.totalWL)} WL</span>}
                      <span>{new Date(tx.date).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    {tx.notes && <p className="text-xs text-gray-500 mt-0.5">{tx.notes}</p>}
                  </div>
                  <button
                    onClick={() => setTxToDelete(tx)}
                    className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    title={t('common_delete')}
                  >
                    <FiTrash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Transaction Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl max-w-md w-full p-5 sm:p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-bold text-white">{t('inv_modal_tx_title')}</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-white p-1 rounded-lg">
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Type Selector */}
            <div className="flex gap-2">
              {[
                { value: 'buy', label: t('inv_filter_buy'), color: '#dc2626' },
                { value: 'sell', label: t('inv_filter_sell'), color: '#10b981' },
                { value: 'use', label: t('inv_filter_use'), color: '#f59e0b' },
              ].map(({ value, label, color }) => (
                <button
                  key={value}
                  onClick={() => setTxForm(prev => ({ ...prev, type: value }))}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    txForm.type === value
                      ? 'text-white shadow-sm'
                      : 'bg-gray-700 text-gray-400 hover:text-white'
                  }`}
                  style={txForm.type === value ? { backgroundColor: color } : {}}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Item Search */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">{t('tracker_modal_item_label')}</label>
              <ItemSearch
                value={txForm.itemName}
                onChange={handleItemSelect}
                placeholder={t('common_search')}
              />
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">{t('common_qty')}</label>
              <input
                type="number"
                value={txForm.quantity || ''}
                onChange={(e) => setTxForm(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                placeholder="0"
                className="w-full px-3 py-1.5 bg-gray-700 border border-gray-600 rounded-lg text-white text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* Price */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">{t('common_price')}</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={txForm.price || ''}
                  onChange={(e) => setTxForm(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                  placeholder={txForm.priceFormat === 'perWL' ? '200' : '3'}
                  className="flex-1 px-3 py-1.5 bg-gray-700 border border-gray-600 rounded-lg text-white text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <select
                  value={txForm.priceFormat}
                  onChange={(e) => setTxForm(prev => ({ ...prev, priceFormat: e.target.value }))}
                  className="px-2 py-1.5 bg-gray-700 border border-gray-600 rounded-lg text-xs text-white focus:outline-none min-w-[95px]"
                >
                  <option value="perWL">{t('unit_per_wl')}</option>
                  <option value="each">{t('unit_wl_each')}</option>
                </select>
              </div>
              {txForm.price > 0 && txForm.quantity > 0 && (
                <p className="text-xs text-yellow-400 mt-1">
                  {t('common_total')}: {fmtWL(calcTxTotal())} WL
                </p>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">{t('step_notes_label')}</label>
              <input
                type="text"
                value={txForm.notes}
                onChange={(e) => setTxForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder={t('step_notes_placeholder')}
                className="w-full px-3 py-1.5 bg-gray-700 border border-gray-600 rounded-lg text-white text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* Submit */}
            <button
              onClick={handleAddTransaction}
              disabled={!txForm.itemName || txForm.quantity <= 0}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-sm"
            >
              <FiCheck className="w-4 h-4" />
              {t('inv_modal_tx_title')}
            </button>
          </div>
        </div>
      )}

      {/* Edit Item Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl max-w-md w-full p-5 sm:p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-bold text-white">{t('common_edit')} {editingItem.name}</h2>
              <button onClick={() => setEditingItem(null)} className="text-gray-400 hover:text-white p-1 rounded-lg">
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">{t('common_qty')}</label>
              <input
                type="number"
                value={editingItem.quantity || ''}
                onChange={(e) => setEditingItem(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                className="w-full px-3 py-1.5 bg-gray-700 border border-gray-600 rounded-lg text-white text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">{t('common_price')}</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={editingItem.price || ''}
                  onChange={(e) => setEditingItem(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                  className="flex-1 px-3 py-1.5 bg-gray-700 border border-gray-600 rounded-lg text-white text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <select
                  value={editingItem.priceFormat || 'perWL'}
                  onChange={(e) => setEditingItem(prev => ({ ...prev, priceFormat: e.target.value }))}
                  className="px-2 py-1.5 bg-gray-700 border border-gray-600 rounded-lg text-xs text-white focus:outline-none min-w-[95px]"
                >
                  <option value="perWL">{t('unit_per_wl')}</option>
                  <option value="each">{t('unit_wl_each')}</option>
                </select>
              </div>
            </div>

            <button
              onClick={() => {
                updateItem(editingItem.id, {
                  quantity: editingItem.quantity,
                  price: editingItem.price,
                  priceFormat: editingItem.priceFormat || 'perWL',
                });
                setEditingItem(null);
              }}
              className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-sm"
            >
              <FiCheck className="w-4 h-4" />
              {t('common_save')}
            </button>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Item Inventory */}
      <ConfirmModal
        isOpen={Boolean(itemToDelete)}
        onClose={() => setItemToDelete(null)}
        onConfirm={() => {
          if (itemToDelete) {
            removeItem(itemToDelete.id);
            setItemToDelete(null);
          }
        }}
        title={`${t('confirm_delete_inv_title')} ("${itemToDelete?.name}")`}
        message={`${t('confirm_delete_inv_msg')} (${formatNumberLocalized(itemToDelete?.quantity || 0)})`}
        confirmText={t('common_yes_delete')}
        cancelText={t('common_cancel')}
      />

      {/* Modal Konfirmasi Hapus Transaksi */}
      <ConfirmModal
        isOpen={Boolean(txToDelete)}
        onClose={() => setTxToDelete(null)}
        onConfirm={() => {
          if (txToDelete) {
            removeTransaction(txToDelete.id);
            setTxToDelete(null);
          }
        }}
        title={t('confirm_delete_tx_title')}
        message={`${t('confirm_delete_tx_msg')} (${txToDelete?.itemName})`}
        confirmText={t('common_yes_delete')}
        cancelText={t('common_cancel')}
      />
    </div>
  );
}
