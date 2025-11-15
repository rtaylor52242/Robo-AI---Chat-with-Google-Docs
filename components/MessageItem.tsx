/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { marked } from 'marked';
import hljs from 'highlight.js';
import { ChatMessage, MessageSender, UrlContextMetadataItem } from '../types';

// SVGs for the copy button
const copyIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-copy"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path></svg>`;
const checkIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check"><path d="M20 6 9 17l-5-5"></path></svg>`;

const renderer = new marked.Renderer();

// Override the code block renderer to add a copy button
renderer.code = (code, lang) => {
  const language = hljs.getLanguage(lang as string) ? lang : 'plaintext';
  
  // Defensively cast code to a string to prevent errors if the markdown is malformed.
  const stringCode = String(code || '');

  const highlightedCode = hljs.highlight(stringCode, { language: language as string }).value;
  
  // Use JSON.stringify to safely escape the code for embedding in the onclick attribute
  const escapedCode = JSON.stringify(stringCode);
  const uniqueId = `copy-btn-${Math.random().toString(16).slice(2)}`;

  return `
    <div class="code-block-container">
      <button
        id="${uniqueId}"
        class="copy-code-button"
        onclick='
          navigator.clipboard.writeText(${escapedCode}).then(() => {
            const button = document.getElementById("${uniqueId}");
            if (button) {
              button.innerHTML = \`${checkIconSvg}\`;
              button.setAttribute("aria-label", "Copied!");
              setTimeout(() => {
                button.innerHTML = \`${copyIconSvg}\`;
                button.setAttribute("aria-label", "Copy code");
              }, 2000);
            }
          })
        '
        aria-label="Copy code"
      >
        ${copyIconSvg}
      </button>
      <pre><code class="hljs language-${language}">${highlightedCode}</code></pre>
    </div>
  `;
};


// Configure marked to use our custom renderer, runs once on module load.
marked.setOptions({
  renderer,
  langPrefix: 'hljs language-', // Prefix for CSS classes
});


interface MessageItemProps {
  message: ChatMessage;
}

const SenderAvatar: React.FC<{ sender: MessageSender }> = ({ sender }) => {
  let avatarChar = '';
  let bgColorClass = '';
  let textColorClass = '';

  if (sender === MessageSender.USER) {
    avatarChar = 'U';
    bgColorClass = 'bg-white/[.12]';
    textColorClass = 'text-white';
  } else if (sender === MessageSender.MODEL) {
    avatarChar = 'AI';
    bgColorClass = 'bg-[#777777]'; 
    textColorClass = 'text-[#E2E2E2]';
  } else { // SYSTEM
    avatarChar = 'S';
    bgColorClass = 'bg-[#4A4A4A]';
    textColorClass = 'text-[#E2E2E2]';
  }

  return (
    <div className={`w-8 h-8 rounded-full ${bgColorClass} ${textColorClass} flex items-center justify-center text-sm font-semibold flex-shrink-0`}>
      {avatarChar}
    </div>
  );
};

const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
  const isUser = message.sender === MessageSender.USER;
  const isModel = message.sender === MessageSender.MODEL;
  const isSystem = message.sender === MessageSender.SYSTEM;

  const renderMessageContent = () => {
    if (isModel && !message.isLoading) {
      const proseClasses = "prose prose-sm prose-invert w-full min-w-0"; 
      // Ensure the input to marked.parse is always a string to prevent type errors.
      const rawMarkup = marked.parse(String(message.text || "")) as string;
      return <div className={proseClasses} dangerouslySetInnerHTML={{ __html: rawMarkup }} />;
    }
    
    let textColorClass = '';
    if (isUser) {
        textColorClass = 'text-white';
    } else if (isSystem) {
        textColorClass = 'text-[#A8ABB4]';
    } else { // Model loading, also use prose colors
        textColorClass = 'text-[#E2E2E2]';
    }
    return <div className={`whitespace-pre-wrap text-sm ${textColorClass}`}>{message.text}</div>;
  };
  
  let bubbleClasses = "p-3 rounded-lg shadow w-full "; // Added w-full

  if (isUser) {
    bubbleClasses += "bg-white/[.12] text-white rounded-br-none";
  } else if (isModel) {
    bubbleClasses += `bg-[rgba(119,119,119,0.10)] border-t border-[rgba(255,255,255,0.04)] backdrop-blur-lg rounded-bl-none`;
  } else { // System message
    bubbleClasses += "bg-[#2C2C2C] text-[#A8ABB4] rounded-bl-none";
  }

  return (
    <div className={`flex mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex items-start gap-2 max-w-[85%]`}>
        {!isUser && <SenderAvatar sender={message.sender} />}
        <div className={bubbleClasses}>
          {message.isLoading ? (
            <div className="flex items-center space-x-1.5">
              <div className={`w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:-0.3s] ${isUser ? 'bg-white' : 'bg-[#A8ABB4]'}`}></div>
              <div className={`w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:-0.15s] ${isUser ? 'bg-white' : 'bg-[#A8ABB4]'}`}></div>
              <div className={`w-1.5 h-1.5 rounded-full animate-bounce ${isUser ? 'bg-white' : 'bg-[#A8ABB4]'}`}></div>
            </div>
          ) : (
            renderMessageContent()
          )}
          
          {isModel && message.urlContext && message.urlContext.length > 0 && (
            <div className="mt-2.5 pt-2.5 border-t border-[rgba(255,255,255,0.1)]">
              <h4 className="text-xs font-semibold text-[#A8ABB4] mb-1">Context URLs Retrieved:</h4>
              <ul className="space-y-0.5">
                {message.urlContext.map((meta, index) => {
                  const statusText = typeof meta.urlRetrievalStatus === 'string' 
                    ? meta.urlRetrievalStatus.replace('URL_RETRIEVAL_STATUS_', '') 
                    : 'UNKNOWN';
                  const isSuccess = meta.urlRetrievalStatus === 'URL_RETRIEVAL_STATUS_SUCCESS';

                  return (
                    <li key={index} className="text-[11px] text-[#A8ABB4]">
                      <a href={meta.retrievedUrl} target="_blank" rel="noopener noreferrer" className="hover:underline break-all text-[#79B8FF]">
                        {meta.retrievedUrl}
                      </a>
                      <span className={`ml-1.5 px-1 py-0.5 rounded-sm text-[9px] ${
                        isSuccess
                          ? 'bg-white/[.12] text-white'
                          : 'bg-slate-600/30 text-slate-400'
                      }`}>
                        {statusText}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
        {isUser && <SenderAvatar sender={message.sender} />}
      </div>
    </div>
  );
};

export default MessageItem;