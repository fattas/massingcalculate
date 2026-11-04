/**
 * Growtopia Massing Calculator - Core Calculation Engine
 */

const GEMS_PER_HIT = 1;
const SECONDS_PER_HIT = 1.5;

/**
 * Calculate seed loss after harvesting
 */
export function calculateSeedsAfterLoss(totalSeeds, seedLossPercent = 21) {
  return Math.floor(totalSeeds * (1 - seedLossPercent / 100));
}

/**
 * Calculate block distribution across TMs
 */
export function distributeBlocks(totalBlocks, tmCount) {
  if (tmCount <= 0) return [];
  const baseCount = Math.floor(totalBlocks / tmCount);
  const remainder = totalBlocks % tmCount;
  const distribution = [];
  for (let i = 0; i < tmCount; i++) {
    distribution.push(baseCount + (i < remainder ? 1 : 0));
  }
  return distribution;
}

/**
 * Calculate gems consumed by TMs
 */
export function calculateGemsConsumed(totalBlocks, hitsPerBlock) {
  return totalBlocks * hitsPerBlock * GEMS_PER_HIT;
}

/**
 * Calculate time to break all blocks with TMs
 */
export function calculateBreakTime(totalBlocks, hitsPerBlock, tmCount) {
  if (tmCount <= 0) return { totalSeconds: 0, formatted: '0 detik' };
  const blocksPerTm = Math.ceil(totalBlocks / tmCount);
  const totalSeconds = blocksPerTm * hitsPerBlock * SECONDS_PER_HIT;
  return { totalSeconds, formatted: formatTime(totalSeconds) };
}

/**
 * Calculate cost based on price format
 */
export function calculateCost(quantity, price, format) {
  if (!price || price <= 0 || !quantity) return 0;
  if (format === 'each') return quantity * price;
  return quantity / price;
}

/**
 * Calculate a full massing step
 */
export function calculateStep(step) {
  const {
    seedsPlanted = 0,
    seedLossPercent = 21,
    hitsPerBlock = 1,
    tmCount = 1,
    useTM = true,
    seed1Qty = 0,
    seed1Price = 0,
    seed1PriceFormat = 'perWL',
    seed2Qty = 0,
    seed2Price = 0,
    seed2PriceFormat = 'perWL',
    fuelNeeded = 0,
    fuelPrice = 0,
    fuelPriceFormat = 'perWL',
    fuelCostPerUnit = 0,
    tmGemsAmount = 0,
    tmGemsCostWL = 0,
  } = step;

  const totalTrees = seedsPlanted;
  const seedsAfterHarvest = calculateSeedsAfterLoss(totalTrees, seedLossPercent);

  const seed1CostWL = calculateCost(seed1Qty || seedsPlanted, seed1Price, seed1PriceFormat);
  const seed2CostWL = calculateCost(seed2Qty || seedsPlanted, seed2Price, seed2PriceFormat);
  const actualFuelPrice = fuelPrice > 0 ? fuelPrice : fuelCostPerUnit;
  const actualFuelFormat = fuelPrice > 0 ? fuelPriceFormat : (fuelCostPerUnit > 0 ? 'each' : fuelPriceFormat);
  const fuelCostWL = calculateCost(fuelNeeded, actualFuelPrice, actualFuelFormat);
  const actualTmGemsCostWL = useTM ? (parseFloat(tmGemsCostWL) || 0) : 0;
  const totalCostWL = seed1CostWL + seed2CostWL + fuelCostWL + actualTmGemsCostWL;

  return {
    totalTrees,
    seedsAfterHarvest,
    seed1CostWL,
    seed2CostWL,
    fuelCostWL,
    tmGemsCostWL: actualTmGemsCostWL,
    tmGemsAmount: useTM ? (parseInt(tmGemsAmount) || 0) : 0,
    totalCostWL,
  };
}

/**
 * Format seconds into readable time string
 */
export function formatTime(totalSeconds) {
  if (!totalSeconds || totalSeconds <= 0) return '0 detik';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  let formatted = '';
  if (hours > 0) formatted += `${hours} jam `;
  if (minutes > 0) formatted += `${minutes} menit `;
  if (seconds > 0 || formatted === '') formatted += `${seconds} detik`;
  return formatted.trim();
}

/**
 * Format WL number - removes trailing .00 zeros safely
 * 8085.00 -> "8085"
 * 8085.50 -> "8085.5"
 * 8085.15 -> "8085.15"
 */
export function fmtWL(num) {
  if (num === 0 || num === undefined || num === null || num === '') return '0';
  const val = typeof num === 'number' ? num : parseFloat(num);
  if (isNaN(val) || val === 0) return '0';
  return parseFloat(val.toFixed(2)).toString();
}

/**
 * Format WL to readable currency (WL, DL, BGL) - no trailing zeros
 */
export function formatCurrency(wl) {
  const abs = Math.abs(wl);
  if (abs >= 1000000) {
    return `${fmtWL(wl / 10000)} BGL`;
  }
  if (abs >= 10000) {
    return `${fmtWL(wl / 100)} DL`;
  }
  return `${fmtWL(wl)} WL`;
}

/**
 * Format number with thousand separators
 */
export function formatNumber(num) {
  return new Intl.NumberFormat('id-ID').format(num);
}

/**
 * Format amount to Indonesian Rupiah number format
 * 7647200 -> "7.647.200"
 */
export function formatRupiah(amount) {
  if (amount === 0 || amount === undefined || amount === null) return '0';
  const val = typeof amount === 'number' ? amount : parseFloat(amount);
  if (isNaN(val) || val === 0) return '0';
  const rounded = Math.round(val);
  return new Intl.NumberFormat('id-ID').format(rounded);
}
