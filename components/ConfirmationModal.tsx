/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm,
  title,
  message,
  confirmButtonText = 'Confirm',
  cancelButtonText = 'Cancel'
}) => {
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="bg-[#2C2C2C] border border-[rgba(255,255,255,0.1)] rounded-xl shadow-2xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between p-4 border-b border-[rgba(255,255,255,0.1)]">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-[#f87171]" size={20} />
            <h2 className="text-lg font-semibold text-[#E2E2E2]">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#A8ABB4] hover:text-white rounded-md hover:bg-white/10 transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </header>
        
        <main className="p-6 text-sm text-[#C0C0C0]">
          <p className="whitespace-pre-wrap">{message}</p>
        </main>

        <footer className="p-4 bg-[#1E1E1E] rounded-b-xl border-t border-[rgba(255,255,255,0.1)] flex justify-end items-center gap-3">
            <button
              onClick={onClose}
              className="bg-white/[.12] hover:bg-white/20 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              {cancelButtonText}
            </button>
            <button
              onClick={onConfirm}
              className="bg-[#ef4444] hover:bg-[#dc2626] text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              {confirmButtonText}
            </button>
        </footer>
      </div>
    </div>
  );
};

export default ConfirmationModal;