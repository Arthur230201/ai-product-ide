import { NextResponse } from 'next/server';
import { z } from 'zod';
import { resolveDesignSystemAuto } from '@/lib/design-system/resolve-design-system';
import { resolveDesignSystemTsEngine } from '@/lib/design-system/ts-engine/retrieve';
import { runUupmDesignSystemMarkdown } from '@/lib/design-system/run-uupm-python';
import { buildUupmDesignSystemSnapshot } from '@/lib/design-system/build-uupm-snapshot';
import {
  recommendDesignSystemWithSnapshot,
  type RecommendDesignSystemInput,
} from '@/lib/design-system/recommend-design-system';
import { log, logError, logWarn } from '@/lib/logger';

const EngineSchema = z.enum(['auto', 'ts', 'python', 'llm']).default('auto');

const ResolveDesignSystemRequestSchema = z.object({
  engine: EngineSchema.optional(),
  nodeLabel: z.string().min(1),
  pageDescription: z.string().optional(),
  prompt: z.string().optional(),
  projectMeta: z
    .object({
      projectName: z.string(),
      industry: z.string(),
      targetAudience: z.string().optional(),
      description: z.string().optional(),
      version: z.string().optional(),
    })
    .optional(),
  aiConfig: z
    .object({
      textModel: z.string().optional(),
      visionModel: z.string().optional(),
    })
    .optional(),
});

function toRecommendInput(r: z.infer<typeof ResolveDesignSystemRequestSchema>): RecommendDesignSystemInput {
  return {
    projectMeta: r.projectMeta
      ? {
          projectName: r.projectMeta.projectName,
          industry: r.projectMeta.industry,
          targetAudience: r.projectMeta.targetAudience ?? '',
          description: r.projectMeta.description ?? '',
        }
      : undefined,
    nodeLabel: r.nodeLabel,
    pageDescription: r.pageDescription,
    prompt: r.prompt,
    aiConfig: r.aiConfig,
    tier: 'draft',
  };
}

export async function POST(req: Request) {
  const startedAt = Date.now();
  try {
    const json = await req.json();
    const parsed = ResolveDesignSystemRequestSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, code: 'BAD_REQUEST', message: '参数不合法', issues: parsed.error.issues.slice(0, 6) },
        { status: 400 }
      );
    }
    const input = parsed.data;
    const engine = (input.engine ?? 'auto') as z.infer<typeof EngineSchema>;

    log('📐 [resolve-design-system] request', {
      engine,
      nodeLabel: input.nodeLabel,
      industry: input.projectMeta?.industry,
    });

    if (engine === 'ts') {
      const r = resolveDesignSystemTsEngine({
        projectName: input.projectMeta?.projectName,
        industry: input.projectMeta?.industry,
        description: input.projectMeta?.description,
        nodeLabel: input.nodeLabel,
        pageDescription: input.pageDescription,
        prompt: input.prompt,
      });
      return NextResponse.json({ ok: true, engine: 'ts', snapshot: r.snapshot, markdown: r.markdown });
    }

    if (engine === 'python') {
      if (process.env.DESIGN_SYSTEM_UUPM_ENABLED !== '1') {
        return NextResponse.json(
          {
            ok: false,
            code: 'PYTHON_DISABLED',
            message: 'Python UIUXProMax 路径未启用（DESIGN_SYSTEM_UUPM_ENABLED!=1）',
            suggestedNext: ['ts', 'llm'],
          },
          { status: 400 }
        );
      }
      const queryParts = [
        input.projectMeta?.industry ?? '',
        input.projectMeta?.description ?? '',
        input.pageDescription ?? '',
        input.nodeLabel,
        input.prompt ?? '',
      ].filter(Boolean);
      const query = queryParts.join(' ').slice(0, 900);
      const projectName = input.projectMeta?.projectName?.trim() || 'Project';
      const u = await runUupmDesignSystemMarkdown({ query, projectName });
      if (!u.ok) {
        return NextResponse.json(
          {
            ok: false,
            code: 'PYTHON_UNAVAILABLE',
            message: `Python UIUXProMax 不可用：${u.reason}`,
            suggestedNext: ['ts', 'llm'],
          },
          { status: 502 }
        );
      }
      const snapshot = buildUupmDesignSystemSnapshot(u.markdown, { queryHint: query, projectName });
      return NextResponse.json({ ok: true, engine: 'python', snapshot, markdown: snapshot.markdownBlock });
    }

    if (engine === 'llm') {
      const recInput = toRecommendInput(input);
      const r = await recommendDesignSystemWithSnapshot(recInput);
      if (!r.snapshot) {
        return NextResponse.json(
          { ok: false, code: 'LLM_EMPTY', message: 'LLM 未返回可用的设计系统快照', suggestedNext: ['ts'] },
          { status: 502 }
        );
      }
      return NextResponse.json({ ok: true, engine: 'llm', snapshot: r.snapshot, markdown: r.markdown });
    }

    // auto
    const recInput = toRecommendInput(input);
    const r = await resolveDesignSystemAuto(recInput);
    if (!r.snapshot) {
      logWarn('[resolve-design-system] auto returned empty snapshot');
      return NextResponse.json(
        { ok: false, code: 'AUTO_EMPTY', message: '未获得可用的设计系统快照（auto）', suggestedNext: ['ts', 'llm'] },
        { status: 502 }
      );
    }
    return NextResponse.json({ ok: true, engine: 'auto', snapshot: r.snapshot, markdown: r.markdown });
  } catch (e) {
    logError('❌ [resolve-design-system] failed', e);
    return NextResponse.json(
      {
        ok: false,
        code: 'INTERNAL',
        message: e instanceof Error ? e.message : '内部错误',
        suggestedNext: ['ts', 'llm'],
      },
      { status: 500 }
    );
  } finally {
    log('📐 [resolve-design-system] done', { elapsedMs: Date.now() - startedAt });
  }
}

