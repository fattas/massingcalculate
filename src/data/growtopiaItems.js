/**
 * Growtopia Item Database & Helpers
 * Uses Growtopia Wiki API for search and images
 */

import { searchWikiItems } from '../utils/wikiApi';

/**
 * Search items - uses Wiki API with local fallback
 */
export async function searchItems(query, limit = 10) {
  if (!query || query.trim().length < 2) return [];
  
  try {
    const wikiResults = await searchWikiItems(query, limit);
    if (wikiResults.length > 0) {
      return wikiResults.map(name => ({ name }));
    }
  } catch {
    // fallback below
  }

  return [{ name: query.trim(), isManual: true }];
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
    seedLossPercent: 21,
    hitsPerBlock: 4,
    tmCount: 8,
    useTM: true,
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

    // TM Gems Fuel (manual modal)
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
    harvestBlockMultiplier: 2.77,
    wlToIdrRate: 0,
    shoppingTrackers: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}
