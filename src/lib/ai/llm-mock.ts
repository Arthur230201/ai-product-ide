/**
 * LLM Mock Layer
 * 
 * Provides deterministic mock responses for E2E testing.
 * Controlled by AI_RUNTIME environment variable: 'mock' | 'real'
 */

import type { z } from 'zod';
import type { AIResult } from './llm';
import { log } from '@/lib/logger';

/**
 * Check if we should use mock mode
 */
export function shouldUseMock(): boolean {
  const runtime = process.env.AI_RUNTIME || 'real';
  return runtime === 'mock';
}

/**
 * Mock callText - returns deterministic HTML or JSON based on actionName
 */
export async function mockCallText(params: {
  prompt: string;
  actionName?: string;
  mode?: string;
}): Promise<AIResult<string>> {
  log('🎭 [LLM Mock] Mock callText called', {
    actionName: params.actionName,
    mode: params.mode,
    promptLength: params.prompt.length,
  });

  // Simulate network delay (10-50ms)
  await new Promise(resolve => setTimeout(resolve, 10 + Math.random() * 40));

  // For generateGraph, return JSON instead of HTML
  if (params.actionName === 'generateGraph' || params.actionName?.includes('generateGraph')) {
    const mockGraphJSON = JSON.stringify({
      clarity: {
        confidence: 85,
        isVague: false,
        detectedDomain: '产品展示',
        detectedBusinessObject: '产品',
        detectedAction: '展示',
      },
      graph: {
        global: {
          userJourneys: [
            {
              id: 'JOURNEY_01',
              name: '产品展示流程',
              actor: '用户',
              narrative: '作为用户，我想要浏览产品，以便了解产品信息',
              steps: ['浏览', '查看详情'],
            },
          ],
          businessEvents: [],
        },
        nodes: [
          {
            id: 'page_1',
            type: 'page',
            pageType: 'View',
            label: '产品展示页面',
            description: '展示产品列表和详情',
            userStories: [
              {
                id: 'US-001',
                role: '用户',
                activity: '浏览产品列表',
                value: '了解可用产品',
                acceptanceCriteria: ['显示产品列表', '支持搜索和筛选'],
              },
            ],
            businessContext: {
              domain: '产品展示',
              role: '用户',
              goal: '浏览和了解产品',
            },
            dataQueries: [],
            traceability: {
              implementsJourney: 'JOURNEY_01',
              journeyStep: '浏览',
              consumesEvent: [],
            },
          },
        ],
        edges: [],
      },
    }, null, 2);
    
    return {
      ok: true,
      data: mockGraphJSON,
      raw: mockGraphJSON,
      metrics: {
        queuedMs: 0,
        dedupHit: false,
        totalMs: 20,
      },
    };
  }
  
  // For analyzeInputClarity, return JSON
  if (params.actionName?.includes('analyzeInputClarity')) {
    const mockClarityJSON = JSON.stringify({
      confidence: 85,
      isVague: false,
      detectedDomain: '产品展示',
      detectedBusinessObject: '产品',
      detectedAction: '展示',
    }, null, 2);
    
    return {
      ok: true,
      data: mockClarityJSON,
      raw: mockClarityJSON,
      metrics: {
        queuedMs: 0,
        dedupHit: false,
        totalMs: 20,
      },
    };
  }

  // For UI pipeline actions, return HTML
  // Determine stage from actionName or mode
  const stage = params.mode || params.actionName || 'static';
  
  let mockHTML = '';
  
  if (stage.includes('static') || stage.includes('generateStaticUI')) {
    mockHTML = generateMockStaticHTML();
  } else if (stage.includes('beautify')) {
    mockHTML = generateMockBeautifiedHTML();
  } else if (stage.includes('interact') || stage.includes('addInteractions')) {
    mockHTML = generateMockInteractiveHTML();
  } else {
    // Default to static
    mockHTML = generateMockStaticHTML();
  }

  return {
    ok: true,
    data: mockHTML,
    raw: mockHTML,
    metrics: {
      queuedMs: 0,
      dedupHit: false,
      totalMs: 20,
    },
  };
}

/**
 * Mock callObject - returns deterministic object
 * T = schema type (ZodType); return data is z.infer<T>
 */
