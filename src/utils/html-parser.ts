/**
 * HTML解析工具
 * 用于从HTML文件中提取关键信息，确保React组件能够精确复刻
 */

export interface HTMLParsedInfo {
  /** 背景色信息 */
  backgroundColors: {
    /** 主背景色（body或最外层容器） */
    primary?: string;
    /** 所有使用的背景色类名或颜色值 */
    all: string[];
  };
  /** 文本颜色信息 */
  textColors: {
    /** 所有使用的文本颜色类名或颜色值 */
    all: string[];
    /** 主要文本颜色（最常见的） */
    primary?: string;
    /** 次要文本颜色（第二常见的） */
    secondary?: string;
  };
  /** 字体信息 */
  fonts: {
    /** 字体族 */
    family?: string;
    /** 所有使用的字体大小类名 */
    sizes: string[];
  };
  /** 图标信息 */
  icons: {
    /** Material Icons使用的图标名称列表 */
    materialIcons: string[];
    /** 其他图标库的图标 */
    other: string[];
  };
  /** 布局信息 */
  layout: {
    /** 使用的Flex布局 */
    flex: string[];
    /** 使用的Grid布局 */
    grid: string[];
    /** 使用的间距类名 */
    spacing: string[];
  };
  /** 详细样式信息 */
  styles: {
    /** 圆角类名 */
    roundedCorners: string[];
    /** 阴影类名 */
    shadows: string[];
    /** 边框类名 */
    borders: string[];
    /** 定位类名 */
    positions: string[];
    /** 尺寸类名 */
    sizes: string[];
  };
  /** 自定义CSS类 */
  customClasses: string[];
  /** 自定义样式（内联样式或style标签） */
  customStyles: string[];
  /** 深色模式支持 */
  hasDarkMode: boolean;
  /** 原始HTML结构摘要（用于AI理解） */
  structureSummary: string;
  /** DOM结构树（简化版） */
  domStructure: string;
  /** 文字内容信息（用于确保AI使用正确的文字） */
  textContent: {
    /** 所有按钮文字 */
    buttons: string[];
    /** 所有标签文字（如筛选标签） */
    labels: string[];
    /** 所有菜单项文字 */
    menuItems: string[];
    /** 所有卡片标题 */
    cardTitles: string[];
    /** 所有卡片内容文字 */
    cardContent: string[];
    /** 完整文本内容（用于AI理解上下文） */
    allText: string;
  };
}

/**
 * Material Icons 到 Lucide React 的映射表
 * 基于语义相似性和视觉相似性
 */
