/**
 * Role: Product Manager (Client-Facing & Business-Oriented).
 * Task: Analyze React/Tailwind/JSX code and generate Business Requirement Specification (BRS) Table.
 * Goal: Translate technical code into user manual style document for non-technical stakeholders.
 */

interface PrdTableRow {
  id: string;
  zone: string;
  element: string;
  function: string;
  display: string;
}

/**
 * 从文件名或组件名提取功能ID前缀
 */
function extractPrefix(fileName: string, componentName?: string): string {
  // 优先使用组件名
  if (componentName) {
    const match = componentName.match(/^[A-Z][a-z]+/);
    if (match) {
      return match[0].split('').filter(c => c === c.toUpperCase()).join('').substring(0, 3).toUpperCase();
    }
  }

  // 从文件名提取
  const nameWithoutExt = fileName.replace(/\.(tsx|ts|jsx|js)$/, '');
  const words = nameWithoutExt.split(/[-_]/).filter(w => w.length > 0);
  
  if (words.length > 0) {
    // 取每个单词的首字母
    return words.map(w => w[0].toUpperCase()).join('').substring(0, 3);
  }

  // 默认：取前3个大写字母
  const upperCase = nameWithoutExt.split('').filter(c => c === c.toUpperCase()).join('');
  return upperCase.substring(0, 3) || 'GEN';
}

/**
 * 识别UI区域
 */
function identifyZone(element: string, context: string): string {
  const lowerElement = element.toLowerCase();
  const lowerContext = context.toLowerCase();

  // 顶部导航
  if (lowerElement.includes('header') || lowerElement.includes('nav') || 
      lowerContext.includes('top') || lowerContext.includes('顶部')) {
    return '顶部导航栏';
  }

  // 侧边栏
  if (lowerElement.includes('aside') || lowerElement.includes('sidebar') || 
      lowerContext.includes('side') || lowerContext.includes('侧边')) {
    return '侧边菜单区';
  }

  // 底部
  if (lowerElement.includes('footer') || lowerContext.includes('bottom') || 
      lowerContext.includes('底部')) {
    return '底部操作栏';
  }

  // 弹窗
  if (lowerElement.includes('dialog') || lowerElement.includes('modal') || 
      lowerElement.includes('overlay') || lowerContext.includes('弹窗')) {
    return '弹窗/浮层';
  }

  // 列表/卡片容器
  if (lowerContext.includes('map') || lowerContext.includes('list') || 
      lowerContext.includes('card') || lowerContext.includes('item')) {
    return '内容列表区';
  }

  // 默认：核心工作台
  return '核心工作台';
}

/**
 * 翻译组件名为业务术语
 */
function translateElementName(componentType: string, props: Record<string, any>, text?: string): string {
  const lowerType = componentType.toLowerCase();
  const lowerText = (text || '').toLowerCase();

  // 按钮
  if (lowerType.includes('button') || props.onClick || props.onPress) {
    if (lowerText.includes('提交') || lowerText.includes('保存')) return '提交按钮';
    if (lowerText.includes('取消') || lowerText.includes('关闭')) return '取消按钮';
    if (lowerText.includes('删除')) return '删除按钮';
    if (lowerText.includes('编辑') || lowerText.includes('修改')) return '编辑按钮';
    if (lowerText.includes('查看') || lowerText.includes('详情')) return '查看按钮';
    if (lowerText.includes('催办')) return '催办按钮';
    if (lowerText.includes('筛选') || lowerText.includes('过滤')) return '筛选按钮';
    return `${text || '操作'}按钮`;
  }

  // 输入框
  if (lowerType.includes('input') || componentType === 'input') {
    if (props.type === 'search' || lowerText.includes('搜索')) return '搜索框';
    if (props.type === 'password') return '密码输入框';
    if (props.type === 'email') return '邮箱输入框';
    if (props.type === 'number') return '数字输入框';
    if (props.type === 'date' || props.type === 'datetime-local') return '日期选择器';
    return `${props.placeholder || text || '文本'}输入框`;
  }

  // 下拉选择
  if (lowerType.includes('select') || componentType === 'select') {
    return `${text || '选项'}下拉框`;
  }

  // 标签/徽章
  if (lowerType.includes('badge') || lowerType.includes('tag') || lowerType.includes('label')) {
    if (lowerText.includes('状态')) return '状态标签';
    if (lowerText.includes('来源') || lowerText.includes('分类')) return '来源标签';
    return '标识标签';
  }

  // 图片/头像
  if (lowerType.includes('img') || lowerType.includes('image') || lowerType.includes('avatar')) {
    if (props.alt?.includes('头像') || lowerText.includes('avatar')) return '用户头像';
    return '图片';
  }

  // 图标
  if (lowerType.includes('icon') || componentType.match(/^[A-Z][a-z]+Icon$/)) {
    const iconName = componentType.replace('Icon', '').toLowerCase();
    const iconMap: Record<string, string> = {
      search: '搜索图标',
      user: '用户图标',
      calendar: '日期图标',
      chevron: '下拉箭头图标',
      close: '关闭图标',
      edit: '编辑图标',
      delete: '删除图标',
      save: '保存图标',
    };
    return iconMap[iconName] || '图标';
  }

  // 文本显示
  if (lowerType.includes('text') || lowerType.includes('span') || lowerType.includes('p') || 
      componentType === 'span' || componentType === 'p') {
    if (lowerText.includes('标题') || lowerText.includes('title')) return '标题文字';
    if (lowerText.includes('描述') || lowerText.includes('desc')) return '描述信息';
    if (lowerText.includes('状态')) return '状态信息';
    if (lowerText.includes('日期') || lowerText.includes('date')) return '日期信息';
    if (lowerText.includes('姓名') || lowerText.includes('name')) return '姓名信息';
    return `${text || '文本'}信息`;
  }

  // 标题
  if (lowerType.includes('heading') || componentType.match(/^h[1-6]$/)) {
    return '标题';
  }

  return text || componentType || '元素';
}

