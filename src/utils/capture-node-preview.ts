/**
 * 导出 PRD 前为节点生成预览图（dataURL）
 * 用于解决导出 HTML 中 UI 不可见：导出前对每个有 view.code 的节点截图，传入导出函数作为 uiPreview。
 */

import { buildCaptureScript } from '@/lib/ui/capture-injector';

const DEFAULT_TIMEOUT_MS = 12000;
const LOAD_WAIT_MS = 800;

function buildFullHtml(rawHtml: string): string {
  const styleMatches = rawHtml.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi);
  const styles: string[] = [];
  for (const match of styleMatches) {
    styles.push(match[1]);
  }
  const tailwindConfigMatch = rawHtml.match(/<script[^>]*tailwind[^>]*>([\s\S]*?)<\/script>/i);
  const tailwindConfig = tailwindConfigMatch ? tailwindConfigMatch[1] : '';
  const hasDoctype = rawHtml.includes('<!DOCTYPE');
  const hasHtmlTag = rawHtml.includes('<html');
  const bodyMatch = rawHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const bodyContent = bodyMatch ? bodyMatch[1].trim() : rawHtml.trim();

  if (hasDoctype && hasHtmlTag) {
    return rawHtml;
  }

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview</title>
  ${styles.map((s) => `<style>${s}</style>`).join('\n')}
  ${tailwindConfig ? `<script>${tailwindConfig}</script>` : ''}
  <script src="https://cdn.tailwindcss.com"></script>
  <style>html,body{width:100%;min-height:100%;margin:0;padding:0;overflow-x:hidden;}body{overflow-y:auto;}</style>
</head>
<body>
  ${bodyContent}
</body>
</html>`;
}

/**
 * 将一段 HTML 在隐藏 iframe 中渲染并截图为 dataURL
 */
export function captureHtmlToDataUrl(
  rawHtml: string,
  options: { timeout?: number } = {}
): Promise<string> {
  const timeoutMs = options.timeout ?? DEFAULT_TIMEOUT_MS;

  return new Promise((resolve, reject) => {
    if (typeof document === 'undefined' || !document.body) {
      reject(new Error('captureHtmlToDataUrl requires DOM'));
      return;
    }

    const fullHtml = buildFullHtml(rawHtml);
    const iframe = document.createElement('iframe');
    iframe.setAttribute('sandbox', 'allow-scripts');
    iframe.style.cssText =
      'position:fixed;left:-9999px;top:0;width:375px;height:812px;border:0;visibility:hidden;';
    document.body.appendChild(iframe);

    const cleanup = () => {
      try {
        window.removeEventListener('message', onMessage);
        if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
      } catch (_) {}
    };

    const timeoutId = setTimeout(() => {
      cleanup();
      reject(new Error('截取预览图超时'));
    }, timeoutMs);

    const onMessage = (event: MessageEvent) => {
      if (event.source !== iframe.contentWindow) return;
      const msg = event.data;
      if (msg?.type === 'CAPTURE_COMPLETE') {
        clearTimeout(timeoutId);
        cleanup();
        resolve(msg.dataUrl as string);
      } else if (msg?.type === 'CAPTURE_ERROR') {
        clearTimeout(timeoutId);
        cleanup();
        reject(new Error((msg.error as string) || '截图失败'));
      }
    };

    window.addEventListener('message', onMessage);

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) {
      clearTimeout(timeoutId);
      cleanup();
      reject(new Error('无法访问 iframe 文档'));
      return;
    }

    iframe.onload = () => {
      setTimeout(() => {
        try {
          const win = iframe.contentWindow;
          if (!win) {
            clearTimeout(timeoutId);
            cleanup();
            reject(new Error('iframe contentWindow 不可用'));
            return;
          }
          const script = doc.createElement('script');
          script.textContent = buildCaptureScript({ quality: 0.9, pixelRatio: 2 });
          doc.body.appendChild(script);
          win.postMessage({ type: 'CAPTURE_REQUEST' }, window.location.origin);
        } catch (e) {
          clearTimeout(timeoutId);
          cleanup();
          reject(e);
        }
      }, LOAD_WAIT_MS);
    };

    doc.open();
    doc.write(fullHtml);
    doc.close();
  });
}

export type NodePreviewInput = { id: string; html: string };

/**
 * 批量为多个节点生成预览 dataURL，返回 nodeId -> dataUrl
 * 跳过无 html 的节点；失败节点不写入，调用方可用占位图
 */
export async function captureNodePreviews(
  nodes: NodePreviewInput[],
  options: { timeoutPerNode?: number; concurrency?: number } = {}
): Promise<Record<string, string>> {
  const timeout = options.timeoutPerNode ?? DEFAULT_TIMEOUT_MS;
  const concurrency = Math.max(1, options.concurrency ?? 2);
  const result: Record<string, string> = {};

  const withHtml = nodes.filter((n) => n.html && n.html.trim().length > 0);
  if (withHtml.length === 0) return result;

  const run = async (node: NodePreviewInput) => {
    try {
      const dataUrl = await captureHtmlToDataUrl(node.html, { timeout });
      result[node.id] = dataUrl;
    } catch (_) {
      // 单节点失败不抛，仅不写入 result
    }
  };

  for (let i = 0; i < withHtml.length; i += concurrency) {
    const batch = withHtml.slice(i, i + concurrency);
    await Promise.all(batch.map(run));
  }

  return result;
}
