import { calculateStep, formatNumber, formatCurrency, formatTime, fmtWL, formatRupiah } from '../../utils/calculations';
import { FiTrendingUp, FiTrendingDown, FiDollarSign, FiClock, FiZap, FiTarget } from 'react-icons/fi';

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
      borderColor: 'border-red-500/30',
    },
    {
      label: 'Pendapatan',
      value: `${fmtWL(revenueWL)} WL`,
      detail: `${formatNumber(effectiveOutput)} item`,
      icon: FiTarget,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/30',
    },
    {
      label: 'Clean Profit',
      value: `${fmtWL(cleanProfitWL)} WL`,
      detail: wlToIdrRate > 0
        ? `≈ Rp ${formatRupiah(cleanProfitRupiah)}`
        : formatCurrency(cleanProfitWL),
      icon: cleanProfitWL >= 0 ? FiTrendingUp : FiTrendingDown,
      color: cleanProfitWL >= 0 ? 'text-green-400' : 'text-red-400',
      bgColor: cleanProfitWL >= 0 ? 'bg-green-500/10' : 'bg-red-500/10',
      borderColor: cleanProfitWL >= 0 ? 'border-green-500/30' : 'border-red-500/30',
    },
    {
      label: 'ROI',
      value: `${fmtWL(roi)}%`,
      detail: roi >= 0 ? 'Menguntungkan' : 'Rugi',
      icon: FiZap,
      color: roi >= 0 ? 'text-purple-400' : 'text-red-400',
      bgColor: roi >= 0 ? 'bg-purple-500/10' : 'bg-red-500/10',
      borderColor: roi >= 0 ? 'border-purple-500/30' : 'border-red-500/30',
    },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-white flex items-center gap-2">
        <FiTrendingUp className="text-green-400" />
        Ringkasan Keuangan
      </h2>

      <div className="grid grid-cols-2 gap-3">
        {cards.map((card) => (
          <div key={card.label} className={`p-3.5 rounded-xl ${card.bgColor} border ${card.borderColor} flex flex-col justify-between`}>
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <card.icon className={`w-4 h-4 ${card.color} flex-shrink-0`} />
                <span className="text-xs font-medium text-gray-400 truncate">{card.label}</span>
              </div>
              <p className={`text-lg sm:text-xl font-bold ${card.color} tracking-tight truncate`}>
                {card.value}
              </p>
            </div>
            <p className="text-xs text-gray-500 mt-1 truncate">{card.detail}</p>
          </div>
        ))}
      </div>

      {/* Konversi ke Rupiah (IDR) */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-3.5 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-white flex items-center gap-1.5">
            🇮🇩 Konversi ke Rupiah (IDR)
          </span>
          {wlToIdrRate > 0 && cleanProfitWL !== 0 && (
            <span className={`text-xs font-bold ${cleanProfitWL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {cleanProfitWL >= 0 ? '+' : '-'}Rp {formatRupiah(Math.abs(cleanProfitRupiah))}
            </span>
          )}
        </div>

        <div>
          <label className="block text-[11px] font-medium text-gray-400 mb-1">
            Harga 1 WL (Rupiah)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-semibold select-none">
              Rp
            </span>
            <input
              type="number"
              value={plan.wlToIdrRate || ''}
              onChange={(e) => onUpdatePlan && onUpdatePlan({ wlToIdrRate: parseFloat(e.target.value) || 0 })}
              placeholder="Contoh: 850"
              className="w-full pl-9 pr-14 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 select-none">
              / WL
            </span>
          </div>
          <p className="text-[10px] text-gray-500 mt-1">
            Input manual harga 1 WL saat ini (misal: 800, 850, 1000)
          </p>
        </div>

        {wlToIdrRate > 0 && (
          <div className="pt-2 border-t border-gray-700/60 space-y-1.5 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-gray-300 font-medium">Profit Bersih (IDR):</span>
              <span className={`font-bold text-sm ${cleanProfitWL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {cleanProfitWL >= 0 ? '+' : '-'}Rp {formatRupiah(Math.abs(cleanProfitRupiah))}
              </span>
            </div>
            {totalInvestmentWL > 0 && (
              <div className="flex justify-between items-center text-gray-400">
                <span>Total Modal (IDR):</span>
                <span>Rp {formatRupiah(totalInvestmentWL * wlToIdrRate)}</span>
              </div>
            )}
            {revenueWL > 0 && (
              <div className="flex justify-between items-center text-gray-400">
                <span>Pendapatan (IDR):</span>
                <span>Rp {formatRupiah(revenueWL * wlToIdrRate)}</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-gray-800 rounded-xl border border-gray-700 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-300">Detail Biaya</h3>

        {finalSplicingSeeds > 0 && (
          <div className="space-y-1.5">
            <div className="flex justify-between items-center bg-green-500/10 px-3 py-2 rounded-lg border border-green-500/20 text-xs">
              <span className="font-medium text-green-300 flex items-center gap-1.5">
                🌱 Hasil Final Seed (After Break)
              </span>
              <span className="font-bold text-green-400">
                {formatNumber(finalSplicingSeeds)} seeds
              </span>
            </div>
            {estimatedHarvestBlocks > 0 && (
              <div className="flex justify-between items-center bg-yellow-500/10 px-3 py-2 rounded-lg border border-yellow-500/20 text-xs">
                <span className="font-medium text-yellow-300 flex items-center gap-1.5">
                  🌾 Estimasi Harvest Block (x{multiplier})
                </span>
                <span className="font-bold text-yellow-400">
                  {formatNumber(estimatedHarvestBlocks)} blocks
                </span>
              </div>
            )}
          </div>
        )}

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Biaya Seed 1 (semua step)</span>
            <span className="text-white">{fmtWL(totalSeed1CostWL)} WL</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Biaya Seed 2 (semua step)</span>
            <span className="text-white">{fmtWL(totalSeed2CostWL)} WL</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Biaya Fuel</span>
            <span className="text-white">{fmtWL(totalFuelCostWL)} WL</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Modal Gems TM</span>
            <span className="text-white">{fmtWL(totalTmGemsCostWL)} WL</span>
          </div>
          <hr className="border-gray-700" />
          <div className="flex justify-between font-semibold">
            <span className="text-gray-300">Total Modal</span>
            <span className="text-red-400">{fmtWL(totalInvestmentWL)} WL</span>
          </div>
          <hr className="border-gray-700" />
          <div className="flex justify-between">
            <span className="text-gray-400">Pendapatan Jual</span>
            <span className="text-green-400">+{fmtWL(revenueWL)} WL</span>
          </div>
          <div className="flex justify-between font-semibold">
            <span className="text-gray-300">Profit Bersih</span>
            <div className="text-right">
              <span className={cleanProfitWL >= 0 ? 'text-green-400' : 'text-red-400'}>
                {cleanProfitWL >= 0 ? '+' : ''}{fmtWL(cleanProfitWL)} WL
              </span>
              {wlToIdrRate > 0 && (
                <p className={`text-xs font-medium ${cleanProfitWL >= 0 ? 'text-green-400/80' : 'text-red-400/80'}`}>
                  ≈ {cleanProfitWL >= 0 ? '+' : '-'}Rp {formatRupiah(Math.abs(cleanProfitRupiah))}
                </p>
              )}
            </div>
          </div>
          {totalTmGemsAmount > 0 && (
            <>
              <hr className="border-gray-700" />
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Total Gems Dibeli</span>
                <span className="text-yellow-400">{formatNumber(totalTmGemsAmount)} gems</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