/**
 * 生成功能说明
 */
function generateFunctionDescription(
  componentType: string,
  props: Record<string, any>,
  text?: string,
  context?: string
): string {
  const lowerType = componentType.toLowerCase();
  const lowerText = (text || '').toLowerCase();

  // 交互元素
  if (props.onClick || props.onPress || props.onChange || props.onSelect || 
      lowerType.includes('button') || lowerType.includes('input') || lowerType.includes('select')) {
    
    if (props.onClick || props.onPress) {
      if (lowerText.includes('提交') || lowerText.includes('保存')) {
        return '用户点击后，系统保存当前表单数据并返回成功提示。';
      }
      if (lowerText.includes('取消') || lowerText.includes('关闭')) {
        return '用户点击后，关闭当前弹窗或返回上一页面。';
      }
      if (lowerText.includes('删除')) {
        return '用户点击后，系统删除当前选中项并刷新列表。';
      }
      if (lowerText.includes('编辑') || lowerText.includes('修改')) {
        return '用户点击后，进入编辑模式，允许修改当前信息。';
      }
      if (lowerText.includes('查看') || lowerText.includes('详情')) {
        return '用户点击后，跳转至详情页面查看完整信息。';
      }
      if (lowerText.includes('催办')) {
        return '用户点击后，系统向负责人发送催办通知，提醒加快处理进度。';
      }
      return `用户点击后，${text || '执行相应操作'}。`;
    }

    if (props.onChange || props.onInput) {
      if (lowerType.includes('search') || lowerText.includes('搜索')) {
        return '用户输入关键词后，系统实时过滤列表，仅显示匹配的结果项。';
      }
      if (lowerType.includes('select')) {
        return '用户选择选项后，系统按选定规则重新排列或筛选内容。';
      }
      return `用户输入或选择后，系统${text || '更新显示内容'}。`;
    }
  }

  // 只读元素
  if (lowerText.includes('状态') || props.status || context?.includes('status')) {
    return '用于标识当前项的流转状态，帮助用户了解处理进度。';
  }

  if (lowerText.includes('标题') || lowerType.includes('heading') || componentType.match(/^h[1-6]$/)) {
    return `用于展示${text || '内容'}的核心主题，帮助用户快速识别。`;
  }

  if (lowerText.includes('日期') || lowerType.includes('calendar') || props.type === 'date') {
    return '用于展示时间信息，帮助用户了解创建或更新时间。';
  }

  if (lowerText.includes('头像') || lowerType.includes('avatar')) {
    return '用于标识负责人或创建者，增强信息的可信度和可追溯性。';
  }

  if (lowerText.includes('标签') || lowerType.includes('tag') || lowerType.includes('badge')) {
    return '用于标识分类或来源渠道，帮助用户快速筛选和归类。';
  }

  if (lowerText.includes('图标') || lowerType.includes('icon')) {
    return '用于增强视觉识别度，配合文字信息提升用户体验。';
  }

  // 默认描述
  if (text) {
    return `用于展示${text}相关信息。`;
  }

  return `用于展示${componentType}相关的内容信息。`;
}

/** Tailwind 常见色阶对应色号（用于展示规范中写出具体色号） */
const TAILWIND_TO_HEX: Record<string, string> = {
  'blue-500': '#3B82F6', 'blue-600': '#2563EB', 'blue-700': '#1D4ED8',
  'red-500': '#EF4444', 'red-600': '#DC2626', 'rose-500': '#F43F5E', 'rose-600': '#E11D48',
  'green-500': '#22C55E', 'green-600': '#16A34A', 'emerald-500': '#10B981', 'emerald-600': '#059669',
  'yellow-500': '#EAB308', 'amber-500': '#F59E0B', 'amber-600': '#D97706',
  'orange-500': '#F97316', 'orange-600': '#EA580C',
  'purple-500': '#A855F7', 'purple-600': '#9333EA', 'indigo-500': '#6366F1',
  'cyan-500': '#06B6D4', 'cyan-600': '#0891B2', 'teal-500': '#14B8A6',
  'gray-400': '#9CA3AF', 'gray-500': '#6B7280', 'gray-600': '#4B5563', 'gray-700': '#374151',
  'slate-400': '#94A3B8', 'slate-500': '#64748B', 'slate-600': '#475569', 'slate-700': '#334155',
};

