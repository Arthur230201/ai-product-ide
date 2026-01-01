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

