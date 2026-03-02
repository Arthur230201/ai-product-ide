/**
 * UI Verifier
 * 
 * Verifies generated UI against UISpec.
 * - Structure verification
 * - Bottom bar fixed positioning check
 * - Interaction markers verification
 */

import type { UISpec } from '@/types/ui-spec';

export interface VerificationResult {
  ok: boolean;
  issues: string[];
  warnings: string[];
}

/**
 * Verify UI structure against UISpec
 */
export function verifyStructure(html: string, uiSpec: UISpec): VerificationResult {
  const issues: string[] = [];
  const warnings: string[] = [];

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const body = doc.body;
    if (!body) {
      issues.push('HTML body is missing');
      return { ok: false, issues, warnings };
    }

    // Check required regions
    const regionChecks: Record<string, boolean> = {
      header: false,
      toolbar: false,
      content: false,
      bottomBar: false,
    };

    for (const region of uiSpec.regions) {
      // Look for common patterns (class names, data attributes, semantic tags)
      const headerPatterns = ['header', 'nav', 'top', 'navbar'];
      const toolbarPatterns = ['toolbar', 'bar', 'actions'];
      const contentPatterns = ['content', 'main', 'body', 'container'];
      const bottomBarPatterns = ['bottom', 'footer', 'bar', 'fixed'];

      let found = false;
      const patterns = 
        region === 'header' ? headerPatterns :
        region === 'toolbar' ? toolbarPatterns :
        region === 'content' ? contentPatterns :
        bottomBarPatterns;

      for (const pattern of patterns) {
        const elements = body.querySelectorAll(
          `[class*="${pattern}"], [id*="${pattern}"], [data-region="${region}"], ${region === 'header' ? 'header' : region === 'content' ? 'main' : ''}`
        );
        if (elements.length > 0) {
          found = true;
          break;
        }
      }

      if (!found && region === 'content') {
        // Content is critical - must exist
        issues.push(`Required region '${region}' not found`);
      } else if (!found) {
        warnings.push(`Region '${region}' not found (may be optional)`);
      }

      regionChecks[region] = found;
    }

    // Check required components (at least some should exist)
    if (uiSpec.components.length > 0) {
      let foundComponents = 0;
      for (const component of uiSpec.components) {
        // Try to find by id, type, or props
        const byId = component.id ? body.querySelector(`#${component.id}, [data-id="${component.id}"]`) : null;
        const byType = body.querySelector(`[data-type="${component.type}"], .${component.type}`);
        if (byId || byType) {
          foundComponents++;
        }
      }
      if (foundComponents === 0 && uiSpec.components.length > 3) {
        warnings.push(`None of the specified components found (expected ${uiSpec.components.length})`);
      }
    }

    // Critical issues check
    const hasCriticalIssues = issues.length > 0;

    return {
      ok: !hasCriticalIssues,
      issues,
      warnings,
    };
  } catch (error) {
    return {
      ok: false,
      issues: [`Verification error: ${error instanceof Error ? error.message : String(error)}`],
      warnings: [],
    };
  }
}

/**
 * Verify bottom bar fixed positioning (best-effort static check)
 */
export function verifyBottomBarFixed(html: string): VerificationResult {
  const issues: string[] = [];
  const warnings: string[] = [];

  try {
    // Static check: look for fixed positioning classes/attributes
    const hasFixedClass = html.includes('fixed') || html.includes('sticky');
    const hasBottomClass = html.includes('bottom-0') || html.includes('bottom:') || html.includes('bottom=');
    const hasFixedBottom = html.match(/position:\s*(fixed|sticky)/i) || html.match(/class="[^"]*fixed[^"]*bottom[^"]*"/i);

    if (hasFixedBottom || (hasFixedClass && hasBottomClass)) {
      // Likely has fixed bottom bar
      return { ok: true, issues: [], warnings: [] };
    }

    // Check for common bottom bar patterns
    const bottomBarPatterns = [
      /<nav[^>]*class="[^"]*bottom/i,
      /<div[^>]*class="[^"]*bottom[^"]*bar/i,
      /<footer[^>]*class="[^"]*fixed/i,
      /data-action="bottom/i,
    ];

    const hasBottomBarPattern = bottomBarPatterns.some(pattern => pattern.test(html));

    if (!hasBottomBarPattern) {
      warnings.push('No fixed bottom bar detected (may be intentional)');
    }

    return { ok: true, issues: [], warnings };
  } catch (error) {
    warnings.push(`Bottom bar check error: ${error instanceof Error ? error.message : String(error)}`);
    return { ok: true, issues: [], warnings };
  }
}

/**
 * Verify interaction markers based on UISpec
 */
export function verifyInteractions(html: string, uiSpec: UISpec): VerificationResult {
  const issues: string[] = [];
  const warnings: string[] = [];

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const body = doc.body;
    if (!body) {
      return { ok: false, issues: ['HTML body missing'], warnings: [] };
    }

    // Check each interaction has corresponding data-* markers
    for (const interaction of uiSpec.interactions) {
      let found = false;

      // Look for data-action or data-nav attributes matching the interaction
      const actionSelectors = [
        `[data-action="${interaction.action.toLowerCase()}"]`,
        `[data-nav="${interaction.payload}"]`,
        `[data-filter="${interaction.payload}"]`,
      ];

      for (const selector of actionSelectors) {
        const elements = body.querySelectorAll(selector);
        if (elements.length > 0) {
          found = true;
          break;
        }
      }

      // Also check selector hint
      if (!found && interaction.selectorHint) {
        const hintElements = body.querySelectorAll(interaction.selectorHint);
        if (hintElements.length > 0) {
          // Check if element has any data-* attribute
          for (const el of Array.from(hintElements)) {
            if (el.hasAttribute('data-action') || el.hasAttribute('data-nav') || el.hasAttribute('data-filter')) {
              found = true;
              break;
            }
          }
        }
      }

      if (!found) {
        warnings.push(`Interaction marker not found: ${interaction.action} on ${interaction.selectorHint}`);
      }
    }

    return { ok: true, issues, warnings };
  } catch (error) {
    warnings.push(`Interaction verification error: ${error instanceof Error ? error.message : String(error)}`);
    return { ok: true, issues, warnings };
  }
}

/**
 * Comprehensive verification
 */
export function verifyUI(html: string, uiSpec: UISpec): VerificationResult {
  const structureResult = verifyStructure(html, uiSpec);
  const bottomBarResult = verifyBottomBarFixed(html);
  const interactionsResult = verifyInteractions(html, uiSpec);

  const allIssues = [
    ...structureResult.issues,
    ...bottomBarResult.issues,
    ...interactionsResult.issues,
  ];

  const allWarnings = [
    ...structureResult.warnings,
    ...bottomBarResult.warnings,
    ...interactionsResult.warnings,
  ];

  // Critical issues: structure failures
  const hasCriticalIssues = structureResult.issues.length > 0;

  return {
    ok: !hasCriticalIssues,
    issues: allIssues,
    warnings: allWarnings,
  };
}


