/**
 * Demo Router
 * 
 * Simulates page navigation inside iframe without real routing or page reloads.
 * Only enabled in presentation mode.
 * 
 * Features:
 * - Intercepts navigation intent via data-demo-nav attributes
 * - Supports forward and back navigation
 * - Preserves scroll position when navigating back
 * - Swaps HTML content inside iframe
 */

export interface NavigationState {
  html: string;
  scrollPosition: number;
  timestamp: number;
}

export interface DemoRouterConfig {
  /** Iframe element */
  iframe: HTMLIFrameElement;
  /** Callback to get HTML content for a given node ID */
  getHtmlForNode: (nodeId: string) => string | null;
  /** Callback when navigation occurs */
  onNavigate?: (nodeId: string) => void;
  /** Callback for navigation errors */
  onError?: (error: string) => void;
}

/**
 * Demo Router Class
 */
export class DemoRouter {
  private iframe: HTMLIFrameElement;
  private getHtmlForNode: (nodeId: string) => string | null;
  private onNavigate?: (nodeId: string) => void;
  private onError?: (error: string) => void;
  
  private history: NavigationState[] = [];
  private currentIndex: number = -1;
  private forwardStack: NavigationState[] = [];
  
  private isEnabled: boolean = false;
  private clickHandler?: (e: MouseEvent) => void;
  private attachRetryTimeout?: ReturnType<typeof setTimeout>;

  constructor(config: DemoRouterConfig) {
    this.iframe = config.iframe;
    this.getHtmlForNode = config.getHtmlForNode;
    this.onNavigate = config.onNavigate;
    this.onError = config.onError;
  }

  /**
   * Enable demo router (only in presentation mode)
   */
  enable(initialHtml: string, initialNodeId?: string) {
    if (this.isEnabled) return;
    
    this.isEnabled = true;
    
    // Initialize history with current page
    this.history = [{
      html: initialHtml,
      scrollPosition: 0,
      timestamp: Date.now(),
    }];
    this.currentIndex = 0;
    this.forwardStack = [];

    // Attach click handler to intercept navigation
    this.attachNavigationHandler();
  }

  /**
   * Disable demo router
   */
  disable() {
    if (!this.isEnabled) return;
    
    this.isEnabled = false;
    this.detachNavigationHandler();
    if (this.attachRetryTimeout) {
      clearTimeout(this.attachRetryTimeout);
      this.attachRetryTimeout = undefined;
    }
    this.history = [];
    this.currentIndex = -1;
    this.forwardStack = [];
  }

  /**
   * Navigate to a new page (by node ID)
   * Returns true if navigation succeeded, false otherwise
   */
  navigateTo(nodeId: string): boolean {
    if (!this.isEnabled) {
      if (this.onError) {
        this.onError('Demo router is not enabled');
      }
      return false;
    }

    const html = this.getHtmlForNode(nodeId);
    if (!html) {
      const errorMsg = `No HTML content found for node: ${nodeId}`;
      if (this.onError) {
        this.onError(errorMsg);
      }
      return false;
    }

    // Save current scroll position before navigation
    this.saveCurrentScrollPosition();

    // Clear forward stack (can't go forward after new navigation)
    this.forwardStack = [];

    // Add new page to history
    const newState: NavigationState = {
      html,
      scrollPosition: 0,
      timestamp: Date.now(),
    };
    
    this.history.push(newState);
    this.currentIndex = this.history.length - 1;

    // Swap HTML content in iframe
    this.swapHtmlContent(html);

    // Notify navigation
    if (this.onNavigate) {
      this.onNavigate(nodeId);
    }
    
    return true;
  }

  /**
   * Navigate back
   */
  navigateBack(): boolean {
    if (!this.isEnabled || this.currentIndex <= 0) {
      return false;
    }

    // Save current scroll position
    this.saveCurrentScrollPosition();

    // Move current state to forward stack
    const currentState = this.history[this.currentIndex];
    this.forwardStack.push(currentState);

    // Navigate to previous state
    this.currentIndex--;
    const previousState = this.history[this.currentIndex];

    // Restore HTML and scroll position
    this.swapHtmlContent(previousState.html, previousState.scrollPosition);

    return true;
  }

  /**
   * Navigate forward
   */
  navigateForward(): boolean {
    if (!this.isEnabled || this.forwardStack.length === 0) {
      return false;
    }

    // Save current scroll position
    this.saveCurrentScrollPosition();

    // Get next state from forward stack
    const nextState = this.forwardStack.pop()!;
    
    // Add to history
    this.currentIndex++;
    this.history[this.currentIndex] = nextState;

    // Restore HTML and scroll position
    this.swapHtmlContent(nextState.html, nextState.scrollPosition);

    return true;
  }

  /**
   * Check if can navigate back
   */
  canGoBack(): boolean {
    return this.isEnabled && this.currentIndex > 0;
  }

  /**
   * Check if can navigate forward
   */
  canGoForward(): boolean {
    return this.isEnabled && this.forwardStack.length > 0;
  }

