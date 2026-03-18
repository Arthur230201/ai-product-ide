import { NextRequest, NextResponse } from 'next/server';
import { buildFullPrdHtmlString } from '@/utils/prdGenerator';
import type { FractalNode } from '@/types/fractal';
import type { ProjectMeta, GlobalRules } from '@/types/fractal';

/**
 * POST /api/export-prd-html
 * Body: { nodes, projectMeta?, globalRules? }
 * Returns: { ok: true, html: string } or { ok: false, error }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let { nodes, projectMeta, globalRules, designSystemSnapshot, designSystemLocked } = body;
    if (!nodes || !Array.isArray(nodes) || nodes.length === 0) {
      return NextResponse.json({ ok: false, error: 'nodes 必填且为非空数组' }, { status: 400 });
    }
    const meta = (projectMeta || {}) as ProjectMeta;
    const rules = (globalRules || {}) as GlobalRules;
    type NodeLike = Record<string, unknown> & { data?: { artifacts?: { spec?: unknown } }; id?: string; label?: string; title?: string; spec?: unknown; type?: string };
    const normalizedNodes: FractalNode[] = nodes.map((n: NodeLike) => {
      if (n.data?.artifacts?.spec != null) return n as unknown as FractalNode;
      return {
        id: (n.id as string) || String(Math.random().toString(36).slice(2)),
        data: {
          label: (n.label ?? n.title ?? '未命名') as string,
          artifacts: { spec: (n.spec ?? { title: n.label ?? '未命名', requirements: [] }) as { title?: string; requirements?: unknown } },
        },
        type: (n.type ?? 'page') as string,
      } as FractalNode;
    });
    const html = await buildFullPrdHtmlString({
      projectMeta: {
        projectName: meta.projectName ?? '未命名项目',
        industry: meta.industry ?? 'General Internet',
        targetAudience: meta.targetAudience ?? '通用用户',
        description: meta.description ?? '',
        version: meta.version ?? '1.0.0',
      },
      globalRules: {
        performance: rules.performance ?? '',
        security: rules.security ?? '',
        compatibility: rules.compatibility ?? '',
        errorHandling: rules.errorHandling ?? '',
        dataTracking: rules.dataTracking ?? '',
      },
      nodes: normalizedNodes,
      designSystemSnapshot,
      designSystemLocked: designSystemLocked === true,
    });
    return NextResponse.json({ ok: true, html });
  } catch (error) {
    console.error('[export-prd-html]', error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : '导出 PRD HTML 失败' },
      { status: 500 }
    );
  }
}
