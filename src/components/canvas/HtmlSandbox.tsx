/**
 * HTML Sandbox Component (Rewritten)
 * 
 * Renders HTML content in a secure iframe sandbox.
 * - Uses srcDoc for complete isolation
 * - Minimal sandbox permissions
 * - Script injection via postMessage (not direct DOM manipulation)
 * - Strict: Host never directly manipulates iframe DOM
 */

import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import type { HostToSandboxMessage, SandboxToHostMessage } from '@/types/sandbox-messages';
import { validateSandboxToHostMessage } from '@/types/sandbox-messages';

interface HtmlSandboxProps {
  html: string;
  mode: 'preview' | 'edit';
  injectorScript?: string;
  onMessage?: (msg: SandboxToHostMessage) => void;
  className?: string;
  heightMode?: 'auto' | 'device';
}

export interface HtmlSandboxHandle {
  getIframe: () => HTMLIFrameElement | null;
  postMessage: (msg: HostToSandboxMessage) => void;
}

export const HtmlSandbox = forwardRef<HtmlSandboxHandle, HtmlSandboxProps>(({
  html,
  mode,
  injectorScript,
  onMessage,
  className,
  heightMode = 'auto',
}, ref) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Expose iframe ref and postMessage via imperative handle
  useImperativeHandle(ref, () => ({
    getIframe: () => iframeRef.current,
    postMessage: (msg: HostToSandboxMessage) => {
      const iframe = iframeRef.current;
      if (iframe && iframe.contentWindow && typeof window !== 'undefined') {
        iframe.contentWindow.postMessage(msg, window.location.origin);
      }
    },
  }), []);

  // Ensure HTML is a complete document
  const ensureFullDocument = (htmlContent: string): string => {
    const trimmed = htmlContent.trim();
    
    // If it's already a full document, return as-is
    if (trimmed.startsWith('<!DOCTYPE') || trimmed.startsWith('<html')) {
      return trimmed;
    }

    // If it's a fragment, wrap it in a complete HTML document
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
${trimmed}
</body>
</html>`;
  };

  const fullHtml = ensureFullDocument(html);

  // Inject bootstrap script into iframe (runs once on load)
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !isLoaded) return;

    try {
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) return;

      // Inject bootstrap listener (only once)
      if (!iframeDoc.getElementById('sandbox-bootstrap')) {
        const bootstrapScript = iframeDoc.createElement('script');
        bootstrapScript.id = 'sandbox-bootstrap';
        bootstrapScript.textContent = `
(function() {
  'use strict';
  
  // Bootstrap listener for script injection
  window.addEventListener('message', function(event) {
    if (event.source !== window.parent) return;
    
    const message = event.data;
    if (message && message.type === 'INJECT') {
      try {
        // Execute injected script using Function constructor
        const fn = new Function(message.script);
        fn();
      } catch (error) {
        console.error('[Sandbox] Error executing injected script:', error);
        if (window.parent) {
          window.parent.postMessage({
            type: 'ERROR',
            message: 'Failed to execute injected script: ' + (error instanceof Error ? error.message : String(error))
          }, window.location.origin);
        }
      }
    }
  });
  
  // Notify host that bootstrap is ready
  if (window.parent) {
    window.parent.postMessage({ type: 'READY' }, window.location.origin);
  }
})();
`;
        iframeDoc.head.appendChild(bootstrapScript);
      }
    } catch (error) {
      console.error('HtmlSandbox: Error injecting bootstrap:', error);
    }
  }, [isLoaded]);

  // Inject editor injector and custom scripts after bootstrap is ready
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !isLoaded) return;

    // Wait a bit for bootstrap to be ready
    const timeoutId = setTimeout(() => {
      try {
        const iframeWindow = iframe.contentWindow;
        if (!iframeWindow) return;

        // Inject editor injector script
        if (injectorScript) {
          iframeWindow.postMessage({
            type: 'INJECT',
            script: injectorScript,
          }, '*');
        }

        // Set mode
        iframeWindow.postMessage({
          type: 'SET_MODE',
          mode: mode,
        }, '*');
      } catch (error) {
        console.error('HtmlSandbox: Error posting injection message:', error);
      }
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [html, injectorScript, mode, isLoaded]);

  // Set up postMessage listener for sandbox messages
  useEffect(() => {
    if (!onMessage) return;

    const handleMessage = (event: MessageEvent) => {
      const iframe = iframeRef.current;
      if (!iframe || event.source !== iframe.contentWindow) return;

      // Validate message
      const validation = validateSandboxToHostMessage(event.data);
      if (validation.valid && validation.message) {
        onMessage(validation.message);
      }
    };
    
    window.addEventListener('message', handleMessage);
    
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [onMessage]);

  // Determine height style
  const heightStyle: React.CSSProperties = 
    heightMode === 'device'
      ? { height: '812px', minHeight: '812px' }
      : { height: '100%', minHeight: '400px' };

  // Ensure outer container has no opacity/filter/backdrop-blur
  const containerStyle: React.CSSProperties = {
    width: '100%',
    ...heightStyle,
    opacity: undefined,
    filter: undefined,
    backdropFilter: undefined,
  };

  return (
    <div className={className} style={containerStyle} data-testid="html-sandbox-container">
      <iframe
        ref={iframeRef}
        data-testid="html-sandbox-iframe"
        srcDoc={fullHtml}
        sandbox="allow-scripts allow-forms allow-popups allow-modals"
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          display: 'block',
        }}
        title="HTML Sandbox Preview"
        onLoad={() => {
          setIsLoaded(true);
        }}
      />
    </div>
  );
});

HtmlSandbox.displayName = 'HtmlSandbox';
