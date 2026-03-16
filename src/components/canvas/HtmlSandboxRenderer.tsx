/**
 * HTML Sandbox Renderer
 * 
 * HTML-First Architecture: Renders original HTML as-is in a secure sandbox
 * - Uses iframe for complete isolation and full HTML document support
 * - Preserves all original behavior (Tailwind, styles, scroll, positioning)
 * - No React conversion or wrapping
 */

import React, { useEffect, useRef, useState } from 'react';

interface HtmlSandboxRendererProps {
  rawHtml: string;
  className?: string;
  onReady?: () => void;
  /** Expose iframe ref for external access (e.g., edit mode) */
  iframeRef?: React.RefObject<HTMLIFrameElement>;
  /** 导航回调：点击 data-nav / data-edge-ref 时调用，宿主据此切换节点 */
  onNav?: (target: string) => void;
}

/**
 * Render Guard
 * Lightweight validation checks after HTML load (runs in milliseconds)
 */
class RenderGuard {
  private iframe: HTMLIFrameElement | null = null;

  /**
   * Initialize the guard with an iframe
   */
  init(iframe: HTMLIFrameElement) {
    this.iframe = iframe;
  }

  /**
   * Run all guard checks (lightweight, runs in milliseconds)
   * Returns true if all checks pass, false otherwise
   */
  check(): { valid: boolean; errors: string[] } {
    if (!this.iframe) {
      return { valid: false, errors: ['Render Guard: iframe not initialized'] };
    }

    const errors: string[] = [];
    const startTime = performance.now();

    try {
      const iframeDoc = this.iframe.contentDocument || this.iframe.contentWindow?.document;
      if (!iframeDoc) {
        return { valid: false, errors: ['Render Guard: iframe document not accessible'] };
      }

      const root = iframeDoc.body || iframeDoc.documentElement;
      if (!root) {
        return { valid: false, errors: ['Render Guard: root element not found'] };
      }

      // Check 1: Root element has no opacity, filter, or backdrop-filter
      // Use iframe's window for getComputedStyle
      const iframeWindow = iframeDoc.defaultView || (iframeDoc as any).parentWindow;
      if (!iframeWindow) {
        return { valid: false, errors: ['Render Guard: iframe window not accessible'] };
      }
      
      const rootStyle = iframeWindow.getComputedStyle(root);
      const rootOpacity = parseFloat(rootStyle.opacity);
      const rootFilter = rootStyle.filter;
      const rootBackdropFilter = rootStyle.backdropFilter;

      if (rootOpacity < 1) {
        errors.push(`Render Guard: Root element has opacity ${rootOpacity} (expected 1)`);
      }
      if (rootFilter && rootFilter !== 'none') {
        errors.push(`Render Guard: Root element has filter "${rootFilter}" (expected none)`);
      }
      if (rootBackdropFilter && rootBackdropFilter !== 'none') {
        errors.push(`Render Guard: Root element has backdrop-filter "${rootBackdropFilter}" (expected none)`);
      }

      // Check 2: At least one element using bg-gradient-* renders a non-gray background
      const gradientElements = iframeDoc.querySelectorAll('[class*="bg-gradient"]');
      let hasNonGrayGradient = false;

      for (let i = 0; i < Math.min(gradientElements.length, 10); i++) {
        const el = gradientElements[i] as HTMLElement;
        const bgImage = iframeWindow.getComputedStyle(el).backgroundImage;
        
        // Check if it's a gradient (not a solid color or gray)
        if (bgImage && bgImage !== 'none' && bgImage.includes('gradient')) {
          // Extract color values from gradient
          const colorMatches = bgImage.match(/(?:rgb|rgba|hsl|hsla|#[0-9a-fA-F]{3,6})/g);
          if (colorMatches && colorMatches.length > 0) {
            // Check if any color is not gray (simple heuristic: check if it's not all grayscale)
            const hasColor = colorMatches.some((color: string) => {
              // Convert to RGB for grayscale check
              if (color.startsWith('#')) {
                const r = parseInt(color.slice(1, 3), 16);
                const g = parseInt(color.slice(3, 5) || color.slice(1, 2).repeat(2), 16);
                const b = parseInt(color.slice(5, 7) || color.slice(2, 3).repeat(2), 16);
                // Check if not grayscale (R, G, B are not approximately equal)
                return Math.abs(r - g) > 10 || Math.abs(g - b) > 10 || Math.abs(r - b) > 10;
              }
              return true; // Assume non-gray if we can't parse
            });
            if (hasColor) {
              hasNonGrayGradient = true;
              break;
            }
          }
        }
      }

      // If there are gradient elements but none render non-gray, it's a warning
      // But we only fail if there are gradient classes and all are gray
      if (gradientElements.length > 0 && !hasNonGrayGradient) {
        errors.push('Render Guard: Elements with bg-gradient-* classes found but all render gray backgrounds');
      }

      // Check 3: Any bottom fixed element remains attached to viewport bottom
      const fixedElements = iframeDoc.querySelectorAll('[class*="fixed"], [style*="position: fixed"], [style*="position:fixed"]');
      const viewportHeight = iframeDoc.documentElement.clientHeight || iframeDoc.body.clientHeight;

      for (let i = 0; i < Math.min(fixedElements.length, 20); i++) {
        const el = fixedElements[i] as HTMLElement;
        const style = iframeWindow.getComputedStyle(el);
        const bottom = style.bottom;
        const position = style.position;

        // Check if element is fixed and positioned at bottom
        if (position === 'fixed' && (bottom === '0px' || bottom === '0' || el.classList.toString().includes('bottom-0'))) {
          const rect = el.getBoundingClientRect();
          const distanceFromBottom = viewportHeight - rect.bottom;
          
          // Allow small tolerance (5px) for rounding errors
          if (Math.abs(distanceFromBottom) > 5) {
            errors.push(`Render Guard: Bottom fixed element not attached to viewport (distance: ${distanceFromBottom}px)`);
          }
        }
      }

      const duration = performance.now() - startTime;
      if (duration > 10) {
        console.warn(`Render Guard: Checks took ${duration.toFixed(2)}ms (target: <10ms)`);
      }

      return {
        valid: errors.length === 0,
        errors,
      };
    } catch (err) {
      return {
        valid: false,
        errors: [`Render Guard: Exception during checks: ${err instanceof Error ? err.message : String(err)}`],
      };
    }
  }
}

/**
 * Unified Behavior Injector
 * 
 * Single source of truth for all UI behavior:
 * - No inline event handlers in HTML
 * - All DOM mutations go through this injector
 * - All click, filter, tab, and state logic attached here
 * - Exposes unified API for AI to query/modify DOM
 */
export interface BehaviorInjectorOptions {
  onNav?: (target: string) => void;
}

class BehaviorInjector {
  private iframe: HTMLIFrameElement | null = null;
  private injected = false;
  private onNavCallback: ((target: string) => void) | null = null;
  private eventHandlers: Map<string, Array<{ element: Element; event: string; handler: (e: Event) => void }>> = new Map();

  /**
   * Initialize the injector with an iframe and optional callbacks
   */
  init(iframe: HTMLIFrameElement, options?: BehaviorInjectorOptions) {
    this.iframe = iframe;
    this.injected = false;
    this.onNavCallback = options?.onNav ?? null;
    this.eventHandlers.clear();
  }

  /**
   * Get iframe document (with error handling)
   */
  private getDocument(): Document | null {
    if (!this.iframe) return null;
    try {
      return this.iframe.contentDocument || this.iframe.contentWindow?.document || null;
    } catch {
      return null;
    }
  }

  /**
   * Get iframe window (with error handling)
   */
  private getWindow(): Window | null {
    if (!this.iframe) return null;
    try {
      const doc = this.getDocument();
      return doc?.defaultView || (doc as any)?.parentWindow || null;
    } catch {
      return null;
    }
  }

  /**
   * Inject behaviors after HTML is loaded
   * This is the ONLY place where event handlers are attached
   */
  inject() {
    if (!this.iframe || this.injected) return;
    
    try {
      const iframeDoc = this.getDocument();
      if (!iframeDoc) {
        // Iframe not ready yet, retry
        setTimeout(() => this.inject(), 100);
        return;
      }

      const body = iframeDoc.body || iframeDoc.documentElement;

      // Step 1: Remove any inline event handlers from HTML
      this.removeInlineHandlers(body);

      // Step 2: Inject event handlers for interactive elements
      this.attachEventHandlers(body);

      // Step 2b: Fill tables/lists bound by data-data-query-runtime JSON (mock or embedded)
      this.injectDataQueryRuntime(body);
      
      // Step 3: Inject data/state management
      this.injectStateManagement(body);
      
      // Step 4: Expose unified API
      this.exposeUnifiedAPI(iframeDoc);
      
      this.injected = true;
    } catch (err) {
      // Cross-origin or not ready, retry
      console.warn('Behavior injector not ready, retrying...', err);
      setTimeout(() => this.inject(), 100);
    }
  }

  /**
   * Remove all inline event handlers from HTML
   * This ensures no behavior exists outside the injector
   */
  private removeInlineHandlers(container: Element | Document) {
    // Remove onclick, onchange, etc. from all elements
    const allElements = container.querySelectorAll('*');
    allElements.forEach((el) => {
      // Remove common inline handlers
      const handlers = ['onclick', 'onchange', 'oninput', 'onsubmit', 'onfocus', 'onblur', 'onmouseenter', 'onmouseleave'];
      handlers.forEach((handler) => {
        if (el.hasAttribute(handler)) {
          el.removeAttribute(handler);
        }
      });
    });
  }

  /**
   * Attach event handlers to interactive elements
   * This is the ONLY place where event handlers are attached
   */
  private attachEventHandlers(container: Element | Document) {
    const doc = container instanceof Document ? container : container.ownerDocument || (container as any).ownerDocument;
    const iframeWindow = this.getWindow();
    if (!doc || !iframeWindow) return;

    // Handle dropdowns
    const dropdowns = doc.querySelectorAll('[class*="dropdown"], select, [role="combobox"]');
    dropdowns.forEach((dropdown) => {
      if (!dropdown.hasAttribute('data-injected')) {
        dropdown.setAttribute('data-injected', 'true');
        // Add click handler for custom dropdowns
        if (dropdown.classList.contains('dropdown') || dropdown.getAttribute('role') === 'combobox') {
          dropdown.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            const options = target.querySelector('[class*="options"], [class*="menu"]');
            if (options) {
              const computedStyle = iframeWindow.getComputedStyle(options);
              const isHidden = options.classList.contains('hidden') || 
                              computedStyle.display === 'none';
              if (isHidden) {
                options.classList.remove('hidden');
                (options as HTMLElement).style.display = '';
              } else {
                options.classList.add('hidden');
                (options as HTMLElement).style.display = 'none';
              }
            }
          });
        }
      }
    });

    // Handle tabs
    const tabs = doc.querySelectorAll('[role="tab"], [class*="tab"]');
    tabs.forEach((tab) => {
      if (!tab.hasAttribute('data-injected')) {
        tab.setAttribute('data-injected', 'true');
        tab.addEventListener('click', (e) => {
          e.preventDefault();
          const tabId = tab.getAttribute('data-tab') || tab.getAttribute('aria-controls');
          if (tabId) {
            // Hide all tab panels
            doc.querySelectorAll('[role="tabpanel"], [class*="tab-panel"]').forEach((panel) => {
              panel.classList.add('hidden');
              (panel as HTMLElement).style.display = 'none';
            });
            // Show selected tab panel
            const targetPanel = doc.querySelector(`[id="${tabId}"], [data-tab="${tabId}"]`);
            if (targetPanel) {
              targetPanel.classList.remove('hidden');
              (targetPanel as HTMLElement).style.display = '';
            }
            // Update active tab state
            doc.querySelectorAll('[role="tab"], [class*="tab"]').forEach((t) => {
              t.classList.remove('active', 'bg-blue-500', 'text-white');
              t.setAttribute('aria-selected', 'false');
            });
            tab.classList.add('active');
            tab.setAttribute('aria-selected', 'true');
          }
        });
      }
    });

    // Handle filters
    const filters = doc.querySelectorAll('[class*="filter"], [data-filter]');
    filters.forEach((filter) => {
      if (!filter.hasAttribute('data-injected')) {
        filter.setAttribute('data-injected', 'true');
        filter.addEventListener('click', (e) => {
          const filterValue = filter.getAttribute('data-filter') || filter.textContent?.trim();
          if (filterValue) {
            // Filter list items
            const listItems = doc.querySelectorAll('[data-item], [class*="item"]');
            listItems.forEach((item) => {
              const itemFilter = item.getAttribute('data-filter') || item.getAttribute('data-status');
              if (filterValue === 'all' || itemFilter === filterValue) {
                item.classList.remove('hidden');
                (item as HTMLElement).style.display = '';
              } else {
                item.classList.add('hidden');
                (item as HTMLElement).style.display = 'none';
              }
            });
            // Update active filter state
            doc.querySelectorAll('[class*="filter"], [data-filter]').forEach((f) => {
              f.classList.remove('active', 'bg-blue-500', 'text-white');
            });
            filter.classList.add('active');
          }
        });
      }
    });

    // Handle navigation: [data-nav] and [data-edge-ref] → onNav(target)
    const navSelectors = ['[data-nav]', '[data-edge-ref]'];
    navSelectors.forEach((selector) => {
      doc.querySelectorAll(selector).forEach((el) => {
        if (el.hasAttribute('data-injected')) return;
        const ref = el.getAttribute('data-nav') ?? el.getAttribute('data-edge-ref');
        if (!ref || !this.onNavCallback) return;
        el.setAttribute('data-injected', 'true');
        el.addEventListener('click', (e) => {
          e.preventDefault();
          this.onNavCallback?.(ref);
        });
      });
    });

    // Handle buttons with actions
    const actionButtons = doc.querySelectorAll('button[data-action], [class*="action-button"]');
    actionButtons.forEach((button) => {
      if (!button.hasAttribute('data-injected')) {
        button.setAttribute('data-injected', 'true');
        button.addEventListener('click', (e) => {
          const action = button.getAttribute('data-action');
          if (action) {
            // Handle different actions
            switch (action) {
              case 'submit':
                const form = button.closest('form');
                if (form) {
                  e.preventDefault();
                  // Show success feedback
                  const feedback = doc.createElement('div');
                  feedback.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded';
                  feedback.textContent = '提交成功';
                  doc.body.appendChild(feedback);
                  setTimeout(() => feedback.remove(), 2000);
                }
                break;
              case 'open-modal':
                const modalId = button.getAttribute('data-modal');
                if (modalId) {
                  const modal = doc.querySelector(`[id="${modalId}"], [data-modal="${modalId}"]`);
                  if (modal) {
                    modal.classList.remove('hidden');
                    (modal as HTMLElement).style.display = 'flex';
                  }
                }
                break;
            }
          }
        });
      }
    });

    // Handle all buttons (generic click handler for buttons without data-action)
    const allButtons = doc.querySelectorAll('button:not([data-injected])');
    allButtons.forEach((button) => {
      if (!button.hasAttribute('data-injected') && !button.hasAttribute('data-action')) {
        button.setAttribute('data-injected', 'true');
        button.addEventListener('click', (e) => {
          // Generic button handler - can be extended via API
          const buttonText = button.textContent?.trim() || '';
          console.log('Button clicked:', buttonText);
        });
      }
    });

    // Handle form inputs (onChange handlers)
    const inputs = doc.querySelectorAll('input, textarea, select');
    inputs.forEach((input) => {
      if (!input.hasAttribute('data-injected')) {
        input.setAttribute('data-injected', 'true');
        input.addEventListener('change', (e) => {
          const target = e.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
          const value = target.value;
          const name = target.getAttribute('name') || target.getAttribute('data-bind') || '';
          if (name) {
            // Update data binding
            const api = (doc as any).__uiAPI;
            if (api && api.updateData) {
              api.updateData({ [name]: value });
            }
          }
        });
      }
    });
  }

