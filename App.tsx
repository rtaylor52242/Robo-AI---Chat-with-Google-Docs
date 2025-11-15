/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect, useCallback } from 'react';
import { ChatMessage, MessageSender, URLGroup, KnowledgeUrl, LocalDocument } from './types';
import { generateContentWithUrlContext, getInitialSuggestions } from './services/geminiService';
import KnowledgeBaseManager from './components/KnowledgeBaseManager';
import ChatInterface from './components/ChatInterface';
import HelpModal from './components/HelpModal';
import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';

const GEMINI_DOCS_KNOWLEDGE_URLS: KnowledgeUrl[] = [
  { url: "https://ai.google.dev/gemini-api/docs", title: "Gemini API Documentation" },
  { url: "https://ai.google.dev/gemini-api/docs/quickstart", title: "Gemini API Quickstart" },
  { url: "https://ai.google.dev/gemini-api/docs/api-key", title: "Get an API Key" },
  { url: "https://ai.google.dev/gemini-api/docs/libraries", title: "SDK Libraries" },
  { url: "https://ai.google.dev/gemini-api/docs/models", title: "Gemini Models" },
  { url: "https://ai.google.dev/gemini-api/docs/pricing", title: "Pricing Information" },
  { url: "https://ai.google.dev/gemini-api/docs/rate-limits", title: "Rate Limits" },
  { url: "https://ai.google.dev/gemini-api/docs/billing", title: "Billing and Payments" },
  { url: "https://ai.google.dev/gemini-api/docs/changelog", title: "API Changelog" },
];

const MODEL_CAPABILITIES_KNOWLEDGE_URLS: KnowledgeUrl[] = [
  { url: "https://ai.google.dev/gemini-api/docs/text-generation", title: "Text Generation" },
  { url: "https://ai.google.dev/gemini-api/docs/image-generation", title: "Image Generation" },
  { url: "https://ai.google.dev/gemini-api/docs/video", title: "Video Modality" },
  { url: "https://ai.google.dev/gemini-api/docs/speech-generation", title: "Speech Generation" },
  { url: "https://ai.google.dev/gemini-api/docs/music-generation", title: "Music Generation" },
  { url: "https://ai.google.dev/gemini-api/docs/long-context", title: "Long Context" },
  { url: "https://ai.google.dev/gemini-api/docs/structured-output", title: "Structured Output (JSON)" },
  { url: "https://ai.google.dev/gemini-api/docs/thinking", title: "Model Thinking" },
  { url: "https://ai.google.dev/gemini-api/docs/function-calling", title: "Function Calling" },
  { url: "https://ai.google.dev/gemini-api/docs/document-processing", title: "Document Processing" },
  { url: "https://ai.google.dev/gemini-api/docs/image-understanding", title: "Image Understanding" },
  { url: "https://ai.google.dev/gemini-api/docs/video-understanding", title: "Video Understanding" },
  { url: "https://ai.google.dev/gemini-api/docs/audio", title: "Audio Modality" },
  { url: "https://ai.google.dev/gemini-api/docs/code-execution", title: "Code Execution" },
  { url: "https://ai.google.dev/gemini-api/docs/grounding", title: "Grounding with Google Search" },
];

const INITIAL_URL_GROUPS: URLGroup[] = [
  { id: 'gemini-overview', name: 'Gemini Docs Overview', urls: GEMINI_DOCS_KNOWLEDGE_URLS, documents: [] },
  { id: 'model-capabilities', name: 'Model Capabilities', urls: MODEL_CAPABILITIES_KNOWLEDGE_URLS, documents: [] },
];

