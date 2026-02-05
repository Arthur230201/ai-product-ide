/**
 * UI Pipeline Test Helpers
 * 
 * Exports handler functions directly for testing purposes.
 * These are the same handlers used by server actions, but accessible for E2E tests.
 * 
 * Note: zsa createServerAction returns an action object. We need to access the handler
 * through the action's internal structure. For testing, we'll use a workaround by
 * calling the action directly with the input wrapped in the expected format.
 */

import { generateStaticUIFromText, beautifyUI, addInteractions } from './ui-pipeline-new';
import type { UIPipelineResponse } from './ui-pipeline-response';

// Type definitions for inputs
type GenerateStaticUIInput = {
  prompt: string;
  nodeLabel?: string;
  aiConfig?: { textModel?: string };
};

type BeautifyUIInput = {
  html: string;
  prompt?: string;
  aiConfig?: { textModel?: string };
};

type AddInteractionsInput = {
  html: string;
  prompt?: string;
  aiConfig?: { textModel?: string };
};

// For testing, zsa actions are functions that accept { input } format
// We'll call them directly with the input wrapped
export async function testGenerateStaticUI(input: GenerateStaticUIInput): Promise<UIPipelineResponse> {
  // zsa server actions are callable functions that accept { input }
  const result = await generateStaticUIFromText({ input });
  return result as UIPipelineResponse;
}

export async function testBeautifyUI(input: BeautifyUIInput): Promise<UIPipelineResponse> {
  const result = await beautifyUI({ input });
  return result as UIPipelineResponse;
}

export async function testAddInteractions(input: AddInteractionsInput): Promise<UIPipelineResponse> {
  const result = await addInteractions({ input });
  return result as UIPipelineResponse;
}

