#!/usr/bin/env node

/**
 * UI Pipeline Self-Check Script
 * 
 * Validates mock HTML outputs directly:
 * - Contract compliance (object response structure)
 * - Stage constraints (static/beautify/interact)
 * - HTML structure validation
 * 
 * Usage: AI_RUNTIME=mock node scripts/ui-pipeline-selfcheck.mjs
 */

// Set mock mode
process.env.AI_RUNTIME = 'mock';
process.env.NODE_ENV = 'test';

const TEST_PROMPT = '生成一个产品展示页面';

// Inline normalizeUIPipelineResponse (simplified version)
function normalizeUIPipelineResponse(raw) {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    if ('ok' in raw && (raw.type === 'UI_HTML' || raw.type === 'RATE_LIMIT' || raw.type === 'NETWORK' || raw.type === 'PROVIDER' || raw.type === 'PARSE' || raw.type === 'VALIDATION')) {
      return raw;
    }
  }
  return raw;
}

// Inline mock HTML generators
function generateMockStaticHTML() {
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
    <nav class="nav">
      <a href="#" class="nav-item">首页</a>
      <a href="#" class="nav-item">关于</a>
      <a href="#" class="nav-item">联系</a>
    </nav>
  </header>
  
  <main class="main" data-component-id="main">
    <div class="card" data-component-id="card-1">
      <h2 class="card-title">卡片标题 1</h2>
      <p class="card-content">这是第一个卡片的内容描述。</p>
      <div class="image-placeholder">图片占位符 1</div>
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

function generateMockBeautifiedHTML() {
  // Beautified version with improved CSS but same structure
  return generateMockStaticHTML().replace(
    /--color-bg: #ffffff;/g,
    '--color-bg: #f8fafc;'
  ).replace(
    /--color-surface: #f9fafb;/g,
    '--color-surface: #ffffff;'
  ).replace(
    /--shadow: 0 1px 3px 0 rgba\(0, 0, 0, 0.1\);/g,
    '--shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);'
  );
}

function generateMockInteractiveHTML() {
  const staticHTML = generateMockBeautifiedHTML();
  // Add data-action and script
  return staticHTML.replace(
    '<button class="button" data-component-id="button-1">操作按钮</button>',
    '<button class="button" data-component-id="button-1" data-action="button-click" aria-label="操作按钮" tabindex="0">操作按钮</button>'
  ).replace(
    '</body>',
    `  <div class="toast" id="toast" data-state="hidden" role="alert" aria-live="polite">
    <p>操作成功</p>
  </div>
  
  <script>
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
      }
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
</body>`
  );
}

async function checkContract(response, stage) {
  console.log(`\n✅ [${stage}] Contract Check:`);
  
  // Must be an object, not array/tuple
  if (Array.isArray(response)) {
    throw new Error(`❌ Response is an array, expected object`);
  }
  
  if (typeof response !== 'object' || response === null) {
    throw new Error(`❌ Response is not an object`);
  }
  
  // Must have 'ok' field
  if (!('ok' in response)) {
    throw new Error(`❌ Response missing 'ok' field`);
  }
  
  // Must have 'type' field
  if (!('type' in response)) {
    throw new Error(`❌ Response missing 'type' field`);
  }
  
  console.log(`  ✓ Response is an object`);
  console.log(`  ✓ Has 'ok' field: ${response.ok}`);
  console.log(`  ✓ Has 'type' field: ${response.type}`);
  
  if (response.ok) {
    if (!('html' in response)) {
      throw new Error(`❌ Success response missing 'html' field`);
    }
    if (!('stage' in response)) {
      throw new Error(`❌ Success response missing 'stage' field`);
    }
    console.log(`  ✓ Has 'html' field (length: ${response.html.length})`);
    console.log(`  ✓ Has 'stage' field: ${response.stage}`);
    if ('meta' in response) {
      console.log(`  ✓ Has 'meta' field: ${JSON.stringify(response.meta)}`);
    }
  }
}

async function checkHTMLConstraints(html, stage) {
  console.log(`\n✅ [${stage}] HTML Constraints Check:`);
  
  // Must be a string
  if (typeof html !== 'string') {
    throw new Error(`❌ HTML is not a string`);
  }
  
  // Must be valid HTML
  if (!html.includes('<!DOCTYPE') && !html.includes('<html')) {
    throw new Error(`❌ HTML is not a complete document`);
  }
  
  // Stage 1: No <script> tags
  if (stage === 'STATIC') {
    const scriptMatches = html.match(/<script[^>]*>/gi);
    if (scriptMatches && scriptMatches.length > 0) {
      throw new Error(`❌ Static HTML should not have <script> tags`);
    }
    console.log(`  ✓ No <script> tags`);
  }
  
  // All stages: Must have inline <style>
  if (!html.includes('<style>')) {
    throw new Error(`❌ HTML missing inline <style> block`);
  }
  console.log(`  ✓ Has inline <style> block`);
  
  // All stages: Must have CSS variables
  if (!html.includes(':root') || !html.includes('--color-')) {
    throw new Error(`❌ HTML missing CSS variables in :root`);
  }
  console.log(`  ✓ Has CSS variables in :root`);
  
  // All stages: Must have 6-10 data-component-id
  const componentIdMatches = html.match(/data-component-id="[^"]+"/g);
  const componentCount = componentIdMatches ? componentIdMatches.length : 0;
  if (componentCount < 6 || componentCount > 10) {
    throw new Error(`❌ Expected 6-10 data-component-id, found ${componentCount}`);
  }
  console.log(`  ✓ Has ${componentCount} data-component-id attributes (6-10 required)`);
  
  // Stage 3: Must have data-action attributes
  if (stage === 'INTERACT') {
    const dataActionMatches = html.match(/data-action="[^"]+"/g);
    const actionCount = dataActionMatches ? dataActionMatches.length : 0;
    if (actionCount === 0) {
      throw new Error(`❌ Interactive HTML should have data-action attributes`);
    }
    console.log(`  ✓ Has ${actionCount} data-action attributes`);
    
    // Must have <script> tag for interactivity
    if (!html.includes('<script>')) {
      throw new Error(`❌ Interactive HTML should have <script> tag`);
    }
    console.log(`  ✓ Has <script> tag for interactivity`);
  }
}

async function checkStage2PreservesStructure(htmlBefore, htmlAfter) {
  console.log(`\n✅ [BEAUTIFY] Structure Preservation Check:`);
  
  // Extract all data-component-id values
  const extractComponentIds = (html) => {
    const matches = html.match(/data-component-id="([^"]+)"/g);
    return matches ? matches.map(m => m.match(/data-component-id="([^"]+)"/)[1]).sort() : [];
  };
  
  const idsBefore = extractComponentIds(htmlBefore);
  const idsAfter = extractComponentIds(htmlAfter);
  
  if (idsBefore.length !== idsAfter.length) {
    throw new Error(`❌ Component count changed: ${idsBefore.length} -> ${idsAfter.length}`);
  }
  
  // Check that all IDs are preserved
  for (const id of idsBefore) {
    if (!idsAfter.includes(id)) {
      throw new Error(`❌ Component ID lost: ${id}`);
    }
  }
  
  console.log(`  ✓ All ${idsBefore.length} component IDs preserved`);
}

