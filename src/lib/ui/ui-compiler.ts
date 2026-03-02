/**
 * UI Compiler Orchestrator
 * 
 * Two-Track Pipeline:
 * - Fidelity Track: Generate base HTML from UISpec
 * - Behavior Track: Generate patches to add data-* hooks
 * - Verifier: Validate output before delivery
 */

import { generateText } from 'ai';
import { getOpenAIClient } from '@/lib/openai-client';
import { getTextModel } from '@/lib/ai-config';
import { extractTaggedBlock } from '@/lib/ai/protocol';
import { log, logError, logWarn } from '@/lib/logger';
import { applyPatch, type HtmlPatch } from '@/lib/ui/html-patch';
import { verifyUI } from './ui-verifier';
import type { UISpec } from '@/types/ui-spec';

export type UICompileResult =
  | {
      ok: true;
      html: string;
      uiSpec: UISpec;
      patchesApplied: number;
      warnings: string[];
    }
  | {
      ok: false;
      type: 'AI' | 'VERIFY' | 'BUDGET';
      message: string;
      fallbackHtml?: string;
      issues?: string[];
    };

interface CompileUIOptions {
  prompt: string;
  nodeLabel: string;
  aiConfig?: {
    visionModel?: string;
    textModel?: string;
  };
}

/**
 * Compile UI from prompt using Two-Track Pipeline
 */
