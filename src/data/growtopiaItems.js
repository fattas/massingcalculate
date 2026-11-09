/**
 * Growtopia Item Database & Helpers
 * Uses Growtopia items.dat database (15,894 items) & Growtopia CDN sprites
 */

import gtItems from './gtItemsData.json';

// Build index lookup map for fast O(1) resolution
const nameToIdMap = new Map();
for (let id = 0; id < gtItems.length; id++) {
  const name = gtItems[id];
  if (name) {
    nameToIdMap.set(name.toLowerCase(), id);
  }
}

/**
 * Resolve an item name to its Growtopia Item ID
 */
export function getItemId(name) {
  if (!name) return null;
  const clean = String(name).trim();
  const lower = clean.toLowerCase();

  // 1. Direct exact match
  if (nameToIdMap.has(lower)) {
    return nameToIdMap.get(lower);
  }

  // 2. Handle "X Seed" vs "X"
  if (lower.endsWith(' seed')) {
    const baseName = lower.slice(0, -5).trim();
    if (nameToIdMap.has(baseName)) {
      const baseId = nameToIdMap.get(baseName);
      // In Growtopia, seed ID is usually baseId + 1
      return baseId + 1;
    }
  } else {
    // If user entered without "Seed", check if "X Seed" exists
    const withSeed = `${lower} seed`;
    if (nameToIdMap.has(withSeed)) {
      const seedId = nameToIdMap.get(withSeed);
      return Math.max(0, seedId - 1);
    }
  }

  return null;
}

/**
 * Get the CDN sprite image URL for an item
 */
export function getItemSpriteURL(nameOrId) {
  if (nameOrId === null || nameOrId === undefined || nameOrId === '') return null;
  if (typeof nameOrId === 'number') {
    return `https://cdn.growtopiawiki.com/sprites/${nameOrId}.png`;
  }
  const id = getItemId(nameOrId);
  if (id !== null) {
    return `https://cdn.growtopiawiki.com/sprites/${id}.png`;
  }
  return null;
}

/**
 * Fast in-memory search across Growtopia database (15,894 items)
 */
export function searchItems(query, limit = 10) {
  if (!query || query.trim().length < 2) return [];
  const q = query.trim().toLowerCase();

  const results = [];
  const seenIds = new Set();

  // 1. Exact matches or startsWith (highest priority)
  for (let id = 0; id < gtItems.length; id++) {
    const name = gtItems[id];
    if (name && name.toLowerCase().startsWith(q)) {
      results.push({ id, name });
      seenIds.add(id);
      if (results.length >= limit) return results;
    }
  }

  // 2. Substring matches
  for (let id = 0; id < gtItems.length; id++) {
    if (seenIds.has(id)) continue;
    const name = gtItems[id];
    if (name && name.toLowerCase().includes(q)) {
      results.push({ id, name });
      seenIds.add(id);
      if (results.length >= limit) return results;
    }
  }

  // If nothing found, return manual input option
  if (results.length === 0) {
    return [{ name: query.trim(), isManual: true }];
  }

  return results;
}

/**
 * Default step template
 */
export function createDefaultStep(overrides = {}) {
  return {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    name: '',
    seedName1: '',
    seedName2: '',
    resultItemName: '',
    seedsPlanted: 0,
    seedsHarvested: 0,
    seedLossPercent: 21,
    hitsPerBlock: 4,
    tmCount: 8,
    useTM: true,
    tmHarvestedBlocks: 0,
    tmBlockMultiplier: 2.77,
    isCompleted: false,
    isExpanded: true,

    // Seed 1
    seed1Qty: 0,
    seed1Price: 0,
    seed1PriceFormat: 'perWL',
    seed1ExtraPurchases: [],

    // Seed 2
    seed2Qty: 0,
    seed2Price: 0,
    seed2PriceFormat: 'perWL',
    seed2ExtraPurchases: [],

    // Fuel
    fuelNeeded: 0,
    fuelPrice: 0,
    fuelPriceFormat: 'perWL',
    fuelCostPerUnit: 0,

    // TM Gems Fuel (Real workflow: (Initial + Remaining) - Final) / Rate
    tmInitialGems: 0,
    tmRemainingGems: 0,
    tmFinalGems: 0,
    tmGemsRate: 0,
    tmGemsAmount: 0,
    tmGemsCostWL: 0,

    notes: '',
    ...overrides,
  };
}

/**
 * Default plan template
 */
export function createDefaultPlan(overrides = {}) {
  return {
    id: Date.now().toString(),
    name: 'Untitled Massing Plan',
    description: '',
    targetItem: '',
    steps: [createDefaultStep()],
    sellPrice: 0,
    sellPriceFormat: 'perWL',
    totalFinalOutput: 0,
    harvestedBlocks: 0,
    harvestBlockMultiplier: 2.77,
    wlToIdrRate: 0,
    currencyRates: {},
    shoppingTrackers: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}
