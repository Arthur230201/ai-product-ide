import { NextResponse } from 'next/server';
import { generateStaticUIFromText } from '@/app/actions/ui-pipeline-new';

import { STYLE_PRESET_IDS } from '@/types/theme';
const STYLE_PRESETS = STYLE_PRESET_IDS;
const VIEWPORT_PRESETS = ['mobile', 'desktop'] as const;

/**
 * POST /api/generate-static-ui
 * Body: { prompt?, nodeLabel, stylePreset?, viewportPreset?, projectMeta?, pageDescription?, designSystemLocked?, designSystemSnapshot? }
 * Returns: { ok, type, html?, stage?, message? }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const prompt = typeof body?.prompt === 'string' ? body.prompt.trim() : '';
    const nodeLabel = typeof body?.nodeLabel === 'string' ? body.nodeLabel.trim() : '';
    if (!nodeLabel) {
      return NextResponse.json({ ok: false, type: 'VALIDATION', message: 'nodeLabel 必填' }, { status: 400 });
    }
    const stylePreset = typeof body?.stylePreset === 'string' && STYLE_PRESETS.includes(body.stylePreset as (typeof STYLE_PRESETS)[number])
      ? (body.stylePreset as (typeof STYLE_PRESETS)[number])
      : 'neutral';
    const viewportPreset = typeof body?.viewportPreset === 'string' && VIEWPORT_PRESETS.includes(body.viewportPreset as (typeof VIEWPORT_PRESETS)[number])
      ? (body.viewportPreset as (typeof VIEWPORT_PRESETS)[number])
      : 'mobile';
    const pageDescription = typeof body?.pageDescription === 'string' ? body.pageDescription.trim() : undefined;
    const pm = body?.projectMeta;
    const projectMeta =
      pm && typeof pm === 'object' && pm !== null && typeof (pm as { projectName?: string }).projectName === 'string'
        ? {
            projectName: String((pm as { projectName: string }).projectName),
            industry: String((pm as { industry?: string }).industry ?? ''),
            targetAudience: String((pm as { targetAudience?: string }).targetAudience ?? ''),
            description: String((pm as { description?: string }).description ?? ''),
          }
        : undefined;
    const designSystemLocked = body?.designSystemLocked === true;
    const designSystemSnapshot = body?.designSystemSnapshot;
    const inputPrompt = String(prompt || `请为"${nodeLabel}"页面生成静态 HTML 界面。`);
    const raw = await generateStaticUIFromText({
      prompt: inputPrompt,
      nodeLabel,
      pageDescription,
      projectMeta,
      stylePreset,
      viewportPreset,
      designSystemLocked,
      designSystemSnapshot,
    });
    // zsa 可能返回 [data, null] 或 [null, error] 或直接返回 data
    const isTuple = Array.isArray(raw) && raw.length === 2;
    const result = isTuple ? raw[0] : raw;
    const error = isTuple ? raw[1] : null;
    if (result?.ok && result?.type === 'UI_HTML') {
      return NextResponse.json(result);
    }
    const errMsg = error instanceof Error ? error.message : (typeof error === 'object' && error !== null && 'message' in error ? String((error as { message: unknown }).message) : String(error ?? '生成失败'));
    const payload = result && typeof result === 'object'
      ? { ...result, message: typeof result.message === 'string' ? result.message : errMsg }
      : { ok: false, type: 'PROVIDER', message: errMsg };
    return NextResponse.json(payload, { status: 502 });
  } catch (error) {
    console.error('[api/generate-static-ui]', error);
    return NextResponse.json(
      { ok: false, type: 'PROVIDER', message: error instanceof Error ? error.message : 'generate-static-ui 异常' },
      { status: 500 }
    );
  }
}
