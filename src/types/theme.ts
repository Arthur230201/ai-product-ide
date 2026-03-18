/**
 * UI Design Tokens - The DNA of UI Style
 * 定义UI风格的数据结构
 */

export interface UIThemeConfig {
  colors: {
    primary: string;
    secondary: string;
    background: {
      light: string;
      dark: string;
    };
    surface: string;
    text: {
      primary: string;
      secondary: string;
    };
    border: string;
  };
  shape: {
    borderRadius: {
      sm: string;
      md: string;
      lg: string;
      full: string;
    };
    borderWidth: string;
  };
  typography: {
    fontFamily: string;
    baseSize: string;
    density: 'compact' | 'normal' | 'spacious';
  };
  shadows: {
    cardShadow: string;
    buttonShadow: string;
  };
  vibe: string; // 风格描述，如 "Professional Logistics", "Cyberpunk"
}

/**
 * 默认主题配置 - 使用标准 Tailwind 值
 */
export const defaultTheme: UIThemeConfig = {
  colors: {
    primary: 'blue-500',
    secondary: 'purple-500',
    background: {
      light: 'white',
      dark: 'slate-900',
    },
    surface: 'slate-800',
    text: {
      primary: 'slate-50',
      secondary: 'slate-400',
    },
    border: 'slate-700',
  },
  shape: {
    borderRadius: {
      sm: 'rounded-sm',
      md: 'rounded-md',
      lg: 'rounded-lg',
      full: 'rounded-full',
    },
    borderWidth: 'border',
  },
  typography: {
    fontFamily: 'sans-serif',
    baseSize: 'text-base',
    density: 'normal',
  },
  shadows: {
    cardShadow: 'shadow-lg',
    buttonShadow: 'shadow-md',
  },
  vibe: 'Modern Professional',
};

/** 内置风格 ID：按视觉/气质分类，参考 UIUXProMax 等设计系统 */
export const STYLE_PRESET_IDS = [
  'auto',
  'neutral', 'glass', 'flat', 'corporate', 'neo', 'cyberpunk', 'warm', 'brutal',
  'bento', 'aurora', 'dark', 'accessible', 'clay', 'liquid', 'soft', 'retro', 'y2k',
  'custom',
] as const;
export type StylePresetId = (typeof STYLE_PRESET_IDS)[number];

/** 风格示例与适用场景（用于选择器展示） */
export interface StyleExample {
  /** 一句话示例描述，如「网格卡片、信息块分区」 */
  example?: string;
  /** 适用场景标签，如 ["企业后台", "数据大屏"] */
  bestFor?: string[];
}