  /**
   * Attach navigation handler to intercept data-demo-nav clicks
   * Retries with exponential backoff (max 5 attempts)
   */
  private attachNavigationHandler(attempt: number = 0): void {
    const MAX_ATTEMPTS = 5;
    const RETRY_DELAY_MS = 100;

    const iframeDoc = this.iframe.contentDocument || this.iframe.contentWindow?.document;
    if (!iframeDoc) {
      if (attempt >= MAX_ATTEMPTS) {
        if (this.onError) {
          this.onError('Failed to attach navigation handler: iframe not ready');
        }
        return;
      }
      // Iframe not ready, retry with exponential backoff
      this.attachRetryTimeout = setTimeout(
        () => this.attachNavigationHandler(attempt + 1),
        RETRY_DELAY_MS * (attempt + 1)
      );
      return;
    }

    // Clear retry timeout on success
    if (this.attachRetryTimeout) {
      clearTimeout(this.attachRetryTimeout);
      this.attachRetryTimeout = undefined;
    }

    this.clickHandler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // Find element with data-demo-nav attribute (check target and parents)
      let navElement: HTMLElement | null = target;
      while (navElement && navElement !== iframeDoc.body) {
        const nodeId = navElement.getAttribute('data-demo-nav');
        if (nodeId) {
          e.preventDefault();
          e.stopPropagation();
          this.navigateTo(nodeId);
          return;
        }
        navElement = navElement.parentElement;
      }
    };

    iframeDoc.addEventListener('click', this.clickHandler, true);
  }

  /**
   * Detach navigation handler
   */
  private detachNavigationHandler() {
    if (!this.clickHandler) return;

    const iframeDoc = this.iframe.contentDocument || this.iframe.contentWindow?.document;
    if (iframeDoc) {
      iframeDoc.removeEventListener('click', this.clickHandler, true);
    }
    
    this.clickHandler = undefined;
  }

  /**
   * Save current scroll position
   */
  private saveCurrentScrollPosition() {
    if (this.currentIndex < 0 || this.currentIndex >= this.history.length) return;

    const iframeDoc = this.iframe.contentDocument || this.iframe.contentWindow?.document;
    if (!iframeDoc) return;

    const scrollY = iframeDoc.documentElement.scrollTop || iframeDoc.body.scrollTop || 0;
    this.history[this.currentIndex].scrollPosition = scrollY;
  }

  /**
   * Swap HTML content in iframe
   */
  private swapHtmlContent(html: string, scrollPosition?: number) {
    const iframeDoc = this.iframe.contentDocument || this.iframe.contentWindow?.document;
    if (!iframeDoc) return;

    // Check if html is a full document or fragment
    const hasDoctype = html.includes('<!DOCTYPE');
    const hasHtmlTag = html.includes('<html');
    const hasBodyTag = html.includes('<body');

    let bodyContent = html;

    if (hasDoctype || hasHtmlTag) {
      // Extract body content from full HTML document
      const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      if (bodyMatch) {
        bodyContent = bodyMatch[1];
      } else if (hasBodyTag) {
        // Body tag exists but might not be closed properly
        const bodyStart = html.indexOf('<body');
        const bodyOpenEnd = html.indexOf('>', bodyStart);
        if (bodyOpenEnd !== -1) {
          bodyContent = html.substring(bodyOpenEnd + 1);
        }
      }
    }

    // Update body content
    if (iframeDoc.body) {
      iframeDoc.body.innerHTML = bodyContent;
    } else {
      // If body doesn't exist, create it
      const body = iframeDoc.createElement('body');
      body.innerHTML = bodyContent;
      iframeDoc.documentElement.appendChild(body);
    }

    // Reattach navigation handler (new content may have new nav elements)
    // Use requestAnimationFrame for better timing with DOM updates
    this.detachNavigationHandler();
    requestAnimationFrame(() => {
      // Small delay to ensure DOM is updated
      setTimeout(() => this.attachNavigationHandler(), 0);
    });

    // Restore scroll position after content loads
    const restoreScroll = () => {
      const targetScroll = scrollPosition !== undefined ? scrollPosition : 0;
      if (iframeDoc.documentElement) {
        iframeDoc.documentElement.scrollTop = targetScroll;
      }
      if (iframeDoc.body) {
        iframeDoc.body.scrollTop = targetScroll;
      }
    };

    // Wait for content to render
    // Use requestAnimationFrame + small delay for synchronous content
    requestAnimationFrame(() => {
      setTimeout(restoreScroll, 50);
    });
    // Additional attempt for async content (images, fonts, etc.)
    setTimeout(restoreScroll, 200);
  }

  /**
   * Get current navigation state
   */
  getCurrentState(): NavigationState | null {
    if (!this.isEnabled || this.currentIndex < 0 || this.currentIndex >= this.history.length) {
      return null;
    }
    return this.history[this.currentIndex];
  }

  /**
   * Self-check: returns PASS/FAIL with reason
   * Validates router state and iframe accessibility
   */
  selfCheck(): { pass: boolean; reason: string } {
    if (!this.iframe) {
      return { pass: false, reason: 'Iframe reference is null' };
    }

    const iframeDoc = this.iframe.contentDocument || this.iframe.contentWindow?.document;
    if (!iframeDoc) {
      return { pass: false, reason: 'Iframe document not accessible' };
    }

    if (!this.getHtmlForNode) {
      return { pass: false, reason: 'getHtmlForNode callback is not set' };
    }

    if (this.isEnabled && this.currentIndex < 0) {
      return { pass: false, reason: 'Router enabled but history is empty' };
    }

    return { pass: true, reason: 'All checks passed' };
  }
}