function tailwindClassToHex(className: string): { label: string; hex: string } | null {
  const m = className.match(/(?:bg|text|border)-(blue|red|rose|green|emerald|yellow|amber|orange|purple|indigo|cyan|teal|gray|slate)-(\d{3,4})/);
  if (!m) return null;
  const key = `${m[1]}-${m[2]}`;
  const hex = TAILWIND_TO_HEX[key];
  if (!hex) return null;
  const role = className.includes('bg-') ? '背景色' : className.includes('text-') ? '文字色' : '边框色';
  return { label: `${role} ${hex}`, hex };
}

/**
 * 翻译 Tailwind 类名为展示规范（有意义的文字+色号，禁止无意义的纯色块）
 */
function translateDisplaySpecs(className: string, componentType: string, props: Record<string, any>): string {
  const specs: string[] = [];

  // 颜色：用「语义 + 色号」描述，不单独使用色块
  const colorSpecs: string[] = [];
  if (className.includes('bg-blue-') || className.includes('text-blue-')) {
    const info = tailwindClassToHex(className) || { label: '蓝色', hex: '#2563EB' };
    colorSpecs.push(`主色/链接色：${info.hex}`);
  }
  if (className.includes('bg-red-') || className.includes('text-red-') || className.includes('bg-rose-') || className.includes('text-rose-')) {
    const info = tailwindClassToHex(className) || { label: '红色', hex: '#DC2626' };
    colorSpecs.push(`警示/高危：${info.hex}`);
  }
  if (className.includes('bg-green-') || className.includes('text-green-') || className.includes('bg-emerald-') || className.includes('text-emerald-')) {
    const info = tailwindClassToHex(className) || { label: '绿色', hex: '#16A34A' };
    colorSpecs.push(`成功/完成：${info.hex}`);
  }
  if (className.includes('bg-orange-') || className.includes('text-orange-') || className.includes('bg-amber-') || className.includes('text-amber-') || className.includes('bg-yellow-') || className.includes('text-yellow-')) {
    const info = tailwindClassToHex(className) || { label: '橙黄', hex: '#D97706' };
    colorSpecs.push(`警告/待处理：${info.hex}`);
  }
  if (className.includes('bg-purple-') || className.includes('text-purple-') || className.includes('bg-indigo-') || className.includes('text-indigo-')) {
    const info = tailwindClassToHex(className) || { label: '紫色', hex: '#9333EA' };
    colorSpecs.push(`强调/品牌：${info.hex}`);
  }
  if (className.includes('text-gray-') || className.includes('bg-gray-') || className.includes('text-slate-') || className.includes('bg-slate-')) {
    const info = tailwindClassToHex(className) || { label: '灰色', hex: '#6B7280' };
    colorSpecs.push(`次要/置灰：${info.hex}`);
  }
  if (className.includes('bg-cyan-') || className.includes('text-cyan-') || className.includes('bg-teal-') || className.includes('text-teal-')) {
    const info = tailwindClassToHex(className) || { label: '青色', hex: '#0891B2' };
    colorSpecs.push(`主按钮/强调：${info.hex}`);
  }
  if (colorSpecs.length > 0) specs.push(colorSpecs.join('；'));

  // 形状
  if (className.includes('rounded-full')) {
    specs.push('胶囊样式');
  } else if (className.includes('rounded')) {
    specs.push('圆角矩形');
  }

  // 字体
  if (className.includes('font-bold')) specs.push('粗体');
  if (className.includes('text-xs')) specs.push('小号字');
  if (className.includes('text-sm')) specs.push('正文小字');

  // 按钮：明确写出「主按钮」「次要按钮」及色号
  const lowerType = componentType.toLowerCase();
  if (lowerType.includes('button') && colorSpecs.length > 0) {
    specs.push('按钮样式见上方色号');
  }

  // 状态标签/徽章：建议写出「状态文案 + 颜色 + 色号」的规范
  if ((lowerType.includes('badge') || lowerType.includes('tag')) && colorSpecs.length > 0) {
    specs.push('状态文案与色号对应（如：执行中→蓝色 #2563EB，执行完毕→绿色 #16A34A）');
  }

  // 图标：用文字描述，不用色块
  if (componentType.includes('Icon') || componentType.match(/^[A-Z][a-z]+Icon$/)) {
    const iconName = componentType.replace('Icon', '').toLowerCase();
    const iconDesc: Record<string, string> = {
      search: '搜索图标', user: '用户图标', calendar: '日历图标',
      chevron: '下拉箭头', close: '关闭图标', edit: '编辑图标', delete: '删除图标',
    };
    specs.push(iconDesc[iconName] || '图标');
  }

  if (props.placeholder) specs.push(`占位符："${props.placeholder}"`);
  if (props.defaultValue) specs.push(`默认值："${props.defaultValue}"`);
  if (props.showActionButton === false || props.conditional) specs.push('仅在需要时显示');

  return specs.length > 0 ? specs.join('；') : '标准样式';
}

/**
 * 解析 React 代码并生成 PRD 表格
 */