/** 各风格用于展示的预览配置（区分度强、预览内容多） */
export interface StylePreviewConfig {
  primary: string;
  secondary?: string;
  bg: string;
  cardBg: string;
  text: string;
  textSecondary: string;
  radius: string;
  cardRadius: string;
  shadow?: string;
  isDark?: boolean;
}
export const STYLE_PREVIEW: Record<StylePresetId, StylePreviewConfig> = {
  auto: {
    primary: '#8b5cf6',
    secondary: '#06b6d4',
    bg: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 50%, #134e4a 100%)',
    cardBg: 'rgba(255,255,255,0.08)',
    text: '#f5f3ff',
    textSecondary: '#a5b4fc',
    radius: '12px',
    cardRadius: '16px',
    shadow: '0 0 24px rgba(139,92,246,0.2)',
    isDark: true,
  },
  neutral: {
    primary: '#374151',
    secondary: '#6b7280',
    bg: '#f9fafb',
    cardBg: '#ffffff',
    text: '#111827',
    textSecondary: '#6b7280',
    radius: '6px',
    cardRadius: '8px',
    shadow: '0 1px 2px rgba(0,0,0,0.05)',
  },
  glass: {
    primary: '#6366f1',
    secondary: '#a78bfa',
    bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    cardBg: 'rgba(255,255,255,0.2)',
    text: '#ffffff',
    textSecondary: 'rgba(255,255,255,0.85)',
    radius: '12px',
    cardRadius: '16px',
    shadow: '0 8px 32px rgba(0,0,0,0.1)',
  },
  flat: {
    primary: '#e11d48',
    secondary: '#f97316',
    bg: '#fef2f2',
    cardBg: '#ffffff',
    text: '#1f2937',
    textSecondary: '#6b7280',
    radius: '8px',
    cardRadius: '12px',
    shadow: 'none',
  },
  corporate: {
    primary: '#1e40af',
    secondary: '#64748b',
    bg: '#f1f5f9',
    cardBg: '#ffffff',
    text: '#0f172a',
    textSecondary: '#475569',
    radius: '4px',
    cardRadius: '6px',
    shadow: '0 1px 3px rgba(0,0,0,0.08)',
  },
  neo: {
    primary: '#8b5cf6',
    secondary: '#a78bfa',
    bg: '#e0e7ff',
    cardBg: '#e0e7ff',
    text: '#3730a3',
    textSecondary: '#6366f1',
    radius: '12px',
    cardRadius: '16px',
    shadow: '6px 6px 12px #c4b8e0, -6px -6px 12px #fcf8ff',
  },
  cyberpunk: {
    primary: '#ec4899',
    secondary: '#22d3ee',
    bg: '#0a0a0f',
    cardBg: '#14141f',
    text: '#f0e6ff',
    textSecondary: '#a78bfa',
    radius: '0',
    cardRadius: '4px',
    shadow: '0 0 20px rgba(236,72,153,0.3), 0 0 40px rgba(34,211,238,0.1)',
    isDark: true,
  },
  warm: {
    primary: '#b45309',
    secondary: '#78716c',
    bg: '#faf8f5',
    cardBg: '#fffefb',
    text: '#292524',
    textSecondary: '#78716c',
    radius: '12px',
    cardRadius: '16px',
    shadow: '0 1px 3px rgba(0,0,0,0.06)',
  },
  brutal: {
    primary: '#dc2626',
    secondary: '#2563eb',
    bg: '#fefce8',
    cardBg: '#ffffff',
    text: '#1c1917',
    textSecondary: '#57534e',
    radius: '0',
    cardRadius: '0',
    shadow: '4px 4px 0 0 #1c1917',
  },
  custom: {
    primary: '#6366f1',
    bg: '#1f2937',
    cardBg: '#374151',
    text: '#f3f4f6',
    textSecondary: '#9ca3af',
    radius: '8px',
    cardRadius: '8px',
    isDark: true,
  },
  // UIUXProMax 扩展风格
  bento: {
    primary: '#4f46e5',
    secondary: '#818cf8',
    bg: '#f8fafc',
    cardBg: '#ffffff',
    text: '#0f172a',
    textSecondary: '#64748b',
    radius: '12px',
    cardRadius: '16px',
    shadow: '0 1px 3px rgba(0,0,0,0.08)',
  },
  aurora: {
    primary: '#06b6d4',
    secondary: '#8b5cf6',
    bg: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0c4a6e 100%)',
    cardBg: 'rgba(255,255,255,0.08)',
    text: '#f0fdfa',
    textSecondary: '#a5f3fc',
    radius: '16px',
    cardRadius: '20px',
    shadow: '0 0 40px rgba(6,182,212,0.15)',
    isDark: true,
  },
  dark: {
    primary: '#38bdf8',
    secondary: '#a78bfa',
    bg: '#0a0a0a',
    cardBg: '#171717',
    text: '#fafafa',
    textSecondary: '#a3a3a3',
    radius: '8px',
    cardRadius: '12px',
    shadow: '0 4px 12px rgba(0,0,0,0.4)',
    isDark: true,
  },
  accessible: {
    primary: '#2563eb',
    secondary: '#059669',
    bg: '#ffffff',
    cardBg: '#f8fafc',
    text: '#0f172a',
    textSecondary: '#475569',
    radius: '8px',
    cardRadius: '8px',
    shadow: '0 1px 2px rgba(0,0,0,0.06)',
  },
  clay: {
    primary: '#ea580c',
    secondary: '#ca8a04',
    bg: '#fef3c7',
    cardBg: '#fffbeb',
    text: '#78350f',
    textSecondary: '#a16207',
    radius: '24px',
    cardRadius: '28px',
    shadow: '0 4px 14px rgba(234,88,12,0.12)',
  },
  liquid: {
    primary: '#0ea5e9',
    secondary: '#6366f1',
    bg: 'linear-gradient(160deg, #0c4a6e 0%, #1e3a5f 100%)',
    cardBg: 'rgba(255,255,255,0.12)',
    text: '#ffffff',
    textSecondary: '#bae6fd',
    radius: '20px',
    cardRadius: '24px',
    shadow: '0 8px 32px rgba(0,0,0,0.2)',
    isDark: true,
  },
  soft: {
    primary: '#7c3aed',
    secondary: '#06b6d4',
    bg: '#f5f3ff',
    cardBg: '#ffffff',
    text: '#1e1b4b',
    textSecondary: '#6d28d9',
    radius: '12px',
    cardRadius: '14px',
    shadow: '0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.05)',
  },
  retro: {
    primary: '#f59e0b',
    secondary: '#ef4444',
    bg: '#1c1917',
    cardBg: '#292524',
    text: '#fef3c7',
    textSecondary: '#fcd34d',
    radius: '4px',
    cardRadius: '6px',
    shadow: '0 0 0 2px #f59e0b',
    isDark: true,
  },
  y2k: {
    primary: '#ec4899',
    secondary: '#14b8a6',
    bg: '#fdf2f8',
    cardBg: '#ffffff',
    text: '#831843',
    textSecondary: '#9d174d',
    radius: '0',
    cardRadius: '0',
    shadow: 'none',
  },
};

