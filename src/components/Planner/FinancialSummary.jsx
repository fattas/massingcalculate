import { calculateStep, formatNumber, formatCurrency, fmtWL, formatRupiah, calculateBEP, formatBEP } from '../../utils/calculations';
import { FiTrendingUp, FiTrendingDown, FiDollarSign, FiTarget, FiZap } from 'react-icons/fi';
import { FaBalanceScale } from 'react-icons/fa';

export default function FinancialSummary({ plan, onUpdatePlan }) {
  const { steps = [], sellPrice, sellPriceFormat, totalFinalOutput } = plan;

  const stepResults = steps.map(s => calculateStep(s));

  let totalSeed1CostWL = 0;
  let totalSeed2CostWL = 0;
  let totalFuelCostWL = 0;
  let totalTmGemsCostWL = 0;
  let totalTmGemsAmount = 0;

  stepResults.forEach((result) => {
    totalSeed1CostWL += result.seed1CostWL;
    totalSeed2CostWL += result.seed2CostWL;
    totalFuelCostWL += result.fuelCostWL;
    totalTmGemsCostWL += (result.tmGemsCostWL || 0);
    totalTmGemsAmount += (result.tmGemsAmount || 0);
  });

  const finalStep = stepResults[stepResults.length - 1];
  const finalSplicingSeeds = finalStep ? finalStep.seedsAfterHarvest : 0;
  const multiplier = plan.harvestBlockMultiplier !== undefined ? plan.harvestBlockMultiplier : 2.77;
  const estimatedHarvestBlocks = finalSplicingSeeds > 0 && multiplier > 0
    ? Math.floor(finalSplicingSeeds * multiplier)
    : 0;
  const effectiveOutput = totalFinalOutput > 0 ? totalFinalOutput : finalSplicingSeeds;

  const totalSeedCostWL = totalSeed1CostWL + totalSeed2CostWL;
  const totalInvestmentWL = totalSeedCostWL + totalFuelCostWL + totalTmGemsCostWL;

  const revenueWL = sellPrice > 0
    ? (sellPriceFormat === 'perWL' ? effectiveOutput / sellPrice : effectiveOutput * sellPrice)
    : 0;

  const cleanProfitWL = revenueWL - totalInvestmentWL;
  const roi = totalInvestmentWL > 0 ? (cleanProfitWL / totalInvestmentWL) * 100 : 0;
  const wlToIdrRate = plan.wlToIdrRate || 0;
  const cleanProfitRupiah = cleanProfitWL * wlToIdrRate;

  // BEP Calculations
  const bepActive = calculateBEP(totalInvestmentWL, effectiveOutput, sellPriceFormat);
  const bepSeedPerWL = calculateBEP(totalInvestmentWL, finalSplicingSeeds, 'perWL');
  const bepSeedEach = calculateBEP(totalInvestmentWL, finalSplicingSeeds, 'each');
  const bepBlockPerWL = calculateBEP(totalInvestmentWL, estimatedHarvestBlocks, 'perWL');
  const bepBlockEach = calculateBEP(totalInvestmentWL, estimatedHarvestBlocks, 'each');

  const cards = [
    {
      label: 'Total Modal',
      value: `${fmtWL(totalInvestmentWL)} WL`,
      detail: wlToIdrRate > 0 && totalInvestmentWL > 0
        ? `Rp ${formatRupiah(totalInvestmentWL * wlToIdrRate)}`
        : formatCurrency(totalInvestmentWL),
      icon: FiDollarSign,
      color: 'text-red-400',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/25',
    },
    {
      label: 'Pendapatan',
      value: `${fmtWL(revenueWL)} WL`,
      detail: `${formatNumber(effectiveOutput)} item`,
      icon: FiTarget,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/25',
    },
    {
      label: 'Net Profit',
      value: `${fmtWL(cleanProfitWL)} WL`,
      detail: wlToIdrRate > 0
        ? `≈ Rp ${formatRupiah(cleanProfitRupiah)}`
        : formatCurrency(cleanProfitWL),
      icon: cleanProfitWL >= 0 ? FiTrendingUp : FiTrendingDown,
      color: cleanProfitWL >= 0 ? 'text-emerald-400' : 'text-red-400',
      bgColor: cleanProfitWL >= 0 ? 'bg-emerald-500/10' : 'bg-red-500/10',
      borderColor: cleanProfitWL >= 0 ? 'border-emerald-500/25' : 'border-red-500/25',
    },
    {
      label: 'ROI',
      value: `${fmtWL(roi)}%`,
      detail: roi >= 0 ? 'Untung' : 'Rugi',
      icon: FiZap,
      color: roi >= 0 ? 'text-purple-400' : 'text-red-400',
      bgColor: roi >= 0 ? 'bg-purple-500/10' : 'bg-red-500/10',
      borderColor: roi >= 0 ? 'border-purple-500/25' : 'border-red-500/25',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Top Section Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <FiTrendingUp className="text-emerald-400" />
          Ringkasan Keuangan
        </h2>
        {totalInvestmentWL > 0 && (
          <span className="text-xs text-gray-400">
            Total {steps.length} Step
          </span>
        )}
      </div>

      {/* 4 Primary Metric Cards */}
      <div className="grid grid-cols-2 gap-2.5">
        {cards.map((card) => (
          <div
            key={card.label}
            className={`p-3 rounded-xl ${card.bgColor} border ${card.borderColor} flex flex-col justify-between`}
          >
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <card.icon className={`w-3.5 h-3.5 ${card.color} flex-shrink-0`} />
                <span className="text-xs font-medium text-gray-400 truncate">{card.label}</span>
              </div>
              <p className={`text-base sm:text-lg font-bold ${card.color} tracking-tight truncate`}>
                {card.value}
              </p>
            </div>
            <p className="text-[11px] text-gray-500 mt-0.5 truncate">{card.detail}</p>
          </div>
        ))}
      </div>

      {/* Break-Even Price (BEP) Card */}
      <div className="bg-gray-800 border border-gray-700/80 rounded-2xl p-3.5 space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-white flex items-center gap-1.5">
            <FaBalanceScale className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
            Break-Even Price (BEP)
          </span>
          {sellPrice > 0 && totalInvestmentWL > 0 && effectiveOutput > 0 && (
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                cleanProfitWL > 0
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : cleanProfitWL < 0
                  ? 'bg-red-500/10 text-red-400 border-red-500/30'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              }`}
            >
              {cleanProfitWL > 0 ? 'Untung' : cleanProfitWL < 0 ? 'Rugi' : 'Balik Modal'}
            </span>
          )}
        </div>

        {totalInvestmentWL > 0 && effectiveOutput > 0 ? (
          <div className="space-y-2">
            <div className="p-3 bg-amber-500/10 border border-amber-500/25 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[11px] text-amber-300 font-medium block">
                  Harga Balik Modal ({sellPriceFormat === 'perWL' ? 'qty / WL' : 'WL each'}):
                </span>
                <p className="text-lg font-bold text-amber-400 mt-0.5">
                  {formatBEP(bepActive, sellPriceFormat)}
                </p>
              </div>
              {wlToIdrRate > 0 && (
                <div className="text-right">
                  <span className="text-[10px] text-gray-400 block">Modal/Item (IDR)</span>
                  <span className="text-xs font-bold text-white">
                    Rp {parseFloat(((totalInvestmentWL * wlToIdrRate) / effectiveOutput).toFixed(2))}
                  </span>
                </div>
              )}
            </div>

            {/* Comparison: Sell Seed vs Sell Block */}
            {(finalSplicingSeeds > 0 || estimatedHarvestBlocks > 0) && (
              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                {finalSplicingSeeds > 0 && (
                  <div className="p-2 bg-gray-750/70 border border-gray-700 rounded-lg">
                    <span className="text-[10px] text-gray-400 block mb-0.5">Jual Seed:</span>
                    <p className="font-bold text-emerald-400 text-xs">
                      {formatBEP(bepSeedPerWL, 'perWL')}
                    </p>
                    <span className="text-[10px] text-gray-500">
                      ({formatBEP(bepSeedEach, 'each')})
                    </span>
                  </div>
                )}
                {estimatedHarvestBlocks > 0 && (
                  <div className="p-2 bg-gray-750/70 border border-gray-700 rounded-lg">
                    <span className="text-[10px] text-gray-400 block mb-0.5">Jual Block:</span>
                    <p className="font-bold text-yellow-400 text-xs">
                      {formatBEP(bepBlockPerWL, 'perWL')}
                    </p>
                    <span className="text-[10px] text-gray-500">
                      ({formatBEP(bepBlockEach, 'each')})
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs text-gray-500">
            Isi modal dan jumlah pohon/seed untuk kalkulasi BEP.
          </p>
        )}
      </div>

      {/* IDR Conversion Card */}
      <div className="bg-gray-800 border border-gray-700/80 rounded-2xl p-3.5 space-y-2.5 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-white">
            🇮🇩 Konversi ke Rupiah (IDR)
          </span>
          {wlToIdrRate > 0 && cleanProfitWL !== 0 && (
            <span className={`text-xs font-bold ${cleanProfitWL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {cleanProfitWL >= 0 ? '+' : '-'}Rp {formatRupiah(Math.abs(cleanProfitRupiah))}
            </span>
          )}
        </div>

        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-semibold select-none">
            Rp
          </span>
          <input
            type="number"
            value={plan.wlToIdrRate || ''}
            onChange={(e) => onUpdatePlan && onUpdatePlan({ wlToIdrRate: parseFloat(e.target.value) || 0 })}
            placeholder="850"
            className="w-full pl-9 pr-14 py-2 bg-gray-700/80 border border-gray-600 rounded-lg text-white font-semibold text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 select-none">
            / WL
          </span>
        </div>

        {wlToIdrRate > 0 && (
          <div className="pt-2 border-t border-gray-700/70 space-y-1 text-xs">
            <div className="flex justify-between items-center text-gray-300">
              <span>Profit Bersih:</span>
              <span className={`font-bold ${cleanProfitWL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {cleanProfitWL >= 0 ? '+' : '-'}Rp {formatRupiah(Math.abs(cleanProfitRupiah))}
              </span>
            </div>
            {totalInvestmentWL > 0 && (
              <div className="flex justify-between items-center text-gray-400 text-[11px]">
                <span>Total Modal:</span>
                <span>Rp {formatRupiah(totalInvestmentWL * wlToIdrRate)}</span>
              </div>
            )}
            {revenueWL > 0 && (
              <div className="flex justify-between items-center text-gray-400 text-[11px]">
                <span>Pendapatan:</span>
                <span>Rp {formatRupiah(revenueWL * wlToIdrRate)}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Detail Cost Breakdown Card */}
      <div className="bg-gray-800 border border-gray-700/80 rounded-2xl p-3.5 space-y-2.5 shadow-sm">
        <h3 className="text-xs font-semibold text-gray-300">Rincian Pengeluaran</h3>

        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between items-center p-2 bg-gray-750/70 rounded-lg">
            <span className="text-gray-400">Total Beli Seeds:</span>
            <span className="font-semibold text-white">{fmtWL(totalSeedCostWL)} WL</span>
          </div>

          {totalFuelCostWL > 0 && (
            <div className="flex justify-between items-center p-2 bg-gray-750/70 rounded-lg">
              <span className="text-gray-400">Total Fuel Pack:</span>
              <span className="font-semibold text-yellow-400">{fmtWL(totalFuelCostWL)} WL</span>
            </div>
          )}

          {totalTmGemsCostWL > 0 && (
            <div className="flex justify-between items-center p-2 bg-gray-750/70 rounded-lg">
              <span className="text-gray-400">Total Gems TM ({formatNumber(totalTmGemsAmount)}):</span>
              <span className="font-semibold text-cyan-400">{fmtWL(totalTmGemsCostWL)} WL</span>
            </div>
          )}

          <div className="flex justify-between items-center p-2 bg-gray-700/50 rounded-lg border border-gray-650 font-bold">
            <span className="text-gray-200">Total Modal Keseluruhan:</span>
            <span className="text-red-400">{fmtWL(totalInvestmentWL)} WL</span>
          </div>
        </div>
      </div>
    </div>
  );
}
