import React from 'react';
import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-xl' }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className={`w-full ${maxWidth} bg-white dark:bg-darkbg-card rounded-2xl shadow-2xl border border-gray-200 dark:border-darkbg-border overflow-hidden transition-all transform scale-100`}>
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-darkbg-border">
          <h3 className="text-base font-bold text-gray-900 dark:text-white">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-darkbg-hover transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[80vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}

export function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', confirmStyle = 'danger', loading = false }) {
  if (!isOpen) return null;

  const getBtnStyle = () => {
    if (confirmStyle === 'danger') {
      return 'bg-red-600 hover:bg-red-700 text-white';
    }
    return 'bg-navy hover:bg-navy-light text-white';
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-md">
      <div className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          {message}
        </p>
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-darkbg-border">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-darkbg hover:bg-gray-200 dark:hover:bg-darkbg-hover transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-2 ${getBtnStyle()}`}
          >
            {loading && <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}

