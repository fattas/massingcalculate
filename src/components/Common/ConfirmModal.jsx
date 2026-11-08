import { useEffect } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { FiAlertTriangle, FiTrash2, FiX } from 'react-icons/fi';

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  type = 'danger', // 'danger' | 'warning' | 'info'
}) {
  const { t } = useLanguage();

  const finalTitle = title || t('common_confirm');
  const finalConfirmText = confirmText || t('common_yes_delete');
  const finalCancelText = cancelText || t('common_cancel');

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isDanger = type === 'danger';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      {/* Backdrop click area */}
      <div
        className="fixed inset-0 -z-10"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div className="bg-gray-800 border border-gray-700 rounded-2xl max-w-sm sm:max-w-md w-full p-5 space-y-4 shadow-2xl relative animate-scale-up">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-700/60 transition-colors"
          title={t('common_close')}
        >
          <FiX className="w-5 h-5" />
        </button>

        {/* Header with Icon */}
        <div className="flex items-start gap-3.5 pr-6">
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
              isDanger
                ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
            }`}
          >
            {isDanger ? (
              <FiTrash2 className="w-5 h-5" />
            ) : (
              <FiAlertTriangle className="w-5 h-5" />
            )}
          </div>
          <div>
            <h3 className="text-base font-bold text-white leading-snug">
              {finalTitle}
            </h3>
            <div className="text-xs text-gray-400 mt-1 leading-relaxed">
              {typeof message === 'string' ? <p>{message}</p> : message}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-700/80">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-650 text-gray-300 rounded-xl text-xs font-semibold transition-colors"
          >
            {finalCancelText}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-4 py-2 text-white rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 shadow-lg ${
              isDanger
                ? 'bg-red-600 hover:bg-red-700 shadow-red-600/30 active:scale-95'
                : 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/30 active:scale-95'
            }`}
          >
            <FiTrash2 className="w-3.5 h-3.5" />
            <span>{finalConfirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