export async function mockCallObject<T extends z.ZodTypeAny>(params: {
  prompt: string;
  schema: T;
  actionName?: string;
  mode?: string;
}): Promise<AIResult<z.infer<T>>> {
  log('🎭 [LLM Mock] Mock callObject called', {
    actionName: params.actionName,
    mode: params.mode,
  });

  await new Promise(resolve => setTimeout(resolve, 10 + Math.random() * 40));

  // For generateGraph, return a simple graph structure
  if (params.actionName?.includes('generateGraph') || params.actionName?.includes('analyzeInputClarity')) {
    // Return a mock graph structure
    const mockGraphData = {
      global: {
        userJourneys: [
          {
            id: 'JOURNEY_01',
            name: '产品展示流程',
            actor: '用户',
            narrative: '作为用户，我想要浏览产品，以便了解产品信息',
            steps: ['浏览', '查看详情'],
          },
        ],
        businessEvents: [],
      },
      nodes: [
        {
          id: 'page_1',
          type: 'page',
          pageType: 'View',
          label: '产品展示页面',
          description: '展示产品列表和详情',
          userStories: [
            {
              id: 'US-001',
              role: '用户',
              activity: '浏览产品列表',
              value: '了解可用产品',
              acceptanceCriteria: ['显示产品列表', '支持搜索和筛选'],
            },
          ],
          businessContext: {
            domain: '产品展示',
            role: '用户',
            goal: '浏览和了解产品',
          },
          dataQueries: [],
          traceability: {
            implementsJourney: 'JOURNEY_01',
            journeyStep: '浏览',
            consumesEvent: [],
          },
        },
      ],
      edges: [],
    } as z.infer<T>;
    
    return {
      ok: true,
      data: mockGraphData,
      raw: JSON.stringify(mockGraphData),
      metrics: {
        queuedMs: 0,
        dedupHit: false,
        totalMs: 20,
      },
    };
  }
  
  // For InputClarityAnalysis, return high confidence
  if (params.actionName?.includes('analyzeInputClarity') || (params.schema as { shape?: { confidence?: unknown } })?.shape?.confidence) {
    const mockAnalysis = {
      confidence: 85,
      isVague: false,
      detectedDomain: '产品展示',
      detectedBusinessObject: '产品',
      detectedAction: '展示',
    } as z.infer<T>;
    
    return {
      ok: true,
      data: mockAnalysis,
      raw: JSON.stringify(mockAnalysis),
      metrics: {
        queuedMs: 0,
        dedupHit: false,
        totalMs: 20,
      },
    };
  }

  // Default: Return empty object (will trigger fallback)
  const mockData = {} as z.infer<T>;
  
  return {
    ok: true,
    data: mockData,
    raw: JSON.stringify(mockData),
    metrics: {
      queuedMs: 0,
      dedupHit: false,
      totalMs: 20,
    },
  };
}

/**
 * Generate mock static HTML (Stage 1)
 * Must satisfy:
 * - Single HTML file with inline <style>
 * - NO <script> tags
 * - 6-10 components with data-component-id
 * - CSS variables in :root
 * - At least one image placeholder (inline SVG)
 * - No external network fetches
 */
function generateMockStaticHTML(): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mock Static Page</title>
  <style>
    :root {
      --color-bg: #ffffff;
      --color-surface: #f9fafb;
      --color-text: #1f2937;
      --color-muted: #6b7280;
      --color-primary: #2563eb;
      --color-accent: #ef4444;
      --radius: 0.5rem;
      --shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
      --space-xs: 0.25rem;
      --space-sm: 0.5rem;
      --space-md: 1rem;
      --space-lg: 1.5rem;
      --font-base: 1rem;
      --font-lg: 1.125rem;
      --font-xl: 1.25rem;
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background-color: var(--color-bg);
      color: var(--color-text);
      line-height: 1.6;
    }
    
    .header {
      background-color: var(--color-surface);
      padding: var(--space-md);
      border-bottom: 1px solid #e5e7eb;
    }
    
    .nav {
      display: flex;
      gap: var(--space-md);
    }
    
    .nav-item {
      padding: var(--space-sm) var(--space-md);
      color: var(--color-text);
      text-decoration: none;
      border-radius: var(--radius);
    }
    
    .main {
      padding: var(--space-lg);
      max-width: 1200px;
      margin: 0 auto;
    }
    
    .card {
      background: var(--color-surface);
      border-radius: var(--radius);
      padding: var(--space-md);
      box-shadow: var(--shadow);
      margin-bottom: var(--space-md);
    }
    
    .card-title {
      font-size: var(--font-lg);
      font-weight: 600;
      margin-bottom: var(--space-sm);
    }
    
    .card-content {
      color: var(--color-muted);
    }
    
    .button {
      display: inline-block;
      padding: var(--space-sm) var(--space-md);
      background-color: var(--color-primary);
      color: white;
      border: none;
      border-radius: var(--radius);
      cursor: pointer;
      font-size: var(--font-base);
    }
    
    .footer {
      background-color: var(--color-surface);
      padding: var(--space-md);
      text-align: center;
      color: var(--color-muted);
      margin-top: var(--space-lg);
    }
    
    .image-placeholder {
      width: 100%;
      height: 200px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: var(--radius);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: var(--font-lg);
    }
    
    @media (max-width: 768px) {
      .main {
        padding: var(--space-md);
      }
    }
  </style>
