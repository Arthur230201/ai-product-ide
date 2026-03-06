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

/** 内置风格 ID：按视觉/气质分类，参考网络常见设计风格 */
export const STYLE_PRESET_IDS = ['neutral', 'glass', 'flat', 'corporate', 'neo', 'cyberpunk', 'warm', 'brutal', 'custom'] as const;
export type StylePresetId = (typeof STYLE_PRESET_IDS)[number];

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
};

/** 对用户展示的命名风格（按视觉气质分类，非品牌） */
export const NAMED_STYLES: { id: StylePresetId; label: string; theme: UIThemeConfig }[] = [
  {
    id: 'neutral',
    label: '极简中性',
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
];