export async function compileUIFromPrompt(options: CompileUIOptions): Promise<UICompileResult> {
  const { prompt, nodeLabel, aiConfig } = options;
  const requestId = `compile-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  try {
    const textModel = getTextModel(aiConfig);
    const openaiClient = getOpenAIClient(aiConfig);

    // ==================== Track 1: Build UISpec (AI JSON, small budget) ====================
    log(`[UI Compiler] Track 1: Building UISpec for "${nodeLabel}"`, { requestId });

    const specPrompt = `# Task
Generate a UI specification for: "${nodeLabel}"

User Request: ${prompt}

# Output Format
Output ONLY one tagged block:
<AI_JSON>
{
  "pageId": "${nodeLabel.toLowerCase().replace(/\s+/g, '-')}",
  "title": "${nodeLabel}",
  "regions": ["header", "toolbar", "content", "bottomBar"],
  "components": [
    {"id": "comp1", "type": "button", "props": {"text": "Submit"}},
    {"id": "comp2", "type": "input", "props": {"placeholder": "Search..."}}
  ],
  "dataSchema": {
    "items": "array",
    "status": "string"
  },
  "interactions": [
    {"when": "CLICK", "selectorHint": "button", "action": "NAV", "payload": "detail"},
    {"when": "INPUT", "selectorHint": "input", "action": "FILTER", "payload": "search"}
  ]
}
</AI_JSON>

Rules:
- Output ONLY the <AI_JSON> block
- No other text outside the block
- JSON must be valid`;

    const specResult = await generateText({
      model: openaiClient(textModel),
      messages: [
        { role: 'system', content: 'You are a UI specification generator. Output only valid JSON in <AI_JSON> tags.' },
        { role: 'user', content: specPrompt },
      ],
      temperature: 0.3,
    });

    const specBlock = extractTaggedBlock(specResult.text, 'AI_JSON');
    if (!specBlock) {
      logError('[UI Compiler] UISpec block not found', { requestId });
      return {
        ok: false,
        type: 'AI',
        message: 'Failed to extract UI specification',
      };
    }

    let uiSpec: UISpec;
    try {
      uiSpec = JSON.parse(specBlock) as UISpec;
    } catch (parseError) {
      logError('[UI Compiler] UISpec JSON parse error', { requestId, error: parseError });
      return {
        ok: false,
        type: 'AI',
        message: 'Failed to parse UI specification',
      };
    }

    log(`[UI Compiler] UISpec generated: ${uiSpec.components.length} components, ${uiSpec.interactions.length} interactions`, { requestId });

    // ==================== Track 2: Fidelity Track - Generate base HTML (AI HTML, budget) ====================
    log(`[UI Compiler] Track 2: Generating base HTML (Fidelity Track)`, { requestId });

    const htmlPrompt = `# Task
Generate complete HTML for: "${uiSpec.title}"

UISpec:
- Regions: ${uiSpec.regions.join(', ')}
- Components: ${uiSpec.components.map(c => `${c.type}(${c.id})`).join(', ')}
- Data Schema: ${JSON.stringify(uiSpec.dataSchema)}

User Request: ${prompt}

# Output Format
Output ONLY one tagged block:
<AI_HTML>
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
  <!-- Your HTML here -->
</body>
</html>
</AI_HTML>

Rules:
- Output ONLY the <AI_HTML> block
- Include complete HTML document (DOCTYPE, head, body)
- Use Tailwind CSS classes
- Include sample data for lists/tables
- Do NOT include inline event handlers (onclick, etc.)
- Preserve visual fidelity from user request`;

    const htmlResult = await generateText({
      model: openaiClient(textModel),
      messages: [
        { role: 'system', content: 'You are an HTML generator. Output only valid HTML in <AI_HTML> tags. Keep output reasonable (< 15000 tokens).' },
        { role: 'user', content: htmlPrompt },
      ],
      temperature: 0.1,
    });

    const htmlBlock = extractTaggedBlock(htmlResult.text, 'AI_HTML');
    if (!htmlBlock) {
      logError('[UI Compiler] HTML block not found', { requestId });
      return {
        ok: false,
        type: 'AI',
        message: 'Failed to extract HTML',
        fallbackHtml: undefined,
      };
    }

    let baseHtml = htmlBlock.trim();
    // Ensure it's a complete document
    if (!baseHtml.includes('<!DOCTYPE') && !baseHtml.includes('<html')) {
      baseHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
${baseHtml}
</body>
</html>`;
    }

    log(`[UI Compiler] Base HTML generated: ${baseHtml.length} chars`, { requestId });

    // ==================== Track 3: Behavior Track - Generate patches (AI PATCH, small) ====================
    log(`[UI Compiler] Track 3: Generating behavior patches (Behavior Track)`, { requestId });

    const patchPrompt = `# Task
Generate data-* attribute patches for interactions.

UISpec Interactions:
${uiSpec.interactions.map(i => `- ${i.when} on ${i.selectorHint} -> ${i.action}(${i.payload})`).join('\n')}

Base HTML (first 2000 chars):
${baseHtml.substring(0, 2000)}...

# Output Format
Output ONLY one tagged block:
<AI_PATCH>
[
  {"op": "SET_ATTR", "selector": "button.submit", "name": "data-action", "value": "submit"},
  {"op": "SET_ATTR", "selector": "input.search", "name": "data-filter", "value": "search"}
]
</AI_PATCH>

Rules:
- Output ONLY the <AI_PATCH> block
- Use stable selectors (prefer id, then data-id, then class)
- Add data-action, data-nav, or data-filter attributes based on interactions
- Do NOT modify text content or structure
- Keep output concise`;

    const patchResult = await generateText({
      model: openaiClient(textModel),
      messages: [
        { role: 'system', content: 'You are a patch generator. Output only valid JSON array in <AI_PATCH> tags. Keep output concise (< 2000 tokens).' },
        { role: 'user', content: patchPrompt },
      ],
      temperature: 0.1,
    });

    const patchBlock = extractTaggedBlock(patchResult.text, 'AI_PATCH');
    let patches: HtmlPatch[] = [];
    let patchesApplied = 0;

    if (patchBlock) {
      try {
        const patchArray = JSON.parse(patchBlock) as Array<{
          op: 'SET_ATTR' | 'SET_TEXT' | 'TOGGLE_CLASS';
          selector: string;
          name?: string;
          value?: string;
          className?: string;
          enabled?: boolean;
        }>;

        patches = patchArray.map(p => {
          if (p.op === 'SET_ATTR') {
            return {
              op: 'SET_ATTR',
              selector: p.selector,
              name: p.name || '',
              value: p.value || '',
            };
          } else if (p.op === 'TOGGLE_CLASS') {
            return {
              op: 'TOGGLE_CLASS',
              selector: p.selector,
              className: p.className || '',
              enabled: p.enabled ?? false,
            };
          } else {
            return {
              op: 'SET_TEXT',
              selector: p.selector,
              value: p.value || '',
            };
          }
        });

        // Apply patches
        let currentHtml = baseHtml;
        for (const patch of patches) {
          try {
            currentHtml = applyPatch(currentHtml, patch);
            patchesApplied++;
          } catch (patchError) {
            logWarn('[UI Compiler] Patch application failed', { requestId, patch, error: patchError });
          }
        }
        baseHtml = currentHtml;
      } catch (parseError) {
        logWarn('[UI Compiler] Patch JSON parse error, continuing without patches', { requestId, error: parseError });
      }
    } else {
      logWarn('[UI Compiler] Patch block not found, continuing without patches', { requestId });
    }

    log(`[UI Compiler] Applied ${patchesApplied}/${patches.length} patches`, { requestId });

    // ==================== Track 4: Verification ====================
    log(`[UI Compiler] Track 4: Verifying output`, { requestId });

    const verifyResult = verifyUI(baseHtml, uiSpec);

    if (!verifyResult.ok) {
      logError('[UI Compiler] Verification failed', { requestId, issues: verifyResult.issues });
      return {
        ok: false,
        type: 'VERIFY',
        message: `Verification failed: ${verifyResult.issues.join('; ')}`,
        fallbackHtml: baseHtml, // Return base HTML as fallback
        issues: verifyResult.issues,
      };
    }

    log(`[UI Compiler] Verification passed`, { requestId, warnings: verifyResult.warnings.length });

    return {
      ok: true,
      html: baseHtml,
      uiSpec,
      patchesApplied,
      warnings: verifyResult.warnings,
    };
  } catch (error) {
    logError('[UI Compiler] Compilation error', { requestId, error });
    return {
      ok: false,
      type: 'AI',
      message: error instanceof Error ? error.message : 'Unknown compilation error',
    };
  }
}

