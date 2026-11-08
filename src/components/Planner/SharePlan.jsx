import { useState, useRef } from 'react';
import { generateShareURL, generatePlanCode, importPlanCode, exportPlanJSON, importPlanJSON } from '../../utils/sharing';
import { useLanguage } from '../../i18n/LanguageContext';
import { FiShare2, FiCopy, FiDownload, FiUpload, FiCheck, FiLink, FiX } from 'react-icons/fi';

export default function SharePlan({ plan, onImport }) {
  const { t } = useLanguage();
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(null);
  const [importCode, setImportCode] = useState('');
  const [importError, setImportError] = useState('');
  const fileInputRef = useRef(null);

  const handleCopyURL = async () => {
    const url = generateShareURL(plan);
    if (url) {
      try {
        await navigator.clipboard.writeText(url);
        setCopied('url');
        setTimeout(() => setCopied(null), 2000);
      } catch {
        const textArea = document.createElement('textarea');
        textArea.value = url;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setCopied('url');
        setTimeout(() => setCopied(null), 2000);
      }
    }
  };

  const handleCopyCode = async () => {
    const code = generatePlanCode(plan);
    if (code) {
      try {
        await navigator.clipboard.writeText(code);
        setCopied('code');
        setTimeout(() => setCopied(null), 2000);
      } catch {
        setCopied('code');
        setTimeout(() => setCopied(null), 2000);
      }
    }
  };

  const handleImportCode = () => {
    if (!importCode.trim()) {
      setImportError(t('share_import_placeholder'));
      return;
    }
    const result = importPlanCode(importCode.trim());
    if (result) {
      onImport(result);
      setImportCode('');
      setImportError('');
      setShowModal(false);
    } else {
      setImportError('Invalid plan code');
    }
  };

  const handleExportJSON = () => {
    const filename = `${plan.name || 'massing-plan'}-${new Date().toISOString().slice(0, 10)}.json`;
    exportPlanJSON(plan, filename);
  };

  const handleImportJSON = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const imported = await importPlanJSON(file);
      onImport(imported);
      setShowModal(false);
    } catch (err) {
      setImportError(err.message);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm"
      >
        <FiShare2 className="w-3.5 h-3.5" />
        {t('common_share')}
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl max-w-lg w-full p-5 sm:p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <FiShare2 className="text-emerald-400" />
                {t('share_title')}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white p-1 rounded-lg">
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5">
              <button
                onClick={handleCopyURL}
                className="w-full flex items-center gap-3 p-3 bg-gray-750 hover:bg-gray-700 border border-gray-700 rounded-xl transition-colors text-left"
              >
                {copied === 'url' ? <FiCheck className="w-5 h-5 text-emerald-400 flex-shrink-0" /> : <FiLink className="w-5 h-5 text-blue-400 flex-shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-semibold text-white">
                    {copied === 'url' ? t('common_copied') : t('share_copy_link')}
                  </p>
                  <p className="text-[11px] text-gray-400 truncate">{t('share_link_desc')}</p>
                </div>
              </button>

              <button
                onClick={handleCopyCode}
                className="w-full flex items-center gap-3 p-3 bg-gray-750 hover:bg-gray-700 border border-gray-700 rounded-xl transition-colors text-left"
              >
                {copied === 'code' ? <FiCheck className="w-5 h-5 text-emerald-400 flex-shrink-0" /> : <FiCopy className="w-5 h-5 text-purple-400 flex-shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-semibold text-white">
                    {copied === 'code' ? t('common_copied') : t('share_copy_code')}
                  </p>
                  <p className="text-[11px] text-gray-400 truncate">{t('share_code_desc')}</p>
                </div>
              </button>

              <button
                onClick={handleExportJSON}
                className="w-full flex items-center gap-3 p-3 bg-gray-750 hover:bg-gray-700 border border-gray-700 rounded-xl transition-colors text-left"
              >
                <FiDownload className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-semibold text-white">{t('share_download_json')}</p>
                  <p className="text-[11px] text-gray-400 truncate">{t('share_json_desc')}</p>
                </div>
              </button>
            </div>

            <div className="border-t border-gray-700 pt-3 space-y-2.5">
              <h3 className="text-xs font-semibold text-gray-300">{t('share_import_title')}</h3>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={importCode}
                  onChange={(e) => { setImportCode(e.target.value); setImportError(''); }}
                  placeholder={t('share_import_placeholder')}
                  className="flex-1 px-3 py-1.5 bg-gray-700/80 border border-gray-600 rounded-lg text-white text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <button
                  onClick={handleImportCode}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-colors flex-shrink-0"
                >
                  {t('share_import_btn')}
                </button>
              </div>

              {importError && (
                <p className="text-xs text-red-400">{importError}</p>
              )}

              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleImportJSON}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 py-2 bg-gray-750 hover:bg-gray-700 border border-dashed border-gray-600 text-gray-300 rounded-xl text-xs font-medium transition-colors"
                >
                  <FiUpload className="w-4 h-4 text-emerald-400" />
                  <span>{t('share_upload_json')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
