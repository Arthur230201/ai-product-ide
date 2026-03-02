/**
 * Color Extractor for HTML-to-React JIT Pipeline
 * 
 * Extracts all custom colors from HTML and generates CSS variables
 * This is part of JIT Pipeline Layer 2: Color Preservation
 */

export interface ExtractedColors {
  /** All unique hex color values found in the HTML */
  hexColors: string[];
  /** All unique RGB/RGBA color values */
  rgbColors: string[];
  /** All unique HSL/HSLA color values */
  hslColors: string[];
  /** Named colors (e.g., 'red', 'blue') that are not standard Tailwind colors */
  namedColors: string[];
  /** CSS variables string to inject */
  cssVariables: string;
  /** Map of color to CSS variable name */
  colorToVarMap: Map<string, string>;
}

/**
 * Extracts all custom colors from HTML
 * Returns hex colors, RGB colors, and generates CSS variables
 */
export function extractCustomColors(html: string): ExtractedColors {
  const hexColors = new Set<string>();
  const rgbColors = new Set<string>();
  const hslColors = new Set<string>();
  const namedColors = new Set<string>();
  const colorToVarMap = new Map<string, string>();

  // Extract hex colors (#RGB, #RRGGBB, #RRGGBBAA)
  const hexRegex = /#([0-9A-Fa-f]{3,8})\b/g;
  let match;
  while ((match = hexRegex.exec(html)) !== null) {
    const hex = match[0];
    // Normalize hex colors (expand short form)
    const normalizedHex = normalizeHexColor(hex);
    hexColors.add(normalizedHex);
  }

  // Extract RGB/RGBA colors
  const rgbRegex = /rgba?\([^)]+\)/gi;
  while ((match = rgbRegex.exec(html)) !== null) {
    rgbColors.add(match[0]);
  }

  // Extract HSL/HSLA colors
  const hslRegex = /hsla?\([^)]+\)/gi;
  while ((match = hslRegex.exec(html)) !== null) {
    hslColors.add(match[0]);
  }

  // Extract colors from inline styles
  const styleRegex = /style=["']([^"']+)["']/gi;
  while ((match = styleRegex.exec(html)) !== null) {
    const styleContent = match[1];
    
    // Extract color values from style attributes
    const colorMatches = [
      ...styleContent.matchAll(/#([0-9A-Fa-f]{3,8})\b/g),
      ...styleContent.matchAll(/rgba?\([^)]+\)/gi),
      ...styleContent.matchAll(/hsla?\([^)]+\)/gi),
    ];
    
    colorMatches.forEach(m => {
      if (m[0].startsWith('#')) {
        hexColors.add(normalizeHexColor(m[0]));
      } else if (m[0].startsWith('rgb')) {
        rgbColors.add(m[0]);
      } else if (m[0].startsWith('hsl')) {
        hslColors.add(m[0]);
      }
    });
  }

  // Extract colors from Tailwind arbitrary values (bg-[#xxx], text-[#xxx])
  const arbitraryColorRegex = /(?:bg|text|border|ring|outline|from|via|to)-\[([#\w()]+)\]/g;
  while ((match = arbitraryColorRegex.exec(html)) !== null) {
    const colorValue = match[1];
    if (colorValue.startsWith('#')) {
      hexColors.add(normalizeHexColor(colorValue));
    } else if (colorValue.startsWith('rgb')) {
      rgbColors.add(colorValue);
    } else if (colorValue.startsWith('hsl')) {
      hslColors.add(colorValue);
    } else if (!isStandardTailwindColor(colorValue)) {
      namedColors.add(colorValue);
    }
  }

  // Generate CSS variables
  const cssVars: string[] = [];
  let varIndex = 0;

  // Process hex colors
  hexColors.forEach(color => {
    const varName = `--color-custom-${varIndex++}`;
    colorToVarMap.set(color, varName);
    cssVars.push(`    ${varName}: ${color};`);
  });

  // Process RGB colors
  rgbColors.forEach(color => {
    const varName = `--color-custom-${varIndex++}`;
    colorToVarMap.set(color, varName);
    cssVars.push(`    ${varName}: ${color};`);
  });

  // Process HSL colors
  hslColors.forEach(color => {
    const varName = `--color-custom-${varIndex++}`;
    colorToVarMap.set(color, varName);
    cssVars.push(`    ${varName}: ${color};`);
  });

  // Process named colors (if any)
  namedColors.forEach(color => {
    const varName = `--color-custom-${varIndex++}`;
    colorToVarMap.set(color, varName);
    cssVars.push(`    ${varName}: ${color};`);
  });

  const cssVariables = cssVars.length > 0
    ? `:root {\n${cssVars.join('\n')}\n  }`
    : '';

  return {
    hexColors: Array.from(hexColors),
    rgbColors: Array.from(rgbColors),
    hslColors: Array.from(hslColors),
    namedColors: Array.from(namedColors),
    cssVariables,
    colorToVarMap,
  };
}

/**
 * Normalizes hex color to full form (#RRGGBB or #RRGGBBAA)
 */
function normalizeHexColor(hex: string): string {
  // Remove # if present
  const hexValue = hex.startsWith('#') ? hex.slice(1) : hex;
  
  // Expand short form (#RGB -> #RRGGBB, #RGBA -> #RRGGBBAA)
  if (hexValue.length === 3) {
    return `#${hexValue[0]}${hexValue[0]}${hexValue[1]}${hexValue[1]}${hexValue[2]}${hexValue[2]}`;
  }
  if (hexValue.length === 4) {
    return `#${hexValue[0]}${hexValue[0]}${hexValue[1]}${hexValue[1]}${hexValue[2]}${hexValue[2]}${hexValue[3]}${hexValue[3]}`;
  }
  
  return `#${hexValue}`;
}

/**
 * Checks if a color name is a standard Tailwind color
 */
function isStandardTailwindColor(color: string): boolean {
  const standardColors = [
    'red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'teal',
    'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink',
    'rose', 'slate', 'gray', 'zinc', 'neutral', 'stone', 'white', 'black',
    'transparent', 'current',
  ];
  
  // Check if it's a standard Tailwind color name (e.g., 'red-500', 'blue-600')
  return standardColors.some(baseColor => 
    color === baseColor || color.startsWith(`${baseColor}-`)
  );
}

/**
 * Replaces custom colors in HTML/JSX with CSS variable references
 * Example: bg-[#3B82F6] -> bg-[var(--color-custom-0)]
 */
export function replaceColorsWithCSSVars(
  html: string,
  colorToVarMap: Map<string, string>
): string {
  let result = html;

  // Replace in Tailwind arbitrary values
  colorToVarMap.forEach((varName, color) => {
    // Replace in arbitrary values: bg-[#xxx] -> bg-[var(--color-custom-0)]
    const arbitraryPattern = new RegExp(
      `(bg|text|border|ring|outline|from|via|to)-\\[${escapeRegex(color)}\\]`,
      'g'
    );
    result = result.replace(arbitraryPattern, `$1-[var(${varName})]`);

    // Replace in inline styles: style="background: #xxx" -> style="background: var(--color-custom-0)"
    const stylePattern = new RegExp(
      `(background(?:-color)?|color|border-color):\\s*${escapeRegex(color)}`,
      'gi'
    );
    result = result.replace(stylePattern, `$1: var(${varName})`);
  });

  return result;
}

/**
 * Escapes special regex characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}



