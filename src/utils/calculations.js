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
    seedsHarvested = 0,
    seedLossPercent = 21,
    hitsPerBlock = 1,
    tmCount = 1,
    useTM = true,
    tmHarvestedBlocks = 0,
    seed1Qty = 0,
    seed1Price = 0,
    seed1PriceFormat = 'perWL',
    seed1ExtraPurchases = [],
    seed2Qty = 0,
    seed2Price = 0,
    seed2PriceFormat = 'perWL',
    seed2ExtraPurchases = [],
    fuelNeeded = 0,
    fuelPrice = 0,
    fuelPriceFormat = 'perWL',
    fuelCostPerUnit = 0,
    tmInitialGems = 0,
    tmRemainingGems = 0,
    tmFinalGems = 0,
    tmGemsRate = 0,
    tmGemsAmount = 0,
    tmGemsCostWL = 0,
  } = step;

  const totalTrees = parseInt(seedsPlanted, 10) || 0;

  // Splicing Output: If user entered seedsHarvested (new inverted logic), use it directly
  const hasHarvestedInput = seedsHarvested !== undefined && seedsHarvested !== null && seedsHarvested !== '' && parseInt(seedsHarvested, 10) > 0;
  const seedsAfterHarvest = hasHarvestedInput
    ? parseInt(seedsHarvested, 10)
    : (step.seedsHarvested === 0 && (step.seedLossPercent === undefined || step.seedLossPercent === ''))
      ? 0
      : calculateSeedsAfterLoss(totalTrees, seedLossPercent);

  const calculatedSeedLossPercent = totalTrees > 0
    ? parseFloat((((totalTrees - seedsAfterHarvest) / totalTrees) * 100).toFixed(2))
    : 0;

  // Seed 1: Primary + Extra Purchases
  const extraSeed1Purchases = Array.isArray(seed1ExtraPurchases) ? seed1ExtraPurchases : [];
  const primarySeed1Cost = calculateCost(
    seed1Qty || (extraSeed1Purchases.length === 0 ? seedsPlanted : 0),
    seed1Price,
    seed1PriceFormat
  );
  const extraSeed1Cost = extraSeed1Purchases.reduce((sum, p) => {
    return sum + calculateCost(p.qty, p.price, p.priceFormat || 'perWL');
  }, 0);
  const seed1CostWL = primarySeed1Cost + extraSeed1Cost;
  const totalSeed1Qty = (parseInt(seed1Qty) || 0) + extraSeed1Purchases.reduce((sum, p) => sum + (parseInt(p.qty) || 0), 0);

  // Seed 2: Primary + Extra Purchases
  const extraSeed2Purchases = Array.isArray(seed2ExtraPurchases) ? seed2ExtraPurchases : [];
  const primarySeed2Cost = calculateCost(
    seed2Qty || (extraSeed2Purchases.length === 0 ? seedsPlanted : 0),
    seed2Price,
    seed2PriceFormat
  );
  const extraSeed2Cost = extraSeed2Purchases.reduce((sum, p) => {
    return sum + calculateCost(p.qty, p.price, p.priceFormat || 'perWL');
  }, 0);
  const seed2CostWL = primarySeed2Cost + extraSeed2Cost;
  const totalSeed2Qty = (parseInt(seed2Qty) || 0) + extraSeed2Purchases.reduce((sum, p) => sum + (parseInt(p.qty) || 0), 0);

  const actualFuelPrice = fuelPrice > 0 ? fuelPrice : fuelCostPerUnit;
  const actualFuelFormat = fuelPrice > 0 ? fuelPriceFormat : (fuelCostPerUnit > 0 ? 'each' : fuelPriceFormat);
  const fuelCostWL = calculateCost(fuelNeeded, actualFuelPrice, actualFuelFormat);

  // TM Gems Calculation: (Initial + Remaining) - Final, then divide by Gems Rate
  const hasNewGemsWorkflow = tmInitialGems > 0 || tmRemainingGems > 0 || tmFinalGems > 0 || tmGemsRate > 0;
  let actualTmGemsAmount = 0;
  let actualTmGemsCostWL = 0;

  if (useTM) {
    if (hasNewGemsWorkflow) {
      const initG = parseInt(tmInitialGems, 10) || 0;
      const remG = parseInt(tmRemainingGems, 10) || 0;
      const finG = parseInt(tmFinalGems, 10) || 0;
      const rateG = parseFloat(tmGemsRate) || 0;
      actualTmGemsAmount = Math.max(0, (initG + remG) - finG);
      actualTmGemsCostWL = rateG > 0 ? parseFloat((actualTmGemsAmount / rateG).toFixed(4)) : 0;
    } else {
      actualTmGemsCostWL = parseFloat(tmGemsCostWL) || 0;
      actualTmGemsAmount = parseInt(tmGemsAmount, 10) || 0;
    }
  }

  const totalCostWL = seed1CostWL + seed2CostWL + fuelCostWL + actualTmGemsCostWL;

  // TM Calculations: Total Block (inverted logic) vs Ratio
  const hasHarvestedBlocks = tmHarvestedBlocks !== undefined && tmHarvestedBlocks !== null && tmHarvestedBlocks !== '' && parseInt(tmHarvestedBlocks, 10) > 0;
  const tmBlockMultiplier = (totalTrees > 0 && hasHarvestedBlocks)
    ? parseFloat((parseInt(tmHarvestedBlocks, 10) / totalTrees).toFixed(4))
    : (step.tmBlockMultiplier !== undefined ? step.tmBlockMultiplier : 2.77);

  const tmEstimatedBlocks = hasHarvestedBlocks
    ? parseInt(tmHarvestedBlocks, 10)
    : ((totalTrees > 0 && tmBlockMultiplier > 0) ? Math.floor(totalTrees * tmBlockMultiplier) : 0);

  const tmHitsPerBlock = hitsPerBlock || 1;
  const tmGemsNeeded = useTM ? calculateGemsConsumed(tmEstimatedBlocks, tmHitsPerBlock) : 0;
  const tmBreakTime = useTM
    ? calculateBreakTime(tmEstimatedBlocks, tmHitsPerBlock, tmCount)
    : { totalSeconds: 0, formatted: '0 detik' };

  return {
    totalTrees,
    seedsAfterHarvest,
    calculatedSeedLossPercent,
    seed1CostWL,
    seed2CostWL,
    totalSeed1Qty,
    totalSeed2Qty,
    fuelCostWL,
    tmEstimatedBlocks,
    tmBlockMultiplier,
    tmGemsNeeded,
    tmBreakTime,
    tmGemsCostWL: actualTmGemsCostWL,
    tmGemsAmount: actualTmGemsAmount,
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

/**
 * Calculate Break-Even Price (BEP / Balik Modal)
 * @param {number} totalCostWL - Total modal (investasi) dalam WL
 * @param {number} totalUnits - Jumlah item yang dijual (seed atau block)
 * @param {string} format - 'perWL' atau 'each'
 * @returns {number} Nilai BEP
 */
export function calculateBEP(totalCostWL, totalUnits, format = 'perWL') {
  if (!totalCostWL || totalCostWL <= 0 || !totalUnits || totalUnits <= 0) return 0;
  if (format === 'each') {
    return totalCostWL / totalUnits;
  }
  return totalUnits / totalCostWL;
}

/**
 * Format BEP number with appropriate label
 */
export function formatBEP(bep, format = 'perWL') {
  if (!bep || bep <= 0 || isNaN(bep)) return '0';
  if (format === 'each') {
    if (bep >= 1) return `${fmtWL(bep)} WL each`;
    if (bep >= 0.01) return `${parseFloat(bep.toFixed(2))} WL each`;
    return `${parseFloat(bep.toFixed(4))} WL each`;
  }
  // perWL format
  if (bep >= 1) return `${fmtWL(bep)} / WL`;
  return `${parseFloat(bep.toFixed(2))} / WL`;
}