  /**
   * Inject state management for dynamic content
   */
  /**
   * Read #data-query-runtime JSON and fill tbody for each table[data-data-query-ref].
   * Class names on new cells use same tokens as page-plan recipes (plain utilities, no arbitrary []).
   */
  private injectDataQueryRuntime(rootEl: Element | Document) {
    const doc = rootEl instanceof Document ? rootEl : rootEl.ownerDocument ?? (rootEl as Element & { ownerDocument?: Document }).ownerDocument;
    if (!doc || !doc.body) return;
    const script = doc.getElementById('data-query-runtime');
    if (!script || !script.textContent) return;
    let payload: { byRef?: Record<string, { columns?: string[]; rows?: string[][] }> };
    try {
      payload = JSON.parse(script.textContent);
    } catch {
      return;
    }
    const byRef = payload.byRef || {};
    const cellClass = 'border-b border-slate-100 px-4 py-3';
    let hasAnyRows = false;
    doc.querySelectorAll('table[data-data-query-ref]').forEach((table) => {
      const ref = table.getAttribute('data-data-query-ref');
      if (!ref || !byRef[ref]) return;
      const spec = byRef[ref];
      const columns = spec.columns || ['名称', '状态'];
      const rows = spec.rows || [];
      if (rows.length > 0) hasAnyRows = true;
      const thead = table.querySelector('thead');
      if (thead && columns.length > 0) {
        const tr = doc.createElement('tr');
        columns.forEach((col) => {
          const th = doc.createElement('th');
          th.className = 'px-4 py-3';
          th.textContent = col;
          tr.appendChild(th);
        });
        thead.innerHTML = '';
        thead.appendChild(tr);
        thead.className = 'border-b border-slate-200 bg-slate-50 text-slate-700';
      }
      let tbody = table.querySelector('tbody');
      if (!tbody) {
        tbody = doc.createElement('tbody');
        table.appendChild(tbody);
      }
      tbody.innerHTML = '';
      rows.forEach((cells) => {
        const tr = doc.createElement('tr');
        tr.className = 'data-item';
        tr.setAttribute('data-filter', 'active');
        cells.forEach((text) => {
          const td = doc.createElement('td');
          td.className = cellClass;
          td.textContent = text;
          tr.appendChild(td);
        });
        tbody!.appendChild(tr);
      });
      if (rows.length === 0) {
        const tr = doc.createElement('tr');
        const td = doc.createElement('td');
        td.className = cellClass;
        td.colSpan = Math.max(columns.length, 1);
        td.textContent = '暂无数据';
        tr.appendChild(td);
        tbody.appendChild(tr);
      }
    });

    const viewStateRoot = doc.querySelector<HTMLElement>('[data-view-state-container]');
    if (viewStateRoot) {
      const viewState: 'loading' | 'empty' | 'error' | 'content' = hasAnyRows ? 'content' : 'empty';
      viewStateRoot.setAttribute('data-view-state', viewState);
      ['loading', 'empty', 'error', 'content'].forEach((block) => {
        const el = viewStateRoot.querySelector(`[data-state-block="${block}"]`);
        if (el) {
          const isShow = block === viewState;
          (el as HTMLElement).classList.toggle('hidden', !isShow);
          if ((el as HTMLElement).style) {
            (el as HTMLElement).style.display = isShow ? '' : 'none';
          }
        }
      });
    }
  }