/** 对用户展示的命名风格（按视觉气质分类，含示例与适用场景） */
export const NAMED_STYLES: ({ id: StylePresetId; label: string; theme: UIThemeConfig } & StyleExample)[] = [
  {
    id: 'auto',
    label: '智能推荐',
    example: '按项目与页面描述推荐版式与色板，不锁定单一预设',
    bestFor: ['新功能探索', '行业差异化', '多风格尝试'],
    theme: {
      ...defaultTheme,
      colors: {
        primary: 'violet-600',
        secondary: 'cyan-600',
        background: { light: 'slate-50', dark: 'slate-950' },
        surface: 'white',
        text: { primary: 'slate-900', secondary: 'slate-600' },
        border: 'slate-200',
      },
      vibe: 'Context-driven（智能推荐：生成时由系统推荐设计系统，不锁单一预设）',
    },
  },
  {
    id: 'neutral',
    label: '极简中性',
    example: '留白与排版优先、灰阶主色',
    bestFor: ['企业后台', '文档与内容', '通用产品'],
    theme: {
      ...defaultTheme,
      colors: {
        primary: 'gray-700',
        secondary: 'gray-500',
        background: { light: 'white', dark: 'gray-900' },
        surface: 'gray-50',
        text: { primary: 'gray-900', secondary: 'gray-500' },
        border: 'gray-200',
      },
      shape: {
        ...defaultTheme.shape,
        borderRadius: { sm: 'rounded-sm', md: 'rounded-md', lg: 'rounded-lg', full: 'rounded-full' },
      },
      typography: { fontFamily: 'sans-serif', baseSize: 'text-base', density: 'normal' },
      shadows: { cardShadow: 'shadow-sm', buttonShadow: 'shadow-sm' },
      vibe: '极简中性：黑白灰为主、留白与排版优先、无强烈色彩、适合通用与内容型产品',
    },
  },
  {
    id: 'glass',
    label: '玻璃拟态',
    example: '半透明毛玻璃、渐变底、大圆角',
    bestFor: ['现代 SaaS', '运营活动', 'C 端产品'],
    theme: {
      ...defaultTheme,
      colors: {
        primary: 'violet-500',
        secondary: 'purple-400',
        background: { light: 'slate-100', dark: 'slate-800' },
        surface: 'white/10',
        text: { primary: 'gray-900', secondary: 'gray-600' },
        border: 'white/20',
      },
      shape: {
        ...defaultTheme.shape,
        borderRadius: { sm: 'rounded-lg', md: 'rounded-xl', lg: 'rounded-2xl', full: 'rounded-full' },
      },
      typography: { fontFamily: 'system-ui, sans-serif', baseSize: 'text-base', density: 'normal' },
      shadows: { cardShadow: 'shadow-xl', buttonShadow: 'shadow-lg' },
      vibe: '玻璃拟态：半透明毛玻璃、大圆角、轻边框、背景模糊，适合现代运营与 C 端',
    },
  },
  {
    id: 'flat',
    label: '扁平鲜明',
    example: '高饱和色块、少阴影、清晰边界',
    bestFor: ['活动页', '年轻向产品', '营销落地页'],
    theme: {
      ...defaultTheme,
      colors: {
        primary: 'rose-600',
        secondary: 'orange-500',
        background: { light: 'rose-50', dark: 'gray-900' },
        surface: 'white',
        text: { primary: 'gray-900', secondary: 'gray-600' },
        border: 'gray-200',
      },
      shape: {
        ...defaultTheme.shape,
        borderRadius: { sm: 'rounded-md', md: 'rounded-lg', lg: 'rounded-xl', full: 'rounded-full' },
      },
      typography: { fontFamily: 'system-ui, sans-serif', baseSize: 'text-base', density: 'normal' },
      shadows: { cardShadow: 'shadow-sm', buttonShadow: 'shadow' },
      vibe: '扁平鲜明：高饱和色块、无渐变少阴影、清晰边界、适合活动页与年轻向产品',
    },
  },
  {
    id: 'corporate',
    label: '企业稳重',
    example: '深蓝灰主色、小圆角、适度阴影',
    bestFor: ['B 端后台', '企业服务', '专业可信'],
    theme: {
      ...defaultTheme,
      colors: {
        primary: 'blue-800',
        secondary: 'slate-500',
        background: { light: 'slate-50', dark: 'slate-900' },
        surface: 'white',
        text: { primary: 'slate-900', secondary: 'slate-600' },
        border: 'slate-200',
      },
      shape: {
        ...defaultTheme.shape,
        borderRadius: { sm: 'rounded', md: 'rounded-md', lg: 'rounded-lg', full: 'rounded-full' },
      },
      typography: { fontFamily: 'system-ui, sans-serif', baseSize: 'text-base', density: 'normal' },
      shadows: { cardShadow: 'shadow', buttonShadow: 'shadow-sm' },
      vibe: '企业稳重：深蓝/灰主色、小圆角、适度阴影、偏 B 端与后台、专业可信',
    },
  },
  {
    id: 'neo',
    label: '柔和拟态',
    example: '同色系双阴影浮雕、大圆角',
    bestFor: ['健康/冥想', '教育应用', '柔和品牌'],
    theme: {
      ...defaultTheme,
      colors: {
        primary: 'violet-600',
        secondary: 'violet-400',
        background: { light: 'indigo-100', dark: 'indigo-900' },
        surface: 'indigo-100',
        text: { primary: 'indigo-900', secondary: 'indigo-700' },
        border: 'indigo-200',
      },
      shape: {
        ...defaultTheme.shape,
        borderRadius: { sm: 'rounded-xl', md: 'rounded-2xl', lg: 'rounded-3xl', full: 'rounded-full' },
      },
      typography: { fontFamily: 'system-ui, sans-serif', baseSize: 'text-base', density: 'normal' },
      shadows: { cardShadow: 'shadow-lg', buttonShadow: 'shadow-md' },
      vibe: '柔和拟态：同色系深浅、内外双阴影浮雕感、大圆角、柔和舒适',
    },
  },
  {
    id: 'cyberpunk',
    label: '赛博朋克',
    example: '深黑底、霓虹粉/青发光、等宽字体',
    bestFor: ['游戏', '科技/加密', '科幻感产品'],
    theme: {
      ...defaultTheme,
      colors: {
        primary: 'pink-500',
        secondary: 'cyan-400',
        background: { light: 'black', dark: 'gray-950' },
        surface: 'gray-900',
        text: { primary: 'gray-100', secondary: 'purple-300' },
        border: 'pink-500/30',
      },
      shape: {
        ...defaultTheme.shape,
        borderRadius: { sm: 'rounded-none', md: 'rounded-sm', lg: 'rounded', full: 'rounded-full' },
      },
      typography: { fontFamily: '"JetBrains Mono", monospace', baseSize: 'text-base', density: 'compact' },
      shadows: { cardShadow: 'shadow-lg', buttonShadow: 'shadow' },
      vibe: '赛博朋克：深黑底、霓虹粉/青发光、锐利边角、等宽字体、科幻感强',
    },
  },
  {
    id: 'warm',
    label: '温暖极简',
    example: '奶油/米色底、单一暖色点缀',
    bestFor: ['生活服务', '美业/疗愈', '2025 流行'],
    theme: {
      ...defaultTheme,
      colors: {
        primary: 'amber-700',
        secondary: 'stone-500',
        background: { light: 'amber-50', dark: 'stone-900' },
        surface: 'white',
        text: { primary: 'stone-800', secondary: 'stone-600' },
        border: 'stone-200',
      },
      shape: {
        ...defaultTheme.shape,
        borderRadius: { sm: 'rounded-lg', md: 'rounded-xl', lg: 'rounded-2xl', full: 'rounded-full' },
      },
      typography: { fontFamily: 'system-ui, sans-serif', baseSize: 'text-base', density: 'normal' },
      shadows: { cardShadow: 'shadow-sm', buttonShadow: 'shadow-sm' },
      vibe: '温暖极简：奶油/米色底、单一暖色点缀、大圆角、克制留白，2025 流行',
    },
  },
  {
    id: 'brutal',
    label: '新粗野主义',
    example: '粗黑描边、厚实阴影、直角',
    bestFor: ['设计作品集', '创意品牌', '反精致'],
    theme: {
      ...defaultTheme,
      colors: {
        primary: 'red-600',
        secondary: 'blue-600',
        background: { light: 'yellow-50', dark: 'gray-900' },
        surface: 'white',
        text: { primary: 'stone-900', secondary: 'stone-600' },
        border: 'stone-900',
      },
      shape: {
        ...defaultTheme.shape,
        borderRadius: { sm: 'rounded-none', md: 'rounded-none', lg: 'rounded-none', full: 'rounded-full' },
      },
      typography: { fontFamily: 'system-ui, sans-serif', baseSize: 'text-base', density: 'normal' },
      shadows: { cardShadow: 'shadow-[4px_4px_0_0_#1c1917]', buttonShadow: 'shadow-[4px_4px_0_0_#1c1917]' },
      vibe: '新粗野主义：粗黑描边、厚实阴影、高对比色块、直角、反精致',
    },
  },
  // ---------- UIUXProMax 扩展风格 ----------
  {
    id: 'bento',
    label: 'Bento 网格',
    example: '网格卡片分区、信息块错落排布',
    bestFor: ['仪表盘', '产品页', '个人主页'],
    theme: {
      ...defaultTheme,
      colors: {
        primary: 'indigo-600',
        secondary: 'violet-500',
        background: { light: 'slate-50', dark: 'slate-900' },
        surface: 'white',
        text: { primary: 'slate-900', secondary: 'slate-600' },
        border: 'slate-200',
      },
      shape: {
        ...defaultTheme.shape,
        borderRadius: { sm: 'rounded-lg', md: 'rounded-xl', lg: 'rounded-2xl', full: 'rounded-full' },
      },
      typography: { fontFamily: 'system-ui, sans-serif', baseSize: 'text-base', density: 'normal' },
      shadows: { cardShadow: 'shadow-sm', buttonShadow: 'shadow' },
      vibe: 'Bento 网格：规则或不规则网格分区、卡片信息块、清晰留白与层级',
    },
  },
  {
    id: 'aurora',
    label: '极光 UI',
    example: '深色渐变底、柔和光晕、现代 SaaS 感',
    bestFor: ['现代 SaaS', '创意机构', '产品官网'],
    theme: {
      ...defaultTheme,
      colors: {
        primary: 'cyan-400',
        secondary: 'violet-400',
        background: { light: 'slate-900', dark: 'slate-950' },
        surface: 'white/10',
        text: { primary: 'slate-50', secondary: 'cyan-100' },
        border: 'cyan-500/20',
      },
      shape: {
        ...defaultTheme.shape,
        borderRadius: { sm: 'rounded-xl', md: 'rounded-2xl', lg: 'rounded-3xl', full: 'rounded-full' },
      },
      typography: { fontFamily: 'system-ui, sans-serif', baseSize: 'text-base', density: 'normal' },
      shadows: { cardShadow: 'shadow-xl', buttonShadow: 'shadow-lg' },
      vibe: '极光 UI：深色渐变背景、半透明卡片、青/紫光晕、现代高端',
    },
  },
  {
    id: 'dark',
    label: '深色模式',
    example: '纯黑/深灰底、高对比、护眼',
    bestFor: ['夜间模式', '代码/开发工具', '阅读类'],
    theme: {
      ...defaultTheme,
      colors: {
        primary: 'sky-400',
        secondary: 'violet-400',
        background: { light: '#0a0a0a', dark: '#0a0a0a' },
        surface: 'neutral-900',
        text: { primary: 'neutral-50', secondary: 'neutral-400' },
        border: 'neutral-700',
      },
      shape: {
        ...defaultTheme.shape,
        borderRadius: { sm: 'rounded', md: 'rounded-lg', lg: 'rounded-xl', full: 'rounded-full' },
      },
      typography: { fontFamily: 'system-ui, sans-serif', baseSize: 'text-base', density: 'normal' },
      shadows: { cardShadow: 'shadow-lg', buttonShadow: 'shadow-md' },
      vibe: '深色模式：OLED 友好深黑、高对比文字、护眼适合长时间使用',
    },
  },
  {
    id: 'accessible',
    label: '可访问优先',
    example: '高对比、焦点可见、语义化结构',
    bestFor: ['政府/公共', '医疗/教育', '无障碍产品'],
    theme: {
      ...defaultTheme,
      colors: {
        primary: 'blue-600',
        secondary: 'emerald-600',
        background: { light: 'white', dark: 'slate-900' },
        surface: 'slate-50',
        text: { primary: 'slate-900', secondary: 'slate-600' },
        border: 'slate-300',
      },
      shape: {
        ...defaultTheme.shape,
        borderRadius: { sm: 'rounded-md', md: 'rounded-md', lg: 'rounded-lg', full: 'rounded-full' },
      },
      typography: { fontFamily: 'system-ui, sans-serif', baseSize: 'text-base', density: 'normal' },
      shadows: { cardShadow: 'shadow', buttonShadow: 'shadow-md' },
      vibe: '可访问优先：WCAG 对比度、焦点环可见、语义化、政府/医疗/教育适用',
    },
  },
  {
    id: 'clay',
    label: '黏土拟态',
    example: '柔和圆角、暖色、立体感',
    bestFor: ['教育/儿童', '生活应用', '亲和品牌'],
    theme: {
      ...defaultTheme,
      colors: {
        primary: 'orange-600',
        secondary: 'yellow-600',
        background: { light: 'amber-50', dark: 'amber-950' },
        surface: 'orange-50',
        text: { primary: 'amber-900', secondary: 'amber-700' },
        border: 'amber-200',
      },
      shape: {
        ...defaultTheme.shape,
        borderRadius: { sm: 'rounded-2xl', md: 'rounded-3xl', lg: 'rounded-[28px]', full: 'rounded-full' },
      },
      typography: { fontFamily: 'system-ui, sans-serif', baseSize: 'text-base', density: 'normal' },
      shadows: { cardShadow: 'shadow-md', buttonShadow: 'shadow-lg' },
      vibe: '黏土拟态：大圆角、暖色、柔和立体阴影、亲和友好',
    },
  },
  {
    id: 'liquid',
    label: '液态玻璃',
    example: '高端半透明、深色渐变底',
    bestFor: ['高端 SaaS', '电商精选', '品牌首屏'],
    theme: {
      ...defaultTheme,
      colors: {
        primary: 'sky-400',
        secondary: 'indigo-400',
        background: { light: 'sky-950', dark: 'slate-950' },
        surface: 'white/12',
        text: { primary: 'white', secondary: 'sky-200' },
        border: 'white/20',
      },
      shape: {
        ...defaultTheme.shape,
        borderRadius: { sm: 'rounded-2xl', md: 'rounded-3xl', lg: 'rounded-[24px]', full: 'rounded-full' },
      },
      typography: { fontFamily: 'system-ui, sans-serif', baseSize: 'text-base', density: 'normal' },
      shadows: { cardShadow: 'shadow-2xl', buttonShadow: 'shadow-xl' },
      vibe: '液态玻璃：深色渐变、半透明卡片、backdrop-blur、高端精致',
    },
  },
  {
    id: 'soft',
    label: '柔和进化',
    example: '轻阴影、紫/青主色、现代企业',
    bestFor: ['现代企业', 'SaaS 后台', '协作工具'],
    theme: {
      ...defaultTheme,
      colors: {
        primary: 'violet-600',
        secondary: 'cyan-500',
        background: { light: 'violet-50', dark: 'violet-950' },
        surface: 'white',
        text: { primary: 'violet-950', secondary: 'violet-700' },
        border: 'violet-200',
      },
      shape: {
        ...defaultTheme.shape,
        borderRadius: { sm: 'rounded-lg', md: 'rounded-xl', lg: 'rounded-2xl', full: 'rounded-full' },
      },
      typography: { fontFamily: 'system-ui, sans-serif', baseSize: 'text-base', density: 'normal' },
      shadows: { cardShadow: 'shadow-md', buttonShadow: 'shadow' },
      vibe: '柔和进化：轻阴影、紫/青主色、现代企业 SaaS 感',
    },
  },
  {
    id: 'retro',
    label: '复古未来',
    example: '深色底、琥珀/红强调、复古科技',
    bestFor: ['游戏', '音乐/娱乐', '复古品牌'],
    theme: {
      ...defaultTheme,
      colors: {
        primary: 'amber-500',
        secondary: 'red-500',
        background: { light: 'stone-900', dark: 'stone-950' },
        surface: 'stone-800',
        text: { primary: 'amber-50', secondary: 'amber-200' },
        border: 'amber-600',
      },
      shape: {
        ...defaultTheme.shape,
        borderRadius: { sm: 'rounded-sm', md: 'rounded', lg: 'rounded-md', full: 'rounded-full' },
      },
      typography: { fontFamily: '"JetBrains Mono", monospace', baseSize: 'text-base', density: 'compact' },
      shadows: { cardShadow: 'shadow-none', buttonShadow: '0 0 0 2px var(--amber)' },
      vibe: '复古未来：深色底、琥珀/红强调、等宽字体、复古科技感',
    },
  },
  {
    id: 'y2k',
    label: 'Y2K 美学',
    example: '高饱和粉/青、直角、千禧年',
    bestFor: ['时尚/美妆', '音乐/潮流', 'Z 世代'],
    theme: {
      ...defaultTheme,
      colors: {
        primary: 'pink-500',
        secondary: 'teal-400',
        background: { light: 'pink-50', dark: 'pink-950' },
        surface: 'white',
        text: { primary: 'pink-900', secondary: 'pink-700' },
        border: 'pink-300',
      },
      shape: {
        ...defaultTheme.shape,
        borderRadius: { sm: 'rounded-none', md: 'rounded-none', lg: 'rounded-none', full: 'rounded-full' },
      },
      typography: { fontFamily: 'system-ui, sans-serif', baseSize: 'text-base', density: 'normal' },
      shadows: { cardShadow: 'shadow-none', buttonShadow: 'shadow-none' },
      vibe: 'Y2K 美学：高饱和粉/青、直角或几何、千禧年复古潮流',
    },
  },
];