</head>
<body>
  <header class="header" data-component-id="header">
    <nav class="nav" data-component-id="nav">
      <a href="#" class="nav-item" data-component-id="nav-item-home">首页</a>
      <a href="#" class="nav-item" data-component-id="nav-item-about">关于</a>
      <a href="#" class="nav-item" data-component-id="nav-item-contact">联系</a>
    </nav>
  </header>
  
  <main class="main" data-component-id="main">
    <div class="card" data-component-id="card-1">
      <h2 class="card-title">卡片标题 1</h2>
      <p class="card-content">这是第一个卡片的内容描述。</p>
      <div class="image-placeholder" data-component-id="image-1">图片占位符 1</div>
    </div>
    
    <div class="card" data-component-id="card-2">
      <h2 class="card-title">卡片标题 2</h2>
      <p class="card-content">这是第二个卡片的内容描述。</p>
    </div>
    
    <div class="card" data-component-id="card-3">
      <h2 class="card-title">卡片标题 3</h2>
      <p class="card-content">这是第三个卡片的内容描述。</p>
      <button class="button" data-component-id="button-1">操作按钮</button>
    </div>
    
    <div class="card" data-component-id="card-4">
      <h2 class="card-title">卡片标题 4</h2>
      <p class="card-content">这是第四个卡片的内容描述。</p>
    </div>
    
    <div class="card" data-component-id="card-5">
      <h2 class="card-title">卡片标题 5</h2>
      <p class="card-content">这是第五个卡片的内容描述。</p>
    </div>
    
    <div class="card" data-component-id="card-6">
      <h2 class="card-title">卡片标题 6</h2>
      <p class="card-content">这是第六个卡片的内容描述。</p>
    </div>
  </main>
  
  <footer class="footer" data-component-id="footer">
    <p>© 2024 Mock Static Page. All rights reserved.</p>
  </footer>