const App: React.FC = () => {
  const [urlGroups, setUrlGroups] = useState<URLGroup[]>(INITIAL_URL_GROUPS);
  const [activeUrlGroupId, setActiveUrlGroupId] = useState<string>(INITIAL_URL_GROUPS[0].id);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);
  const [initialQuerySuggestions, setInitialQuerySuggestions] = useState<string[]>([]);
  
  const [isProcessingDoc, setIsProcessingDoc] = useState(false);
  const [docError, setDocError] = useState<string|null>(null);
  
  const MAX_URLS = 20;
  const MAX_DOCS = 5;

  const activeGroup = urlGroups.find(group => group.id === activeUrlGroupId);
  const currentUrlsForChat = activeGroup ? activeGroup.urls : [];
  const currentDocsForChat = activeGroup ? activeGroup.documents : [];

   useEffect(() => {
    // Set PDF.js worker source once
    try {
      const workerSrc = 'https://esm.sh/pdfjs-dist@4.4.178/build/pdf.worker.mjs';
      if (pdfjsLib.GlobalWorkerOptions.workerSrc !== workerSrc) {
           pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;
      }
    } catch (e) {
      console.error("Failed to set pdf.js worker source", e);
    }
   }, []);


   useEffect(() => {
    const apiKey = process.env.API_KEY;
    const currentActiveGroup = urlGroups.find(group => group.id === activeUrlGroupId);
    const welcomeMessageText = !apiKey 
        ? 'ERROR: Gemini API Key (process.env.API_KEY) is not configured. Please set this environment variable to use the application.'
        : `Welcome to Documentation Chat Bot! You're currently browsing content from: "${currentActiveGroup?.name || 'None'}". Just ask me questions, or try one of the suggestions below to get started`;
    
    setChatMessages([{
      id: `system-welcome-${activeUrlGroupId}-${Date.now()}`,
      text: welcomeMessageText,
      sender: MessageSender.SYSTEM,
      timestamp: new Date(),
    }]);
  }, [activeUrlGroupId, urlGroups]); 


  const fetchAndSetInitialSuggestions = useCallback(async (urls: string[], docs: LocalDocument[]) => {
    if (urls.length === 0 && docs.length === 0) {
      setInitialQuerySuggestions([]);
      return;
    }
      
    setIsFetchingSuggestions(true);
    setInitialQuerySuggestions([]); 

    try {
      const docContents = docs.map(d => d.content);
      const response = await getInitialSuggestions(urls, docContents); 
      let suggestionsArray: string[] = [];
      if (response.text) {
        try {
          let jsonStr = response.text.trim();
          const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s; 
          const match = jsonStr.match(fenceRegex);
          if (match && match[2]) {
            jsonStr = match[2].trim();
          }
          const parsed = JSON.parse(jsonStr);
          if (parsed && Array.isArray(parsed.suggestions)) {
            suggestionsArray = parsed.suggestions.filter((s: unknown) => typeof s === 'string');
          } else {
            console.warn("Parsed suggestions response, but 'suggestions' array not found or invalid:", parsed);
             setChatMessages(prev => [...prev, { id: `sys-err-suggestion-fmt-${Date.now()}`, text: "Received suggestions in an unexpected format.", sender: MessageSender.SYSTEM, timestamp: new Date() }]);
          }
        } catch (parseError) {
          console.error("Failed to parse suggestions JSON:", parseError, "Raw text:", response.text);
          setChatMessages(prev => [...prev, { id: `sys-err-suggestion-parse-${Date.now()}`, text: "Error parsing suggestions from AI.", sender: MessageSender.SYSTEM, timestamp: new Date() }]);
        }
      }
      setInitialQuerySuggestions(suggestionsArray.slice(0, 4)); 
    } catch (e: any) {
      const errorMessage = e.message || 'Failed to fetch initial suggestions.';
      setChatMessages(prev => [...prev, { id: `sys-err-suggestion-fetch-${Date.now()}`, text: `Error fetching suggestions: ${errorMessage}`, sender: MessageSender.SYSTEM, timestamp: new Date() }]);
    } finally {
      setIsFetchingSuggestions(false);
    }
  }, []); 

  useEffect(() => {
    const urlStrings = currentUrlsForChat.map(item => item.url);
    if ((urlStrings.length > 0 || currentDocsForChat.length > 0) && process.env.API_KEY) { 
        fetchAndSetInitialSuggestions(urlStrings, currentDocsForChat);
    } else {
        setInitialQuerySuggestions([]); 
    }
  }, [currentUrlsForChat, currentDocsForChat, fetchAndSetInitialSuggestions]); 


  const handleAddUrl = (url: string) => {
    setUrlGroups(prevGroups => 
      prevGroups.map(group => {
        if (group.id === activeUrlGroupId) {
          if (group.urls.length < MAX_URLS && !group.urls.some(item => item.url === url)) {
            const newUrlItem: KnowledgeUrl = { url, title: url };
            return { ...group, urls: [...group.urls, newUrlItem] };
          }
        }
        return group;
      })
    );
  };

  const handleRemoveUrl = (urlToRemove: string) => {
    setUrlGroups(prevGroups =>
      prevGroups.map(group => {
        if (group.id === activeUrlGroupId) {
          return { ...group, urls: group.urls.filter(item => item.url !== urlToRemove) };
        }
        return group;
      })
    );
  };

  const handleAddDocument = async (file: File) => {
    setIsProcessingDoc(true);
    setDocError(null);
    try {
      let textContent = '';
      const arrayBuffer = await file.arrayBuffer();
  
      if (file.name.toLowerCase().endsWith('.docx')) {
        const result = await mammoth.extractRawText({ arrayBuffer });
        textContent = result.value;
      } else if (file.name.toLowerCase().endsWith('.pdf')) {
        const pdf = await pdfjsLib.getDocument(new Uint8Array(arrayBuffer)).promise;
        const numPages = pdf.numPages;
        let extractedText = '';
        for (let i = 1; i <= numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          const pageText = content.items.map(item => ('str' in item ? item.str : '')).join(' ');
          extractedText += pageText + '\n\n';
        }
        textContent = extractedText.trim();
      } else {
        throw new Error('Unsupported file type. Please select a .docx or .pdf file.');
      }
  
      if (!textContent.trim()) {
        throw new Error('Could not extract any text from the document. It might be empty or image-based.');
      }
  
      const newDocument: LocalDocument = {
        id: `doc-${Date.now()}-${file.name}`,
        name: file.name,
        content: textContent,
      };
  
      setUrlGroups(prevGroups =>
        prevGroups.map(group => {
          if (group.id === activeUrlGroupId) {
            if (group.documents.length < MAX_DOCS) {
              return { ...group, documents: [...group.documents, newDocument] };
            } else {
              setDocError(`Maximum of ${MAX_DOCS} documents reached.`);
            }
          }
          return group;
        })
      );
    } catch (error) {
      console.error("Error processing document:", error);
      const message = error instanceof Error ? error.message : "Failed to read the content of this file.";
      setDocError(message);
    } finally {
      setIsProcessingDoc(false);
    }
  };

  const handleRemoveDocument = (docIdToRemove: string) => {
    setUrlGroups(prevGroups =>
      prevGroups.map(group => {
        if (group.id === activeUrlGroupId) {
          return { ...group, documents: group.documents.filter(doc => doc.id !== docIdToRemove) };
        }
        return group;
      })
    );
  };

  const handleSendMessage = async (query: string) => {
    if (!query.trim() || isLoading || isFetchingSuggestions) return;

    const apiKey = process.env.API_KEY;
    if (!apiKey) {
       setChatMessages(prev => [...prev, {
        id: `error-apikey-${Date.now()}`,
        text: 'ERROR: API Key (process.env.API_KEY) is not configured. Please set it up to send messages.',
        sender: MessageSender.SYSTEM,
        timestamp: new Date(),
      }]);
      return;
    }
    
    setIsLoading(true);
    setInitialQuerySuggestions([]); 

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      text: query,
      sender: MessageSender.USER,
      timestamp: new Date(),
    };
    
    const modelPlaceholderMessage: ChatMessage = {
      id: `model-response-${Date.now()}`,
      text: 'Thinking...', 
      sender: MessageSender.MODEL,
      timestamp: new Date(),
      isLoading: true,
    };

    setChatMessages(prevMessages => [...prevMessages, userMessage, modelPlaceholderMessage]);

    try {
      const urlStrings = currentUrlsForChat.map(item => item.url);
      const docContents = currentDocsForChat.map(doc => doc.content);
      const response = await generateContentWithUrlContext(query, urlStrings, docContents);
      setChatMessages(prevMessages =>
        prevMessages.map(msg =>
          msg.id === modelPlaceholderMessage.id
            ? { ...modelPlaceholderMessage, text: response.text || "I received an empty response.", isLoading: false, urlContext: response.urlContextMetadata }
            : msg
        )
      );
    } catch (e: any) {
      const errorMessage = e.message || 'Failed to get response from AI.';
      setChatMessages(prevMessages =>
        prevMessages.map(msg =>
          msg.id === modelPlaceholderMessage.id
            ? { ...modelPlaceholderMessage, text: `Error: ${errorMessage}`, sender: MessageSender.SYSTEM, isLoading: false } 
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestedQueryClick = (query: string) => {
    handleSendMessage(query);
  };
  
  const chatPlaceholder = (currentUrlsForChat.length > 0 || currentDocsForChat.length > 0)
    ? `Ask about "${activeGroup?.name || 'current documents'}"...`
    : "Select a group, add URLs, or upload documents to enable chat.";

  return (
    <div 
      className="h-screen max-h-screen antialiased relative overflow-x-hidden bg-[#121212] text-[#E2E2E2]"
    >
      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-20 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
      
      <div className="flex h-full w-full md:p-4 md:gap-4">
        {/* Sidebar */}
        <div className={`
          fixed top-0 left-0 h-full w-11/12 max-w-sm z-30 transform transition-transform ease-in-out duration-300 p-3
          md:static md:p-0 md:w-1/3 lg:w-1/4 md:h-full md:max-w-none md:translate-x-0 md:z-auto
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <KnowledgeBaseManager
            urls={currentUrlsForChat}
            onAddUrl={handleAddUrl}
            onRemoveUrl={handleRemoveUrl}
            maxUrls={MAX_URLS}
            urlGroups={urlGroups}
            activeUrlGroupId={activeUrlGroupId}
            onSetGroupId={setActiveUrlGroupId}
            onCloseSidebar={() => setIsSidebarOpen(false)}
            documents={currentDocsForChat}
            onAddDocument={handleAddDocument}
            onRemoveDocument={handleRemoveDocument}
            maxDocs={MAX_DOCS}
            isProcessingDoc={isProcessingDoc}
            docError={docError}
          />
        </div>

        {/* Chat Interface */}
        <div className="w-full h-full p-3 md:p-0 md:w-2/3 lg:w-3/4">
          <ChatInterface
            messages={chatMessages}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            placeholderText={chatPlaceholder}
            initialQuerySuggestions={initialQuerySuggestions}
            onSuggestedQueryClick={handleSuggestedQueryClick}
            isFetchingSuggestions={isFetchingSuggestions}
            onToggleSidebar={() => setIsSidebarOpen(true)}
            onOpenHelp={() => setIsHelpModalOpen(true)}
          />
        </div>
      </div>
      <HelpModal isOpen={isHelpModalOpen} onClose={() => setIsHelpModalOpen(false)} />
    </div>
  );
};

export default App;