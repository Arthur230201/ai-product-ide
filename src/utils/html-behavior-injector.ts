/**
 * HTML Behavior Injector
 * 
 * Provides a controlled API for injecting behaviors into HTML content
 * without modifying the original HTML structure
 */

export interface BehaviorInjectorAPI {
  /**
   * Update state value
   */
  updateState: (key: string, value: any) => void;
  
  /**
   * Get state value
   */
  getState: (key: string) => any;
  
  /**
   * Modify DOM elements by selector
   */
  modifyDOM: (selector: string, callback: (el: Element) => void) => void;
  
  /**
   * Attach event handler to elements
   */
  attachHandler: (selector: string, event: string, handler: (e: Event) => void) => void;
  
  /**
   * Inject data into the DOM
   */
  injectData: (data: Record<string, any>) => void;
}

/**
 * Create a behavior injector for a given container
 */
export function createBehaviorInjector(container: Element | ShadowRoot): BehaviorInjectorAPI {
  const state: Record<string, any> = {};
  const handlers: Map<string, Array<{ selector: string; event: string; handler: (e: Event) => void }>> = new Map();

  return {
    updateState: (key: string, value: any) => {
      state[key] = value;
      // Update all elements with data-state attribute
      const stateElements = container.querySelectorAll(`[data-state="${key}"]`);
      stateElements.forEach((el) => {
        el.textContent = String(value);
      });
    },

    getState: (key: string) => {
      return state[key];
    },

    modifyDOM: (selector: string, callback: (el: Element) => void) => {
      const elements = container.querySelectorAll(selector);
      elements.forEach(callback);
    },

    attachHandler: (selector: string, event: string, handler: (e: Event) => void) => {
      const elements = container.querySelectorAll(selector);
      elements.forEach((el) => {
        el.addEventListener(event, handler);
      });
      // Store handler for cleanup
      const key = `${selector}:${event}`;
      if (!handlers.has(key)) {
        handlers.set(key, []);
      }
      handlers.get(key)!.push({ selector, event, handler });
    },

    injectData: (data: Record<string, any>) => {
      Object.entries(data).forEach(([key, value]) => {
        // Inject into elements with data-inject attribute
        const elements = container.querySelectorAll(`[data-inject="${key}"]`);
        elements.forEach((el) => {
          if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
            (el as HTMLInputElement).value = String(value);
          } else {
            el.textContent = String(value);
          }
        });
      });
    },
  };
}



