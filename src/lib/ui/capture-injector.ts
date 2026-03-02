/**
 * Capture Injector Script
 * 
 * Pure frontend JS for capturing long screenshots in iframe.
 * - Scrolls through the page in chunks
 * - Uses SVG foreignObject to render HTML to Canvas
 * - Stitches into a single long image
 * - Posts dataURL back to host
 */

export interface CaptureOptions {
  /** Include fixed elements (e.g., bottom bar) in capture */
  includeFixed?: boolean;
  /** Quality (0-1, default 0.9) */
  quality?: number;
  /** Pixel ratio (default 2 for retina) */
  pixelRatio?: number;
}

/**
 * Build capture script string
 * 
 * @param options Capture options
 * @returns JavaScript code as string to be injected into iframe
 */
export function buildCaptureScript(options: CaptureOptions = {}): string {
  const {
    includeFixed = false,
    quality = 0.9,
    pixelRatio = 2,
  } = options;

  return `
(function() {
  'use strict';
  
  // ==================== PostMessage Helper ====================
  function postToHost(type, payload) {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type, ...payload }, window.location.origin);
    }
  }
  
  // ==================== Render HTML to Canvas using SVG foreignObject ====================
  async function renderHtmlToCanvas(htmlElement, width, height, pixelRatio) {
    return new Promise((resolve, reject) => {
      try {
        // Create SVG with foreignObject
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        svg.setAttribute('width', (width * pixelRatio).toString());
        svg.setAttribute('height', (height * pixelRatio).toString());
        
        const foreignObject = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
        foreignObject.setAttribute('width', (width * pixelRatio).toString());
        foreignObject.setAttribute('height', (height * pixelRatio).toString());
        foreignObject.setAttribute('x', '0');
        foreignObject.setAttribute('y', '0');
        
        // Clone the element with styles
        const clone = htmlElement.cloneNode(true);
        clone.style.width = (width * pixelRatio) + 'px';
        clone.style.height = (height * pixelRatio) + 'px';
        clone.style.transform = 'scale(' + pixelRatio + ')';
        clone.style.transformOrigin = 'top left';
        
        foreignObject.appendChild(clone);
        svg.appendChild(foreignObject);
        
        // Serialize SVG
        const svgData = new XMLSerializer().serializeToString(svg);
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const svgUrl = URL.createObjectURL(svgBlob);
        
        // Create image from SVG
        const img = new Image();
        img.onload = function() {
          // Create canvas and draw image
          const canvas = document.createElement('canvas');
          canvas.width = width * pixelRatio;
          canvas.height = height * pixelRatio;
          const ctx = canvas.getContext('2d');
          
          if (ctx) {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            URL.revokeObjectURL(svgUrl);
            resolve(canvas);
          } else {
            URL.revokeObjectURL(svgUrl);
            reject(new Error('Canvas context not available'));
          }
        };
        img.onerror = function() {
          URL.revokeObjectURL(svgUrl);
          reject(new Error('Failed to load SVG image'));
        };
        img.src = svgUrl;
      } catch (error) {
        reject(error);
      }
    });
  }
  
  // ==================== Capture Long Screenshot ====================
  async function captureLongScreenshot() {
    try {
      const doc = document;
      const body = doc.body;
      const html = doc.documentElement;
      
      if (!body || !html) {
        postToHost('CAPTURE_ERROR', { error: 'Document not ready' });
        return;
      }
      
      // Get full dimensions
      const fullWidth = Math.max(
        html.scrollWidth,
        html.offsetWidth,
        body.scrollWidth,
        body.offsetWidth,
        window.innerWidth
      );
      const fullHeight = Math.max(
        html.scrollHeight,
        html.offsetHeight,
        body.scrollHeight,
        body.offsetHeight
      );
      
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      
      // Calculate number of chunks needed
      const chunks = Math.ceil(fullHeight / viewportHeight);
      
      // Create canvas for final image
      const canvas = doc.createElement('canvas');
      canvas.width = fullWidth * pixelRatio;
      canvas.height = fullHeight * pixelRatio;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        postToHost('CAPTURE_ERROR', { error: 'Canvas context not available' });
        return;
      }
      
      // Set white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Store original scroll position
      const originalScrollTop = window.pageYOffset || doc.documentElement.scrollTop;
      const originalScrollLeft = window.pageXOffset || doc.documentElement.scrollLeft;
      
      // Handle fixed elements
      const fixedElements = [];
      if (!includeFixed) {
        // Convert fixed to static during capture
        const allElements = body.querySelectorAll('*');
        allElements.forEach((el) => {
          const htmlEl = el;
          const computedStyle = window.getComputedStyle(htmlEl);
          if (computedStyle.position === 'fixed') {
            fixedElements.push({
              element: htmlEl,
              originalPosition: htmlEl.style.position || '',
              originalBottom: htmlEl.style.bottom || '',
              originalTop: htmlEl.style.top || '',
            });
            htmlEl.style.position = 'static';
            htmlEl.style.bottom = '';
            htmlEl.style.top = '';
          }
        });
      }
      
      // Create a container to capture viewport content
      const captureContainer = doc.createElement('div');
      captureContainer.style.position = 'absolute';
      captureContainer.style.left = '-9999px';
      captureContainer.style.top = '0';
      captureContainer.style.width = viewportWidth + 'px';
      captureContainer.style.overflow = 'hidden';
      body.appendChild(captureContainer);
      
      // Capture each chunk
      for (let i = 0; i < chunks; i++) {
        // Scroll to chunk position
        const scrollY = i * viewportHeight;
        window.scrollTo(0, scrollY);
        
        // Wait for scroll to settle and content to render
        await new Promise(resolve => setTimeout(resolve, 150));
        
        // Get the visible viewport content
        const viewportContent = doc.createElement('div');
        viewportContent.style.width = viewportWidth + 'px';
        viewportContent.style.height = viewportHeight + 'px';
        viewportContent.style.position = 'relative';
        viewportContent.style.overflow = 'hidden';
        
        // Clone body content and position it to show current viewport
        const bodyClone = body.cloneNode(true);
        bodyClone.style.position = 'absolute';
        bodyClone.style.top = '-' + scrollY + 'px';
        bodyClone.style.left = '0';
        viewportContent.appendChild(bodyClone);
        captureContainer.appendChild(viewportContent);
        
        try {
          // Render viewport to canvas using SVG foreignObject
          const chunkCanvas = await renderHtmlToCanvas(viewportContent, viewportWidth, viewportHeight, pixelRatio);
          
          // Draw chunk to main canvas
          const destY = scrollY * pixelRatio;
          ctx.drawImage(chunkCanvas, 0, destY);
          
          // Clean up
          captureContainer.removeChild(viewportContent);
        } catch (renderError) {
          // Fallback: draw a placeholder
          ctx.fillStyle = '#f0f0f0';
          ctx.fillRect(0, scrollY * pixelRatio, canvas.width, viewportHeight * pixelRatio);
          ctx.fillStyle = '#666';
          ctx.font = (14 * pixelRatio) + 'px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('Chunk ' + (i + 1) + ' of ' + chunks, canvas.width / 2, (scrollY + viewportHeight / 2) * pixelRatio);
          
          captureContainer.removeChild(viewportContent);
        }
        
        // Notify progress
        postToHost('CAPTURE_PROGRESS', {
          chunk: i + 1,
          total: chunks,
          progress: Math.round(((i + 1) / chunks) * 100)
        });
      }
      
      // Clean up capture container
      body.removeChild(captureContainer);
      
      // Restore original scroll position
      window.scrollTo(originalScrollLeft, originalScrollTop);
      
      // Restore fixed elements
      fixedElements.forEach(({ element, originalPosition, originalBottom, originalTop }) => {
        element.style.position = originalPosition;
        if (originalBottom) element.style.bottom = originalBottom;
        if (originalTop) element.style.top = originalTop;
      });
      
      // Convert canvas to data URL
      const dataUrl = canvas.toDataURL('image/png', quality);
      
      // Post result to host
      postToHost('CAPTURE_COMPLETE', {
        dataUrl: dataUrl,
        width: fullWidth,
        height: fullHeight
      });
      
    } catch (error) {
      postToHost('CAPTURE_ERROR', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
  
  // ==================== Listen for Capture Request ====================
  window.addEventListener('message', function(event) {
    // Only accept messages from parent window
    if (event.source !== window.parent) return;
    
    const message = event.data;
    if (message && message.type === 'CAPTURE_REQUEST') {
      const options = message.options || {};
      captureLongScreenshot();
    }
  });
  
  // Expose capture function globally for direct calls
  window.captureLongScreenshot = captureLongScreenshot;
  
  // Notify host that capture injector is ready
  postToHost('CAPTURE_INJECTOR_READY', {});
})();
`.trim();
}
