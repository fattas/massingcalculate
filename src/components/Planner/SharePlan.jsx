import { useState, useRef } from 'react';
import { generateShareURL, generatePlanCode, importPlanCode, exportPlanJSON, importPlanJSON } from '../../utils/sharing';
import { FiShare2, FiCopy, FiDownload, FiUpload, FiCheck, FiLink, FiX } from 'react-icons/fi';

export default function SharePlan({ plan, onImport }) {
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
      setImportError('Masukkan kode terlebih dahulu');
      return;
    }
    const result = importPlanCode(importCode.trim());
    if (result) {
      onImport(result);
      setImportCode('');
      setImportError('');
      setShowModal(false);
    } else {
      setImportError('Kode tidak valid atau rusak');
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
        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
      >
        <FiShare2 className="w-4 h-4" />
        Share / Export
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl max-w-lg w-full p-6 space-y-5 animate-fade-in">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <FiShare2 className="text-green-400" />
                Share & Export Plan
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white p-1">
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleCopyURL}
                className="w-full flex items-center gap-3 p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              >
                {copied === 'url' ? <FiCheck className="w-5 h-5 text-green-400" /> : <FiLink className="w-5 h-5 text-blue-400" />}
                <div className="text-left flex-1">
                  <p className="text-sm font-medium text-white">
                    {copied === 'url' ? 'Link Tersalin!' : 'Salin Link Share'}
                  </p>
                  <p className="text-xs text-gray-400">Kirim link ini ke teman, langsung bisa dibuka di browser</p>
                </div>
              </button>

              <button
                onClick={handleCopyCode}
                className="w-full flex items-center gap-3 p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              >
                {copied === 'code' ? <FiCheck className="w-5 h-5 text-green-400" /> : <FiCopy className="w-5 h-5 text-purple-400" />}
                <div className="text-left flex-1">
                  <p className="text-sm font-medium text-white">
                    {copied === 'code' ? 'Kode Tersalin!' : 'Salin Kode Plan'}
                  </p>
                  <p className="text-xs text-gray-400">Kode pendek untuk di-paste via Discord/WhatsApp</p>
                </div>
              </button>

              <button
                onClick={handleExportJSON}
                className="w-full flex items-center gap-3 p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              >
                <FiDownload className="w-5 h-5 text-yellow-400" />
                <div className="text-left flex-1">
                  <p className="text-sm font-medium text-white">Download JSON</p>
                  <p className="text-xs text-gray-400">Simpan sebagai file backup di komputer</p>
                </div>
              </button>
            </div>

            <div className="border-t border-gray-700 pt-4">
              <h3 className="text-sm font-semibold text-gray-300 mb-3">Import Plan</h3>

              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={importCode}
                  onChange={(e) => { setImportCode(e.target.value); setImportError(''); }}
                  placeholder="Paste kode plan di sini..."
                  className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <button
                  onClick={handleImportCode}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Import
                </button>
              </div>

              {importError && (
                <p className="text-xs text-red-400 mb-2">{importError}</p>
              )}

              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center gap-3 p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              >
                <FiUpload className="w-5 h-5 text-cyan-400" />
                <div className="text-left flex-1">
                  <p className="text-sm font-medium text-white">Import dari File JSON</p>
                  <p className="text-xs text-gray-400">Buka file plan .json dari komputer</p>
                </div>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImportJSON}
                className="hidden"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

