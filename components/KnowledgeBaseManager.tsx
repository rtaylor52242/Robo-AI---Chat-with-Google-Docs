/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useRef } from 'react';
import { Plus, Trash2, ChevronDown, X, FileText, UploadCloud } from 'lucide-react';
import { URLGroup, KnowledgeUrl, LocalDocument } from '../types';
import ConfirmationModal from './ConfirmationModal';

interface KnowledgeBaseManagerProps {
  urls: KnowledgeUrl[];
  onAddUrl: (url: string) => void;
  onRemoveUrl: (url: string) => void;
  maxUrls?: number;
  urlGroups: URLGroup[];
  activeUrlGroupId: string;
  onSetGroupId: (id: string) => void;
  onCloseSidebar?: () => void;
  documents: LocalDocument[];
  onAddDocument: (file: File) => void;
  onRemoveDocument: (docId: string) => void;
  maxDocs?: number;
  isProcessingDoc: boolean;
  docError: string | null;
}

const KnowledgeBaseManager: React.FC<KnowledgeBaseManagerProps> = ({ 
  urls, 
  onAddUrl, 
  onRemoveUrl, 
  maxUrls = 20,
  urlGroups,
  activeUrlGroupId,
  onSetGroupId,
  onCloseSidebar,
  documents,
  onAddDocument,
  onRemoveDocument,
  maxDocs = 5,
  isProcessingDoc,
  docError
}) => {
  const [currentUrlInput, setCurrentUrlInput] = useState('');
  const [urlError, setUrlError] = useState<string | null>(null);
  const [urlToDelete, setUrlToDelete] = useState<KnowledgeUrl | null>(null);
  const [docToDelete, setDocToDelete] = useState<LocalDocument | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isValidUrl = (urlString: string): boolean => {
    try {
      new URL(urlString);
      return true;
    } catch (e) {
      return false;
    }
  };

  const handleAddUrl = () => {
    if (!currentUrlInput.trim()) {
      setUrlError('URL cannot be empty.');
      return;
    }
    if (!isValidUrl(currentUrlInput)) {
      setUrlError('Invalid URL format. Please include http:// or https://');
      return;
    }
    if (urls.length >= maxUrls) {
      setUrlError(`You can add a maximum of ${maxUrls} URLs to the current group.`);
      return;
    }
    if (urls.some(item => item.url === currentUrlInput)) {
      setUrlError('This URL has already been added to the current group.');
      return;
    }
    onAddUrl(currentUrlInput);
    setCurrentUrlInput('');
    setUrlError(null);
  };

  const handleConfirmUrlDelete = () => {
    if (urlToDelete) {
      onRemoveUrl(urlToDelete.url);
      setUrlToDelete(null);
    }
  };

  const handleConfirmDocDelete = () => {
    if (docToDelete) {
      onRemoveDocument(docToDelete.id);
      setDocToDelete(null);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const fileName = file.name.toLowerCase();
      if(fileName.endsWith('.docx') || fileName.endsWith('.pdf')){
        onAddDocument(file);
      } else {
        alert('Please upload a valid .docx or .pdf file.');
      }
    }
    // Reset file input to allow uploading the same file again
    if(event.target) event.target.value = '';
  };

  const activeGroupName = urlGroups.find(g => g.id === activeUrlGroupId)?.name || "Unknown Group";

  return (
    <div className="p-4 bg-[#1E1E1E] shadow-md rounded-xl h-full flex flex-col border border-[rgba(255,255,255,0.05)]">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-semibold text-[#E2E2E2]">Knowledge Base</h2>
        {onCloseSidebar && (
          <button
            onClick={onCloseSidebar}
            className="p-1 text-[#A8ABB4] hover:text-white rounded-md hover:bg-white/10 transition-colors md:hidden"
            aria-label="Close knowledge base"
          >
            <X size={24} />
          </button>
        )}
      </div>
      
      <div className="mb-3">
        <label htmlFor="url-group-select-kb" className="block text-sm font-medium text-[#A8ABB4] mb-1">
          Active Group
        </label>
        <div className="relative w-full">
          <select
            id="url-group-select-kb"
            value={activeUrlGroupId}
            onChange={(e) => onSetGroupId(e.target.value)}
            className="w-full py-2 pl-3 pr-8 appearance-none border border-[rgba(255,255,255,0.1)] bg-[#2C2C2C] text-[#E2E2E2] rounded-md focus:ring-1 focus:ring-white/20 focus:border-white/20 text-sm"
          >
            {urlGroups.map(group => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
          <ChevronDown
            className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A8ABB4] pointer-events-none"
            aria-hidden="true"
          />
        </div>
      </div>

      {/* URLs Section */}
      <div className="mb-3">
        <p className="text-sm font-medium text-[#A8ABB4] mb-1">URLs</p>
        <div className="flex items-center gap-2">
          <input
            type="url"
            value={currentUrlInput}
            onChange={(e) => { setCurrentUrlInput(e.target.value); setUrlError(null); }}
            placeholder="https://docs.example.com"
            className="flex-grow h-8 py-1 px-2.5 border border-[rgba(255,255,255,0.1)] bg-[#2C2C2C] text-[#E2E2E2] placeholder-[#777777] rounded-lg focus:ring-1 focus:ring-white/20 focus:border-white/20 transition-shadow text-sm"
            onKeyPress={(e) => e.key === 'Enter' && handleAddUrl()}
          />
          <button
            onClick={handleAddUrl}
            disabled={urls.length >= maxUrls}
            className="h-8 w-8 p-1.5 bg-white/[.12] hover:bg-white/20 text-white rounded-lg transition-colors disabled:bg-[#4A4A4A] disabled:text-[#777777] flex items-center justify-center"
            aria-label="Add URL"
          >
            <Plus size={16} />
          </button>
        </div>
        {urlError && <p className="text-xs text-[#f87171] mt-1">{urlError}</p>}
        {urls.length >= maxUrls && <p className="text-xs text-[#fbbf24] mt-1">Maximum {maxUrls} URLs reached for this group.</p>}
      </div>

      {/* Local Documents Section */}
      <div className="mb-3">
        <p className="text-sm font-medium text-[#A8ABB4] mb-1.5">Local Documents</p>
        <input 
          type="file" 
          accept=".docx,.pdf" 
          onChange={handleFileChange}
          ref={fileInputRef}
          style={{ display: 'none' }}
          disabled={documents.length >= maxDocs || isProcessingDoc}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={documents.length >= maxDocs || isProcessingDoc}
          className="w-full flex items-center justify-center gap-2 h-8 px-3 bg-white/[.12] hover:bg-white/20 text-white rounded-lg transition-colors disabled:bg-[#4A4A4A] disabled:text-[#777777] text-sm"
        >
          {isProcessingDoc ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Processing...</span>
            </>
          ) : (
            <>
              <UploadCloud size={16} />
              <span>Upload Document</span>
            </>
          )}
        </button>
        {docError && <p className="text-xs text-[#f87171] mt-1">{docError}</p>}
        {documents.length >= maxDocs && <p className="text-xs text-[#fbbf24] mt-1">Maximum {maxDocs} documents reached for this group.</p>}
      </div>

      <div className="flex-grow overflow-y-auto space-y-2 chat-container pr-1 min-h-[100px]">
        {(urls.length === 0 && documents.length === 0) && (
          <p className="text-[#777777] text-center py-3 text-sm">Add URLs or upload documents to the group "{activeGroupName}" to start querying.</p>
        )}
        {urls.map((item, index) => (
          <div key={item.url} className="flex items-center gap-3 p-2.5 bg-[#2C2C2C] border border-[rgba(255,255,255,0.05)] rounded-lg hover:shadow-sm transition-shadow">
            <span className="text-sm font-mono text-[#777777]">{String(index + 1).padStart(2, '0')}</span>
            <div className="flex-1 min-w-0">
              <a 
                href={item.url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-sm text-[#E2E2E2] hover:text-[#79B8FF] hover:underline block truncate" 
                title={item.url}
              >
                {item.title}
              </a>
            </div>
            <button 
              onClick={() => setUrlToDelete(item)}
              className="p-1 text-[#A8ABB4] hover:text-[#f87171] rounded-md hover:bg-[rgba(255,0,0,0.1)] transition-colors flex-shrink-0"
              aria-label={`Remove ${item.url}`}
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
        {documents.map((doc) => (
          <div key={doc.id} className="flex items-center gap-3 p-2.5 bg-[#2C2C2C] border border-[rgba(255,255,255,0.05)] rounded-lg hover:shadow-sm transition-shadow">
            <FileText size={16} className="text-[#A8ABB4] flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-[#E2E2E2] block truncate" title={doc.name}>
                {doc.name}
              </p>
            </div>
            <button 
              onClick={() => setDocToDelete(doc)}
              className="p-1 text-[#A8ABB4] hover:text-[#f87171] rounded-md hover:bg-[rgba(255,0,0,0.1)] transition-colors flex-shrink-0"
              aria-label={`Remove ${doc.name}`}
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
      <ConfirmationModal 
        isOpen={!!urlToDelete}
        onClose={() => setUrlToDelete(null)}
        onConfirm={handleConfirmUrlDelete}
        title="Confirm URL Deletion"
        message={`Are you sure you want to remove this URL?\n\n"${urlToDelete?.title}"`}
        confirmButtonText="Delete"
      />
      <ConfirmationModal 
        isOpen={!!docToDelete}
        onClose={() => setDocToDelete(null)}
        onConfirm={handleConfirmDocDelete}
        title="Confirm Document Deletion"
        message={`Are you sure you want to remove this document?\n\n"${docToDelete?.name}"`}
        confirmButtonText="Delete"
      />
    </div>
  );
};

export default KnowledgeBaseManager;