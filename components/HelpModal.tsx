/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
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
      className="fixed inset-0 bg-black/70 z-40 flex items-center justify-center p-4"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="bg-[#1E1E1E] border border-[rgba(255,255,255,0.1)] rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between p-4 border-b border-[rgba(255,255,255,0.1)] flex-shrink-0">
          <h2 className="text-xl font-semibold text-[#E2E2E2]">How to Use This App</h2>
          <button
            onClick={onClose}
            className="p-1.5 text-[#A8ABB4] hover:text-white rounded-md hover:bg-white/10 transition-colors"
            aria-label="Close help"
          >
            <X size={20} />
          </button>
        </header>
        
        <main className="p-6 overflow-y-auto text-[#C0C0C0] space-y-6">
          <p>
            This application allows you to chat with Gemini about the contents of specific web pages. The AI uses the URLs you provide as a knowledge base to answer your questions.
          </p>

          <div>
            <h3 className="text-lg font-semibold text-[#E2E2E2] mb-2">Step 1: Set Up Your Knowledge Base</h3>
            <p className="mb-2">
              The panel on the left side of the screen is your <strong>Knowledge Base Manager</strong>. This is where you tell the AI which documents to read.
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>
                <strong>Select a Group:</strong> Use the dropdown to switch between pre-defined sets of URLs.
              </li>
              <li>
                <strong>Add Your Own URLs:</strong> Paste a URL into the input field and click the plus button to add it to the active group. The AI will then be able to use this new page as context.
              </li>
              <li>
                <strong>Manage URLs:</strong> You can remove URLs from a group at any time by clicking the trash icon.
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-[#E2E2E2] mb-2">Step 2: Ask a Question</h3>
            <p className="mb-2">
              Once you have at least one URL in your active knowledge base group, you can start asking questions.
            </p>
             <ul className="list-disc list-inside space-y-1 pl-2">
               <li>
                 <strong>Use the Chat Input:</strong> Type your question into the text area at the bottom of the chat panel and press Enter or click the send button.
               </li>
               <li>
                 <strong>Use Suggestions:</strong> To get started quickly, click on one of the suggested prompts that appear at the beginning of a chat.
               </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-[#E2E2E2] mb-2">Step 3: Review the Response</h3>
            <p>
              The AI will generate a response based on the information found in the URLs you provided. Underneath its answer, you will see a list of <strong>"Context URLs Retrieved"</strong>. These are the specific pages the model consulted to generate its response, allowing you to verify the information.
            </p>
          </div>
        </main>

        <footer className="p-4 border-t border-[rgba(255,255,255,0.1)] flex-shrink-0 text-right">
            <button
              onClick={onClose}
              className="bg-white/[.12] hover:bg-white/20 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              Got it!
            </button>
        </footer>
      </div>
    </div>
  );
};

export default HelpModal;
