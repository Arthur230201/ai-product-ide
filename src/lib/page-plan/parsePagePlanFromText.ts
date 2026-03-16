/**
 * Extract PagePlan JSON from LLM output (strip markdown code blocks, parse).
 */
import type { PagePlan } from './schema/pagePlan.zod';

export function parsePagePlanFromText(raw: string): PagePlan | null {
  let text = raw.trim();
  const jsonBlock = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonBlock) {
    text = jsonBlock[1].trim();
  }
  try {
    const parsed = JSON.parse(text) as unknown;
    if (parsed && typeof parsed === 'object' && 'version' in parsed && 'sections' in parsed) {
      return parsed as PagePlan;
    }
  } catch {
    // try trimming more
    text = text.replace(/^[\s\S]*?(\{[\s\S]*\})[\s\S]*$/, '$1');
    try {
      const parsed = JSON.parse(text) as unknown;
      if (parsed && typeof parsed === 'object' && 'version' in parsed && 'sections' in parsed) {
        return parsed as PagePlan;
      }
    } catch {
      // ignore
    }
  }
  return null;
}