  private injectStateManagement(rootEl: Element | Document) {
    const doc = rootEl instanceof Document ? rootEl : rootEl.ownerDocument ?? (rootEl as Element & { ownerDocument?: Document }).ownerDocument;
    if (!doc) return;

    // Create a simple state store
    if (!(doc as any).__uiState) {
      (doc as any).__uiState = {};
    }
  }

  /**
   * Expose unified API for AI to interact with DOM
   * This is the ONLY bridge between AI logic and HTML UI
   */
  private exposeUnifiedAPI(doc: Document) {
    const injector = this;
    
    (doc as any).__uiAPI = {
      // ========== DOM Query API ==========
      /**
       * Query DOM elements by selector
       */
      query: (selector: string): Element[] => {
        try {
          return Array.from(doc.querySelectorAll(selector));
        } catch {
          return [];
        }
      },

      /**
       * Find single element by selector
       */
      find: (selector: string): Element | null => {
        try {
          return doc.querySelector(selector);
        } catch {
          return null;
        }
      },

      /**
       * Get element by ID
       */
      getById: (id: string): Element | null => {
        return doc.getElementById(id);
      },

      // ========== DOM Modification API ==========
      /**
       * Modify DOM structure (the ONLY way to mutate DOM)
       */
      modify: (selector: string, callback: (el: Element) => void): void => {
        try {
          const elements = doc.querySelectorAll(selector);
          elements.forEach(callback);
        } catch (err) {
          console.error('DOM modification failed:', err);
        }
      },

      /**
       * Update element text content
       */
      setText: (selector: string, text: string): void => {
        injector.modifyDOM(selector, (el) => {
          el.textContent = text;
        });
      },

      /**
       * Update element HTML
       */
      setHTML: (selector: string, html: string): void => {
        injector.modifyDOM(selector, (el) => {
          el.innerHTML = html;
        });
      },

      /**
       * Add class to elements
       */
      addClass: (selector: string, className: string): void => {
        injector.modifyDOM(selector, (el) => {
          el.classList.add(className);
        });
      },

      /**
       * Remove class from elements
       */
      removeClass: (selector: string, className: string): void => {
        injector.modifyDOM(selector, (el) => {
          el.classList.remove(className);
        });
      },

      /**
       * Toggle class on elements
       */
      toggleClass: (selector: string, className: string): void => {
        injector.modifyDOM(selector, (el) => {
          el.classList.toggle(className);
        });
      },

      /**
       * Set attribute on elements
       */
      setAttr: (selector: string, attr: string, value: string): void => {
        injector.modifyDOM(selector, (el) => {
          el.setAttribute(attr, value);
        });
      },

      /**
       * Remove attribute from elements
       */
      removeAttr: (selector: string, attr: string): void => {
        injector.modifyDOM(selector, (el) => {
          el.removeAttribute(attr);
        });
      },

      /**
       * Create and insert new element
       */
      create: (tag: string, attributes?: Record<string, string>, parent?: string | Element): Element => {
        const element = doc.createElement(tag);
        if (attributes) {
          Object.entries(attributes).forEach(([key, value]) => {
            element.setAttribute(key, value);
          });
        }
        const parentEl = typeof parent === 'string' ? doc.querySelector(parent) : parent;
        if (parentEl) {
          parentEl.appendChild(element);
        } else {
          doc.body.appendChild(element);
        }
        return element;
      },

      /**
       * Remove elements
       */
      remove: (selector: string): void => {
        injector.modifyDOM(selector, (el) => {
          el.remove();
        });
      },

      // ========== Data Binding API ==========
      /**
       * Update data-bound elements (elements with data-bind attribute)
       */
      updateData: (data: Record<string, any>): void => {
        Object.entries(data).forEach(([key, value]) => {
          // Update elements with data-bind attribute
          const elements = doc.querySelectorAll(`[data-bind="${key}"]`);
          elements.forEach((el) => {
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
              (el as HTMLInputElement).value = String(value);
            } else if (el.tagName === 'SELECT') {
              (el as HTMLSelectElement).value = String(value);
            } else {
              el.textContent = String(value);
            }
          });
          // Also update state store
          if ((doc as any).__uiState) {
            (doc as any).__uiState[key] = value;
          }
        });
      },

      /**
       * Get data from data-bound elements
       */
      getData: (key?: string): any => {
        if (key) {
          const element = doc.querySelector(`[data-bind="${key}"]`);
          if (element) {
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
              return (element as HTMLInputElement).value;
            } else if (element.tagName === 'SELECT') {
              return (element as HTMLSelectElement).value;
            } else {
              return element.textContent;
            }
          }
          return (doc as any).__uiState?.[key];
        }
        // Return all data
        const allData: Record<string, any> = {};
        const boundElements = doc.querySelectorAll('[data-bind]');
        boundElements.forEach((el) => {
          const key = el.getAttribute('data-bind');
          if (key) {
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
              allData[key] = (el as HTMLInputElement).value;
            } else if (el.tagName === 'SELECT') {
              allData[key] = (el as HTMLSelectElement).value;
            } else {
              allData[key] = el.textContent;
            }
          }
        });
        return { ...allData, ...((doc as any).__uiState || {}) };
      },

      // ========== State Management API ==========
      /**
       * Update state value
       */
      setState: (key: string, value: any): void => {
        if (!(doc as any).__uiState) {
          (doc as any).__uiState = {};
        }
        (doc as any).__uiState[key] = value;
        // Update data-bound elements
        const stateElements = doc.querySelectorAll(`[data-state="${key}"]`);
        stateElements.forEach((el) => {
          el.textContent = String(value);
        });
      },

      /**
       * Get state value
       */
      getState: (key: string): any => {
        return (doc as any).__uiState?.[key];
      },

      // ========== Event Management API ==========
      /**
       * Attach event handler (through injector only)
       */
      on: (selector: string, event: string, handler: (e: Event) => void): void => {
        injector.attachHandler(selector, event, handler);
      },

      /**
       * Remove event handler
       */
      off: (selector: string, event: string): void => {
        injector.removeHandler(selector, event);
      },
    };
  }

  /**
   * Internal method to modify DOM (only called by API)
   */
  private modifyDOM(selector: string, callback: (el: Element) => void): void {
    const doc = this.getDocument();
    if (!doc) return;
    try {
      const elements = doc.querySelectorAll(selector);
      elements.forEach(callback);
    } catch (err) {
      console.error('DOM modification failed:', err);
    }
  }

  /**
   * Internal method to attach event handler
   */
  private attachHandler(selector: string, event: string, handler: (e: Event) => void): void {
    const doc = this.getDocument();
    if (!doc) return;
    try {
      const elements = doc.querySelectorAll(selector);
      elements.forEach((el) => {
        el.addEventListener(event, handler);
        // Store handler for cleanup
        const key = `${selector}:${event}`;
        if (!this.eventHandlers.has(key)) {
          this.eventHandlers.set(key, []);
        }
        this.eventHandlers.get(key)!.push({ element: el, event, handler });
      });
    } catch (err) {
      console.error('Event handler attachment failed:', err);
    }
  }

  /**
   * Internal method to remove event handler
   */
  private removeHandler(selector: string, event: string): void {
    const key = `${selector}:${event}`;
    const handlers = this.eventHandlers.get(key);
    if (handlers) {
      handlers.forEach(({ element, event, handler }) => {
        element.removeEventListener(event, handler);
      });
      this.eventHandlers.delete(key);
    }
  }

  /**
   * Expose controlled API for AI to modify DOM structure
   */
  getAPI() {
    if (!this.iframe) return null;
    try {
      const iframeDoc = this.getDocument();
      return iframeDoc ? (iframeDoc as any).__uiAPI : null;
    } catch {
      return null;
    }
  }
}