const MATERIAL_TO_LUCIDE_MAP: Record<string, string> = {
  // 导航和方向
  'arrow_forward': 'ArrowRight',
  'arrow_back': 'ArrowLeft',
  'arrow_upward': 'ArrowUp',
  'arrow_downward': 'ArrowDown',
  'chevron_right': 'ChevronRight',
  'chevron_left': 'ChevronLeft',
  'expand_more': 'ChevronDown',
  'expand_less': 'ChevronUp',
  
  // 状态和操作
  'check': 'Check',
  'check_circle': 'CheckCircle',
  'close': 'X',
  'cancel': 'X',
  'delete': 'Trash2',
  'edit': 'Edit',
  'add': 'Plus',
  'remove': 'Minus',
  'save': 'Save',
  'search': 'Search',
  'filter': 'Filter',
  'sort': 'ArrowUpDown',
  
  // 通知和反馈
  'notifications': 'Bell',
  'notifications_none': 'Bell',
  'notifications_active': 'Bell',
  'error': 'AlertCircle',
  'warning': 'AlertTriangle',
  'info': 'Info',
  'help': 'HelpCircle',
  
  // 文件和文档
  'description': 'FileText',
  'folder': 'Folder',
  'folder_open': 'FolderOpen',
  'insert_drive_file': 'File',
  'article': 'FileText',
  'picture_as_pdf': 'FileText',
  
  // 用户和账户
  'person': 'User',
  'account_circle': 'UserCircle',
  'people': 'Users',
  'group': 'Users',
  
  // 时间和日期
  'calendar_today': 'Calendar',
  'event': 'Calendar',
  'schedule': 'Clock',
  'access_time': 'Clock',
  'today': 'Calendar',
  
  // 通信
  'email': 'Mail',
  'mail': 'Mail',
  'message': 'MessageSquare',
  'chat': 'MessageCircle',
  'phone': 'Phone',
  'call': 'Phone',
  
  // 媒体
  'image': 'Image',
  'photo': 'Image',
  'video': 'Video',
  'mic': 'Mic',
  'volume_up': 'Volume2',
  'volume_off': 'VolumeX',
  
  // 设置和配置
  'settings': 'Settings',
  'tune': 'Settings',
  'more_vert': 'MoreVertical',
  'more_horiz': 'MoreHorizontal',
  'menu': 'Menu',
  
  // 数据和图表
  'assessment': 'BarChart3',
  'analytics': 'TrendingUp',
  'pie_chart': 'PieChart',
  'bar_chart': 'BarChart3',
  'show_chart': 'LineChart',
  
  // 位置和地图
  'location_on': 'MapPin',
  'place': 'MapPin',
  'map': 'Map',
  
  // 其他常用图标
  'home': 'Home',
  'dashboard': 'LayoutDashboard',
  'star': 'Star',
  'favorite': 'Heart',
  'favorite_border': 'Heart',
  'thumb_up': 'ThumbsUp',
  'thumb_down': 'ThumbsDown',
  'share': 'Share2',
  'download': 'Download',
  'upload': 'Upload',
  'refresh': 'RefreshCw',
  'sync': 'RefreshCw',
  'lock': 'Lock',
  'lock_open': 'Unlock',
  'visibility': 'Eye',
  'visibility_off': 'EyeOff',
  'key': 'Key',
  'security': 'Shield',
  'verified_user': 'ShieldCheck',
  'smart_toy': 'Bot',
  'touch_app': 'Hand',
  'signal_cellular_alt': 'Signal',
  'wifi': 'Wifi',
  'battery_full': 'Battery',
  'fact_check': 'CheckSquare',
  'post_add': 'FilePlus',
  'rate_review': 'MessageSquare',
  'assignment_ind': 'UserCheck',
  'library_books': 'BookOpen',
  'playlist_add_check': 'CheckSquare',
};

/**
 * 提取HTML中的背景色信息
 */
function extractBackgroundColors(html: string): { primary?: string; all: string[] } {
  const colors = new Set<string>();
  let primaryColor: string | undefined;

  // 提取Tailwind背景色类名
  const bgClassRegex = /bg-([\w-]+)/g;
  let match;
  while ((match = bgClassRegex.exec(html)) !== null) {
    const colorClass = match[1];
    // 排除一些非颜色类名
    if (!['white', 'transparent', 'current'].includes(colorClass) && 
        !colorClass.startsWith('opacity-') &&
        !colorClass.startsWith('gradient-')) {
      colors.add(`bg-${colorClass}`);
    }
    // 如果找到body或最外层容器的背景色，作为主背景色
    if (html.includes(`<body`) || html.includes(`class="bg-${colorClass}"`)) {
      primaryColor = `bg-${colorClass}`;
    }
  }

  // 提取内联样式中的背景色
  const inlineBgRegex = /background(?:-color)?:\s*([^;]+)/gi;
  while ((match = inlineBgRegex.exec(html)) !== null) {
    const colorValue = match[1].trim();
    if (colorValue && !colorValue.includes('url(')) {
      colors.add(colorValue);
    }
  }

  // 提取十六进制颜色值
  const hexColorRegex = /#[0-9A-Fa-f]{3,6}/g;
  while ((match = hexColorRegex.exec(html)) !== null) {
    colors.add(match[0]);
  }

  // 如果没有找到主背景色，使用第一个或最常见的
  if (!primaryColor && colors.size > 0) {
    primaryColor = Array.from(colors)[0];
  }

  return {
    primary: primaryColor,
    all: Array.from(colors),
  };
}

/**
 * 提取HTML中的文本颜色信息
 */