// Simulate server action responses
async function simulateGenerateStaticUI(prompt) {
  await new Promise(resolve => setTimeout(resolve, 10)); // Simulate delay
  const html = generateMockStaticHTML();
  return {
    ok: true,
    type: 'UI_HTML',
    stage: 'STATIC',
    html,
    meta: {
      componentCount: (html.match(/data-component-id="[^"]+"/g) || []).length,
      imageCount: (html.match(/<img|<svg|image-placeholder/gi) || []).length,
      hasScript: html.includes('<script>'),
      hasExternalCdn: false,
    },
  };
}

async function simulateBeautifyUI(html) {
  await new Promise(resolve => setTimeout(resolve, 10));
  const beautified = generateMockBeautifiedHTML();
  return {
    ok: true,
    type: 'UI_HTML',
    stage: 'BEAUTIFY',
    html: beautified,
    meta: {
      componentCount: (beautified.match(/data-component-id="[^"]+"/g) || []).length,
      imageCount: (beautified.match(/<img|<svg|image-placeholder/gi) || []).length,
      hasScript: beautified.includes('<script>'),
      hasExternalCdn: false,
    },
  };
}

async function simulateAddInteractions(html) {
  await new Promise(resolve => setTimeout(resolve, 10));
  const interactive = generateMockInteractiveHTML();
  return {
    ok: true,
    type: 'UI_HTML',
    stage: 'INTERACT',
    html: interactive,
    meta: {
      componentCount: (interactive.match(/data-component-id="[^"]+"/g) || []).length,
      imageCount: (interactive.match(/<img|<svg|image-placeholder/gi) || []).length,
      hasScript: interactive.includes('<script>'),
      hasExternalCdn: false,
    },
  };
}

async function main() {
  console.log('🧪 UI Pipeline Self-Check (Mock Mode)');
  console.log('=====================================\n');
  
  try {
    // Stage 1: Generate Static UI
    console.log('📝 Stage 1: Generate Static UI');
    const staticResult = await simulateGenerateStaticUI(TEST_PROMPT);
    const staticResponse = normalizeUIPipelineResponse(staticResult);
    
    await checkContract(staticResponse, 'STATIC');
    if (!staticResponse.ok) {
      throw new Error(`❌ Static generation failed: ${staticResponse.message}`);
    }
    await checkHTMLConstraints(staticResponse.html, 'STATIC');
    
    // Stage 2: Beautify UI
    console.log('\n📝 Stage 2: Beautify UI');
    const beautifyResult = await simulateBeautifyUI(staticResponse.html);
    const beautifyResponse = normalizeUIPipelineResponse(beautifyResult);
    
    await checkContract(beautifyResponse, 'BEAUTIFY');
    if (!beautifyResponse.ok) {
      throw new Error(`❌ Beautify failed: ${beautifyResponse.message}`);
    }
    await checkHTMLConstraints(beautifyResponse.html, 'BEAUTIFY');
    await checkStage2PreservesStructure(staticResponse.html, beautifyResponse.html);
    
    // Stage 3: Add Interactions
    console.log('\n📝 Stage 3: Add Interactions');
    const interactResult = await simulateAddInteractions(beautifyResponse.html);
    const interactResponse = normalizeUIPipelineResponse(interactResult);
    
    await checkContract(interactResponse, 'INTERACT');
    if (!interactResponse.ok) {
      throw new Error(`❌ Add interactions failed: ${interactResponse.message}`);
    }
    await checkHTMLConstraints(interactResponse.html, 'INTERACT');
    
    console.log('\n✅ All checks passed!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Self-check failed:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

main();