// Global instances
const globalInjector = new BehaviorInjector();
const globalRenderGuard = new RenderGuard();

export const HtmlSandboxRenderer: React.FC<HtmlSandboxRendererProps> = ({
  rawHtml,
  className = '',
  onReady,
  iframeRef: externalIframeRef,
  onNav,
}) => {
  const internalIframeRef = useRef<HTMLIFrameElement>(null);
  const iframeRef = externalIframeRef || internalIframeRef;
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [renderValid, setRenderValid] = useState<boolean | null>(null);
  const [renderErrors, setRenderErrors] = useState<string[]>([]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !rawHtml || rawHtml.trim().length === 0) {
      setIsLoading(false);
      return;
    }

    try {
      globalInjector.init(iframe, { onNav });
      globalRenderGuard.init(iframe);

      // Extract and preserve Tailwind config if present
      const tailwindConfigMatch = rawHtml.match(/<script[^>]*tailwind[^>]*>([\s\S]*?)<\/script>/i);
      let tailwindConfig = '';
      if (tailwindConfigMatch) {
        tailwindConfig = tailwindConfigMatch[1];
      }

      // Extract all <style> blocks
      const styleMatches = rawHtml.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi);
      const styles: string[] = [];
      for (const match of styleMatches) {
        styles.push(match[1]);
      }

      // Determine if we have a full HTML document or fragments
      let htmlContent = rawHtml;
      const hasDoctype = rawHtml.includes('<!DOCTYPE');
      const hasHtmlTag = rawHtml.includes('<html');
      const hasBodyTag = rawHtml.includes('<body');

      // If it's a full HTML document, use as-is
      // Otherwise, wrap in a minimal HTML structure
      let fullHtml = htmlContent;
      if (!hasDoctype && !hasHtmlTag) {
        // Wrap fragments in a complete HTML document
        const bodyMatch = rawHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
        const bodyContent = bodyMatch ? bodyMatch[1] : rawHtml;
        
        fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>UI Preview</title>
  ${styles.map(style => `<style>${style}</style>`).join('\n')}
  ${tailwindConfig ? `<script>${tailwindConfig}</script>` : ''}
  <!-- Tailwind CDN for JIT compilation -->
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    /* Ensure body scroll works */
    html, body {
      width: 100%;
      height: 100%;
      margin: 0;
      padding: 0;
      overflow-x: hidden;
    }
    body {
      overflow-y: auto;
    }
    /* Preserve fixed/sticky positioning */
    [style*="position: fixed"], [style*="position:fixed"],
    .fixed, [class*="fixed"] {
      position: fixed !important;
    }
    [style*="position: sticky"], [style*="position:sticky"],
    .sticky, [class*="sticky"] {
      position: sticky !important;
    }
  </style>
</head>
<body>
  ${bodyContent}
</body>
</html>`;
      }

      // Write HTML to iframe
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (iframeDoc) {
        iframeDoc.open();
        iframeDoc.write(fullHtml);
        iframeDoc.close();

        // Wait for content to load, then run render guard and inject behaviors
        const handleLoad = () => {
          setTimeout(() => {
            // Run Render Guard first (lightweight, runs in milliseconds)
            const guardResult = globalRenderGuard.check();
            setRenderValid(guardResult.valid);
            setRenderErrors(guardResult.errors);
            // Update global state
            globalRenderValid = guardResult.valid;
            globalRenderErrors = guardResult.errors;

            if (!guardResult.valid) {
              console.error('🚨 Render Guard failed:', guardResult.errors);
              setIsLoading(false);
              // Do not proceed to behavior injection if guard fails
              return;
            }

            // Guard passed: proceed with behavior injection
            globalInjector.inject();
            setIsLoading(false);
            if (onReady) {
              onReady();
            }
          }, 100);
        };

        // Check if already loaded
        if (iframeDoc.readyState === 'complete') {
          handleLoad();
        } else {
          iframe.onload = handleLoad;
        }
      } else {
        // Iframe not accessible, wait a bit and retry
        setTimeout(() => {
          const retryDoc = iframe.contentDocument || iframe.contentWindow?.document;
          if (retryDoc) {
            retryDoc.open();
            retryDoc.write(fullHtml);
            retryDoc.close();
            setTimeout(() => {
              // Run Render Guard first
              const guardResult = globalRenderGuard.check();
              setRenderValid(guardResult.valid);
              setRenderErrors(guardResult.errors);
              // Update global state
              globalRenderValid = guardResult.valid;
              globalRenderErrors = guardResult.errors;

              if (!guardResult.valid) {
                console.error('🚨 Render Guard failed:', guardResult.errors);
                setIsLoading(false);
                return;
              }

              // Guard passed: proceed with behavior injection
              globalInjector.inject();
              setIsLoading(false);
              if (onReady) {
                onReady();
              }
            }, 200);
          } else {
            setIsLoading(false);
          }
        }, 100);
      }

      setError(null);
    } catch (err) {
      console.error('HTML Sandbox Renderer Error:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
      setIsLoading(false);
    }
  }, [rawHtml, onReady, iframeRef, onNav]);

  if (error) {
    return (
      <div className={`border border-red-500 p-4 ${className}`}>
        <div className="text-red-500 text-sm mb-2">HTML渲染失败</div>
        <div className="text-red-400 text-xs">{error.message}</div>
      </div>
    );
  }

  // Render Guard failed: show errors
  if (renderValid === false) {
    return (
      <div className={`border border-yellow-500 p-4 ${className}`} style={{ width: '100%', height: '100%' }}>
        <div className="text-yellow-500 text-sm mb-2 font-semibold">⚠️ 渲染验证失败</div>
        <div className="text-yellow-400 text-xs mb-2">以下问题阻止了渲染完成：</div>
        <ul className="list-disc list-inside text-yellow-300 text-xs space-y-1">
          {renderErrors.map((err, idx) => (
            <li key={idx}>{err}</li>
          ))}
        </ul>
        <div className="text-yellow-400 text-xs mt-3">
          渲染已停止，不会进行AI后处理。
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ width: '100%', height: '100%' }}>
        <div className="text-zinc-500 text-sm">正在加载 HTML...</div>
      </div>
    );
  }

  // Outer container: only layout properties, no visual modifiers
  // iframe provides complete isolation and preserves all original HTML behavior
  return (
    <iframe
      ref={iframeRef}
      className={className}
      style={{
        width: '100%',
        height: '100%',
        border: 'none',
        // CRITICAL: Only layout properties, no visual modifiers
        opacity: undefined,
        filter: undefined,
        backdropFilter: undefined,
        transform: undefined,
        backgroundColor: undefined,
        background: undefined,
      } as React.CSSProperties}
      sandbox="allow-scripts allow-same-origin"
      title="UI Preview Sandbox"
    />
  );
};

// Global render valid state (exposed for external access)
let globalRenderValid: boolean | null = null;
let globalRenderErrors: string[] = [];

/**
 * Expose API for AI to modify DOM structure
 */
export function getSandboxAPI(): any {
  const api = globalInjector.getAPI();
  if (api) {
    // Add render guard status to API
    api.getRenderValid = () => globalRenderValid;
    api.getRenderErrors = () => globalRenderErrors;
  }
  return api;
}

/**
 * Get render guard status
 */
export function getRenderGuardStatus(): { valid: boolean | null; errors: string[] } {
  return { valid: globalRenderValid, errors: globalRenderErrors };
}