function extractTextColors(html: string): { all: string[]; primary?: string; secondary?: string } {
  const colors = new Set<string>();
  const colorCounts = new Map<string, number>();

  // 提取Tailwind文本颜色类名
  const textClassRegex = /text-([\w-]+)/g;
  let match;
  while ((match = textClassRegex.exec(html)) !== null) {
    const colorClass = match[1];
    // 排除一些非颜色类名
    if (!['left', 'center', 'right', 'justify'].includes(colorClass)) {
      const fullClass = `text-${colorClass}`;
      colors.add(fullClass);
      colorCounts.set(fullClass, (colorCounts.get(fullClass) || 0) + 1);
    }
  }

  // 提取内联样式中的文本颜色
  const inlineColorRegex = /color:\s*([^;]+)/gi;
  while ((match = inlineColorRegex.exec(html)) !== null) {
    const colorValue = match[1].trim();
    if (colorValue) {
      colors.add(colorValue);
      colorCounts.set(colorValue, (colorCounts.get(colorValue) || 0) + 1);
    }
  }

  // 提取十六进制颜色值
  const hexColorRegex = /#[0-9A-Fa-f]{3,6}/g;
  while ((match = hexColorRegex.exec(html)) !== null) {
    colors.add(match[0]);
  }

  // 找出最常见的颜色作为主要和次要颜色
  const sortedColors = Array.from(colorCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([color]) => color);

  return {
    all: Array.from(colors),
    primary: sortedColors[0],
    secondary: sortedColors[1],
  };
}

/**
 * 提取HTML中的字体信息
 */
function extractFonts(html: string): { family?: string; sizes: string[] } {
  const sizes = new Set<string>();

  // 提取Tailwind字体大小类名
  const fontSizeRegex = /text-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)/g;
  let match;
  while ((match = fontSizeRegex.exec(html)) !== null) {
    sizes.add(`text-${match[1]}`);
  }

  // 提取字体族
  const fontFamilyRegex = /font-family:\s*([^;]+)/gi;
  let fontFamily: string | undefined;
  if ((match = fontFamilyRegex.exec(html)) !== null) {
    fontFamily = match[1].trim();
  }

  return {
    family: fontFamily,
    sizes: Array.from(sizes),
  };
}

/**
 * 提取HTML中的图标信息
 */
