/**
 * JIT 视觉重构流水线
 * 
 * 架构概览：通过三层架构标准化 HTML 输出，不依赖 AI 逐行重写 HTML
 * 
 * Layer 1 - 结构标准化层 (Guardrails): 强制注入防溢出容器和交互脚本
 * Layer 2 - 语义配置层 (Semantic Config): AI 只生成 tailwind.config，不改动 HTML
 * Layer 3 - 组件映射层 (Component Mapping): 针对特定组件的正则替换规则
 */

/**
 * Layer 1: 结构标准化层
 * 目的：无论用户上传什么代码，保证它在手机壳里不溢出，且具备基础交互能力
 */
export function injectGuardrails(htmlContent: string): string {
  if (!htmlContent || htmlContent.trim().length === 0) {
    return htmlContent;
  }

  // 1. 强制重写 Meta Viewport
  const viewportMeta = '<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover"/>';
  
  // 2. 注入全局安全样式（无论内容怎么变，这层壳永远锁死布局）
  const safeShellCss = `
    <style>
      /* 强制接管滚动条 */
      ::-webkit-scrollbar { 
        display: none; 
      }
      
      /* 全局重置 */
      * {
        box-sizing: border-box;
      }
      
      html, body { 
        margin: 0;
        padding: 0;
        -webkit-font-smoothing: antialiased; 
        -moz-osx-font-smoothing: grayscale;
        /* 强制限制在视口内，溢出自动隐藏 */
        overflow-x: hidden; 
        max-width: 100vw;
        width: 100%;
        height: 100%;
      }
      
      /* 防止内容溢出容器 */
      body > * {
        max-width: 100%;
        overflow-x: hidden;
      }
      
      /* 交互反馈增强 */
      button:active, 
      .clickable:active,
      [role="button"]:active {
        transform: scale(0.96); 
        transition: transform 0.1s ease;
      }
      
      /* 防止图片溢出 */
      img {
        max-width: 100%;
        height: auto;
      }
      
      /* 防止表格溢出 */
      table {
        width: 100%;
        table-layout: fixed;
        word-wrap: break-word;
      }
    </style>
  `;

  // 3. 插入到 <head> 中
  let processed = htmlContent;

  // 如果存在 <head> 标签，插入到 </head> 之前
  if (processed.includes('</head>')) {
    // 检查是否已有 viewport meta
    const hasViewport = /<meta[^>]*name=["']viewport["'][^>]*>/i.test(processed);
    
    if (!hasViewport) {
      processed = processed.replace('</head>', `    ${viewportMeta}\n</head>`);
    } else {
      // 替换现有的 viewport meta
      processed = processed.replace(
        /<meta[^>]*name=["']viewport["'][^>]*>/i,
        viewportMeta
      );
    }
    
    // 插入安全样式
    processed = processed.replace('</head>', `${safeShellCss}\n</head>`);
  } else if (processed.includes('<html')) {
    // 如果没有 <head>，创建它
    processed = processed.replace(
      /<html[^>]*>/i,
      `<html>\n<head>\n    ${viewportMeta}\n${safeShellCss}\n</head>`
    );
  } else {
    // 如果连 <html> 都没有，在最前面添加完整的 head
    processed = `<!DOCTYPE html>\n<html>\n<head>\n    ${viewportMeta}\n${safeShellCss}\n</head>\n<body>\n${processed}\n</body>\n</html>`;
  }

  return processed;
}

/**
 * Layer 2: 语义配置层
 * 目的：AI 只生成 tailwind.config，不改动 HTML 中的 class 名称
 * 
 * 注意：这个函数返回一个默认配置模板。
 * 实际使用中，应该调用 generateTailwindConfig server action 来生成 AI 配置。
 * 
 * @param designRequirement - 用户的设计需求描述（如"深蓝/淡蓝"）
 * @param existingConfig - 现有的 tailwind.config（如果有）
 * @returns 生成的 tailwind.config 脚本代码（默认模板）
 */
export function generateSemanticConfig(
  designRequirement: string,
  existingConfig?: string
): string {
  // 默认配置模板（当 AI 生成失败时使用）
  const configTemplate = `
    <script>
      tailwind.config = {
        theme: {
          extend: {
            colors: {
              // 语义化颜色变量
              primary: {
                DEFAULT: '#1E3A8A', // 深蓝主色
                50: '#EFF6FF',
                100: '#DBEAFE',
                200: '#BFDBFE',
                300: '#93C5FD',
                400: '#60A5FA',
                500: '#3B82F6',
                600: '#1E3A8A', // 覆盖默认 blue-600
                700: '#1E40AF',
                800: '#1E3A8A',
                900: '#1E3A8A',
              },
              background: '#F3F4F6', // 全局背景色
              surface: '#FFFFFF', // 卡片/容器背景色
              // 覆盖默认蓝色调色板，接管所有相关组件
              blue: {
                50: '#EFF6FF',
                100: '#DBEAFE',
                200: '#BFDBFE',
                300: '#93C5FD',
                400: '#60A5FA',
                500: '#3B82F6',
                600: '#1E3A8A', // 您的深蓝主色
                700: '#1E40AF',
                800: '#1E3A8A',
                900: '#1E3A8A',
              },
            }
          }
        },
        darkMode: 'class', // 强制手动模式，防止随系统变黑
      };
    </script>
  `;

  // 如果有现有配置，尝试合并
  if (existingConfig) {
    // 这里可以解析并合并配置
    // 为了简化，直接返回新配置
    return configTemplate;
  }

  return configTemplate;
}

/**
 * 将 AI 生成的配置对象包装成 <script> 标签
 */
export function wrapConfigInScript(configObject: string): string {
  return `
    <script>
      tailwind.config = ${configObject};
    </script>
  `;
}

/**
 * 替换或注入 tailwind.config 到 HTML 中
 */
export function injectTailwindConfig(htmlContent: string, configScript: string): string {
  if (!htmlContent || !configScript) {
    return htmlContent;
  }

  // 移除现有的 tailwind.config 脚本
  let processed = htmlContent.replace(
    /<script[^>]*>[\s\S]*?tailwind\.config\s*=[\s\S]*?<\/script>/gi,
    ''
  );

  // 插入新的配置脚本
  if (processed.includes('</head>')) {
    processed = processed.replace('</head>', `    ${configScript}\n</head>`);
  } else if (processed.includes('<body')) {
    processed = processed.replace('<body', `${configScript}\n<body`);
  } else {
    // 如果没有 head 或 body，添加到最前面
    processed = `${configScript}\n${processed}`;
  }

  return processed;
}

/**
 * Layer 3: 组件映射与修复层
 * 目的：解决特定组件的布局缺陷（如"底部导航栏贴底溢出"）
 */
export function applySurgicalFixes(htmlContent: string): string {
  if (!htmlContent || htmlContent.trim().length === 0) {
    return htmlContent;
  }

  let processed = htmlContent;

  // 修复 1: 检测并修复贴底通栏导航
  // 模式：`fixed bottom-0 w-full` (贴底通栏导航)
  // 动作：转换为悬浮胶囊样式，避免贴底溢出
  const bottomNavPattern = /class=["']([^"']*\bfixed\b[^"']*\bbottom-0\b[^"']*\bw-full\b[^"']*)["']/gi;
  processed = processed.replace(bottomNavPattern, (match, classes) => {
    // 保留原有的其他类名，但替换关键类
    const newClasses = classes
      .replace(/\bbottom-0\b/g, 'bottom-6')
      .replace(/\bw-full\b/g, 'left-4 right-4')
      .replace(/\brounded-\w+\b/g, '') // 移除旧的圆角
      + ' rounded-full shadow-2xl backdrop-blur-xl z-50';
    
    return `class="${newClasses.trim()}"`;
  });

  // 修复 2: 检测并修复全屏高度问题
  // 模式：`h-screen` 或 `min-h-screen`
  // 动作：替换为 `min-h-[100dvh]` (适配移动端动态视口高度)
  processed = processed.replace(
    /\b(h-screen|min-h-screen)\b/gi,
    'min-h-[100dvh]'
  );

  // 修复 3: 检测并修复固定定位元素的溢出问题
  // 模式：`fixed` 且没有 `left` 或 `right` 约束
  // 动作：添加左右约束
  const fixedWithoutConstraints = /class=["']([^"']*\bfixed\b[^"']*(?!\b(left|right|inset))[^"']*)["']/gi;
  processed = processed.replace(fixedWithoutConstraints, (match, classes) => {
    // 如果已经有 left/right，不处理
    if (/\b(left|right|inset)\b/.test(classes)) {
      return match;
    }
    
    // 添加默认约束
    return `class="${classes} left-0 right-0"`;
  });

  // 修复 4: 检测并修复水平滚动问题
  // 模式：可能导致水平滚动的元素
  processed = processed.replace(
    /<div([^>]*class=["'][^"']*\boverflow-x-auto\b[^"']*["'][^>]*)>/gi,
    (match, attrs) => {
      // 确保有 max-width 约束
      if (!/\bmax-w/.test(attrs)) {
        return match.replace('>', ' style="max-width: 100vw;">');
      }
      return match;
    }
  );

  return processed;
}

/**
 * JIT 视觉重构流水线主函数
 * 
 * @param userHtml - 用户上传的原始 HTML
 * @param designRequirement - 设计需求描述（可选，用于生成语义配置）
 * @returns 处理后的标准化 HTML
 */
export function processHtmlThroughJitPipeline(
  userHtml: string,
  designRequirement?: string
): string {
  if (!userHtml || userHtml.trim().length === 0) {
    return userHtml;
  }

  // Step 1: Layer 1 - 注入安全壳
  // 保证基本的 CSS Reset 和 Viewport 锁定，防止布局炸裂
  let processed = injectGuardrails(userHtml);

  // Step 2: Layer 2 - AI 生成语义配置（如果提供了设计需求）
  if (designRequirement) {
    // 提取现有的 tailwind.config（如果有）
    const existingConfigMatch = processed.match(
      /<script[^>]*>[\s\S]*?tailwind\.config\s*=\s*(\{[\s\S]*?\});?\s*<\/script>/i
    );
    const existingConfig = existingConfigMatch ? existingConfigMatch[1] : undefined;

    // 生成新的配置
    const configScript = generateSemanticConfig(designRequirement, existingConfig);
    
    // 注入配置
    processed = injectTailwindConfig(processed, configScript);
  }

  // Step 3: Layer 3 - 执行手术式修复
  // 针对特定组件的布局缺陷进行修复
  processed = applySurgicalFixes(processed);

  return processed;
}

/**
 * 提取现有的 tailwind.config（用于分析）
 */
export function extractExistingTailwindConfig(htmlContent: string): string | null {
  if (!htmlContent) {
    return null;
  }

  const configMatch = htmlContent.match(
    /<script[^>]*>[\s\S]*?tailwind\.config\s*=\s*(\{[\s\S]*?\});?\s*<\/script>/i
  );

  return configMatch ? configMatch[1] : null;
}

/**
 * 检测 HTML 中是否存在高风险布局模式
 */
export function detectHighRiskPatterns(htmlContent: string): {
  hasBottomNav: boolean;
  hasFullScreen: boolean;
  hasOverflowRisk: boolean;
  patterns: string[];
} {
  const patterns: string[] = [];
  let hasBottomNav = false;
  let hasFullScreen = false;
  let hasOverflowRisk = false;

  // 检测贴底导航
  if (/\bfixed\b.*\bbottom-0\b.*\bw-full\b/i.test(htmlContent)) {
    hasBottomNav = true;
    patterns.push('贴底通栏导航 (fixed bottom-0 w-full)');
  }

  // 检测全屏高度
  if (/\b(h-screen|min-h-screen)\b/i.test(htmlContent)) {
    hasFullScreen = true;
    patterns.push('全屏高度 (h-screen/min-h-screen)');
  }

  // 检测溢出风险
  if (/\boverflow-x-auto\b/i.test(htmlContent) && !/\bmax-w/.test(htmlContent)) {
    hasOverflowRisk = true;
    patterns.push('水平滚动风险 (overflow-x-auto 无 max-width 约束)');
  }

  return {
    hasBottomNav,
    hasFullScreen,
    hasOverflowRisk,
    patterns,
  };
}

