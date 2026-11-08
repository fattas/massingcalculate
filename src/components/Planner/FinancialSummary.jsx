import { calculateStep, formatCurrency, fmtWL, calculateBEP, formatBEP } from '../../utils/calculations';
import { useLanguage } from '../../i18n/LanguageContext';
import FlagIcon from '../Common/FlagIcon';
import { FiTrendingUp, FiTrendingDown, FiDollarSign, FiTarget, FiZap } from 'react-icons/fi';
import { FaBalanceScale } from 'react-icons/fa';

export default function FinancialSummary({ plan, onUpdatePlan }) {
  const { t, formatNumberLocalized, currentCurrency } = useLanguage();
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

  // Active currency rate resolution (supports multi-currency with backward-compatible IDR fallback)
  const activeCurrencyCode = currentCurrency?.code || 'IDR';
  const activeRate = (plan.currencyRates && plan.currencyRates[activeCurrencyCode] !== undefined)
    ? plan.currencyRates[activeCurrencyCode]
    : (activeCurrencyCode === 'IDR' ? (plan.wlToIdrRate || 0) : 0);

  const cleanProfitConverted = cleanProfitWL * activeRate;
  const totalInvestmentConverted = totalInvestmentWL * activeRate;
  const revenueConverted = revenueWL * activeRate;

  const handleRateChange = (newVal) => {
    const updatedRates = {
      ...(plan.currencyRates || {}),
      [activeCurrencyCode]: newVal,
    };
    const updates = { currencyRates: updatedRates };
    if (activeCurrencyCode === 'IDR') {
      updates.wlToIdrRate = newVal;
    }
    if (onUpdatePlan) {
      onUpdatePlan(updates);
    }
  };

  // BEP Calculations
  const bepActive = calculateBEP(totalInvestmentWL, effectiveOutput, sellPriceFormat);
  const bepSeedPerWL = calculateBEP(totalInvestmentWL, finalSplicingSeeds, 'perWL');
  const bepSeedEach = calculateBEP(totalInvestmentWL, finalSplicingSeeds, 'each');
  const bepBlockPerWL = calculateBEP(totalInvestmentWL, estimatedHarvestBlocks, 'perWL');
  const bepBlockEach = calculateBEP(totalInvestmentWL, estimatedHarvestBlocks, 'each');

  const cards = [
    {
      label: t('card_modal'),
      value: `${fmtWL(totalInvestmentWL)} WL`,
      detail: activeRate > 0 && totalInvestmentWL > 0
        ? currentCurrency.format(totalInvestmentConverted)
        : formatCurrency(totalInvestmentWL),
      icon: FiDollarSign,
      color: 'text-red-400',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/25',
    },
    {
      label: t('card_revenue'),
      value: `${fmtWL(revenueWL)} WL`,
      detail: `${formatNumberLocalized(effectiveOutput)} items`,
      icon: FiTarget,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/25',
    },
    {
      label: t('card_profit'),
      value: `${fmtWL(cleanProfitWL)} WL`,
      detail: activeRate > 0
        ? `≈ ${currentCurrency.format(cleanProfitConverted)}`
        : formatCurrency(cleanProfitWL),
      icon: cleanProfitWL >= 0 ? FiTrendingUp : FiTrendingDown,
      color: cleanProfitWL >= 0 ? 'text-emerald-400' : 'text-red-400',
      bgColor: cleanProfitWL >= 0 ? 'bg-emerald-500/10' : 'bg-red-500/10',
      borderColor: cleanProfitWL >= 0 ? 'border-emerald-500/25' : 'border-red-500/25',
    },
    {
      label: t('card_roi'),
      value: `${fmtWL(roi)}%`,
      detail: roi >= 0 ? t('roi_profitable') : t('roi_loss'),
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
          {t('financial_title')}
        </h2>
        {totalInvestmentWL > 0 && (
          <span className="text-xs text-gray-400">
            Total {steps.length} {t('common_steps')}
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
            {t('bep_title')}
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
              {cleanProfitWL > 0 ? t('roi_profitable') : cleanProfitWL < 0 ? t('roi_loss') : t('roi_breakeven')}
            </span>
          )}
        </div>

        {totalInvestmentWL > 0 && effectiveOutput > 0 ? (
          <div className="space-y-2">
            <div className="p-3 bg-amber-500/10 border border-amber-500/25 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[11px] text-amber-300 font-medium block">
                  {t('bep_price_label')} ({sellPriceFormat === 'perWL' ? t('unit_per_wl') : t('unit_wl_each')}):
                </span>
                <p className="text-lg font-bold text-amber-400 mt-0.5">
                  {formatBEP(bepActive, sellPriceFormat)}
                </p>
              </div>
              {activeRate > 0 && (
                <div className="text-right">
                  <span className="text-[10px] text-gray-400 block">{t('bep_cost_per_item', { currency: currentCurrency.code })}</span>
                  <span className="text-xs font-bold text-white">
                    {currentCurrency.formatUnit((totalInvestmentWL * activeRate) / effectiveOutput)}
                  </span>
                </div>
              )}
            </div>

            {/* Comparison: Sell Seed vs Sell Block */}
            {(finalSplicingSeeds > 0 || estimatedHarvestBlocks > 0) && (
              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                {finalSplicingSeeds > 0 && (
                  <div className="p-2 bg-gray-750/70 border border-gray-700 rounded-lg">
                    <span className="text-[10px] text-gray-400 block mb-0.5">{t('bep_if_sell_seed')}</span>
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
                    <span className="text-[10px] text-gray-400 block mb-0.5">{t('bep_if_sell_block')}</span>
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
            {t('bep_empty_hint')}
          </p>
        )}
      </div>

      {/* Currency Conversion Card (Matches current language & country) */}
      <div className="bg-gray-800 border border-gray-700/80 rounded-2xl p-3.5 space-y-2.5 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-white flex items-center gap-2">
            <FlagIcon code={currentCurrency.flag} className="w-4 h-3 rounded-sm shadow-sm" />
            {t('currency_conversion_title', { currency: currentCurrency.name })}
          </span>
          {activeRate > 0 && cleanProfitWL !== 0 && (
            <span className={`text-xs font-bold ${cleanProfitWL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {currentCurrency.format(cleanProfitConverted)}
            </span>
          )}
        </div>

        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-semibold select-none">
            {currentCurrency.symbol}
          </span>
          <input
            type="number"
            step={currentCurrency.decimals > 0 ? "0.01" : "1"}
            value={activeRate || ''}
            onChange={(e) => handleRateChange(parseFloat(e.target.value) || 0)}
            placeholder={currentCurrency.defaultPlaceholder}
            className="w-full pl-9 pr-14 py-2 bg-gray-700/80 border border-gray-600 rounded-lg text-white font-semibold text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 select-none">
            / WL
          </span>
        </div>

        {activeRate > 0 && (
          <div className="pt-2 border-t border-gray-700/70 space-y-1 text-xs">
            <div className="flex justify-between items-center text-gray-300">
              <span>{t('currency_profit_label')}</span>
              <span className={`font-bold ${cleanProfitWL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {currentCurrency.format(cleanProfitConverted)}
              </span>
            </div>
            {totalInvestmentWL > 0 && (
              <div className="flex justify-between items-center text-gray-400 text-[11px]">
                <span>{t('currency_modal_label')}</span>
                <span>{currentCurrency.format(totalInvestmentConverted)}</span>
              </div>
            )}
            {revenueWL > 0 && (
              <div className="flex justify-between items-center text-gray-400 text-[11px]">
                <span>{t('currency_revenue_label')}</span>
                <span>{currentCurrency.format(revenueConverted)}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Detail Cost Breakdown Card */}
      <div className="bg-gray-800 border border-gray-700/80 rounded-2xl p-3.5 space-y-2.5 shadow-sm">
        <h3 className="text-xs font-semibold text-gray-300">{t('cost_breakdown_title')}</h3>

        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between items-center p-2 bg-gray-750/70 rounded-lg">
            <span className="text-gray-400">{t('cost_seeds')}</span>
            <span className="font-semibold text-white">{fmtWL(totalSeedCostWL)} WL</span>
          </div>

          {totalFuelCostWL > 0 && (
            <div className="flex justify-between items-center p-2 bg-gray-750/70 rounded-lg">
              <span className="text-gray-400">{t('cost_fuel')}</span>
              <span className="font-semibold text-yellow-400">{fmtWL(totalFuelCostWL)} WL</span>
            </div>
          )}

          {totalTmGemsCostWL > 0 && (
            <div className="flex justify-between items-center p-2 bg-gray-750/70 rounded-lg">
              <span className="text-gray-400">{t('cost_tm_gems')} ({formatNumberLocalized(totalTmGemsAmount)}):</span>
              <span className="font-semibold text-cyan-400">{fmtWL(totalTmGemsCostWL)} WL</span>
            </div>
          )}

          <div className="flex justify-between items-center p-2 bg-gray-700/50 rounded-lg border border-gray-650 font-bold">
            <span className="text-gray-200">{t('cost_total_investment')}</span>
            <span className="text-red-400">{fmtWL(totalInvestmentWL)} WL</span>
          </div>
        </div>
      </div>
    </div>
  );
}