function extractIcons(html: string): { materialIcons: string[]; other: string[] } {
  const materialIcons = new Set<string>();
  const otherIcons = new Set<string>();

  // 提取Material Icons
  const materialIconRegex = /material-icons(?:-round)?["']?\s*>([^<]+)</g;
  let match;
  while ((match = materialIconRegex.exec(html)) !== null) {
    const iconName = match[1].trim();
    if (iconName) {
      materialIcons.add(iconName);
    }
  }

  // 提取其他图标（如Font Awesome、自定义图标等）
  const otherIconRegex = /<i[^>]*class=["'][^"']*icon[^"']*["'][^>]*>([^<]+)</gi;
  while ((match = otherIconRegex.exec(html)) !== null) {
    const iconName = match[1].trim();
    if (iconName && !iconName.includes('material-icons')) {
      otherIcons.add(iconName);
    }
  }

  return {
    materialIcons: Array.from(materialIcons),
    other: Array.from(otherIcons),
  };
}

/**
 * 提取HTML中的布局信息
 */
function extractLayout(html: string): {
  flex: string[];
  grid: string[];
  spacing: string[];
} {
  const flex = new Set<string>();
  const grid = new Set<string>();
  const spacing = new Set<string>();

  // 提取Flex布局类名
  const flexRegex = /(flex|flex-col|flex-row|flex-wrap|flex-nowrap|items-|justify-|gap-)/g;
  let match;
  while ((match = flexRegex.exec(html)) !== null) {
    flex.add(match[1]);
  }

  // 提取Grid布局类名
  const gridRegex = /(grid|grid-cols-|grid-rows-|col-span-|row-span-)/g;
  while ((match = gridRegex.exec(html)) !== null) {
    grid.add(match[1]);
  }

  // 提取间距类名
  const spacingRegex = /(p-|px-|py-|pt-|pb-|pl-|pr-|m-|mx-|my-|mt-|mb-|ml-|mr-|gap-|space-)[\w-]*/g;
  while ((match = spacingRegex.exec(html)) !== null) {
    spacing.add(match[0]);
  }

  return {
    flex: Array.from(flex),
    grid: Array.from(grid),
    spacing: Array.from(spacing),
  };
}

/**
 * 提取自定义CSS类
 */
function extractCustomClasses(html: string): string[] {
  const customClasses = new Set<string>();

  // 提取style标签中的CSS类定义
  const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  let match;
  while ((match = styleRegex.exec(html)) !== null) {
    const cssContent = match[1];
    // 提取类选择器
    const classRegex = /\.([a-zA-Z][\w-]*)\s*\{/g;
    let classMatch;
    while ((classMatch = classRegex.exec(cssContent)) !== null) {
      customClasses.add(classMatch[1]);
    }
  }

  return Array.from(customClasses);
}

/**
 * 提取自定义样式
 */
function extractCustomStyles(html: string): string[] {
  const styles: string[] = [];

  // 提取style标签内容
  const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  let match;
  while ((match = styleRegex.exec(html)) !== null) {
    styles.push(match[1].trim());
  }

  // 提取内联样式（示例）
  const inlineStyleRegex = /style=["']([^"']+)["']/g;
  while ((match = inlineStyleRegex.exec(html)) !== null) {
    styles.push(match[1]);
  }

  return styles;
}

/**
 * 检查是否支持深色模式
 */
function hasDarkMode(html: string): boolean {
  return /dark:/g.test(html) || /dark-mode/gi.test(html);
}

/**
 * 提取详细的布局和样式信息
 */
function extractDetailedLayout(html: string): {
  roundedCorners: string[];
  shadows: string[];
  borders: string[];
  positions: string[];
  sizes: string[];
} {
  const roundedCorners = new Set<string>();
  const shadows = new Set<string>();
  const borders = new Set<string>();
  const positions = new Set<string>();
  const sizes = new Set<string>();

  // 提取圆角类名
  const roundedRegex = /rounded(?:-[\w-]+)?/g;
  let match;
  while ((match = roundedRegex.exec(html)) !== null) {
    roundedCorners.add(match[0]);
  }

  // 提取阴影类名
  const shadowRegex = /shadow(?:-[\w-]+)?/g;
  while ((match = shadowRegex.exec(html)) !== null) {
    shadows.add(match[0]);
  }

  // 提取边框类名
  const borderRegex = /border(?:-[\w-]+)?/g;
  while ((match = borderRegex.exec(html)) !== null) {
    borders.add(match[0]);
  }

  // 提取定位类名
  const positionRegex = /(absolute|relative|fixed|sticky|static)/g;
  while ((match = positionRegex.exec(html)) !== null) {
    positions.add(match[1]);
  }

  // 提取尺寸类名（宽度、高度）
  const sizeRegex = /(w-|h-|min-w-|min-h-|max-w-|max-h-)[\w-]+/g;
  while ((match = sizeRegex.exec(html)) !== null) {
    sizes.add(match[0]);
  }

  return {
    roundedCorners: Array.from(roundedCorners),
    shadows: Array.from(shadows),
    borders: Array.from(borders),
    positions: Array.from(positions),
    sizes: Array.from(sizes),
  };
}

/**
 * 提取HTML的DOM结构树（增强版，移除限制）
 */
function extractDOMStructure(html: string): string {
  // 移除script和style标签
  const cleaned = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                     .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  
  const structure: string[] = [];
  let depth = 0;
  const maxDepth = 10; // 增加到10层，支持深层嵌套
  
  // 提取主要结构
  const tagRegex = /<(div|section|main|article|header|footer|nav|aside|button|a|span|p|h[1-6]|ul|li|ol|input|select|option)[^>]*(?:class=["']([^"']+)["'])?[^>]*>/gi;
  let match;
  let elementCount = 0;
  const maxElements = 200; // 增加到200个元素，确保提取完整结构
  
  while ((match = tagRegex.exec(cleaned)) !== null && elementCount < maxElements) {
    const tag = match[1];
    const className = match[2] || '';
    const indent = '  '.repeat(Math.min(depth, maxDepth));
    
    // 提取关键类名（保留更多类名信息）
    const keyClasses = className.split(' ').filter(cls => 
      cls.includes('bg-') || 
      cls.includes('text-') || 
      cls.includes('flex') || 
      cls.includes('grid') ||
      cls.includes('rounded') ||
      cls.includes('p-') ||
      cls.includes('m-') ||
      cls.includes('card') ||
      cls.includes('item') ||
      cls.includes('list') ||
      cls.includes('button') ||
      cls.includes('tab')
    ).slice(0, 5).join(' '); // 增加到5个类名
    
    structure.push(`${indent}<${tag}${keyClasses ? ` class="${keyClasses}"` : ''}>`);
    elementCount++;
    
    // 检查是否是自闭合标签
    if (!match[0].endsWith('/>') && !['img', 'input', 'br', 'hr', 'meta', 'link'].includes(tag)) {
      depth++;
    }
    
    // 检查闭合标签，减少深度
    const closingTagRegex = new RegExp(`</${tag}>`, 'gi');
    const nextMatch = cleaned.substring(match.index + match[0].length);
    if (closingTagRegex.test(nextMatch)) {
      // 找到闭合标签后，深度会自然减少
    }
  }

  return structure.join('\n'); // 移除数量限制，返回所有提取的结构
}

/**
 * 提取HTML中的所有可见文字内容
 * 这是确保AI使用正确文字的关键函数
 */
function extractAllTextContent(html: string): {
  buttons: string[];
  labels: string[];
  menuItems: string[];
  cardTitles: string[];
  cardContent: string[];
  allText: string;
} {
  // 移除script和style标签
  const cleaned = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                     .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  
  const buttons: string[] = [];
  const labels: string[] = [];
  const menuItems: string[] = [];
  const cardTitles: string[] = [];
  const cardContent: string[] = [];
  
  // 1. 提取按钮文字
  const buttonRegex = /<button[^>]*>([\s\S]*?)<\/button>/gi;
  let match;
  while ((match = buttonRegex.exec(cleaned)) !== null) {
    const text = match[1].replace(/<[^>]+>/g, '').trim();
    if (text && !buttons.includes(text)) {
      buttons.push(text);
    }
  }
  
  // 2. 提取链接文字（可能是按钮样式）
  const linkRegex = /<a[^>]*class=["'][^"']*button[^"']*["'][^>]*>([\s\S]*?)<\/a>/gi;
  while ((match = linkRegex.exec(cleaned)) !== null) {
    const text = match[1].replace(/<[^>]+>/g, '').trim();
    if (text && !buttons.includes(text)) {
      buttons.push(text);
    }
  }
  
  // 3. 提取标签文字（筛选标签、状态标签等）
  // 查找包含 "tag"、"label"、"badge"、"chip" 等关键词的元素
  const labelRegex = /<(span|div|button)[^>]*(?:class=["'][^"']*(?:tag|label|badge|chip|filter)[^"']*["'])[^>]*>([\s\S]*?)<\/(?:span|div|button)>/gi;
  while ((match = labelRegex.exec(cleaned)) !== null) {
    const text = match[2].replace(/<[^>]+>/g, '').trim();
    if (text && text.length < 50 && !labels.includes(text)) { // 限制长度，避免提取到整个卡片内容
      labels.push(text);
    }
  }
  
  // 4. 提取菜单项文字（select option、下拉菜单项等）
  const optionRegex = /<option[^>]*>([\s\S]*?)<\/option>/gi;
  while ((match = optionRegex.exec(cleaned)) !== null) {
    const text = match[1].replace(/<[^>]+>/g, '').trim();
    if (text && !menuItems.includes(text)) {
      menuItems.push(text);
    }
  }
  
  // 4.5. 提取输入框 placeholder 文字
  const placeholderRegex = /placeholder=["']([^"']+)["']/gi;
  while ((match = placeholderRegex.exec(cleaned)) !== null) {
    const text = match[1].trim();
    if (text && !menuItems.includes(text)) {
      menuItems.push(text); // placeholder 也作为菜单项处理
    }
  }
  
  // 4.6. 提取标题文字（h1-h6）
  const headingRegex = /<(h[1-6])[^>]*>([\s\S]*?)<\/h[1-6]>/gi;
  while ((match = headingRegex.exec(cleaned)) !== null) {
    const text = match[2].replace(/<[^>]+>/g, '').trim();
    if (text && text.length < 200 && !cardTitles.includes(text)) {
      cardTitles.push(text); // 标题也作为卡片标题处理
    }
  }
  
  // 5. 提取卡片内容（识别重复的卡片结构）
  // 查找包含 "card"、"item"、"task" 等关键词的容器
  const cardRegex = /<(div|section|article)[^>]*(?:class=["'][^"']*(?:card|item|task|todo|list-item)[^"']*["'])[^>]*>([\s\S]{0,500}?)<\/(?:div|section|article)>/gi;
  while ((match = cardRegex.exec(cleaned)) !== null) {
    const cardHtml = match[2];
    // 提取卡片内的所有文字
    const cardText = cardHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (cardText && cardText.length > 10 && cardText.length < 500) {
      cardContent.push(cardText);
    }
    
    // 尝试提取卡片标题（通常是第一个 h1-h6 或加粗文字）
    const titleMatch = cardHtml.match(/<(h[1-6]|p|span|div)[^>]*>([\s\S]{0,100}?)<\/(?:h[1-6]|p|span|div)>/i);
    if (titleMatch && titleMatch[2]) {
      const title = titleMatch[2].replace(/<[^>]+>/g, '').trim();
      if (title && title.length < 100 && !cardTitles.includes(title)) {
        cardTitles.push(title);
      }
    }
  }
  
  // 6. 提取所有可见文字（用于AI理解完整上下文）
  // 移除所有HTML标签，保留文字内容
  const allText = cleaned
    .replace(/<[^>]+>/g, ' ') // 移除所有HTML标签
    .replace(/&nbsp;/g, ' ') // 替换 &nbsp;
    .replace(/&amp;/g, '&') // 替换 &amp;
    .replace(/&lt;/g, '<') // 替换 &lt;
    .replace(/&gt;/g, '>') // 替换 &gt;
    .replace(/&quot;/g, '"') // 替换 &quot;
    .replace(/&#39;/g, "'") // 替换 &#39;
    .replace(/\s+/g, ' ') // 合并多个空格
    .trim()
    .substring(0, 10000); // 限制长度，避免过长
  
  return {
    buttons: buttons.filter(Boolean),
    labels: labels.filter(Boolean),
    menuItems: menuItems.filter(Boolean),
    cardTitles: cardTitles.filter(Boolean),
    cardContent: cardContent.filter(Boolean),
    allText: allText,
  };
}

/**
 * 生成HTML结构摘要
 */
function generateStructureSummary(html: string): string {
  // 提取主要容器和元素
  const mainContainers: string[] = [];
  const mainElements: string[] = [];

  // 提取主要容器（div, section, main, article等）
  const containerRegex = /<(div|section|main|article|header|footer|nav|aside)[^>]*class=["']([^"']+)["']/gi;
  let match;
  while ((match = containerRegex.exec(html)) !== null && mainContainers.length < 10) {
    mainContainers.push(`${match[1]} (${match[2]})`);
  }

  // 提取主要元素（button, input, card等）
  const elementRegex = /<(button|input|a|img|svg)[^>]*/gi;
  while ((match = elementRegex.exec(html)) !== null && mainElements.length < 20) {
    mainElements.push(match[1]);
  }

  return `主要容器: ${mainContainers.slice(0, 5).join(', ')}\n主要元素: ${mainElements.slice(0, 10).join(', ')}`;
}

/**
 * 解析HTML文件，提取关键信息
 */
export function parseHTML(html: string): HTMLParsedInfo {
  // 确保所有字段都有默认值，避免 undefined
  const backgroundColors = extractBackgroundColors(html);
  const textColors = extractTextColors(html);
  const fonts = extractFonts(html);
  const icons = extractIcons(html);
  const layout = extractLayout(html);
  const styles = extractDetailedLayout(html);
  const customClasses = extractCustomClasses(html);
  const customStyles = extractCustomStyles(html);
  const textContent = extractAllTextContent(html); // 提取所有文字内容
  
  return {
    backgroundColors: {
      primary: backgroundColors?.primary,
      all: backgroundColors?.all || [],
    },
    textColors: {
      all: textColors?.all || [],
      primary: textColors?.primary,
      secondary: textColors?.secondary,
    },
    fonts: {
      family: fonts?.family,
      sizes: fonts?.sizes || [],
    },
    icons: {
      materialIcons: icons?.materialIcons || [],
      other: icons?.other || [],
    },
    layout: {
      flex: layout?.flex || [],
      grid: layout?.grid || [],
      spacing: layout?.spacing || [],
    },
    styles: {
      roundedCorners: styles?.roundedCorners || [],
      shadows: styles?.shadows || [],
      borders: styles?.borders || [],
      positions: styles?.positions || [],
      sizes: styles?.sizes || [],
    },
    customClasses: customClasses || [],
    customStyles: customStyles || [],
    hasDarkMode: hasDarkMode(html),
    structureSummary: generateStructureSummary(html),
    domStructure: extractDOMStructure(html),
    textContent: {
      buttons: textContent?.buttons || [],
      labels: textContent?.labels || [],
      menuItems: textContent?.menuItems || [],
      cardTitles: textContent?.cardTitles || [],
      cardContent: textContent?.cardContent || [],
      allText: textContent?.allText || '',
    },
  };
}

/**
 * 将Material Icons名称映射到Lucide React图标名称
 */
export function mapMaterialIconToLucide(materialIconName: string): string {
  // 移除可能的空格和下划线变体
  const normalized = materialIconName.trim().toLowerCase();
  
  // 直接映射
  if (MATERIAL_TO_LUCIDE_MAP[normalized]) {
    return MATERIAL_TO_LUCIDE_MAP[normalized];
  }

  // 尝试部分匹配
  for (const [material, lucide] of Object.entries(MATERIAL_TO_LUCIDE_MAP)) {
    if (normalized.includes(material) || material.includes(normalized)) {
      return lucide;
    }
  }

  // 默认返回一个通用图标
  return 'FileText';
}

/**
 * 生成图标映射说明文本（用于AI提示词）
 */
export function generateIconMappingInstructions(parsedInfo: HTMLParsedInfo): string {
  const icons = parsedInfo.icons || { materialIcons: [], other: [] };
  const materialIcons = icons.materialIcons || [];
  
  if (materialIcons.length === 0) {
    return '';
  }

  const mappings = (Array.isArray(materialIcons) ? materialIcons : []).map(icon => {
    const lucideIcon = mapMaterialIconToLucide(icon);
    return `- Material Icons "${icon}" → Lucide React "${lucideIcon}"`;
  });

  return `**图标映射要求（必须严格遵守）：**
${mappings.join('\n')}

**重要**：
- 必须使用上述映射关系，不能自行选择其他图标
- 如果某个Material Icon没有映射，使用最接近的Lucide图标
- 确保图标的视觉样式（大小、颜色、位置）与HTML完全一致`;
}

/**
 * 生成结构化信息文本（用于AI提示词）
 */
export function generateStructuredInfoText(parsedInfo: HTMLParsedInfo): string {
  const sections: string[] = [];

  // 确保所有字段都有默认值
  const backgroundColors = parsedInfo.backgroundColors || { all: [] };
  const textColors = parsedInfo.textColors || { all: [] };
  const fonts = parsedInfo.fonts || { sizes: [] };
  const icons = parsedInfo.icons || { materialIcons: [], other: [] };
  const layout = parsedInfo.layout || { flex: [], grid: [], spacing: [] };
  const styles = parsedInfo.styles || { roundedCorners: [], shadows: [], borders: [], positions: [], sizes: [] };
  const customClasses = parsedInfo.customClasses || [];

  // DOM结构树（最重要，放在最前面）
  if (parsedInfo.domStructure) {
    sections.push(`**HTML DOM结构（必须严格按照此结构还原）：**
\`\`\`
${parsedInfo.domStructure}
\`\`\`
- **重要**：必须严格按照上述DOM结构生成React组件，不能改变容器层次和嵌套关系`);
  }

  // 文字内容（关键，确保AI使用正确的文字）
  const textContent = parsedInfo.textContent || {
    buttons: [],
    labels: [],
    menuItems: [],
    cardTitles: [],
    cardContent: [],
    allText: '',
  };

  if (textContent.buttons.length > 0 || 
      textContent.labels.length > 0 || 
      textContent.menuItems.length > 0 ||
      textContent.cardTitles.length > 0 ||
      textContent.cardContent.length > 0) {
    const textSections: string[] = [];
    
    if (Array.isArray(textContent.buttons) && textContent.buttons.length > 0) {
      textSections.push(`**按钮文字（必须使用，不能推测或替换）：**
${textContent.buttons.map(btn => `- "${btn}"`).join('\n')}`);
    }
    
    if (Array.isArray(textContent.labels) && textContent.labels.length > 0) {
      textSections.push(`**标签文字（必须使用，不能推测或替换）：**
${textContent.labels.map(label => `- "${label}"`).join('\n')}`);
    }
    
    if (Array.isArray(textContent.menuItems) && textContent.menuItems.length > 0) {
      textSections.push(`**菜单项文字（必须使用，不能推测或替换）：**
${textContent.menuItems.map(item => `- "${item}"`).join('\n')}`);
    }
    
    if (Array.isArray(textContent.cardTitles) && textContent.cardTitles.length > 0) {
      textSections.push(`**卡片标题（必须使用，不能推测或替换）：**
${textContent.cardTitles.map(title => `- "${title}"`).join('\n')}`);
    }
    
    if (Array.isArray(textContent.cardContent) && textContent.cardContent.length > 0) {
      textSections.push(`**卡片内容示例（参考这些文字内容，确保使用相同的文字）：**
${textContent.cardContent.slice(0, 5).map((content, idx) => `- 卡片${idx + 1}: "${content.substring(0, 200)}${content.length > 200 ? '...' : ''}"`).join('\n')}`);
    }
    
    if (textSections.length > 0) {
      sections.push(`**=== HTML文字内容（必须严格遵守） ===**

${textSections.join('\n\n')}

**文字使用要求（强制）：**
- **所有按钮文字**：必须使用HTML中的实际文字，不能推测或替换
- **所有标签文字**：必须使用HTML中的实际文字，不能推测或替换
- **所有菜单项文字**：必须使用HTML中的实际文字，不能推测或替换
- **所有卡片标题和内容**：必须使用HTML中的实际文字，不能推测或替换
- **禁止推测**：如果HTML中没有某个文字，不能自行添加
- **禁止替换**：不能使用同义词或相似词替换原文字
- **禁止简化**：不能简化或省略文字内容`);
    }
  }

  // 背景色信息
  if (backgroundColors.all && backgroundColors.all.length > 0) {
    sections.push(`**背景色（必须使用）：**
- 主背景色：${backgroundColors.primary || '未识别'}
- 所有背景色：${backgroundColors.all.slice(0, 20).join(', ')}
- **重要**：必须使用HTML中定义的颜色值，不能改变或替换`);
  }

  // 文本颜色信息
  if (textColors.all && textColors.all.length > 0) {
    sections.push(`**文本颜色（必须使用）：**
- 主要文本颜色：${textColors.primary || '未识别'}
- 次要文本颜色：${textColors.secondary || '未识别'}
- 所有文本颜色：${textColors.all.slice(0, 20).join(', ')}
- **重要**：必须使用HTML中定义的颜色值，确保文本在背景上清晰可见`);
  }

  // 字体信息
  if ((fonts.sizes && fonts.sizes.length > 0) || fonts.family) {
    sections.push(`**字体（必须使用）：**
${fonts.family ? `- 字体族：${fonts.family}` : ''}
${fonts.sizes && fonts.sizes.length > 0 ? `- 字体大小：${fonts.sizes.join(', ')}` : ''}`);
  }

  // 布局信息
  if ((layout.flex && layout.flex.length > 0) || (layout.grid && layout.grid.length > 0)) {
    sections.push(`**布局（必须使用）：**
${layout.flex && layout.flex.length > 0 ? `- Flex布局：${layout.flex.slice(0, 15).join(', ')}` : ''}
${layout.grid && layout.grid.length > 0 ? `- Grid布局：${layout.grid.slice(0, 15).join(', ')}` : ''}
${layout.spacing && layout.spacing.length > 0 ? `- 间距：${layout.spacing.slice(0, 15).join(', ')}` : ''}`);
  }

  // 详细样式信息
  if ((styles.roundedCorners && styles.roundedCorners.length > 0) || 
      (styles.shadows && styles.shadows.length > 0) || 
      (styles.borders && styles.borders.length > 0)) {
    sections.push(`**样式细节（必须使用）：**
${styles.roundedCorners && styles.roundedCorners.length > 0 ? `- 圆角：${styles.roundedCorners.slice(0, 10).join(', ')}` : ''}
${styles.shadows && styles.shadows.length > 0 ? `- 阴影：${styles.shadows.slice(0, 10).join(', ')}` : ''}
${styles.borders && styles.borders.length > 0 ? `- 边框：${styles.borders.slice(0, 10).join(', ')}` : ''}
${styles.positions && styles.positions.length > 0 ? `- 定位：${styles.positions.join(', ')}` : ''}
${styles.sizes && styles.sizes.length > 0 ? `- 尺寸：${styles.sizes.slice(0, 15).join(', ')}` : ''}`);
  }

  // 自定义CSS类
  if (Array.isArray(customClasses) && customClasses.length > 0) {
    sections.push(`**自定义CSS类（必须在代码中实现）：**
${customClasses.slice(0, 20).map(cls => `- .${cls}`).join('\n')}`);
  }

  // 深色模式
  if (parsedInfo.hasDarkMode) {
    sections.push(`**深色模式支持：**
- HTML支持深色模式，生成的代码也必须支持深色模式
- 使用 \`dark:\` 前缀实现深色模式样式`);
  }

  return sections.join('\n\n');
}

