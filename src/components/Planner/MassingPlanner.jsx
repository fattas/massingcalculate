import { useState, useEffect } from 'react';
import RecipeStep from './RecipeStep';
import FinancialSummary from './FinancialSummary';
import SharePlan from './SharePlan';
import { createDefaultStep, createDefaultPlan } from '../../data/growtopiaItems';
import { useLocalStorage, useSavedPlans } from '../../hooks/useLocalStorage';
import { extractPlanFromURL } from '../../utils/sharing';
import { fmtWL, calculateStep, formatNumber } from '../../utils/calculations';
import { FiPlus, FiSave, FiFolder, FiTrash2 } from 'react-icons/fi';

export default function MassingPlanner() {
  const [plan, setPlan] = useLocalStorage('gt-current-plan', createDefaultPlan());
  const { plans: savedPlans, savePlan, deletePlan } = useSavedPlans();
  const [showSavedPlans, setShowSavedPlans] = useState(false);
  const [saveNotice, setSaveNotice] = useState('');

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

  const handleSavePlan = () => {
    savePlan(plan);
    setSaveNotice('Tersimpan!');
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

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Plan Header */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1">
            <input
              type="text"
              value={plan.name}
              onChange={(e) => updatePlan({ name: e.target.value })}
              placeholder="Nama Plan Massing..."
              className="w-full text-xl font-bold bg-transparent border-none outline-none text-white placeholder-gray-500"
            />
            <input
              type="text"
              value={plan.description || ''}
              onChange={(e) => updatePlan({ description: e.target.value })}
              placeholder="Deskripsi singkat (opsional)..."
              className="w-full text-sm bg-transparent border-none outline-none text-gray-400 placeholder-gray-600 mt-1"
            />
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleNewPlan}
              className="flex items-center gap-1.5 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-sm transition-colors"
              title="Plan Baru"
            >
              <FiPlus className="w-4 h-4" /> Baru
            </button>
            <button
              onClick={handleSavePlan}
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
            >
              <FiSave className="w-4 h-4" />
              {saveNotice || 'Simpan'}
            </button>
            <button
              onClick={() => setShowSavedPlans(!showSavedPlans)}
              className="flex items-center gap-1.5 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-sm transition-colors"
            >
              <FiFolder className="w-4 h-4" /> Plans ({savedPlans.length})
            </button>
            <SharePlan plan={plan} onImport={handleImportPlan} />
          </div>
        </div>

        {/* Saved Plans Drawer */}
        {showSavedPlans && savedPlans.length > 0 && (
          <div className="border-t border-gray-700 pt-3 space-y-2 animate-fade-in">
            <h3 className="text-sm font-semibold text-gray-400">Plans Tersimpan:</h3>
            {savedPlans.map((sp) => (
              <div key={sp.id} className="flex items-center justify-between p-2 bg-gray-700/50 rounded-lg">
                <button
                  onClick={() => handleLoadPlan(sp)}
                  className="text-left flex-1 hover:text-green-400 transition-colors"
                >
                  <p className="text-sm text-white font-medium">{sp.name}</p>
                  <p className="text-xs text-gray-400">
                    {sp.steps?.length || 0} steps • Disimpan: {new Date(sp.savedAt).toLocaleDateString('id-ID')}
                  </p>
                </button>
                <button
                  onClick={() => deletePlan(sp.id)}
                  className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors"
                >
                  <FiTrash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main Content: 2 Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Steps */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Tahapan Splicing & Farm</h2>
            <button
              onClick={addStep}
              className="flex items-center gap-1.5 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <FiPlus className="w-4 h-4" /> Tambah Step
            </button>
          </div>

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
                onRemove={() => removeStep(index)}
                isOnly={plan.steps.length === 1}
              />
            );
          })}
        </div>

        {/* Right: Financial Summary & Settings */}
        <div className="space-y-4">
          {/* Global Settings */}
          {(() => {
            const stepResults = (plan.steps || []).map(s => calculateStep(s));
            const finalStep = stepResults[stepResults.length - 1];
            const finalSplicingSeeds = finalStep ? finalStep.seedsAfterHarvest : 0;
            const finalStepItem = plan.steps[plan.steps.length - 1]?.resultItemName;
            const multiplier = plan.harvestBlockMultiplier !== undefined ? plan.harvestBlockMultiplier : 2.77;
            const estimatedHarvestBlocks = finalSplicingSeeds > 0 && multiplier > 0
              ? Math.floor(finalSplicingSeeds * multiplier)
              : 0;

            return (
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 space-y-3">
                <h3 className="text-sm font-semibold text-white">Pengaturan Penjualan</h3>

                {/* Fitur Estimasi Harvest Block Step Akhir (2 Field: Statis & Acuan Manual) */}
                <div className="p-3 bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-yellow-500/10 border border-green-500/30 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-green-300 flex items-center gap-1.5">
                      🌾 Estimasi Harvest Block (Step {plan.steps.length})
                    </span>
                    {finalStepItem && (
                      <span className="text-[11px] text-gray-300 bg-gray-800/80 px-2 py-0.5 rounded truncate max-w-[140px]">
                        {finalStepItem}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    {/* Field 1: Final Splicing (Hasil Break Akhir) - Statis */}
                    <div>
                      <label className="block text-[11px] font-medium text-gray-400 mb-1">
                        Final Splicing (Hasil Break)
                      </label>
                      <input
                        type="text"
                        readOnly
                        value={finalSplicingSeeds > 0 ? `${formatNumber(finalSplicingSeeds)} seeds` : '0 seeds'}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-green-400 font-bold text-sm cursor-not-allowed select-none"
                        title="Nilai statis yang didapat dari sistem yang telah dihitung"
                      />
                      <p className="text-[10px] text-gray-500 mt-0.5">Statis (dari sistem)</p>
                    </div>

                    {/* Field 2: Acuan / Pengali (Bisa diisi manual) */}
                    <div>
                      <label className="block text-[11px] font-medium text-gray-400 mb-1">
                        Acuan (Block per Tree)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={plan.harvestBlockMultiplier ?? ''}
                        onChange={(e) => updatePlan({ harvestBlockMultiplier: parseFloat(e.target.value) || 0 })}
                        placeholder="Misal: 2.77"
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      />
                      <p className="text-[10px] text-gray-500 mt-0.5">Manual (misal: 2.77)</p>
                    </div>
                  </div>

                  {/* Hasil Estimasi Harvest Block & Tombol */}
                  {estimatedHarvestBlocks > 0 && (
                    <div className="p-2.5 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[11px] text-yellow-300 font-medium">Estimasi Harvest Block:</p>
                        <p className="text-lg font-bold text-yellow-400 truncate">
                          {formatNumber(estimatedHarvestBlocks)} <span className="text-xs font-normal text-gray-400">blocks</span>
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => updatePlan({ totalFinalOutput: estimatedHarvestBlocks })}
                        className="px-2.5 py-1.5 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-xs font-medium transition-colors shadow-sm flex-shrink-0"
                        title="Gunakan estimasi block ini sebagai Total Hasil Akhir penjualan"
                      >
                        Pakai Block ➔
                      </button>
                    </div>
                  )}

                  {finalSplicingSeeds > 0 && (
                    <div className="flex items-center justify-between pt-1 text-[11px] text-gray-400 border-t border-gray-700/50">
                      <span>Mau jual berupa seed?</span>
                      <button
                        type="button"
                        onClick={() => updatePlan({ totalFinalOutput: finalSplicingSeeds })}
                        className="text-green-400 hover:underline font-medium"
                      >
                        Pakai Seed ({formatNumber(finalSplicingSeeds)}) ➔
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Total Hasil Akhir (item)</label>
                  <input
                    type="number"
                    value={plan.totalFinalOutput || ''}
                    onChange={(e) => updatePlan({ totalFinalOutput: parseInt(e.target.value) || 0 })}
                    placeholder={finalSplicingSeeds > 0 ? `${finalSplicingSeeds}` : 'Jumlah produk jadi'}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Harga Jual</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={plan.sellPrice || ''}
                      onChange={(e) => updatePlan({ sellPrice: parseFloat(e.target.value) || 0 })}
                      placeholder={plan.sellPriceFormat === 'perWL' ? 'Contoh: 50' : 'Contoh: 3'}
                      className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <select
                      value={plan.sellPriceFormat || 'perWL'}
                      onChange={(e) => updatePlan({ sellPriceFormat: e.target.value })}
                      className="px-2 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white focus:outline-none min-w-[110px]"
                    >
                      <option value="perWL">qty / WL</option>
                      <option value="each">WL each</option>
                    </select>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {plan.sellPriceFormat === 'perWL'
                      ? 'Misal: 50/wl berarti 50 item per 1 WL'
                      : 'Misal: 3 WL each berarti 1 item = 3 WL'}
                  </p>
                  {plan.sellPrice > 0 && (plan.totalFinalOutput > 0 || finalSplicingSeeds > 0) && (
                    <p className="text-xs text-green-400 mt-1">
                      Estimasi pendapatan: {fmtWL(plan.sellPriceFormat === 'perWL'
                        ? (plan.totalFinalOutput || finalSplicingSeeds) / plan.sellPrice
                        : (plan.totalFinalOutput || finalSplicingSeeds) * plan.sellPrice
                      )} WL
                    </p>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Financial Summary */}
          <FinancialSummary plan={plan} onUpdatePlan={updatePlan} />
        </div>
      </div>
    </div>
  );
}
