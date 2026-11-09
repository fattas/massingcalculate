import { useState, useEffect } from 'react';
import RecipeStep from './RecipeStep';
import FinancialSummary from './FinancialSummary';
import SharePlan from './SharePlan';
import ConfirmModal from '../Common/ConfirmModal';
import NumericInput from '../Common/NumericInput';
import { createDefaultStep, createDefaultPlan } from '../../data/growtopiaItems';
import { useLocalStorage, useSavedPlans } from '../../hooks/useLocalStorage';
import { extractPlanFromURL } from '../../utils/sharing';
import { fmtWL, calculateStep, calculateBEP, formatBEP } from '../../utils/calculations';
import { useLanguage } from '../../i18n/LanguageContext';
import { FiPlus, FiSave, FiFolder, FiTrash2, FiCopy, FiCheckCircle } from 'react-icons/fi';

export default function MassingPlanner() {
  const { t, formatNumberLocalized, language } = useLanguage();
  const [plan, setPlan] = useLocalStorage('gt-current-plan', createDefaultPlan());
  const { plans: savedPlans, savePlan, deletePlan } = useSavedPlans();
  const [showSavedPlans, setShowSavedPlans] = useState(false);
  const [saveNotice, setSaveNotice] = useState('');
  const [stepToDelete, setStepToDelete] = useState(null);
  const [planToDelete, setPlanToDelete] = useState(null);

  // Check URL for shared plan on mount
  useEffect(() => {
    const sharedPlan = extractPlanFromURL();
    if (sharedPlan) {
      setPlan({ ...createDefaultPlan(), ...sharedPlan, id: Date.now().toString() });
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const updatePlan = (updates) => {
    setPlan(prev => ({ ...prev, ...updates, updatedAt: new Date().toISOString() }));
  };

  const addStep = () => {
    updatePlan({ steps: [...plan.steps, createDefaultStep()] });
  };

  const updateStep = (index, updatedStep) => {
    const newSteps = [...plan.steps];
    newSteps[index] = updatedStep;
    updatePlan({ steps: newSteps });
  };

  const removeStep = (index) => {
    const newSteps = plan.steps.filter((_, i) => i !== index);
    updatePlan({ steps: newSteps.length > 0 ? newSteps : [createDefaultStep()] });
  };

  const handleToggleAllSteps = (isExpanded) => {
    const newSteps = (plan.steps || []).map((s) => ({
      ...s,
      isExpanded,
    }));
    updatePlan({ steps: newSteps });
  };

  const handleSavePlan = () => {
    savePlan(plan);
    setSaveNotice(t('common_saved'));
    setTimeout(() => setSaveNotice(''), 2000);
  };

  const handleLoadPlan = (savedPlan) => {
    setPlan(savedPlan);
    setShowSavedPlans(false);
  };

  const handleImportPlan = (importedPlan) => {
    setPlan({ ...createDefaultPlan(), ...importedPlan, id: Date.now().toString() });
  };

  const handleNewPlan = () => {
    setPlan(createDefaultPlan());
  };

  const duplicatePlan = (targetPlan) => {
    const clonedSteps = (targetPlan.steps || []).map((step, idx) => ({
      ...step,
      id: Date.now().toString() + '_' + idx + '_' + Math.random().toString(36).substring(2, 7),
      isCompleted: false,
      isExpanded: step.isExpanded !== undefined ? step.isExpanded : true,
      seed1ExtraPurchases: (step.seed1ExtraPurchases || []).map((p, pIdx) => ({
        ...p,
        id: Date.now().toString() + '_p1_' + pIdx + '_' + Math.random().toString(36).substring(2, 6),
      })),
      seed2ExtraPurchases: (step.seed2ExtraPurchases || []).map((p, pIdx) => ({
        ...p,
        id: Date.now().toString() + '_p2_' + pIdx + '_' + Math.random().toString(36).substring(2, 6),
      })),
    }));

    const newPlan = {
      ...targetPlan,
      id: Date.now().toString() + Math.random().toString(36).substring(2, 7),
      name: `${targetPlan.name || 'Untitled Plan'} (Copy)`,
      steps: clonedSteps,
      shoppingTrackers: (targetPlan.shoppingTrackers || []).map((t, tIdx) => ({
        ...t,
        id: Date.now().toString() + '_t_' + tIdx + '_' + Math.random().toString(36).substring(2, 6),
        purchases: (t.purchases || []).map((p, pIdx) => ({
          ...p,
          id: Date.now().toString() + '_tp_' + pIdx + '_' + Math.random().toString(36).substring(2, 6),
        })),
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return newPlan;
  };

  const handleDuplicateCurrentPlan = () => {
    const duplicated = duplicatePlan(plan);
    setPlan(duplicated);
    savePlan(duplicated);
    setSaveNotice(t('common_duplicated'));
    setTimeout(() => setSaveNotice(''), 2500);
  };

  const handleDuplicateSavedPlan = (sp, e) => {
    e.stopPropagation();
    const duplicated = duplicatePlan(sp);
    savePlan(duplicated);
    setSaveNotice(t('common_duplicated'));
    setTimeout(() => setSaveNotice(''), 2500);
  };

  const duplicateStep = (index) => {
    const stepToClone = plan.steps[index];
    const clonedStep = {
      ...stepToClone,
      id: Date.now().toString() + Math.random().toString(36).substring(2, 7),
      name: stepToClone.name ? `${stepToClone.name} (Copy)` : '',
      isCompleted: false,
      isExpanded: true,
      seed1ExtraPurchases: (stepToClone.seed1ExtraPurchases || []).map((p, pIdx) => ({
        ...p,
        id: Date.now().toString() + '_p1_' + pIdx + '_' + Math.random().toString(36).substring(2, 6),
      })),
      seed2ExtraPurchases: (stepToClone.seed2ExtraPurchases || []).map((p, pIdx) => ({
        ...p,
        id: Date.now().toString() + '_p2_' + pIdx + '_' + Math.random().toString(36).substring(2, 6),
      })),
    };
    const newSteps = [...plan.steps];
    newSteps.splice(index + 1, 0, clonedStep);
    updatePlan({ steps: newSteps });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Plan Header Card */}
      <div className="bg-gray-800 border border-gray-700/80 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <input
              type="text"
              value={plan.name}
              onChange={(e) => updatePlan({ name: e.target.value })}
              placeholder={t('plan_name_placeholder')}
              className="w-full text-xl sm:text-2xl font-bold bg-transparent border-none outline-none text-white placeholder-gray-500"
            />
            <input
              type="text"
              value={plan.description || ''}
              onChange={(e) => updatePlan({ description: e.target.value })}
              placeholder={t('plan_desc_placeholder')}
              className="w-full text-xs sm:text-sm bg-transparent border-none outline-none text-gray-400 placeholder-gray-600 mt-0.5"
            />
          </div>

          {/* Action Button Bar */}
          <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
            <button
              onClick={handleNewPlan}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-750 hover:bg-gray-700 border border-gray-650 text-gray-300 rounded-lg text-xs font-semibold transition-colors"
              title={t('common_new')}
            >
              <FiPlus className="w-3.5 h-3.5" /> {t('common_new')}
            </button>
            <button
              onClick={handleSavePlan}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm"
            >
              <FiSave className="w-3.5 h-3.5" />
              {saveNotice || t('common_save')}
            </button>
            <button
              onClick={handleDuplicateCurrentPlan}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-750 hover:bg-gray-700 border border-gray-650 text-gray-300 hover:text-amber-300 rounded-lg text-xs font-semibold transition-colors"
              title={t('common_duplicate')}
            >
              <FiCopy className="w-3.5 h-3.5 text-amber-400" /> {t('common_duplicate')}
            </button>
            <button
              onClick={() => setShowSavedPlans(!showSavedPlans)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-750 hover:bg-gray-700 border border-gray-650 text-gray-300 rounded-lg text-xs font-semibold transition-colors"
            >
              <FiFolder className="w-3.5 h-3.5" /> {t('common_plans')} ({savedPlans.length})
            </button>
            <SharePlan plan={plan} onImport={handleImportPlan} />
          </div>
        </div>

        {/* Saved Plans Drawer */}
        {showSavedPlans && savedPlans.length > 0 && (
          <div className="border-t border-gray-700/80 pt-3 space-y-2 animate-fade-in">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-gray-400">{t('saved_plans_title')}</h3>
              {saveNotice && (
                <span className="text-xs text-emerald-400 font-medium animate-fade-in">
                  ✓ {saveNotice}
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {savedPlans.map((sp) => (
                <div key={sp.id} className="flex items-center justify-between p-2.5 bg-gray-750/70 hover:bg-gray-750 border border-gray-700/60 rounded-xl transition-colors">
                  <button
                    onClick={() => handleLoadPlan(sp)}
                    className="text-left flex-1 min-w-0 mr-2"
                  >
                    <p className="text-xs font-semibold text-white truncate">{sp.name}</p>
                    <p className="text-[11px] text-gray-400">
                      {sp.steps?.length || 0} {t('common_steps')} • {new Date(sp.savedAt).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US')}
                    </p>
                  </button>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={(e) => handleDuplicateSavedPlan(sp, e)}
                      className="p-1.5 text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 rounded-lg transition-colors"
                      title={t('common_duplicate')}
                    >
                      <FiCopy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPlanToDelete(sp);
                      }}
                      className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                      title={t('common_delete')}
                    >
                      <FiTrash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Content: 2 Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Steps Section */}
        <div className="lg:col-span-2 space-y-4">
          {(() => {
            const totalSteps = plan.steps?.length || 0;
            const completedSteps = (plan.steps || []).filter((s) => s.isCompleted).length;
            const completedPercent = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
            return (
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-base sm:text-lg font-bold text-white">{t('steps_title')}</h2>
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-gray-800 text-gray-300 border border-gray-700">
                      {completedSteps} / {totalSteps} {t('common_done')}
                    </span>
                    {completedSteps === totalSteps && totalSteps > 0 && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        {t('steps_completed_all')}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    {totalSteps > 1 && (
                      <div className="flex items-center bg-gray-800 p-0.5 rounded-lg border border-gray-700 text-xs">
                        <button
                          type="button"
                          onClick={() => handleToggleAllSteps(false)}
                          className="px-2.5 py-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors text-[11px] font-medium"
                          title={t('steps_collapse_all')}
                        >
                          {t('steps_collapse_all')}
                        </button>
                        <span className="text-gray-600">|</span>
                        <button
                          type="button"
                          onClick={() => handleToggleAllSteps(true)}
                          className="px-2.5 py-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors text-[11px] font-medium"
                          title={t('steps_expand_all')}
                        >
                          {t('steps_expand_all')}
                        </button>
                      </div>
                    )}
                    <button
                      onClick={addStep}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm"
                    >
                      <FiPlus className="w-3.5 h-3.5" /> {t('steps_add_step')}
                    </button>
                  </div>
                </div>

                {/* Progress Bar Pengerjaan Step */}
                {totalSteps > 0 && (
                  <div className="bg-gray-800 border border-gray-700/80 rounded-xl p-3 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400 font-medium flex items-center gap-1.5">
                        <FiCheckCircle className={completedPercent === 100 ? 'text-emerald-400' : 'text-blue-400'} />
                        {t('progress_label')}: <strong className="text-white">{completedSteps} {t('progress_of')} {totalSteps} {t('common_steps')}</strong>
                      </span>
                      <span className={`font-bold ${completedPercent === 100 ? 'text-emerald-400' : 'text-white'}`}>
                        {completedPercent}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          completedPercent === 100
                            ? 'bg-emerald-500'
                            : 'bg-gradient-to-r from-blue-500 to-emerald-500'
                        }`}
                        style={{ width: `${completedPercent}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Steps List */}
          {plan.steps.map((step, index) => {
            const prevStepResult = index > 0 ? calculateStep(plan.steps[index - 1]) : null;
            return (
              <RecipeStep
                key={step.id}
                step={step}
                index={index}
                prevStepSeeds={prevStepResult ? prevStepResult.seedsAfterHarvest : 0}
                onApplyPrevStep={(seeds) => {
                  updateStep(index, {
                    ...step,
                    seed1Qty: seeds,
                    seedsPlanted: seeds,
                  });
                }}
                onUpdate={(updated) => updateStep(index, updated)}
                onRemove={() => setStepToDelete({ index, name: step.name || `${t('common_step')} ${index + 1}` })}
                onDuplicate={() => duplicateStep(index)}
                isOnly={plan.steps.length === 1}
              />
            );
          })}
        </div>

        {/* Right: Settings & Financial Summary */}
        <div className="space-y-4">
          {/* Selling Settings */}
          {(() => {
            const stepResults = (plan.steps || []).map(s => calculateStep(s));
            const finalStep = stepResults[stepResults.length - 1];
            const finalSplicingSeeds = finalStep ? finalStep.seedsAfterHarvest : 0;
            const finalStepItem = plan.steps[plan.steps.length - 1]?.resultItemName;
            const hasHarvestedBlocksPlan = plan.harvestedBlocks !== undefined && plan.harvestedBlocks !== null && plan.harvestedBlocks !== '' && parseInt(plan.harvestedBlocks, 10) > 0;
            const calculatedMultiplier = finalSplicingSeeds > 0 && hasHarvestedBlocksPlan
              ? parseFloat((parseInt(plan.harvestedBlocks, 10) / finalSplicingSeeds).toFixed(4))
              : (plan.harvestBlockMultiplier !== undefined ? plan.harvestBlockMultiplier : 2.77);

            const estimatedHarvestBlocks = hasHarvestedBlocksPlan
              ? parseInt(plan.harvestedBlocks, 10)
              : (finalSplicingSeeds > 0 && calculatedMultiplier > 0 ? Math.floor(finalSplicingSeeds * calculatedMultiplier) : 0);
            const totalCostWL = stepResults.reduce((sum, r) => sum + r.totalCostWL, 0);
            const effectiveSellOutput = plan.totalFinalOutput > 0 ? plan.totalFinalOutput : finalSplicingSeeds;
            const bep = calculateBEP(totalCostWL, effectiveSellOutput, plan.sellPriceFormat || 'perWL');
            const bepRounded = bep > 0
              ? (plan.sellPriceFormat === 'each' && bep < 0.1 ? parseFloat(bep.toFixed(4)) : parseFloat(fmtWL(bep)))
              : 0;

            return (
              <div className="bg-gray-800 border border-gray-700/80 rounded-2xl p-4 space-y-3.5 shadow-sm">
                <h3 className="text-sm font-semibold text-white">{t('sell_settings_title')}</h3>

                {/* Final Output Estimation Card */}
                <div className="p-3 bg-gray-750/50 border border-gray-700 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-emerald-400">
                      {t('final_harvest_title')} ({t('common_step')} {plan.steps.length})
                    </span>
                    {finalStepItem && (
                      <span className="text-[11px] text-gray-300 bg-gray-700 px-2 py-0.5 rounded truncate max-w-[130px]">
                        {finalStepItem}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-medium text-gray-400 mb-1">
                        {t('splicing_result_label')}
                      </label>
                      <input
                        type="text"
                        readOnly
                        value={finalSplicingSeeds > 0 ? `${formatNumberLocalized(finalSplicingSeeds)} ${t('common_seeds')}` : `0 ${t('common_seeds')}`}
                        className="w-full px-2.5 py-1.5 bg-gray-700/80 border border-gray-600 rounded-lg text-emerald-400 font-bold text-xs select-none"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-medium text-gray-400">
                          {t('final_harvest_blocks_label')}
                        </label>
                        {finalSplicingSeeds > 0 && (plan.harvestedBlocks > 0 || calculatedMultiplier > 0) && (
                          <span className="text-[10px] font-bold text-yellow-400 bg-yellow-500/10 px-1.5 py-0.2 rounded border border-yellow-500/30">
                            {t('block_ratio_badge', { ratio: calculatedMultiplier })}
                          </span>
                        )}
                      </div>
                      <NumericInput
                        value={plan.harvestedBlocks}
                        onChange={(v) => updatePlan({ harvestedBlocks: v })}
                        allowDecimal={false}
                        min={0}
                        placeholder={finalSplicingSeeds > 0 ? `${Math.floor(finalSplicingSeeds * 2.77)}` : t('harvested_blocks_placeholder')}
                        className="w-full px-2.5 py-1.5 bg-gray-700/80 border border-gray-600 rounded-lg text-white font-semibold text-xs focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Estimation Results & Action Pills */}
                  {estimatedHarvestBlocks > 0 && (
                    <div className="p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-[10px] text-yellow-300 block">{t('estimated_blocks_label')}</span>
                        <p className="text-sm font-bold text-yellow-400 truncate">
                          {formatNumberLocalized(estimatedHarvestBlocks)} <span className="text-xs font-normal text-gray-400">{t('common_blocks')}</span>
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => updatePlan({ totalFinalOutput: estimatedHarvestBlocks })}
                        className="px-2.5 py-1 bg-yellow-600 hover:bg-yellow-500 text-white rounded text-xs font-semibold transition-colors flex-shrink-0"
                      >
                        {t('use_blocks_btn')}
                      </button>
                    </div>
                  )}

                  {finalSplicingSeeds > 0 && (
                    <div className="flex items-center justify-between text-xs pt-1 border-t border-gray-700">
                      <span className="text-gray-400 text-[11px]">{t('sell_as_seeds_question')}</span>
                      <button
                        type="button"
                        onClick={() => updatePlan({ totalFinalOutput: finalSplicingSeeds })}
                        className="text-emerald-400 hover:underline text-xs font-semibold"
                      >
                        {t('use_seeds_btn')} ({formatNumberLocalized(finalSplicingSeeds)}) ➔
                      </button>
                    </div>
                  )}
                </div>

                {/* Total Quantity & Price Inputs */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">{t('total_final_output_label')}</label>
                    <NumericInput
                      value={plan.totalFinalOutput}
                      onChange={(v) => updatePlan({ totalFinalOutput: v })}
                      allowDecimal={false}
                      min={0}
                      placeholder={finalSplicingSeeds > 0 ? `${finalSplicingSeeds}` : t('total_final_output_placeholder')}
                      className="w-full px-3 py-2 bg-gray-700/80 border border-gray-600 rounded-lg text-white text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">{t('sell_price_label')}</label>
                    <div className="flex gap-2">
                      <NumericInput
                        value={plan.sellPrice}
                        onChange={(v) => updatePlan({ sellPrice: v })}
                        allowDecimal={true}
                        min={0}
                        placeholder={plan.sellPriceFormat === 'perWL' ? '50' : '3'}
                        className="flex-1 px-3 py-2 bg-gray-700/80 border border-gray-600 rounded-lg text-white text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                      <select
                        value={plan.sellPriceFormat || 'perWL'}
                        onChange={(e) => updatePlan({ sellPriceFormat: e.target.value })}
                        className="px-2 py-2 bg-gray-700/80 border border-gray-600 rounded-lg text-xs text-white focus:outline-none min-w-[95px]"
                      >
                        <option value="perWL">{t('unit_per_wl')}</option>
                        <option value="each">{t('unit_wl_each')}</option>
                      </select>
                    </div>

                    {plan.sellPrice > 0 && (plan.totalFinalOutput > 0 || finalSplicingSeeds > 0) && (
                      <div className="flex items-center justify-between text-xs mt-1.5 text-emerald-400">
                        <span>{t('estimated_revenue_label')}</span>
                        <span className="font-bold">
                          {fmtWL(plan.sellPriceFormat === 'perWL'
                            ? (plan.totalFinalOutput || finalSplicingSeeds) / plan.sellPrice
                            : (plan.totalFinalOutput || finalSplicingSeeds) * plan.sellPrice
                          )} WL
                        </span>
                      </div>
                    )}

                    {bep > 0 && (
                      <div className="flex items-center justify-between text-xs mt-2 p-2 bg-amber-500/10 border border-amber-500/25 rounded-lg">
                        <span className="text-amber-300 font-medium">
                          {t('bep_label')} <strong>{formatBEP(bep, plan.sellPriceFormat || 'perWL')}</strong>
                        </span>
                        {plan.sellPrice !== bepRounded && (
                          <button
                            type="button"
                            onClick={() => updatePlan({ sellPrice: bepRounded })}
                            className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold hover:underline"
                          >
                            {t('use_bep_btn')}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Financial Summary */}
          <FinancialSummary plan={plan} onUpdatePlan={updatePlan} />
        </div>
      </div>

      {/* Confirmation Modal for Step Deletion */}
      <ConfirmModal
        isOpen={Boolean(stepToDelete)}
        onClose={() => setStepToDelete(null)}
        onConfirm={() => {
          if (stepToDelete) {
            removeStep(stepToDelete.index);
            setStepToDelete(null);
          }
        }}
        title={`${t('common_delete')} ${stepToDelete?.name}?`}
        message={t('confirm_delete_step_msg')}
        confirmText={t('common_yes_delete')}
        cancelText={t('common_cancel')}
      />

      {/* Confirmation Modal for Plan Deletion */}
      <ConfirmModal
        isOpen={Boolean(planToDelete)}
        onClose={() => setPlanToDelete(null)}
        onConfirm={() => {
          if (planToDelete) {
            deletePlan(planToDelete.id);
            setPlanToDelete(null);
          }
        }}
        title={`${t('common_delete')} "${planToDelete?.name}"?`}
        message={t('confirm_delete_plan_msg')}
        confirmText={t('common_yes_delete')}
        cancelText={t('common_cancel')}
      />
    </div>
  );
}
