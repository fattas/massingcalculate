import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for syncing state with localStorage
 * @param {string} key - localStorage key
 * @param {*} initialValue - Default value
 * @returns {[*, Function]} - [value, setValue]
 */
export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback((value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setValue];
}

/**
 * Custom hook for managing inventory in localStorage
 */
export function useInventory() {
  const [items, setItems] = useLocalStorage('gt-inventory', []);
  const [transactions, setTransactions] = useLocalStorage('gt-transactions', []);

  const addItem = useCallback((item) => {
    setItems(prev => {
      const existing = prev.find(i => i.name.toLowerCase() === item.name.toLowerCase());
      if (existing) {
        const newQty = existing.quantity + item.quantity;
        // Update price to latest
        return prev.map(i =>
          i.name.toLowerCase() === item.name.toLowerCase()
            ? {
                ...i,
                quantity: newQty,
                price: item.price || i.price || 0,
                priceFormat: item.priceFormat || i.priceFormat || 'perWL',
                icon: item.icon || i.icon || '',
              }
            : i
        );
      }
      return [...prev, { ...item, id: Date.now().toString() }];
    });
  }, [setItems]);

  const removeItem = useCallback((id) => {
    setItems(prev => prev.filter(i => i.id !== id));
  }, [setItems]);

  const updateItem = useCallback((id, updates) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
  }, [setItems]);

  const addTransaction = useCallback((transaction) => {
    const newTransaction = {
      ...transaction,
      id: Date.now().toString(),
      date: new Date().toISOString(),
    };
    setTransactions(prev => [newTransaction, ...prev]);
    
    // Update inventory
    if (transaction.type === 'buy') {
      addItem({
        name: transaction.itemName,
        quantity: transaction.quantity,
        icon: transaction.icon || '',
        price: transaction.price || 0,
        priceFormat: transaction.priceFormat || 'perWL',
      });
    } else if (transaction.type === 'sell' || transaction.type === 'use') {
      setItems(prev => prev
        .map(i =>
          i.name.toLowerCase() === transaction.itemName.toLowerCase()
            ? { ...i, quantity: i.quantity - transaction.quantity }
            : i
        )
        .filter(i => i.quantity > 0) // Remove items with 0 or negative qty
      );
    }
    
    return newTransaction;
  }, [setTransactions, addItem, setItems]);

  const removeTransaction = useCallback((id) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  }, [setTransactions]);

  const getTotalAssetValue = useCallback(() => {
    return items.reduce((total, item) => {
      if (!item.price || item.price <= 0 || !item.quantity) return total;
      if (item.priceFormat === 'each') {
        return total + (item.quantity * item.price);
      }
      // perWL format: price = how many items per 1 WL
      return total + (item.quantity / item.price);
    }, 0);
  }, [items]);

  return {
    items,
    transactions,
    addItem,
    removeItem,
    updateItem,
    addTransaction,
    removeTransaction,
    getTotalAssetValue,
    setItems,
    setTransactions,
  };
}

/**
 * Hook for managing saved plans
 */
export function useSavedPlans() {
  const [plans, setPlans] = useLocalStorage('gt-saved-plans', []);

  const savePlan = useCallback((plan) => {
    const savedPlan = {
      ...plan,
      id: plan.id || Date.now().toString(),
      savedAt: new Date().toISOString(),
    };
    setPlans(prev => {
      const idx = prev.findIndex(p => p.id === savedPlan.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = savedPlan;
        return updated;
      }
      return [...prev, savedPlan];
    });
    return savedPlan;
  }, [setPlans]);

  const deletePlan = useCallback((id) => {
    setPlans(prev => prev.filter(p => p.id !== id));
  }, [setPlans]);

  return { plans, savePlan, deletePlan };
}
