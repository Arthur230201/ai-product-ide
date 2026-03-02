/**
 * HTML Config Extractor
 * 
 * Extracts Tailwind configuration and custom styles from HTML files
 * to enable generic, non-hardcoded UI conversion.
 */

/**
 * Extracts custom Tailwind colors from HTML
 * Looks for arbitrary values like bg-[#HEX] or text-[#HEX]
 */
export function extractCustomColors(html: string): Record<string, string> {
  const colors: Record<string, string> = {};
  
  // Extract arbitrary color values: bg-[#HEX], text-[#HEX], etc.
  const arbitraryColorRegex = /(?:bg|text|border|ring|outline)-\[#([0-9A-Fa-f]{3,6})\]/g;
  let match;
  while ((match = arbitraryColorRegex.exec(html)) !== null) {
    const hex = `#${match[1]}`;
    // Generate a semantic name based on usage context
    const colorName = `custom-${match[1].toLowerCase()}`;
    if (!colors[colorName]) {
      colors[colorName] = hex;
    }
  }
  
  return colors;
}

/**
 * Extracts custom box shadows from HTML
 * Looks for shadow-* classes or custom shadow values
 */
export function extractCustomShadows(html: string): Record<string, string> {
  const shadows: Record<string, string> = {};
  
  // Extract custom shadow classes (if any)
  const shadowRegex = /shadow-\[([^\]]+)\]/g;
  let match;
  while ((match = shadowRegex.exec(html)) !== null) {
    const shadowValue = match[1];
    const shadowName = `custom-${shadowValue.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`;
    shadows[shadowName] = shadowValue;
  }
  
  return shadows;
}

/**
 * Generates a generic Tailwind config from HTML content
 * Only includes colors/shadows that are actually used in the HTML
 */
export function generateTailwindConfigFromHtml(html: string): string {
  const customColors = extractCustomColors(html);
  const customShadows = extractCustomShadows(html);
  
  // Only generate config if there are custom values
  if (Object.keys(customColors).length === 0 && Object.keys(customShadows).length === 0) {
    return ''; // No custom config needed
  }
  
  const config: any = {
    darkMode: 'class',
    theme: {
      extend: {},
    },
  };
  
  if (Object.keys(customColors).length > 0) {
    config.theme.extend.colors = customColors;
  }
  
  if (Object.keys(customShadows).length > 0) {
    config.theme.extend.boxShadow = customShadows;
  }
  
  return `window.tailwind.config = ${JSON.stringify(config, null, 2)};`;
}