</body>
</html>`;
}

/**
 * Generate mock beautified HTML (Stage 2)
 * Only changes CSS, keeps DOM structure and component IDs unchanged
 */
function generateMockBeautifiedHTML(): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mock Beautified Page</title>
  <style>
    :root {
      --color-bg: #f8fafc;
      --color-surface: #ffffff;
      --color-text: #0f172a;
      --color-muted: #64748b;
      --color-primary: #3b82f6;
      --color-accent: #f59e0b;
      --radius: 0.75rem;
      --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      --space-xs: 0.5rem;
      --space-sm: 0.75rem;
      --space-md: 1.5rem;
      --space-lg: 2rem;
      --font-base: 1rem;
      --font-lg: 1.25rem;
      --font-xl: 1.5rem;
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background-color: var(--color-bg);
      color: var(--color-text);
      line-height: 1.7;
    }
    
    .header {
      background-color: var(--color-surface);
      padding: var(--space-md);
      border-bottom: 2px solid #e2e8f0;
      box-shadow: var(--shadow);
    }
    
    .nav {
      display: flex;
      gap: var(--space-md);
    }
    
    .nav-item {
      padding: var(--space-sm) var(--space-md);
      color: var(--color-text);
      text-decoration: none;
      border-radius: var(--radius);
      transition: background-color 0.2s;
    }
    
    .nav-item:hover {
      background-color: var(--color-bg);
    }
    
    .main {
      padding: var(--space-lg);
      max-width: 1200px;
      margin: 0 auto;
    }
    
    .card {
      background: var(--color-surface);
      border-radius: var(--radius);
      padding: var(--space-md);
      box-shadow: var(--shadow);
      margin-bottom: var(--space-md);
      transition: transform 0.2s, box-shadow 0.2s;
    }
    
    .card:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    }
    
    .card-title {
      font-size: var(--font-lg);
      font-weight: 700;
      margin-bottom: var(--space-sm);
      color: var(--color-text);
    }
    
    .card-content {
      color: var(--color-muted);
      font-size: var(--font-base);
    }
    
    .button {
      display: inline-block;
      padding: var(--space-sm) var(--space-md);
      background-color: var(--color-primary);
      color: white;
      border: none;
      border-radius: var(--radius);
      cursor: pointer;
      font-size: var(--font-base);
      font-weight: 600;
      transition: background-color 0.2s, transform 0.1s;
    }
    
    .button:hover {
      background-color: #2563eb;
      transform: scale(1.05);
    }
    
    .button:active {
      transform: scale(0.98);
    }
    
    .footer {
      background-color: var(--color-surface);
      padding: var(--space-md);
      text-align: center;
      color: var(--color-muted);
      margin-top: var(--space-lg);
      border-top: 2px solid #e2e8f0;
    }
    
    .image-placeholder {
      width: 100%;
      height: 200px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: var(--radius);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: var(--font-lg);
      font-weight: 600;
      box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    
    @media (max-width: 768px) {
      .main {
        padding: var(--space-md);
      }
    }
  </style>
</head>
<body>
  <header class="header" data-component-id="header">
    <nav class="nav" data-component-id="nav">
      <a href="#" class="nav-item" data-component-id="nav-item-home">首页</a>
      <a href="#" class="nav-item" data-component-id="nav-item-about">关于</a>
      <a href="#" class="nav-item" data-component-id="nav-item-contact">联系</a>
    </nav>
  </header>
  
  <main class="main" data-component-id="main">
    <div class="card" data-component-id="card-1">
      <h2 class="card-title">卡片标题 1</h2>
      <p class="card-content">这是第一个卡片的内容描述。</p>
      <div class="image-placeholder" data-component-id="image-1">图片占位符 1</div>
    </div>
    
    <div class="card" data-component-id="card-2">
      <h2 class="card-title">卡片标题 2</h2>
      <p class="card-content">这是第二个卡片的内容描述。</p>
    </div>
    
    <div class="card" data-component-id="card-3">
      <h2 class="card-title">卡片标题 3</h2>
      <p class="card-content">这是第三个卡片的内容描述。</p>
      <button class="button" data-component-id="button-1">操作按钮</button>
    </div>
    
    <div class="card" data-component-id="card-4">
      <h2 class="card-title">卡片标题 4</h2>
      <p class="card-content">这是第四个卡片的内容描述。</p>
    </div>
    
    <div class="card" data-component-id="card-5">
      <h2 class="card-title">卡片标题 5</h2>
      <p class="card-content">这是第五个卡片的内容描述。</p>
    </div>
    
    <div class="card" data-component-id="card-6">
      <h2 class="card-title">卡片标题 6</h2>
      <p class="card-content">这是第六个卡片的内容描述。</p>
    </div>
  </main>
  
  <footer class="footer" data-component-id="footer">
    <p>© 2024 Mock Beautified Page. All rights reserved.</p>
  </footer>
</body>
</html>`;
}

/**
 * Generate mock interactive HTML (Stage 3)
 * Adds interactivity with event delegation + data-action pattern
 * Keeps structure stable, adds a11y attributes
 */
