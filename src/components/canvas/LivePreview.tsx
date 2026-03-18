import React, { useMemo, useState, useEffect, useRef } from 'react';
import { transform } from 'sucrase';
import * as LucideIcons from 'lucide-react';
import * as Recharts from 'recharts';
import * as PreviewUI from '@/components/preview-ui';
import { UniversalHtmlRenderer } from './UniversalHtmlRenderer';
import { HtmlSandboxRenderer } from './HtmlSandboxRenderer';
import { HtmlPreviewSurface } from '@/components/html-preview/HtmlPreviewSurface';
import { isHTMLContent } from '@/utils/html-rationalizer';
import { preview } from '@/lib/safe/preview';
import { PreviewFrame } from './PreviewFrame';
import { PC_VIEWPORT_WIDTH, PC_VIEWPORT_HEIGHT, MOBILE_VIEWPORT_WIDTH, MOBILE_VIEWPORT_HEIGHT } from '@/lib/viewport-constants';

export type ViewportPreset = 'mobile' | 'desktop';

/**
 * lucide 的 Icon 依赖 iconNode 数组；误写 <Icon /> 会在 iconNode.map 处崩溃。
 * 预览沙箱注入安全包装：无有效 iconNode 时用 Circle 占位。
 */
const LIVE_PREVIEW_SAFE_LUCIDE_ICON_INIT = `
var Icon = (function() {
  var _Raw = LucideIcons.Icon;
  return function SafeLucideIconPreview(props) {
    var p = props == null ? {} : props;
    if (!Array.isArray(p.iconNode)) {
      return React.createElement(LucideIcons.Circle, {
        size: p.size != null ? p.size : 24,
        className: p.className || '',
        color: p.color != null ? p.color : 'currentColor',
        strokeWidth: p.strokeWidth != null ? p.strokeWidth : 2,
        absoluteStrokeWidth: p.absoluteStrokeWidth
      });
    }
    return React.createElement(_Raw, p);
  };
})();`.trim();

/** 捕获生成组件在渲染阶段的错误（如 cn/Stars 未定义），避免白屏 */
class PreviewErrorBoundary extends React.Component<
  { children: React.ReactNode; onError: (err: Error) => void },
  { hasError: boolean; error: Error | null }
> {
  state = { hasError: false, error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    this.props.onError(error);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <div
          className="p-4 bg-red-950/20 border border-red-900/50 rounded-lg text-red-300 text-sm font-mono min-h-[120px] flex flex-col justify-center"
          role="alert"
        >
          <div className="font-semibold text-red-400 mb-1">渲染错误</div>
          <div className="break-all">{this.state.error.message}</div>
          <div className="mt-2 text-xs text-red-400/80">若此处信息不足，请打开浏览器控制台查看完整报错。</div>
        </div>
      );
    }
    return this.props.children;
  }
}

