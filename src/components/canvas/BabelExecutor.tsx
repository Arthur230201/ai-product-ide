/**
 * Babel Executor Component
 * 
 * JIT (Just-In-Time) Compiler for React Components
 * Uses @babel/standalone to compile and execute React code in the browser.
 */

import React, { useEffect, useRef, useState } from 'react';
import { transform } from '@babel/standalone';
import { createRoot } from 'react-dom/client';
import { log, logError } from '@/lib/logger';

interface BabelExecutorProps {
  codeString: string; // React component code (JSX string)
  configString?: string; // Tailwind config string (optional)
  className?: string;
}

export const BabelExecutor: React.FC<BabelExecutorProps> = ({
  codeString,
  configString = '',
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isCompiling, setIsCompiling] = useState(false);

  useEffect(() => {
    if (!codeString || !containerRef.current) {
      return;
    }

    // Clear previous content
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
    }
    setError(null);
    setIsCompiling(true);

    const execute = async () => {
      try {
      // Step 1: Inject Tailwind config if provided
      if (configString) {
        try {
          // Execute config in global scope
          const configCode = configString.replace(/window\.tailwind\.config\s*=\s*/, '');
          if (typeof window !== 'undefined' && (window as any).tailwind) {
            // Merge with existing config
            const existingConfig = (window as any).tailwind?.config || {};
            const newConfig = new Function('return ' + configCode)();
            (window as any).tailwind.config = {
              ...existingConfig,
              ...newConfig,
            };
            log('🎨 [BabelExecutor] Tailwind config injected');
          }
        } catch (configError) {
          logError('⚠️ [BabelExecutor] Config injection failed:', configError);
        }
      }

      // Step 2: Wrap code in React component template with injected logic
      const wrappedCode = `
        const GeneratedApp = () => {
          // Standard State Hooks
          const [activeTab, setActiveTab] = React.useState('首页');
          const [showModal, setShowModal] = React.useState(false);
          const [inputValue, setInputValue] = React.useState('');
          const [filterMode, setFilterMode] = React.useState('ALL');

          // The Logic Handler
          const handleInteract = (e, type) => {
            e.preventDefault();
            e.stopPropagation();
            const text = e.target?.innerText || e.target?.textContent || '';
            const target = e.target;
            
            console.log('🖱️ [Interaction]', { type, text, target });
            
            if (type === 'tab') {
              setActiveTab(text);
              // Update active state visually
              if (target) {
                // Remove active class from siblings
                const siblings = target.parentElement?.children || [];
                Array.from(siblings).forEach((sibling: any) => {
                  if (sibling.classList) {
                    sibling.classList.remove('text-blue-600', 'bg-blue-50', 'active');
                    sibling.classList.add('text-gray-500');
                  }
                });
                // Add active class to clicked element
                if (target.classList) {
                  target.classList.add('text-blue-600', 'bg-blue-50', 'active');
                  target.classList.remove('text-gray-500');
                }
              }
            } else if (type === 'btn' || type === 'link') {
              alert(\`【交互演示】功能已触发: \${text}\`);
            }
          };

          // The JSX Return (User HTML goes here)
          return (
            <div className="relative isolate w-full h-full bg-white overflow-hidden">
              ${codeString}
            </div>
          );
        };

        // Render it using React 18 createRoot API
        const root = createRoot(renderTarget);
        root.render(React.createElement(GeneratedApp));
      `;

      // Step 3: Transpile with Babel
      log('🔄 [BabelExecutor] Starting Babel transpilation...');
      const { code: transpiledCode } = transform(wrappedCode, {
        presets: ['react', 'env'],
        plugins: [],
      });

      log('✅ [BabelExecutor] Babel transpilation complete');

      // Step 4: Execute the transpiled code
      // Create a function with React dependencies in scope
      const executeCode = new Function(
        'React',
        'createRoot',
        'useState',
        'useEffect',
        'renderTarget',
        transpiledCode || ''
      );

      // Execute with React dependencies
      executeCode(
        React,
        createRoot,
        React.useState,
        React.useEffect,
        containerRef.current
      );

        setIsCompiling(false);
        log('✅ [BabelExecutor] Component rendered successfully');

      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        setIsCompiling(false);
        logError('❌ [BabelExecutor] Execution failed:', error);
        
        // Display error in container
        if (containerRef.current) {
          containerRef.current.innerHTML = `
            <div style="padding: 20px; color: #ef4444; background: #fee2e2; border-radius: 8px;">
              <h3 style="margin: 0 0 10px 0;">编译错误</h3>
              <pre style="margin: 0; font-size: 12px; white-space: pre-wrap;">${error.message}</pre>
            </div>
          `;
        }
      }
    };

    execute();
  }, [codeString, configString]);

  return (
    <div className={className} style={{ position: 'relative', width: '100%', height: '100%' }}>
      {isCompiling && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          padding: '20px',
          background: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          borderRadius: '8px',
          zIndex: 1000,
        }}>
          正在编译...
        </div>
      )}
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      {error && (
        <div style={{
          padding: '10px',
          background: '#fee2e2',
          color: '#dc2626',
          borderRadius: '4px',
          marginTop: '10px',
          fontSize: '12px',
        }}>
          {error.message}
        </div>
      )}
    </div>
  );
};