export function generatePrdTableFromCode(
  code: string,
  fileName: string = 'Component.tsx',
  componentName?: string
): string {
  const rows: PrdTableRow[] = [];
  const prefix = extractPrefix(fileName, componentName);

  // 简单的代码解析（基于正则，实际项目中可以使用 AST）
  // 提取 JSX 元素
  const jsxPattern = /<(\w+)([^>]*)>([^<]*?)<\/\1>|<(\w+)([^>]*)\/>/g;
  let match;
  let index = 1;

  // 提取组件定义
  const componentMatch = code.match(/export\s+(?:default\s+)?function\s+(\w+)/);
  const detectedComponentName = componentMatch ? componentMatch[1] : componentName;

  // 提取 props 接口
  const propsInterfaceMatch = code.match(/interface\s+(\w+Props)[^{]*\{([^}]+)\}/);
  const propsFields: string[] = [];
  if (propsInterfaceMatch) {
    const propsContent = propsInterfaceMatch[2];
    const propMatches = propsContent.matchAll(/(\w+)(\??):\s*([^;]+)/g);
    for (const propMatch of propMatches) {
      propsFields.push(propMatch[1]);
    }
  }

  // 解析主要 UI 元素
  const lines = code.split('\n');
  let currentZone = '核心工作台';
  let depth = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();
    
    // 跳过注释和空行
    if (trimmedLine.startsWith('//') || trimmedLine.startsWith('/*') || trimmedLine.startsWith('*') || trimmedLine === '') {
      continue;
    }
    
    // 检测区域变化（更宽松的匹配）
    const lowerLine = line.toLowerCase();
    if (lowerLine.includes('header') || lowerLine.includes('顶部') || lowerLine.includes('navbar') || lowerLine.includes('nav-bar')) {
      currentZone = '顶部导航栏';
    } else if (lowerLine.includes('footer') || lowerLine.includes('底部') || lowerLine.includes('bottom')) {
      currentZone = '底部操作栏';
    } else if (lowerLine.includes('sidebar') || lowerLine.includes('aside') || lowerLine.includes('侧边') || lowerLine.includes('menu')) {
      currentZone = '侧边菜单区';
    } else if (lowerLine.includes('modal') || lowerLine.includes('dialog') || lowerLine.includes('弹窗') || lowerLine.includes('popup')) {
      currentZone = '弹窗/浮层';
    } else if (lowerLine.includes('.map(') || lowerLine.includes('list') || lowerLine.includes('card') || lowerLine.includes('grid')) {
      currentZone = '内容列表区';
    }

    // 提取关键元素 - 改进正则匹配，支持更多格式
    // Button: 支持自闭合标签、多行标签、带children的标签
    const buttonMatch = line.match(/<button[^>]*>([^<]*)<\/button>|<Button[^>]*>([^<]*)<\/Button>|<button[^>]*\/>|<Button[^>]*\/>/i);
    if (buttonMatch) {
      const text = (buttonMatch[1] || buttonMatch[2] || '').trim();
      const classNameMatch = line.match(/className=["']([^"']+)["']/);
      const onClickMatch = line.match(/onClick\s*=\s*\{([^}]+)\}/);
      
      rows.push({
        id: `${prefix}${String(index).padStart(3, '0')}`,
        zone: currentZone,
        element: translateElementName('Button', { onClick: onClickMatch ? true : false }, text),
        function: generateFunctionDescription('Button', { onClick: onClickMatch ? true : false }, text),
        display: translateDisplaySpecs(classNameMatch?.[1] || '', 'Button', {}),
      });
      index++;
    }

    // Input: 支持单引号和双引号
    const inputMatch = line.match(/<input[^>]*\/?>|<Input[^>]*\/?>/i);
    if (inputMatch) {
      const placeholderMatch = line.match(/placeholder=["']([^"']+)["']/);
      const typeMatch = line.match(/type=["']([^"']+)["']/);
      const classNameMatch = line.match(/className=["']([^"']+)["']/);
      const onChangeMatch = line.match(/onChange\s*=\s*\{([^}]+)\}/);
      
      rows.push({
        id: `${prefix}${String(index).padStart(3, '0')}`,
        zone: currentZone,
        element: translateElementName('Input', { 
          type: typeMatch?.[1] || 'text',
          placeholder: placeholderMatch?.[1],
          onChange: onChangeMatch ? true : false,
        }, placeholderMatch?.[1]),
        function: generateFunctionDescription('Input', { 
          onChange: onChangeMatch ? true : false,
          type: typeMatch?.[1],
        }, placeholderMatch?.[1]),
        display: translateDisplaySpecs(classNameMatch?.[1] || '', 'Input', {
          placeholder: placeholderMatch?.[1],
        }),
      });
      index++;
    }

    // Select: 支持单引号和双引号
    const selectMatch = line.match(/<select[^>]*>|<Select[^>]*>/i);
    if (selectMatch) {
      const classNameMatch = line.match(/className=["']([^"']+)["']/);
      const onChangeMatch = line.match(/onChange\s*=\s*\{([^}]+)\}/);
      
      rows.push({
        id: `${prefix}${String(index).padStart(3, '0')}`,
        zone: currentZone,
        element: translateElementName('Select', { onChange: onChangeMatch ? true : false }),
        function: generateFunctionDescription('Select', { onChange: onChangeMatch ? true : false }),
        display: translateDisplaySpecs(classNameMatch?.[1] || '', 'Select', {}),
      });
      index++;
    }

    // 提取图标 - 改进匹配，支持更多格式
    const iconMatch = line.match(/<(\w+Icon)[^>]*\/?>|<(\w+)\s+className=["'][^"']*icon[^"']*["']/i) || 
                      line.match(/from\s+['"]lucide-react['"]/i) && line.match(/(\w+)\s*=/);
    if (iconMatch) {
      const iconName = iconMatch[1] || iconMatch[2] || iconMatch[3] || 'Icon';
      const classNameMatch = line.match(/className=["']([^"']+)["']/);
      
      rows.push({
        id: `${prefix}${String(index).padStart(3, '0')}`,
        zone: currentZone,
        element: translateElementName(iconName, {}),
        function: generateFunctionDescription(iconName, {}),
        display: translateDisplaySpecs(classNameMatch?.[1] || '', iconName, {}),
      });
      index++;
    }

    // 提取标签/徽章 - 支持单引号和双引号
    const badgeMatch = line.match(/<span[^>]*className=["'][^"']*(badge|tag|label)[^"']*["'][^>]*>([^<]+)<\/span>/i) ||
                      line.match(/<div[^>]*className=["'][^"']*(badge|tag|label)[^"']*["'][^>]*>([^<]+)<\/div>/i);
    if (badgeMatch) {
      const text = (badgeMatch[2] || '').trim();
      const classNameMatch = line.match(/className=["']([^"']+)["']/);
      
      rows.push({
        id: `${prefix}${String(index).padStart(3, '0')}`,
        zone: currentZone,
        element: translateElementName('Badge', {}, text),
        function: generateFunctionDescription('Badge', {}, text),
        display: translateDisplaySpecs(classNameMatch?.[1] || '', 'Badge', {}),
      });
      index++;
    }
    
    // 提取其他常见元素：div、span、p等（如果包含交互或重要内容）
    const divMatch = line.match(/<div[^>]*onClick[^>]*>|<div[^>]*className=["'][^"']*(card|container|wrapper|box)[^"']*["'][^>]*>/i);
    if (divMatch && !badgeMatch) {
      const onClickMatch = line.match(/onClick\s*=\s*\{([^}]+)\}/);
      const classNameMatch = line.match(/className=["']([^"']+)["']/);
      const textMatch = line.match(/>([^<]+)</);
      
      if (onClickMatch || classNameMatch?.[1]?.includes('card') || classNameMatch?.[1]?.includes('container')) {
        rows.push({
          id: `${prefix}${String(index).padStart(3, '0')}`,
          zone: currentZone,
          element: translateElementName('Container', { onClick: onClickMatch ? true : false }, textMatch?.[1]?.trim() || ''),
          function: generateFunctionDescription('Container', { onClick: onClickMatch ? true : false }, textMatch?.[1]?.trim() || ''),
          display: translateDisplaySpecs(classNameMatch?.[1] || '', 'Container', {}),
        });
        index++;
      }
    }
  }

  // 生成 Markdown 表格
  const tableRows = rows.map(row => 
    `| ${row.id} | ${row.zone} | ${row.element} | ${row.function} | ${row.display} |`
  ).join('\n');

  // 如果没有提取到任何元素，返回提示信息而不是空表格
  if (rows.length === 0) {
    return `| 功能ID | UI区域 | 元素名称 | 功能说明 | 展示规范 |\n| :--- | :--- | :--- | :--- | :--- |\n| - | - | 未检测到UI元素 | 请检查代码是否包含有效的React组件元素 | - |`;
  }

  return `| 功能ID | UI区域 | 元素名称 | 功能说明 | 展示规范 |\n| :--- | :--- | :--- | :--- | :--- |\n${tableRows}`;
}

/**
 * 从文件路径读取代码并生成 PRD 表格
 */
export async function generatePrdTableFromFile(filePath: string): Promise<string> {
  // 在浏览器环境中，这需要用户上传文件
  // 在 Node.js 环境中，可以使用 fs 读取
  throw new Error('File reading not implemented. Use generatePrdTableFromCode instead.');
}

/**
 * PRD 配置选项接口
 */
export interface PrdOptions {
  userRole?: string;
  coreValue?: string;
  businessValue?: string;
  prerequisites?: string[];
  pageTitle?: string;
}

/**
 * 从代码注释中提取 PRD 配置
 * 支持格式：
 * @prd
 * @userRole 项目经理
 * @coreValue 提供指令创建、分配、跟踪的完整工作流管理功能
 * @businessValue 确保任务按时完成，提升团队协作效率
 * @prerequisites 用户已登录,具备项目查看权限
 */
export function extractPrdOptionsFromComments(code: string): Partial<PrdOptions> {
  const options: Partial<PrdOptions> = {};
  
  // 提取 @userRole
  const userRoleMatch = code.match(/@userRole\s+([^\n*]+)/);
  if (userRoleMatch) {
    options.userRole = userRoleMatch[1].trim();
  }
  
  // 提取 @coreValue
  const coreValueMatch = code.match(/@coreValue\s+([^\n*]+)/);
  if (coreValueMatch) {
    options.coreValue = coreValueMatch[1].trim();
  }
  
  // 提取 @businessValue
  const businessValueMatch = code.match(/@businessValue\s+([^\n*]+)/);
  if (businessValueMatch) {
    options.businessValue = businessValueMatch[1].trim();
  }
  
  // 提取 @prerequisites（支持逗号分隔的多个条件）
  const prerequisitesMatch = code.match(/@prerequisites\s+([^\n*]+)/);
  if (prerequisitesMatch) {
    options.prerequisites = prerequisitesMatch[1]
      .split(',')
      .map(p => p.trim())
      .filter(p => p.length > 0);
  }
  
  // 提取 @pageTitle
  const pageTitleMatch = code.match(/@pageTitle\s+([^\n*]+)/);
  if (pageTitleMatch) {
    options.pageTitle = pageTitleMatch[1].trim();
  }
  
  return options;
}

/**
 * 从代码推断 PRD 配置（AI 推断的默认值）
 */
function inferPrdOptionsFromCode(code: string, pageTitle?: string): PrdOptions {
  const lowerCode = code.toLowerCase();
  
  // 推断核心价值
  let coreValue = '提供用户界面交互功能';
  if (lowerCode.includes('instruction') || lowerCode.includes('指令')) {
    coreValue = '提供指令管理和流转功能，帮助用户高效处理工作任务';
  } else if (lowerCode.includes('search') || lowerCode.includes('搜索')) {
    coreValue = '提供搜索和筛选功能，帮助用户快速定位目标内容';
  } else if (lowerCode.includes('list') || lowerCode.includes('列表')) {
    coreValue = '提供列表展示和浏览功能，帮助用户查看和管理数据项';
  } else if (lowerCode.includes('form') || lowerCode.includes('表单')) {
    coreValue = '提供数据录入和提交功能，帮助用户完成信息收集';
  }

  // 推断用户角色
  let userRole = '用户';
  if (lowerCode.includes('admin') || lowerCode.includes('管理')) {
    userRole = '管理员';
  } else if (lowerCode.includes('manager') || lowerCode.includes('经理')) {
    userRole = '经理';
  } else if (lowerCode.includes('employee') || lowerCode.includes('员工')) {
    userRole = '员工';
  }

  // 推断业务价值
  let businessValue = '提升工作效率';
  if (lowerCode.includes('instruction') || lowerCode.includes('指令')) {
    businessValue = '提升任务处理效率和协作透明度';
  } else if (lowerCode.includes('search')) {
    businessValue = '快速定位所需信息，减少查找时间';
  }

  // 推断前置条件
  const prerequisites: string[] = [];
  if (lowerCode.includes('login') || lowerCode.includes('auth') || lowerCode.includes('登录')) {
    prerequisites.push('用户已登录系统');
  }
  if (lowerCode.includes('permission') || lowerCode.includes('权限')) {
    prerequisites.push('用户具备相应的访问权限');
  }
  if (lowerCode.includes('role') || lowerCode.includes('角色')) {
    prerequisites.push('用户角色已分配');
  }
  if (prerequisites.length === 0) {
    prerequisites.push('用户已进入系统');
  }

  return {
    userRole,
    coreValue,
    businessValue,
    prerequisites,
    pageTitle
  };
}

/**
 * 生成页面综述
 */
function generatePageOverview(code: string, options?: PrdOptions): string {
  const lowerCode = code.toLowerCase();
  
  // 使用传入的配置，如果没有则推断
  const userRole = options?.userRole || '用户';
  const coreValue = options?.coreValue || '提供用户界面交互功能';
  const businessValue = options?.businessValue || '提升工作效率';
  const prerequisites = options?.prerequisites || ['用户已进入系统'];

  // 推断用户动作（这个通常可以从代码推断）
  let userAction = '使用该功能';
  if (lowerCode.includes('search') || lowerCode.includes('搜索')) {
    userAction = '搜索和筛选指令';
  } else if (lowerCode.includes('view') || lowerCode.includes('查看')) {
    userAction = '查看和管理指令列表';
  } else if (lowerCode.includes('create') || lowerCode.includes('创建')) {
    userAction = '创建新的指令';
  }

  return `### 1. 📝 页面综述

- **核心价值**: ${coreValue}。
- **用户故事**: "作为 ${userRole}，我想要 ${userAction}，以便 ${businessValue}。"
- **前置条件**: ${prerequisites.join('、')}。`;
}

/**
 * 生成核心业务流程
 */
function generateBusinessFlows(code: string): string {
  const lowerCode = code.toLowerCase();
  const flows: string[] = [];

  // 搜索和筛选流程
  if (lowerCode.includes('search') && lowerCode.includes('sort')) {
    flows.push(`**搜索与排序组合流程**：
1. 用户在搜索框输入关键词，系统实时过滤列表（防抖处理，避免频繁请求）。
2. 用户选择排序方式（最新/最旧/按状态），系统重新排列已过滤的结果。
3. 搜索和排序条件可同时生效，搜索结果按选定规则排序。`);
  } else if (lowerCode.includes('search')) {
    flows.push(`**搜索流程**：
1. 用户在搜索框输入关键词。
2. 系统实时过滤列表，仅显示匹配的指令项。
3. 清空搜索框时，恢复显示全部列表。`);
  } else if (lowerCode.includes('sort')) {
    flows.push(`**排序流程**：
1. 用户从下拉框选择排序方式（最新/最旧/按状态）。
2. 系统按选定规则重新排列指令列表。
3. 排序状态保持，直到用户再次更改。`);
  }

  // 催办流程
  if (lowerCode.includes('催办') || lowerCode.includes('onactionclick')) {
    flows.push(`**催办流程**：
1. 用户点击指令卡片上的"催办"按钮。
2. 系统向指令负责人发送催办通知（站内消息或邮件）。
3. 系统记录催办操作日志，便于后续追踪。`);
  }

  // 列表浏览流程
  if (lowerCode.includes('map') || lowerCode.includes('list')) {
    flows.push(`**列表浏览流程**：
1. 页面加载时，系统从数据源获取指令列表。
2. 用户滚动浏览列表，查看各个指令卡片。
3. 每个卡片展示指令的核心信息（标题、状态、负责人、日期等）。
4. 用户可通过点击卡片或相关按钮进行进一步操作。`);
  }

  if (flows.length === 0) {
    flows.push('**基础交互流程**：用户与界面元素交互，系统响应并更新显示内容。');
  }

  return `### 3. 🔄 核心业务流程

${flows.join('\n\n')}`;
}

/**
 * 生成异常与边界情况
 */
function generateExceptions(code: string): string {
  const lowerCode = code.toLowerCase();
  const exceptions: string[] = [];

  // 空状态
  if (lowerCode.includes('map') || lowerCode.includes('list') || lowerCode.includes('length === 0')) {
    exceptions.push(`**空状态**：
- 当列表为空时，显示友好的空状态提示（如"暂无指令"或空状态插图）。
- 空状态应引导用户进行首次操作（如"创建第一个指令"）。`);
  }

  // 加载状态
  if (lowerCode.includes('loading') || lowerCode.includes('isloading') || lowerCode.includes('skeleton')) {
    exceptions.push(`**加载状态**：
- 数据加载时显示骨架屏或加载动画。
- 骨架屏应模拟实际内容布局，提供良好的视觉连续性。`);
  } else {
    exceptions.push(`**加载状态**：
- 数据加载时显示加载指示器，避免页面空白。
- 加载时间超过3秒时，显示加载进度提示。`);
  }

  // 网络错误
  exceptions.push(`**网络错误**：
- 网络请求失败时，显示错误提示（Toast 消息）。
- 提供"重试"按钮，允许用户重新发起请求。
- 错误信息应用户友好，避免显示技术错误码。`);

  // 数据溢出
  if (lowerCode.includes('truncate') || lowerCode.includes('ellipsis') || lowerCode.includes('overflow')) {
    exceptions.push(`**文本溢出**：
- 标题或长文本超出容器时，使用省略号（...）截断。
- 悬停时显示完整内容的提示。`);
  } else {
    exceptions.push(`**文本溢出**：
- 长文本应合理截断，避免破坏布局。
- 关键信息（如标题）应完整显示或提供展开功能。`);
  }

  // 条件显示
  if (lowerCode.includes('showactionbutton') || lowerCode.includes('conditional')) {
    exceptions.push(`**条件显示**：
- 某些元素仅在满足条件时显示（如"催办"按钮仅在需要时出现）。
- 条件不满足时，元素不占用布局空间，保持界面整洁。`);
  }

  return `### 4. ⚠️ 异常与边界情况

${exceptions.join('\n\n')}`;
}

/**
 * 生成数据埋点与性能要求
 */
function generateAnalytics(code: string): string {
  const lowerCode = code.toLowerCase();
  const tracking: string[] = [];
  const performance: string[] = [];

  // 埋点事件
  if (lowerCode.includes('search') || lowerCode.includes('onchange')) {
    tracking.push('- **搜索行为追踪**：记录用户搜索关键词、搜索频率、搜索结果点击率。');
  }
  if (lowerCode.includes('sort') || lowerCode.includes('onselect')) {
    tracking.push('- **排序行为追踪**：记录用户选择的排序方式，分析用户偏好。');
  }
  if (lowerCode.includes('onclick') || lowerCode.includes('button')) {
    tracking.push('- **按钮点击追踪**：记录所有按钮的点击事件（如"催办"按钮点击率）。');
  }
  if (lowerCode.includes('card') || lowerCode.includes('item')) {
    tracking.push('- **列表交互追踪**：记录卡片点击率、列表滚动深度、停留时长。');
  }

  if (tracking.length === 0) {
    tracking.push('- **基础交互追踪**：记录页面访问量、用户停留时间、关键操作点击率。');
  }

  // 性能要求
  if (lowerCode.includes('map') || lowerCode.includes('list')) {
    performance.push('- **列表渲染性能**：首次加载时间 < 1.5秒，支持虚拟滚动（如列表项超过50条）。');
  }
  if (lowerCode.includes('search') && lowerCode.includes('onchange')) {
    performance.push('- **搜索响应性能**：搜索输入防抖延迟 300ms，过滤结果实时更新，响应时间 < 100ms。');
  }
  performance.push('- **页面加载性能**：首屏渲染时间 < 2秒，支持懒加载优化。');
  performance.push('- **数据分页规则**：列表数据采用分页加载，每页显示 20 条，支持无限滚动或分页器。');

  return `### 5. 📊 数据埋点与性能要求

**数据埋点要求**：
${tracking.join('\n')}

**性能要求**：
${performance.join('\n')}`;
}

/**
 * 从已有需求文档中提取功能表格（包含「功能ID」列的表视为功能表格）
 */
export function extractFunctionTableFromRequirements(requirements: string | string[]): string | null {
  const requirementsText = Array.isArray(requirements) 
    ? requirements.join('\n') 
    : String(requirements || '');
  
  // 查找功能表格：查找包含 "功能ID" 的表格
  // 表格格式：| 功能ID | UI区域 | 元素名称 | 功能说明 | 展示规范 |
  const tablePattern = /\|?\s*功能ID\s*\|[^\n]*\n\s*\|?\s*:?-+\s*\|[^\n]*\n((?:\|?[^\n]*\|[^\n]*\n?)+)/;
  const match = requirementsText.match(tablePattern);
  
  if (match && match[1]) {
    // 提取表格数据行（不包括表头，因为我们会重新添加）
    const tableRows = match[1].trim();
    
    // 确保表格有数据行（至少一行）
    if (tableRows.includes('|') && tableRows.split('\n').filter(line => line.trim().includes('|')).length > 0) {
      // 返回完整的表格（包含表头）
      return `| 功能ID | UI区域 | 元素名称 | 功能说明 | 展示规范 |\n| :--- | :--- | :--- | :--- | :--- |\n${tableRows}`;
    }
  }
  
  return null;
}

/**
 * 生成完整的页面级 PRD 文档
 * 
 * 优先级：函数参数 > 代码注释 > AI推断
 * 
 * @param code - React 组件代码字符串
 * @param fileName - 文件名（用于提取功能ID前缀）
 * @param componentName - 组件名（可选，优先使用）
 * @param userOptions - 用户提供的配置（优先级最高）
 * @param existingRequirements - 已有的需求文档（如果存在，会从中提取功能表格）
 * @returns 完整的页面级 PRD 文档（Markdown 格式）
 */
export function generatePageLevelPrd(
  code: string,
  fileName: string = 'Component.tsx',
  componentName?: string,
  userOptions?: PrdOptions,
  existingRequirements?: string | string[]
): string {
  // 提取组件名
  const componentMatch = code.match(/export\s+(?:default\s+)?function\s+(\w+)/);
  const detectedComponentName = componentMatch ? componentMatch[1] : componentName;

  // 1. AI 推断（默认值）
  const aiInferred = inferPrdOptionsFromCode(code, userOptions?.pageTitle);
  
  // 2. 从代码注释提取
  const commentOptions = extractPrdOptionsFromComments(code);
  
  // 3. 合并：AI推断 < 代码注释 < 用户参数（优先级递增）
  const finalOptions: PrdOptions = {
    ...aiInferred,
    ...commentOptions,
    ...userOptions
  };

  // 生成各个部分
  const pageOverview = generatePageOverview(code, finalOptions);
  
  // 优先使用已有需求文档中的功能表格，如果没有则重新生成
  let elementSpec: string;
  if (existingRequirements) {
    const extractedTable = extractFunctionTableFromRequirements(existingRequirements);
    if (extractedTable) {
      elementSpec = extractedTable;
    } else {
      // 如果提取失败，则重新生成
      elementSpec = generatePrdTableFromCode(code, fileName, detectedComponentName);
    }
  } else {
    // 没有已有需求文档，重新生成
    elementSpec = generatePrdTableFromCode(code, fileName, detectedComponentName);
  }
  
  const businessFlows = generateBusinessFlows(code);
  const exceptions = generateExceptions(code);
  const analytics = generateAnalytics(code);

  // 组合完整文档
  return `**角色**: 专业产品经理（PM）。  
**任务**: 基于当前 UI 组件代码/图片，生成完整的**页面级产品需求文档（PRD）**。

---

${pageOverview}

---

### 2. 🧩 页面功能详情

${elementSpec}

---

${businessFlows}

---

${exceptions}

---

${analytics}

---

**约束**: 使用专业的产品语言。避免纯技术术语（如具体的 API 端点或 SQL）。专注于业务逻辑。`;
}

/**
 * 从代码推断 PRD 配置（用于 UI 显示 AI 推断的默认值）
 */
export function inferPrdOptions(code: string, pageTitle?: string): PrdOptions {
  return inferPrdOptionsFromCode(code, pageTitle);
}