// 安全的动态组件渲染器。viewportPreset 由父级传入，决定预览画布尺寸逻辑，不随代码内容反推
export const LivePreview = ({
  code,
  zoom = 1,
  isPresentationMode = false,
  viewportPreset = 'mobile',
  /** 点击「跳转」类按钮时调用，参数为节点 id 或 label，由宿主切换选中节点 */
  onNavigateToNode,
}: {
  code: string;
  zoom?: number;
  isPresentationMode?: boolean;
  viewportPreset?: ViewportPreset;
  onNavigateToNode?: (target: string) => void;
}) => {
  // ========== 所有 Hooks 必须在组件顶层，在任何条件返回之前 ==========
  // 1. 所有 useState hooks
  const [renderedElement, setRenderedElement] = useState<React.ReactElement | null>(null);
  const [compilationError, setCompilationError] = useState<Error | null>(null);
  const [babelLoaded, setBabelLoaded] = useState(false);
  const previewScrollRef = useRef<HTMLDivElement>(null);

  // 动态加载 Material Icons CDN
  useEffect(() => {
    // 检查是否已经加载
    const existingLinks = document.querySelectorAll('link[href*="fonts.googleapis.com/icon"]');
    if (existingLinks.length > 0) {
      return; // 已经加载，不需要重复加载
    }

    // 创建并添加 Material Icons Round 链接
    const link1 = document.createElement('link');
    link1.href = 'https://fonts.googleapis.com/icon?family=Material+Icons+Round';
    link1.rel = 'stylesheet';
    document.head.appendChild(link1);

    // 创建并添加 Material Symbols Outlined 链接
    const link2 = document.createElement('link');
    link2.href = 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap';
    link2.rel = 'stylesheet';
    document.head.appendChild(link2);

    // 清理函数（可选，因为通常我们希望这些链接一直存在）
    return () => {
      // 不清理，让 Material Icons 在整个应用生命周期中保持加载
    };
  }, []);

  // 0. 检测是否为 HTML 代码（生成管线产出均为 React，此处仅对「粘贴/导入」的 HTML 做分支）
  const isHTMLCode = useMemo(() => {
    if (!code || code.trim().length === 0) return false;
    
    const trimmed = code.trim();
    // 明确为 React 组件格式时，绝不走 HTML 分支，避免白屏
    if (/export\s+default\s+function\s+(Page|App|\w+)\s*\(/.test(trimmed)) return false;
    
    // Check for HTML-specific patterns
    const htmlPatterns = [
      /^<!DOCTYPE/i,           // DOCTYPE declaration
      /^<html/i,               // <html> tag
      /<body/i,                 // <body> tag
      /class=["']/,             // class attribute (not className)
      /<div[^>]*class=/i,       // div with class attribute
      /<span[^>]*class=/i,      // span with class attribute
      /<button[^>]*class=/i,    // button with class attribute
    ];
    
    // Check for React-specific patterns (if present, it's likely React, not HTML)
    const reactPatterns = [
      /^import\s+.*from/i,      // import statements
      /^export\s+(default\s+)?(const|function)/i, // export statements
      /const\s+\w+\s*=\s*\(\)\s*=>/i, // arrow function component
      /function\s+\w+\s*\(/i,  // function component
      /className=/i,            // className attribute
      /useState|useEffect/i,    // React hooks
    ];
    
    // If it has React patterns, it's not HTML
    if (reactPatterns.some(pattern => pattern.test(trimmed))) {
      return false;
    }
    
    // If it has HTML patterns, it's likely HTML
    if (htmlPatterns.some(pattern => pattern.test(trimmed))) {
      return true;
    }
    
    // Default: if it starts with < and doesn't look like JSX with imports/exports, assume HTML
    if (trimmed.startsWith('<') && !trimmed.includes('import') && !trimmed.includes('export')) {
      return true;
    }
    
    return false;
  }, [code]);

  // 2. 检测是否为移动端 UI (必须在所有条件返回之前定义，遵守 React Hooks 规则)
  const isBlankPage = useMemo(() => {
    if (!code || code.trim().length === 0) return false;
    // 检测是否为空白页面模板（使用 BlankPage 组件）
    return code.includes('function BlankPage') || code.includes('export default function BlankPage');
  }, [code]);

  // 仅当 viewportPreset 为 mobile 时采用「代码像移动端」的 375 设备框；桌面以用户选择为准
  const useMobileFrame = useMemo(() => {
    if (viewportPreset === 'desktop') return false;
    if (!code) return false;
    return code.includes('w-[375px]') || 
           code.includes('h-[812px]') || 
           code.includes('max-w-md') ||
           code.includes('NavBar') ||
           code.includes('TabBar') ||
           code.includes('金刚区');
  }, [code, viewportPreset]);
  const isMobile = useMobileFrame;

  // 注入页面跳转回调，供生成代码中的 window.__NAV_TO_NODE__?.('页面名') 使用
  useEffect(() => {
    const win = typeof window !== 'undefined' ? window : undefined;
    if (win) {
      (win as unknown as { __NAV_TO_NODE__?: (target: string) => void }).__NAV_TO_NODE__ =
        onNavigateToNode ?? (() => {});
    }
    return () => {
      if (win) (win as unknown as { __NAV_TO_NODE__?: (target: string) => void }).__NAV_TO_NODE__ = undefined;
    };
  }, [onNavigateToNode]);

  // 1. 清理和编译代码
  useEffect(() => {
    if (!code || code === "// PLACEHOLDER") {
      setRenderedElement(null);
      setCompilationError(null);
      return;
    }

    // If it's HTML, use UniversalHtmlRenderer (handled in render)
    if (isHTMLCode) {
      setRenderedElement(null);
      setCompilationError(null);
      return;
    }

    // React 路径：先清空旧结果，避免展示旧内容或旧错误
    setRenderedElement(null);
    setCompilationError(null);

    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      try {
        // 步骤 1: 移除 Markdown 标记
      let cleaned = code.replace(/```tsx|```jsx|```javascript|```typescript|```/g, '').trim();

      // 步骤 2: 处理 export default
      // 如果代码有 export default function App()，转换为 const App = function App()
      cleaned = cleaned.replace(
        /export\s+default\s+function\s+(\w+)\s*\(/g,
        'const $1 = function $1('
      );
      // 如果代码有 export default function()，转换为 const App = function()
      cleaned = cleaned.replace(
        /export\s+default\s+function\s*\(/g,
        'const App = function('
      );
      // 如果代码有 export default const App =，转换为 const App =
      cleaned = cleaned.replace(
        /export\s+default\s+const\s+(\w+)\s*=/g,
        'const $1 ='
      );
      // 移除其他 export 语句
      cleaned = cleaned.replace(/^export\s+.*?;?\s*$/gm, '');
      cleaned = cleaned.replace(/export\s+default\s+/g, '');

      // 步骤 3: 移除 import 语句（sucrase 会处理，但我们先移除以避免问题）
      cleaned = cleaned.replace(/^import\s+.*?from\s+['"].*?['"];?\s*$/gm, '');
      cleaned = cleaned.replace(/^import\s+.*?\{[^}]*\}\s+from\s+['"].*?['"];?\s*$/gm, '');
      cleaned = cleaned.trim();

      // 步骤 4: 提取组件名称
      let componentName = 'App';
      // 尝试多种匹配模式
      const functionMatch = cleaned.match(/(?:function|const|let|var)\s+(\w+)\s*[=\(]/);
      if (functionMatch) {
        componentName = functionMatch[1];
      } else {
        // 如果没有找到函数名，检查是否有匿名函数或箭头函数
        if (cleaned.includes('function(') || cleaned.includes('=>')) {
          componentName = 'App'; // 默认使用 App
        }
      }
      
      // Component name extracted

      // 步骤 4.5: 检测并替换不存在的图标名（仅对 Lucide 图标做替换，绝不替换 PreviewUI 组件名）
      const previewUIKeys = new Set(Object.keys(PreviewUI || {}));
      const iconUsageRegex = /<(\w+)(?:\s|>)/g;
      const usedIconNames = new Set<string>();
      let match;
      while ((match = iconUsageRegex.exec(cleaned)) !== null) {
        const iconName = match[1];
        // 过滤：HTML 标签、React/App/Page、以及 PreviewUI 组件名（NavBar/ListItem/Button/Card 等不得当图标替换）
        if (iconName && /^[A-Z]/.test(iconName) &&
            !['div', 'span', 'button', 'input', 'form', 'section', 'article', 'header', 'footer', 'nav', 'main', 'aside'].includes(iconName.toLowerCase()) &&
            !['React', 'App', 'Page', 'Component', 'Fragment'].includes(iconName) &&
            !previewUIKeys.has(iconName)) {
          usedIconNames.add(iconName);
        }
      }
      
      // 仅对「在 Lucide 中不存在的」图标名做替换；PreviewUI 组件已在上方排除，不会被替换
      const fallbackIcon = 'FileText';
      const iconReplacements: Array<{ from: string; to: string }> = [];
      
      usedIconNames.forEach(iconName => {
        const iconExists =
          iconName in LucideIcons &&
          (typeof (LucideIcons as any)[iconName] === 'function' ||
            typeof (LucideIcons as any)[iconName] === 'object');
        
        if (!iconExists) {
          const similarIcon = Object.keys(LucideIcons).find(key =>
            key.toLowerCase().includes(iconName.toLowerCase().replace(/square|pen|message/gi, '')) ||
            iconName.toLowerCase().replace(/square|pen/gi, '').includes(key.toLowerCase())
          );
          const replacementIcon = similarIcon || fallbackIcon;
          iconReplacements.push({ from: iconName, to: replacementIcon });
          console.warn(`⚠️ [LivePreview] 图标 "${iconName}" 不存在，将替换为 "${replacementIcon}"`);
        }
      });
      
      // 应用图标替换（只替换 JSX 标签中的图标名）
      if (Array.isArray(iconReplacements) && iconReplacements.length > 0) {
        iconReplacements.forEach(({ from, to }) => {
          // 只替换 JSX 标签中的图标名，使用更精确的正则表达式
          // 匹配 <IconName 或 <IconName/ 或 <IconName> 模式
          cleaned = cleaned.replace(new RegExp(`<${from}(?=\\s|>|/)`, 'g'), `<${to}`);
        });
        console.log(`✅ [LivePreview] 已替换 ${iconReplacements.length} 个不存在的图标: ${(Array.isArray(iconReplacements) ? iconReplacements : []).map((r: { from: string; to: string }) => `${r.from} → ${r.to}`).join(', ')}`);
      }

      // 步骤 5: 添加依赖声明和返回语句
      const hasReactHooksDeclaration = /(?:const|let|var)\s+\{\s*(?:useState|useEffect|useRef|useCallback)/.test(cleaned);
      const hasLucideDeclaration = /(?:const|let|var)\s+(?:Lucide|\{[^}]*Lucide[^}]*\})\s*=/.test(cleaned);

      const declarations: string[] = [];
      // 确保 React 在作用域中可用
      declarations.push('var React = React;');
      if (!hasReactHooksDeclaration) {
        declarations.push('const { useState, useEffect, useRef, useCallback, useMemo } = React;');
      }
      // 确保 LucideIcons 可以通过 Lucide 访问，并将所有图标解构到作用域
      if (!hasLucideDeclaration) {
        declarations.push('const Lucide = LucideIcons;');
        // 将所有 Lucide 图标解构到作用域，以便代码可以直接使用 Mic, Search, User 等
        // 只导出以大写字母开头的图标组件（可能是 function 或 object 类型）
        // 添加安全检查，确保 LucideIcons 存在且是对象
        if (LucideIcons && typeof LucideIcons === 'object') {
          const iconNames = Object.keys(LucideIcons).filter(key => 
            /^[A-Z]/.test(key) && 
            // Lucide 图标可能是 function 或 object（React 组件）
            (typeof (LucideIcons as any)[key] === 'function' || typeof (LucideIcons as any)[key] === 'object') &&
            // 排除一些内部使用的函数
            !['createLucideIcon', 'IconNode', 'lucide', 'Icon'].includes(key)
          );
          if (iconNames && Array.isArray(iconNames) && iconNames.length > 0) {
            // 与 PreviewUI 同名的必须用组件，不能被 Lucide 图标覆盖（previewUIKeys 已在步骤 4.5 定义）
            const validIconNames = iconNames.filter(name => {
              if (previewUIKeys.has(name)) return false;
              const isValid = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(name);
              const exists = name in LucideIcons && (
                typeof (LucideIcons as any)[name] === 'function' ||
                typeof (LucideIcons as any)[name] === 'object'
              );
              return isValid && exists;
            });
            
            // 验证关键图标是否存在
            const hasMic = validIconNames && validIconNames.includes('Mic');
            if (!hasMic) {
              console.warn('⚠️ [LivePreview] Mic 图标未找到或被过滤', {
                inIconNames: iconNames.includes('Mic'),
                inLucideIcons: 'Mic' in LucideIcons,
                validCount: validIconNames ? validIconNames.length : 0,
                totalCount: iconNames.length
              });
            }
            
            if (validIconNames && Array.isArray(validIconNames) && validIconNames.length > 0) {
              // 为每个图标创建 var 声明，使用 var 确保函数作用域提升
              const iconInitializations = validIconNames
                .map((name: string) => `var ${name} = LucideIcons.${name};`)
                .join('\n            ');
              
              // 将图标声明放在最前面
              declarations.unshift(iconInitializations);
              
              // 调试信息
              console.log(`✅ [LivePreview] 已初始化 ${validIconNames.length} 个图标${hasMic ? ' (包括 Mic)' : ' (Mic 未包含)'}`);
            } else {
              console.warn('⚠️ [LivePreview] 没有有效的图标可以初始化');
            }
          } else {
            console.warn('⚠️ [LivePreview] 未找到任何图标名称');
          }
        } else {
          console.warn('⚠️ [LivePreview] LucideIcons 未定义或不是对象', {
            type: typeof LucideIcons,
            isNull: LucideIcons === null,
            isUndefined: LucideIcons === undefined
          });
        }
      }
      if (
        /<Icon(?=[\s/>])/.test(cleaned) &&
        !previewUIKeys.has('Icon') &&
        'Icon' in LucideIcons &&
        'Circle' in LucideIcons
      ) {
        declarations.unshift(LIVE_PREVIEW_SAFE_LUCIDE_ICON_INIT);
      }

      // 包装代码，确保可以返回组件
      // 检查代码是否已经是函数声明格式
      const isFunctionDeclaration = /^\s*function\s+\w+\s*\(/.test(cleaned);
      const isConstFunction = /^\s*const\s+\w+\s*=\s*function/.test(cleaned);
      const isArrowFunction = /^\s*const\s+\w+\s*=\s*\(/.test(cleaned);
      
      let wrappedCode: string;
      // 注意：图标声明不在 wrappedCode 中，而是在 new Function() 的函数体开头添加
      // 这样可以确保图标变量在编译后的代码执行前就已经初始化
      const allDeclarations = declarations.join('\n');
      
      if (isFunctionDeclaration || isConstFunction || isArrowFunction) {
        // 代码已经是函数格式，直接包装返回逻辑
        wrappedCode = `
          ${cleaned}
          
          // 返回组件（优先使用 App，然后是 Page，最后是提取的组件名）
          if (typeof App !== 'undefined') {
            return App;
          } else if (typeof Page !== 'undefined') {
            return Page;
          } else if (typeof ${componentName} !== 'undefined') {
            return ${componentName};
          } else {
            throw new Error('无法找到 React 组件。代码中应包含 function App() 或 function Page() 声明。');
          }
        `;
      } else {
        // 代码可能不是函数格式，尝试包装成函数
        wrappedCode = `
          ${cleaned}
          
          // 返回组件（优先使用 App，然后是 Page，最后是提取的组件名）
          if (typeof App !== 'undefined') {
            return App;
          } else if (typeof Page !== 'undefined') {
            return Page;
          } else if (typeof ${componentName} !== 'undefined') {
            return ${componentName};
          } else {
            // 如果都没有找到，尝试将代码作为函数体执行
            throw new Error('无法找到 React 组件。请确保代码包含 function App() 或 function Page() 声明。');
          }
        `;
      }
      
      // Code wrapped successfully

      // 步骤 6: 使用 sucrase 编译 JSX 和 TypeScript
      const compiledCode = transform(wrappedCode, {
        transforms: ['jsx', 'typescript', 'imports'],
        production: true,
        jsxPragma: 'React.createElement',
        jsxFragmentPragma: 'React.Fragment',
      }).code;

      // 步骤 7: 执行编译后的代码
      // 验证依赖项是否可用
      if (!React || typeof React.createElement !== 'function') {
        throw new Error('React 未正确导入或不可用');
      }
      
      if (!LucideIcons || typeof LucideIcons !== 'object') {
        throw new Error('LucideIcons 未正确导入或不可用');
      }
      
      // 创建函数，传入依赖项
      // 使用立即执行函数（IIFE）确保所有图标在使用前都已初始化
      let ComponentFactory: Function;
      try {
        // 使用 IIFE 包装代码，确保图标变量在代码执行前就已经初始化
        ComponentFactory = new Function(
          'React',
          'LucideIcons',
          'Recharts',
          'PreviewUI',
          `
          // 确保依赖项可用
          if (typeof React === 'undefined' || !React) {
            throw new Error('React 未定义');
          }
          if (typeof LucideIcons === 'undefined' || !LucideIcons) {
            throw new Error('LucideIcons 未定义');
          }
          
          // 在外部作用域保存参数，避免变量提升问题
          var _React = React;
          var _LucideIcons = LucideIcons;
          var _Recharts = Recharts || {};
          var _PreviewUI = typeof PreviewUI !== 'undefined' ? PreviewUI : {};
          
          // 使用立即执行函数确保所有变量在使用前都已初始化
          return (function() {
            // 在 IIFE 内部声明变量，从外部作用域获取
            var React = _React;
            // 挂到全局，避免生成代码中 const { useMemo } = React 在部分打包/闭包下取不到 React
            if (typeof globalThis !== 'undefined') globalThis.React = React;
            if (typeof window !== 'undefined') window.React = React;
            var LucideIcons = _LucideIcons;
            var Recharts = _Recharts;
            var Button = _PreviewUI.Button;
            var Card = _PreviewUI.Card;
            var CardHeader = _PreviewUI.CardHeader;
            var CardTitle = _PreviewUI.CardTitle;
            var CardContent = _PreviewUI.CardContent;
            var CardFooter = _PreviewUI.CardFooter;
            var Input = _PreviewUI.Input;
            var Label = _PreviewUI.Label;
            var Badge = _PreviewUI.Badge;
            var Avatar = _PreviewUI.Avatar;
            var Separator = _PreviewUI.Separator;
            var Textarea = _PreviewUI.Textarea;
            var Switch = _PreviewUI.Switch;
            var Alert = _PreviewUI.Alert;
            var Skeleton = _PreviewUI.Skeleton;
            var TabsList = _PreviewUI.TabsList;
            var TabsTrigger = _PreviewUI.TabsTrigger;
            var TabsContent = _PreviewUI.TabsContent;
            var NavBar = _PreviewUI.NavBar;
            var BottomNav = _PreviewUI.BottomNav;
            var BottomNavItem = _PreviewUI.BottomNavItem;
            var AppBar = _PreviewUI.AppBar;
            var Sidebar = _PreviewUI.Sidebar;
            var SidebarItem = _PreviewUI.SidebarItem;
            var Progress = _PreviewUI.Progress;
            var StatCard = _PreviewUI.StatCard;
            var ListItem = _PreviewUI.ListItem;
            var EmptyState = _PreviewUI.EmptyState;
            var PageHeader = _PreviewUI.PageHeader;
            var Dialog = _PreviewUI.Dialog;
            var DialogHeader = _PreviewUI.DialogHeader;
            var DialogContent = _PreviewUI.DialogContent;
            var DialogFooter = _PreviewUI.DialogFooter;
            var cn = typeof _PreviewUI.cn === 'function' ? _PreviewUI.cn : function() { return Array.prototype.slice.call(arguments).filter(Boolean).join(' '); };
            
            // 全局保护：确保数组方法在 undefined 上不会报错
            // 为所有常用的数组方法添加安全检查
            // 添加安全检查，确保 Array.prototype 的方法存在
            var originalMap = Array.prototype && typeof Array.prototype.map === 'function' ? Array.prototype.map : function(callback, thisArg) { return []; };
            var originalFilter = Array.prototype && typeof Array.prototype.filter === 'function' ? Array.prototype.filter : function(callback, thisArg) { return []; };
            var originalForEach = Array.prototype && typeof Array.prototype.forEach === 'function' ? Array.prototype.forEach : function(callback, thisArg) { return; };
            var originalReduce = Array.prototype && typeof Array.prototype.reduce === 'function' ? Array.prototype.reduce : function(callback, initialValue) { return initialValue; };
            var originalFind = Array.prototype && typeof Array.prototype.find === 'function' ? Array.prototype.find : function(callback, thisArg) { return undefined; };
            var originalSome = Array.prototype && typeof Array.prototype.some === 'function' ? Array.prototype.some : function(callback, thisArg) { return false; };
            var originalEvery = Array.prototype && typeof Array.prototype.every === 'function' ? Array.prototype.every : function(callback, thisArg) { return true; };
            
            // 安全检查函数
            function safeArrayCheck(thisArg, methodName) {
              if (thisArg == null) {
                console.warn('⚠️ [Runtime] 尝试对 null/undefined 调用 ' + methodName + ' 方法');
                return true; // 表示需要返回默认值
              }
              return false;
            }
            
            // 只有在客户端环境且方法存在时才重写
            if (typeof window !== 'undefined' && Array.prototype) {
              // 重写 map
              if (originalMap && typeof originalMap === 'function') {
                Array.prototype.map = function(callback, thisArg) {
                  if (safeArrayCheck(this, 'map')) return [];
                  return originalMap.call(this, callback, thisArg);
                };
              }
              
              // 重写 filter
              if (originalFilter && typeof originalFilter === 'function') {
                Array.prototype.filter = function(callback, thisArg) {
                  if (safeArrayCheck(this, 'filter')) return [];
                  return originalFilter.call(this, callback, thisArg);
                };
              }
              
              // 重写 forEach
              if (originalForEach && typeof originalForEach === 'function') {
                Array.prototype.forEach = function(callback, thisArg) {
                  if (safeArrayCheck(this, 'forEach')) return;
                  return originalForEach.call(this, callback, thisArg);
                };
              }
              
              // 重写 reduce
              if (originalReduce && typeof originalReduce === 'function') {
                Array.prototype.reduce = function(callback, initialValue) {
                  if (safeArrayCheck(this, 'reduce')) return initialValue;
                  return originalReduce.call(this, callback, initialValue);
                };
              }
              
              // 重写 find
              if (originalFind && typeof originalFind === 'function') {
                Array.prototype.find = function(callback, thisArg) {
                  if (safeArrayCheck(this, 'find')) return undefined;
                  return originalFind.call(this, callback, thisArg);
                };
              }
              
              // 重写 some
              if (originalSome && typeof originalSome === 'function') {
                Array.prototype.some = function(callback, thisArg) {
                  if (safeArrayCheck(this, 'some')) return false;
                  return originalSome.call(this, callback, thisArg);
                };
              }
              
              // 重写 every
              if (originalEvery && typeof originalEvery === 'function') {
                Array.prototype.every = function(callback, thisArg) {
                  if (safeArrayCheck(this, 'every')) return true;
                  return originalEvery.call(this, callback, thisArg);
                };
              }
            }
            
            // 初始化所有图标变量和其他声明（已排除与 PreviewUI 同名的图标，避免覆盖）
            ${allDeclarations}
            
            // 再次绑定全部 PreviewUI 组件，确保不被 Lucide 同名图标覆盖（主内容区空白根因）
            if (_PreviewUI && typeof _PreviewUI === 'object') {
              if (_PreviewUI.Button != null) Button = _PreviewUI.Button;
              if (_PreviewUI.Card != null) Card = _PreviewUI.Card;
              if (_PreviewUI.CardHeader != null) CardHeader = _PreviewUI.CardHeader;
              if (_PreviewUI.CardTitle != null) CardTitle = _PreviewUI.CardTitle;
              if (_PreviewUI.CardContent != null) CardContent = _PreviewUI.CardContent;
              if (_PreviewUI.CardFooter != null) CardFooter = _PreviewUI.CardFooter;
              if (_PreviewUI.Input != null) Input = _PreviewUI.Input;
              if (_PreviewUI.Label != null) Label = _PreviewUI.Label;
              if (_PreviewUI.Badge != null) Badge = _PreviewUI.Badge;
              if (_PreviewUI.Avatar != null) Avatar = _PreviewUI.Avatar;
              if (_PreviewUI.Separator != null) Separator = _PreviewUI.Separator;
              if (_PreviewUI.Textarea != null) Textarea = _PreviewUI.Textarea;
              if (_PreviewUI.Switch != null) Switch = _PreviewUI.Switch;
              if (_PreviewUI.Alert != null) Alert = _PreviewUI.Alert;
              if (_PreviewUI.Skeleton != null) Skeleton = _PreviewUI.Skeleton;
              if (_PreviewUI.TabsList != null) TabsList = _PreviewUI.TabsList;
              if (_PreviewUI.TabsTrigger != null) TabsTrigger = _PreviewUI.TabsTrigger;
              if (_PreviewUI.TabsContent != null) TabsContent = _PreviewUI.TabsContent;
              if (_PreviewUI.NavBar != null) NavBar = _PreviewUI.NavBar;
              if (_PreviewUI.BottomNav != null) BottomNav = _PreviewUI.BottomNav;
              if (_PreviewUI.BottomNavItem != null) BottomNavItem = _PreviewUI.BottomNavItem;
              if (_PreviewUI.AppBar != null) AppBar = _PreviewUI.AppBar;
              if (_PreviewUI.Sidebar != null) Sidebar = _PreviewUI.Sidebar;
              if (_PreviewUI.SidebarItem != null) SidebarItem = _PreviewUI.SidebarItem;
              if (_PreviewUI.Progress != null) Progress = _PreviewUI.Progress;
              if (_PreviewUI.StatCard != null) StatCard = _PreviewUI.StatCard;
              if (_PreviewUI.ListItem != null) ListItem = _PreviewUI.ListItem;
              if (_PreviewUI.EmptyState != null) EmptyState = _PreviewUI.EmptyState;
              if (_PreviewUI.PageHeader != null) PageHeader = _PreviewUI.PageHeader;
              if (_PreviewUI.Dialog != null) Dialog = _PreviewUI.Dialog;
              if (_PreviewUI.DialogHeader != null) DialogHeader = _PreviewUI.DialogHeader;
              if (_PreviewUI.DialogContent != null) DialogContent = _PreviewUI.DialogContent;
              if (_PreviewUI.DialogFooter != null) DialogFooter = _PreviewUI.DialogFooter;
              if (typeof _PreviewUI.cn === 'function') cn = _PreviewUI.cn;
            }
            
            // 执行编译后的代码（此时所有变量都已初始化并可用）
          ${compiledCode}
          })();
          `
        );
      } catch (factoryError) {
        console.error('❌ [LivePreview] Failed to create ComponentFactory:', factoryError);
        console.error('❌ [LivePreview] Compiled code preview:', preview(compiledCode, 1000));
        console.error('❌ [LivePreview] Declarations:', preview(allDeclarations, 500));
        throw new Error(`无法创建组件工厂函数: ${factoryError instanceof Error ? factoryError.message : String(factoryError)}`);
      }

      // 验证 ComponentFactory 是否创建成功
      if (!ComponentFactory || typeof ComponentFactory !== 'function') {
        throw new Error('ComponentFactory 创建失败，返回的不是函数');
      }

      // 调用函数获取组件
      let Component;
      try {
        // 使用直接调用而不是 .call()，避免可能的 this 绑定问题
        // 传入完整的 LucideIcons 对象，所有图标都已通过解构声明可用
        Component = ComponentFactory(React, LucideIcons || {}, Recharts || {}, PreviewUI || {});
      } catch (execError) {
        console.error('❌ [LivePreview] Function execution error:', execError);
        // 提供更详细的错误信息，包括代码片段
        const errorMessage = execError instanceof Error ? execError.message : String(execError);
        const codeSnippet = preview(cleaned, 200);
        throw new Error(`执行错误: ${errorMessage}\n\n代码片段:\n${codeSnippet}`);
      }

      if (!Component) {
        throw new Error('编译后的代码返回了 undefined 或 null');
      }

      if (typeof Component !== 'function') {
        console.error('❌ [LivePreview] Component is not a function:', typeof Component, Component);
        throw new Error(`编译后的代码没有返回函数，而是: ${typeof Component}`);
      }

      // 渲染组件
      try {
        const element = React.createElement(Component);
        if (!cancelled) {
          setRenderedElement(element);
          setCompilationError(null);
        }
      } catch (renderError) {
        console.error('❌ [LivePreview] React.createElement error:', renderError);
        throw new Error(`渲染错误: ${renderError instanceof Error ? renderError.message : String(renderError)}`);
      }
    } catch (err) {
      if (!cancelled) {
        console.error('❌ [LivePreview] Compilation/Execution error:', err);
        console.error('❌ [LivePreview] Code that failed:', code ? preview(code, 200) : 'N/A');
        setCompilationError(err instanceof Error ? err : new Error(String(err)));
        setRenderedElement(null);
      }
    }
    });
    return () => { cancelled = true; };
  }, [code, isHTMLCode]);

  // 内容更新时滚动到顶部，避免只看到底部 footer
  useEffect(() => {
    if (renderedElement && previewScrollRef.current) {
      previewScrollRef.current.scrollTop = 0;
    }
  }, [renderedElement, code]);

  // 1.5. 如果是 HTML，使用 UniversalHtmlRenderer (需要确保 Babel 已加载)
  useEffect(() => {
    if (isHTMLCode && typeof window !== 'undefined') {
      // Check if Babel is already loaded
      if ((window as any).Babel) {
        setBabelLoaded(true);
        return;
      }
      
      // Load Babel from CDN
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/@babel/standalone/babel.min.js';
      script.onload = () => {
        setBabelLoaded(true);
      };
      script.onerror = () => {
        console.error('Failed to load Babel Standalone');
      };
      document.head.appendChild(script);
      
      return () => {
        // Cleanup: remove script if component unmounts
        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }
      };
    }
  }, [isHTMLCode]);
  
  // 调试条：仅当在控制台设置 window.__SHOW_LIVE_PREVIEW_DEBUG__ = true 时显示
  const showDebug =
    typeof window !== 'undefined' &&
    (window as unknown as { __SHOW_LIVE_PREVIEW_DEBUG__?: boolean }).__SHOW_LIVE_PREVIEW_DEBUG__ === true;
  const debugBranch = isHTMLCode
    ? 'html'
    : compilationError
      ? 'error'
      : !code || code === '// PLACEHOLDER' || !renderedElement
        ? 'loading'
        : 'preview';
  const debugStrip = showDebug ? (
    <div
      className="absolute top-0 left-0 right-0 z-[9999] bg-amber-500 text-black px-2 py-1 text-xs font-mono flex items-center gap-3"
      style={{ minHeight: 28 }}
    >
      <span>[LivePreview]</span>
      <span>branch={debugBranch}</span>
      <span>codeLen={code?.length ?? 0}</span>
      <span>hasEl={String(!!renderedElement)}</span>
      <span>err={compilationError ? compilationError.message.slice(0, 40) : '-'}</span>
      <span>isHTML={String(isHTMLCode)}</span>
    </div>
  ) : null;

  // HTML-First: 统一经 HtmlPreviewSurface → prepareHtmlForDisplay → HtmlSandboxRenderer（单一展示路径）
  if (isHTMLCode) {
    return (
      <div className="relative w-full h-full">
        {debugStrip}
        <HtmlPreviewSurface
          rawHtml={code}
          className="w-full h-full"
          onNav={onNavigateToNode}
        />
      </div>
    );
  }

  // 3. 错误处理（保证最小高度，避免在预览区内「看不见」）
  if (compilationError) {
    return (
      <div className="relative w-full min-h-[140px]">
        {debugStrip}
        <div className="p-4 bg-red-950/20 border border-red-900/50 rounded-lg min-h-[140px] max-h-96 overflow-auto">
          <div className="flex items-start gap-3">
            <div className="text-red-400 text-lg">⚠️</div>
            <div className="flex-1">
              <div className="text-red-400 font-semibold text-sm mb-2">编译/执行错误</div>
              <div className="text-red-300 text-xs font-mono mb-3">{compilationError.message}</div>
              {compilationError.stack && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-red-400 text-xs hover:text-red-300 transition-colors">
                    查看详细堆栈跟踪
                  </summary>
                  <pre className="mt-2 text-xs text-red-400/80 whitespace-pre-wrap font-mono bg-red-950/30 p-2 rounded border border-red-900/30">
                    {compilationError.stack}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 4. 等待状态
  if (!code || code === "// PLACEHOLDER" || !renderedElement) {
    return (
      <div className="relative w-full h-full min-h-[200px]">
        {debugStrip}
        <div className="text-zinc-500 text-sm flex flex-col justify-center items-center h-full gap-3 min-h-[200px]">
          <div className="w-8 h-8 border-2 border-zinc-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs">正在编译 UI 代码...</p>
        </div>
      </div>
    );
  }

  // 5. 渲染内容：标准视口比例，桌面端强制最小宽度，避免「一句话竖向排列」等布局错乱
  const PREVIEW_MIN_HEIGHT = viewportPreset === 'desktop' ? PC_VIEWPORT_HEIGHT : MOBILE_VIEWPORT_HEIGHT;
  const content = (
    <PreviewFrame ref={previewScrollRef} minHeight={PREVIEW_MIN_HEIGHT}>
      <div
        className="preview-generated-root-wrapper"
        style={{
          height: '100%',
          minHeight: PREVIEW_MIN_HEIGHT,
          width: '100%',
          ...(viewportPreset === 'desktop' ? { minWidth: PC_VIEWPORT_WIDTH } : {}),
          display: 'flex',
          flexDirection: 'column',
          flex: '1 1 0%',
        }}
      >
        <PreviewErrorBoundary key={code} onError={setCompilationError}>
          {renderedElement}
        </PreviewErrorBoundary>
      </div>
    </PreviewFrame>
  );

  if (isPresentationMode) {
    return (
      <div
        className={isMobile && zoom !== 1 ? 'w-[375px] h-[812px]' : 'w-full h-full'}
        style={{ overflow: 'hidden', transform: zoom !== 1 ? `scale(${zoom})` : undefined, transformOrigin: 'top center' }}
      >
        {showDebug && debugStrip}
        {content}
      </div>
    );
  }

  const deviceWidth = viewportPreset === 'desktop' ? '100%' : MOBILE_VIEWPORT_WIDTH;
  return (
    <div
      className="rounded-xl overflow-hidden bg-white shrink-0 flex flex-col min-h-0 w-full"
      style={{
        width: deviceWidth,
        height: '100%',
        minHeight: PREVIEW_MIN_HEIGHT,
        ...(viewportPreset === 'desktop' ? { minWidth: PC_VIEWPORT_WIDTH } : {}),
        maxWidth: viewportPreset === 'desktop' ? '100%' : MOBILE_VIEWPORT_WIDTH,
        transform: zoom !== 1 ? `scale(${zoom})` : undefined,
        transformOrigin: 'top center',
        flex: '1 1 0%',
      }}
    >
      {showDebug && debugStrip}
      {content}
    </div>
  );
};