function generateMockInteractiveHTML(): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mock Interactive Page</title>
  <style>
    :root {
      --color-bg: #f8fafc;
      --color-surface: #ffffff;
      --color-text: #0f172a;
      --color-muted: #64748b;
      --color-primary: #3b82f6;
      --color-accent: #f59e0b;
      --radius: 0.75rem;
      --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      --space-xs: 0.5rem;
      --space-sm: 0.75rem;
      --space-md: 1.5rem;
      --space-lg: 2rem;
      --font-base: 1rem;
      --font-lg: 1.25rem;
      --font-xl: 1.5rem;
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background-color: var(--color-bg);
      color: var(--color-text);
      line-height: 1.7;
    }
    
    .header {
      background-color: var(--color-surface);
      padding: var(--space-md);
      border-bottom: 2px solid #e2e8f0;
      box-shadow: var(--shadow);
    }
    
    .nav {
      display: flex;
      gap: var(--space-md);
    }
    
    .nav-item {
      padding: var(--space-sm) var(--space-md);
      color: var(--color-text);
      text-decoration: none;
      border-radius: var(--radius);
      transition: background-color 0.2s;
    }
    
    .nav-item:hover {
      background-color: var(--color-bg);
    }
    
    .main {
      padding: var(--space-lg);
      max-width: 1200px;
      margin: 0 auto;
    }
    
    .card {
      background: var(--color-surface);
      border-radius: var(--radius);
      padding: var(--space-md);
      box-shadow: var(--shadow);
      margin-bottom: var(--space-md);
      transition: transform 0.2s, box-shadow 0.2s;
    }
    
    .card:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    }
    
    .card-title {
      font-size: var(--font-lg);
      font-weight: 700;
      margin-bottom: var(--space-sm);
      color: var(--color-text);
    }
    
    .card-content {
      color: var(--color-muted);
      font-size: var(--font-base);
    }
    
    .button {
      display: inline-block;
      padding: var(--space-sm) var(--space-md);
      background-color: var(--color-primary);
      color: white;
      border: none;
      border-radius: var(--radius);
      cursor: pointer;
      font-size: var(--font-base);
      font-weight: 600;
      transition: background-color 0.2s, transform 0.1s;
    }
    
    .button:hover {
      background-color: #2563eb;
      transform: scale(1.05);
    }
    
    .button:active {
      transform: scale(0.98);
    }
    
    .button:focus {
      outline: 2px solid var(--color-primary);
      outline-offset: 2px;
    }
    
    .button[data-state="active"] {
      background-color: var(--color-accent);
    }
    
    .footer {
      background-color: var(--color-surface);
      padding: var(--space-md);
      text-align: center;
      color: var(--color-muted);
      margin-top: var(--space-lg);
      border-top: 2px solid #e2e8f0;
    }
    
    .image-placeholder {
      width: 100%;
      height: 200px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: var(--radius);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: var(--font-lg);
      font-weight: 600;
      box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    
    .toast {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: var(--color-surface);
      padding: var(--space-md);
      border-radius: var(--radius);
      box-shadow: var(--shadow);
      display: none;
    }
    
    .toast[data-state="visible"] {
      display: block;
    }
    
    @media (max-width: 768px) {
      .main {
        padding: var(--space-md);
      }
    }
  </style>
</head>
<body>
  <header class="header" data-component-id="header">
    <nav class="nav" data-component-id="nav">
      <a href="#" class="nav-item" data-component-id="nav-item-home" data-action="nav-click" aria-label="首页">首页</a>
      <a href="#" class="nav-item" data-component-id="nav-item-about" data-action="nav-click" aria-label="关于">关于</a>
      <a href="#" class="nav-item" data-component-id="nav-item-contact" data-action="nav-click" aria-label="联系">联系</a>
    </nav>
  </header>
  
  <main class="main" data-component-id="main">
    <div class="card" data-component-id="card-1">
      <h2 class="card-title">卡片标题 1</h2>
      <p class="card-content">这是第一个卡片的内容描述。</p>
      <div class="image-placeholder" data-component-id="image-1">图片占位符 1</div>
    </div>
    
    <div class="card" data-component-id="card-2">
      <h2 class="card-title">卡片标题 2</h2>
      <p class="card-content">这是第二个卡片的内容描述。</p>
    </div>
    
    <div class="card" data-component-id="card-3">
      <h2 class="card-title">卡片标题 3</h2>
      <p class="card-content">这是第三个卡片的内容描述。</p>
      <button class="button" data-component-id="button-1" data-action="button-click" aria-label="操作按钮" tabindex="0">操作按钮</button>
    </div>
    
    <div class="card" data-component-id="card-4">
      <h2 class="card-title">卡片标题 4</h2>
      <p class="card-content">这是第四个卡片的内容描述。</p>
    </div>
    
    <div class="card" data-component-id="card-5">
      <h2 class="card-title">卡片标题 5</h2>
      <p class="card-content">这是第五个卡片的内容描述。</p>
    </div>
    
    <div class="card" data-component-id="card-6">
      <h2 class="card-title">卡片标题 6</h2>
      <p class="card-content">这是第六个卡片的内容描述。</p>
    </div>
  </main>
  
  <footer class="footer" data-component-id="footer">
    <p>© 2024 Mock Interactive Page. All rights reserved.</p>
  </footer>
  
  <div class="toast" id="toast" data-state="hidden" role="alert" aria-live="polite">
    <p>操作成功</p>
  </div>
  
  <script>
    // Event delegation for all interactive elements
    document.addEventListener('click', function(e) {
      const target = e.target.closest('[data-action]');
      if (!target) return;
      
      const action = target.getAttribute('data-action');
      
      if (action === 'button-click') {
        target.setAttribute('data-state', 'active');
        showToast('按钮已点击');
        setTimeout(() => {
          target.removeAttribute('data-state');
        }, 1000);
      } else if (action === 'nav-click') {
        e.preventDefault();
        showToast('导航: ' + target.textContent);
      }
    });
    
    // Keyboard support (Enter/Space)
    document.addEventListener('keydown', function(e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      
      const target = e.target.closest('[data-action]');
      if (!target) return;
      
      e.preventDefault();
      target.click();
    });
    
    function showToast(message) {
      const toast = document.getElementById('toast');
      if (!toast) return;
      
      toast.querySelector('p').textContent = message;
      toast.setAttribute('data-state', 'visible');
      
      setTimeout(() => {
        toast.setAttribute('data-state', 'hidden');
      }, 2000);
    }
  </script>
</body>
</html>`;
}

