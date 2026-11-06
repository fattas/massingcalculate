import { useState } from 'react';
import { useInventory } from '../../hooks/useLocalStorage';
import ItemSearch from '../Common/ItemSearch';
import ItemIcon from '../Common/ItemIcon';
import ConfirmModal from '../Common/ConfirmModal';
import { formatNumber, fmtWL } from '../../utils/calculations';
import { FiPlus, FiTrash2, FiEdit3, FiShoppingCart, FiPackage, FiDollarSign, FiFilter, FiX, FiCheck, FiArrowDown, FiArrowUp } from 'react-icons/fi';

export default function InventoryManager() {
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
    priceFormat: 'perWL', // 'perWL' or 'each'
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
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <FiPackage className="w-5 h-5 text-blue-400" />
            <span className="text-sm text-gray-400">Total Item</span>
          </div>
          <p className="text-2xl font-bold text-white">{items.length}</p>
          <p className="text-xs text-gray-500">{formatNumber(items.reduce((s, i) => s + i.quantity, 0))} total unit</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <FiDollarSign className="w-5 h-5 text-green-400" />
            <span className="text-sm text-gray-400">Total Aset (est.)</span>
          </div>
          <p className="text-2xl font-bold text-green-400">{fmtWL(totalAsset)} WL</p>
          <p className="text-xs text-gray-500">Berdasarkan harga beli</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <FiShoppingCart className="w-5 h-5 text-yellow-400" />
            <span className="text-sm text-gray-400">Total Transaksi</span>
          </div>
          <p className="text-2xl font-bold text-white">{transactions.length}</p>
          <p className="text-xs text-gray-500">
            {transactions.filter(t => t.type === 'buy').length} beli • {transactions.filter(t => t.type === 'sell').length} jual • {transactions.filter(t => t.type === 'use').length} pakai
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inventory List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <FiPackage className="text-blue-400" />
              Inventori
            </h2>
            <div className="flex items-center gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-2 py-1.5 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white focus:outline-none"
              >
                <option value="name">Sort: Nama</option>
                <option value="quantity">Sort: Jumlah</option>
                <option value="value">Sort: Nilai</option>
              </select>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <FiPlus className="w-4 h-4" /> Transaksi
              </button>
            </div>
          </div>

          {sortedItems.length === 0 ? (
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-8 text-center">
              <FiPackage className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">Inventori kosong</p>
              <p className="text-sm text-gray-500 mt-1">Tambahkan transaksi beli untuk memulai</p>
            </div>
          ) : (
            <div className="space-y-2">
              {sortedItems.map((item) => {
                const itemValue = item.price > 0
                  ? (item.priceFormat === 'each' ? item.quantity * item.price : item.quantity / item.price)
                  : 0;
                return (
                  <div key={item.id} className="bg-gray-800 border border-gray-700 rounded-xl p-3 flex items-center gap-3">
                    <ItemIcon name={item.icon || item.name} size={40} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{item.name}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span>Qty: <span className="text-white font-medium">{formatNumber(item.quantity)}</span></span>
                        {item.price > 0 && (
                          <span>Rate: <span className="text-yellow-400">
                            {item.priceFormat === 'each' ? `${fmtWL(item.price)} WL each` : `${fmtWL(item.price)}/wl`}
                          </span></span>
                        )}
                        {itemValue > 0 && (
                          <span>Nilai: <span className="text-green-400">{fmtWL(itemValue)} WL</span></span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditingItem(item)}
                        className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                      >
                        <FiEdit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setItemToDelete(item)}
                        className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Hapus item dari inventory"
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
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <FiShoppingCart className="text-yellow-400" />
              Log Transaksi
            </h2>
            <div className="flex items-center gap-1">
              {['all', 'buy', 'sell', 'use'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                    filter === f
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-700 text-gray-400 hover:text-white'
                  }`}
                >
                  {f === 'all' ? 'Semua' : f === 'buy' ? 'Beli' : f === 'sell' ? 'Jual' : 'Pakai'}
                </button>
              ))}
            </div>
          </div>

          {filteredTransactions.length === 0 ? (
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-8 text-center">
              <FiShoppingCart className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">Belum ada transaksi</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {filteredTransactions.map((tx) => (
                <div key={tx.id} className="bg-gray-800 border border-gray-700 rounded-xl p-3 flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    tx.type === 'buy' ? 'bg-red-500/20 text-red-400' :
                    tx.type === 'sell' ? 'bg-green-500/20 text-green-400' :
                    'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {tx.type === 'buy' ? <FiArrowDown className="w-4 h-4" /> :
                     tx.type === 'sell' ? <FiArrowUp className="w-4 h-4" /> :
                     <FiPackage className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                        tx.type === 'buy' ? 'bg-red-500/20 text-red-400' :
                        tx.type === 'sell' ? 'bg-green-500/20 text-green-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {tx.type === 'buy' ? 'BELI' : tx.type === 'sell' ? 'JUAL' : 'PAKAI'}
                      </span>
                      <span className="text-sm font-medium text-white truncate">{tx.itemName}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                      <span>x{formatNumber(tx.quantity)}</span>
                      {tx.price > 0 && <span>{tx.priceFormat === 'each' ? `${fmtWL(tx.price)} WL each` : `${fmtWL(tx.price)}/wl`}</span>}
                      {tx.totalWL > 0 && <span className="text-yellow-400">{fmtWL(tx.totalWL)} WL</span>}
                      <span>{new Date(tx.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    {tx.notes && <p className="text-xs text-gray-500 mt-0.5">{tx.notes}</p>}
                  </div>
                  <button
                    onClick={() => setTxToDelete(tx)}
                    className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    title="Hapus riwayat transaksi ini"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl max-w-md w-full p-6 space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Tambah Transaksi</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-white p-1">
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Type Selector */}
            <div className="flex gap-2">
              {[
                { value: 'buy', label: 'Beli', color: 'red' },
                { value: 'sell', label: 'Jual', color: 'green' },
                { value: 'use', label: 'Pakai', color: 'yellow' },
              ].map(({ value, label, color }) => (
                <button
                  key={value}
                  onClick={() => setTxForm(prev => ({ ...prev, type: value }))}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    txForm.type === value
                      ? `bg-${color}-600 text-white`
                      : 'bg-gray-700 text-gray-400 hover:text-white'
                  }`}
                  style={txForm.type === value ? {
                    backgroundColor: color === 'red' ? '#dc2626' : color === 'green' ? '#16a34a' : '#ca8a04'
                  } : {}}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Item Search */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Nama Item</label>
              <ItemSearch
                value={txForm.itemName}
                onChange={handleItemSelect}
                placeholder="Cari item..."
              />
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Jumlah</label>
              <input
                type="number"
                value={txForm.quantity || ''}
                onChange={(e) => setTxForm(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                placeholder="0"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Price */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Harga</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={txForm.price || ''}
                  onChange={(e) => setTxForm(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                  placeholder={txForm.priceFormat === 'perWL' ? 'Contoh: 200' : 'Contoh: 3'}
                  className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <select
                  value={txForm.priceFormat}
                  onChange={(e) => setTxForm(prev => ({ ...prev, priceFormat: e.target.value }))}
                  className="px-2 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white focus:outline-none min-w-[110px]"
                >
                  <option value="perWL">qty / WL</option>
                  <option value="each">WL each</option>
                </select>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {txForm.priceFormat === 'perWL'
                  ? 'Contoh: 200/wl berarti 200 item per 1 WL'
                  : 'Contoh: 3 WL each berarti 1 item = 3 WL'}
              </p>
              {txForm.price > 0 && txForm.quantity > 0 && (
                <p className="text-xs text-yellow-400 mt-1">
                  Total: {fmtWL(calcTxTotal())} WL
                </p>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Catatan (opsional)</label>
              <input
                type="text"
                value={txForm.notes}
                onChange={(e) => setTxForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Misal: Beli dari BUYDIRT"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Submit */}
            <button
              onClick={handleAddTransaction}
              disabled={!txForm.itemName || txForm.quantity <= 0}
              className="w-full py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              <FiCheck className="w-4 h-4" />
              Tambah Transaksi
            </button>
          </div>
        </div>
      )}

      {/* Edit Item Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl max-w-md w-full p-6 space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Edit {editingItem.name}</h2>
              <button onClick={() => setEditingItem(null)} className="text-gray-400 hover:text-white p-1">
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Jumlah</label>
              <input
                type="number"
                value={editingItem.quantity || ''}
                onChange={(e) => setEditingItem(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Harga</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={editingItem.price || ''}
                  onChange={(e) => setEditingItem(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                  className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <select
                  value={editingItem.priceFormat || 'perWL'}
                  onChange={(e) => setEditingItem(prev => ({ ...prev, priceFormat: e.target.value }))}
                  className="px-2 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white focus:outline-none min-w-[110px]"
                >
                  <option value="perWL">qty / WL</option>
                  <option value="each">WL each</option>
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
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              <FiCheck className="w-4 h-4" />
              Simpan Perubahan
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
        title={`Hapus Item "${itemToDelete?.name}"?`}
        message={`Item ini beserta jumlah stoknya (${formatNumber(itemToDelete?.quantity || 0)}) akan dihapus dari inventory.`}
        confirmText="Ya, Hapus Item"
        cancelText="Batal"
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
        title="Hapus Riwayat Transaksi?"
        message={`Apakah Anda yakin ingin menghapus catatan transaksi ${txToDelete?.type?.toUpperCase()} untuk "${txToDelete?.itemName}"?`}
        confirmText="Ya, Hapus Log"
        cancelText="Batal"
      />
    </div>
  );
}

