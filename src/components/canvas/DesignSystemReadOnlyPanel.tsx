'use client';

import { useMemo, useState } from 'react';
import {
  X,
  Lock,
  Unlock,
  BookMarked,
  ChevronDown,
  ChevronUp,
  Palette,
  Copy,
  RefreshCw,
  RotateCcw,
} from 'lucide-react';
import type { DesignSystemSnapshot } from '@/types/design-system-snapshot';
import { dispatchOpenStyleExtractor } from '@/lib/canvas-ui-events';
import { toast } from 'sonner';
import { useCanvasStore } from '@/store/canvas-store';

const MARKDOWN_PREVIEW_CHARS = 480;

const SOURCE_LABEL: Record<DesignSystemSnapshot['source'], string> = {
  llm_draft: 'LLM 推荐',
  python_uupm: 'UIUXProMax 检索',
  ts_engine: 'TS 引擎',
  manual_override: '人工覆盖',
};

export type DesignSystemReadOnlyPanelProps = {
  isOpen: boolean;
  onClose: () => void;
  snapshot: DesignSystemSnapshot | null;
  designSystemLocked: boolean;
  stylePreset: string;
};

type TraceItem = NonNullable<DesignSystemSnapshot['retrievalTrace']>[number];

function groupTracesByDomain(traces: TraceItem[]): Array<{ domain: string; items: TraceItem[] }> {
  const map = new Map<string, TraceItem[]>();
  for (const t of traces) {
    const k = t.domain || 'unknown';
    map.set(k, [...(map.get(k) ?? []), t]);
  }
  return Array.from(map.entries())
    .map(([domain, items]) => ({
      domain,
      items: [...items].sort((a, b) => (b.score ?? 0) - (a.score ?? 0)).slice(0, 6),
    }))
    .sort((a, b) => a.domain.localeCompare(b.domain));
}

type SnapshotDiff = {
  changed: Array<{ path: string; before: string; after: string }>;
  arrays: Array<{ path: string; added: string[]; removed: string[] }>;
};

function normalizeList(xs: unknown): string[] {
  if (!Array.isArray(xs)) return [];
  return xs.map((x) => String(x)).filter((s) => s.trim().length > 0);
}

function diffArrays(beforeRaw: unknown, afterRaw: unknown): { added: string[]; removed: string[] } {
  const before = new Set(normalizeList(beforeRaw));
  const after = new Set(normalizeList(afterRaw));
  const added = Array.from(after).filter((x) => !before.has(x));
  const removed = Array.from(before).filter((x) => !after.has(x));
  return { added, removed };
}

function diffSnapshot(prev: DesignSystemSnapshot, next: DesignSystemSnapshot): SnapshotDiff {
  const changed: SnapshotDiff['changed'] = [];
  const arrays: SnapshotDiff['arrays'] = [];

  const pushChanged = (path: string, before: unknown, after: unknown) => {
    const b = before == null ? '—' : String(before);
    const a = after == null ? '—' : String(after);
    if (b !== a) changed.push({ path, before: b, after: a });
  };

  pushChanged('style.name', prev.style?.name, next.style?.name);
  pushChanged('typography', prev.typography, next.typography);
  pushChanged('keyEffects', prev.keyEffects, next.keyEffects);
  pushChanged('colors.primary', prev.colors?.primary, next.colors?.primary);
  pushChanged('colors.secondary', prev.colors?.secondary, next.colors?.secondary);
  pushChanged('colors.cta', prev.colors?.cta, next.colors?.cta);
  pushChanged('colors.background', prev.colors?.background, next.colors?.background);
  pushChanged('colors.text', prev.colors?.text, next.colors?.text);

  arrays.push({ path: 'style.keywords', ...diffArrays(prev.style?.keywords, next.style?.keywords) });
  arrays.push({ path: 'antiPatterns', ...diffArrays(prev.antiPatterns, next.antiPatterns) });
  arrays.push({ path: 'a11yRules', ...diffArrays(prev.a11yRules, next.a11yRules) });
  arrays.push({
    path: 'avoidEvidence.matchedIndustryKeywords',
    ...diffArrays(prev.avoidEvidence?.matchedIndustryKeywords, next.avoidEvidence?.matchedIndustryKeywords),
  });
  arrays.push({
    path: 'avoidEvidence.matchedAntiPatterns',
    ...diffArrays(prev.avoidEvidence?.matchedAntiPatterns, next.avoidEvidence?.matchedAntiPatterns),
  });

  return {
    changed: changed.slice(0, 18),
    arrays: arrays.filter((x) => x.added.length || x.removed.length).slice(0, 12),
  };
}

async function copyToClipboard(text: string, label: string) {
  try {
    if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
      toast.error('复制失败：当前环境不支持剪贴板');
      return;
    }
    await navigator.clipboard.writeText(text);
    toast.success(`已复制${label}`);
  } catch {
    toast.error('复制失败，请重试');
  }
}

/**
 * 只读展示当前设计系统快照；调整锁定/重新解析请打开风格面板。
 */
function MarkdownInjectBlock({ markdown }: { markdown: string }) {
  const [expanded, setExpanded] = useState(false);
  const { needTruncate, preview } = useMemo(() => {
    const t = markdown.trim();
    if (t.length <= MARKDOWN_PREVIEW_CHARS) {
      return { needTruncate: false, preview: t };
    }
    return {
      needTruncate: true,
      preview: `${t.slice(0, MARKDOWN_PREVIEW_CHARS)}…`,
    };
  }, [markdown]);

  return (
    <section>
      <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">
        注入用 Markdown 块
      </h3>
      <pre
        className="text-[11px] leading-relaxed text-zinc-400 bg-zinc-950/80 border border-zinc-800 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap break-words max-h-[min(50vh,320px)] overflow-y-auto font-mono"
        tabIndex={0}
        aria-label="设计系统注入 Markdown"
      >
        {needTruncate && !expanded ? preview : markdown}
      </pre>
      {needTruncate && (
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="mt-2 inline-flex items-center gap-1 text-xs text-cyan-500 hover:text-cyan-400 transition-colors"
        >
          {expanded ? (
            <>
              <ChevronUp className="w-3.5 h-3.5" />
              收起预览
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5" />
              查看完整注入块
            </>
          )}
        </button>
      )}
    </section>
  );
}

export function DesignSystemReadOnlyPanel({
  isOpen,
  onClose,
  snapshot,
  designSystemLocked,
  stylePreset,
}: DesignSystemReadOnlyPanelProps) {
  const projectMeta = useCanvasStore((s) => s.projectMeta);
  const aiConfig = useCanvasStore((s) => s.aiConfig);
  const nodes = useCanvasStore((s) => s.nodes);
  const selectedNodeId = useCanvasStore((s) => s.selectedNodeId);
  const commitDesignSystemSnapshot = useCanvasStore((s) => s.commitDesignSystemSnapshot);
  const rollbackDesignSystemSnapshot = useCanvasStore((s) => s.rollbackDesignSystemSnapshot);
  const setDesignSystemLocked = useCanvasStore((s) => s.setDesignSystemLocked);
  const historyCount = useCanvasStore((s) => s.designSystemHistory.length);
  const prevSnapshot = useCanvasStore((s) => s.designSystemHistory[0] ?? null);
  const resolveState = useCanvasStore((s) => s.designSystemResolveState);
  const setResolveState = useCanvasStore((s) => s.setDesignSystemResolveState);
  const [engine, setEngine] = useState<'auto' | 'ts' | 'python' | 'llm'>('auto');
  const [lockAfterRollback, setLockAfterRollback] = useState(true);

  const handleOpenStyleSettings = () => {
    onClose();
    dispatchOpenStyleExtractor();
  };

  const tracesByDomain = useMemo(() => {
    if (!snapshot?.retrievalTrace?.length) return [];
    return groupTracesByDomain(snapshot.retrievalTrace);
  }, [snapshot?.retrievalTrace]);

  const snapshotDiff = useMemo(() => {
    if (!snapshot || !prevSnapshot) return null;
    return diffSnapshot(prevSnapshot, snapshot);
  }, [prevSnapshot, snapshot]);

  const selectedNode = useMemo(() => {
    if (!selectedNodeId) return null;
    return nodes.find((n) => n.id === selectedNodeId) ?? null;
  }, [nodes, selectedNodeId]);

  const resolveInput = useMemo(() => {
    const nodeLabel = selectedNode?.data?.label || '页面';
    const pageDescription =
      selectedNode?.data?.artifacts?.spec?.requirements?.length
        ? selectedNode.data.artifacts.spec.requirements.join('；').slice(0, 800)
        : selectedNode?.data?.artifacts?.spec?.title
          ? String(selectedNode.data.artifacts.spec.title).slice(0, 220)
          : undefined;
    return {
      engine,
      nodeLabel,
      pageDescription,
      prompt: '',
      projectMeta: {
        projectName: projectMeta.projectName,
        industry: projectMeta.industry,
        targetAudience: projectMeta.targetAudience,
        description: projectMeta.description,
        version: projectMeta.version,
      },
      aiConfig,
    };
  }, [aiConfig, engine, projectMeta, selectedNode]);

  const handleResolveNow = async (overrideEngine?: 'auto' | 'ts' | 'python' | 'llm') => {
    const effectiveEngine = overrideEngine ?? engine;
    const effectiveInput = { ...resolveInput, engine: effectiveEngine };
    setResolveState({ status: 'resolving', engine: effectiveEngine });
    try {
      const res = await fetch('/api/resolve-design-system', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(effectiveInput),
      });
      const data = (await res.json()) as
        | { ok: true; snapshot: DesignSystemSnapshot; markdown: string; engine: string }
        | { ok: false; code: string; message: string; suggestedNext?: Array<'ts' | 'llm' | 'python' | 'auto'> };
      if (!res.ok || !data.ok) {
        const code = 'ok' in data && data.ok === false ? data.code : 'HTTP_ERROR';
        const msg = 'ok' in data && data.ok === false ? data.message : '解析失败';
        const suggestedNext = 'ok' in data && data.ok === false ? (data.suggestedNext ?? []) : [];
        const full = `[${code}] ${msg}`;
        setResolveState({
          status: 'failed',
          engine: effectiveEngine,
          message: full,
          suggestedNext,
        });
        toast.error('设计系统解析失败', { description: full, duration: 7000 });
        return;
      }
      commitDesignSystemSnapshot({
        snapshot: data.snapshot,
        reason: 'resolve_api',
        engine: effectiveEngine,
        lockAfter: false,
      });
      setResolveState({ status: 'succeeded', engine: effectiveEngine, message: undefined, suggestedNext: [] });
      toast.success('设计系统已更新', { description: `引擎：${data.engine}`, duration: 2500 });
    } catch (e) {
      const msg = e instanceof Error ? e.message : '网络错误';
      setResolveState({ status: 'failed', engine: effectiveEngine, message: msg, suggestedNext: ['ts', 'llm'] });
      toast.error('设计系统解析失败', { description: msg, duration: 6000 });
    }
  };

  const suggestedNextEngines = useMemo(() => {
    const list = resolveState.suggestedNext ?? [];
    return Array.from(new Set(list));
  }, [resolveState.suggestedNext]);

  const nextButtons = useMemo(() => {
    const prefer = suggestedNextEngines.length ? suggestedNextEngines : (['ts', 'llm'] as const);
    return prefer
      .filter((e) => e !== engine)
      .slice(0, 2)
      .map((e) => ({
        engine: e,
        label: `切到 ${e} 重试`,
      }));
  }, [engine, suggestedNextEngines]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[10020] flex items-center justify-center p-4 bg-black/65 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="design-system-readonly-title"
      onClick={onClose}
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
    >
      <div
        className="max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col rounded-xl border border-zinc-700 bg-zinc-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 shrink-0">
          <h2 id="design-system-readonly-title" className="text-sm font-semibold text-zinc-100">
            设计系统（只读）
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
            aria-label="关闭"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        <div className="p-4 overflow-y-auto space-y-4 text-sm">
          {!snapshot ? (
            <div className="space-y-4">
              <p className="text-zinc-400 leading-relaxed">
                {stylePreset === 'auto'
                  ? '尚未有推荐快照。请在「智能推荐」下成功生成一次页面 UI；锁定与重新解析请在左侧画布打开「风格」面板操作。'
                  : `当前为固定风格预设「${stylePreset}」，无智能推荐快照。切换到「智能推荐」并生成页面后，可在此查看摘要。`}
              </p>
              <button
                type="button"
                onClick={handleOpenStyleSettings}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors"
              >
                <Palette className="w-4 h-4 shrink-0" aria-hidden />
                打开风格设置
              </button>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap gap-2 items-center">
                {designSystemLocked ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-950/60 text-cyan-400 text-xs border border-cyan-800/40">
                    <Lock className="w-3 h-3 shrink-0" aria-hidden />
                    已锁定
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-400 text-xs">
                    <Unlock className="w-3 h-3 shrink-0" aria-hidden />
                    未锁定
                  </span>
                )}
                <span className="text-xs text-zinc-500">{SOURCE_LABEL[snapshot.source]}</span>
              </div>
              <p className="text-[11px] text-zinc-600 font-mono break-all">
                引擎: {snapshot.engineVersion} · {snapshot.createdAt.slice(0, 19).replace('T', ' ')}
              </p>
              {snapshot.contextHash ? (
                <div className="flex items-center justify-between gap-2 rounded-lg border border-zinc-800 bg-zinc-950/50 px-3 py-2">
                  <div className="min-w-0">
                    <div className="text-[10px] text-zinc-500 uppercase tracking-wide">contextHash</div>
                    <div className="text-[11px] text-zinc-400 font-mono break-all">{snapshot.contextHash}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(snapshot.contextHash ?? '', ' contextHash')}
                    className="shrink-0 inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" aria-hidden />
                    复制
                  </button>
                </div>
              ) : null}

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => copyToClipboard(snapshot.markdownBlock ?? '', '注入 Markdown')}
                  className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs font-medium transition-colors"
                >
                  <Copy className="w-4 h-4" aria-hidden />
                  复制注入 Markdown
                </button>
                <button
                  type="button"
                  onClick={() => copyToClipboard(JSON.stringify(snapshot, null, 2), '快照 JSON')}
                  className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs font-medium transition-colors"
                >
                  <Copy className="w-4 h-4" aria-hidden />
                  复制快照 JSON
                </button>
              </div>

              <section className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wide">操作</h3>
                  <div className="flex items-center gap-2">
                    <label className="text-[11px] text-zinc-500">引擎</label>
                    <select
                      value={engine}
                      onChange={(e) => setEngine(e.target.value as any)}
                      className="text-xs bg-zinc-900 border border-zinc-700 rounded-md px-2 py-1 text-zinc-200"
                    >
                      <option value="auto">auto</option>
                      <option value="ts">ts</option>
                      <option value="llm">llm</option>
                      <option value="python">python</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => void handleResolveNow()}
                    disabled={resolveState.status === 'resolving'}
                    className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-cyan-700 hover:bg-cyan-600 disabled:opacity-60 disabled:hover:bg-cyan-700 text-white text-xs font-medium transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" aria-hidden />
                    {resolveState.status === 'resolving' ? '解析中…' : '重算设计系统'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (historyCount === 0) return;
                      const ok = typeof window !== 'undefined' ? window.confirm('确认回退到上一版设计系统？') : true;
                      if (!ok) return;
                      rollbackDesignSystemSnapshot();
                      setDesignSystemLocked(lockAfterRollback);
                    }}
                    disabled={historyCount === 0}
                    className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-60 disabled:hover:bg-zinc-800 text-zinc-100 text-xs font-medium transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" aria-hidden />
                    回退上一版{historyCount ? `（${historyCount}）` : ''}
                  </button>
                      <label className="col-span-2 flex items-center gap-2 text-[11px] text-zinc-400 select-none">
                        <input
                          type="checkbox"
                          className="accent-cyan-500"
                          checked={lockAfterRollback}
                          onChange={(e) => setLockAfterRollback(e.target.checked)}
                        />
                        回退后锁定（后续生成复用该快照）
                      </label>
                </div>
                {resolveState.status === 'failed' && resolveState.message ? (
                  <div className="text-[11px] text-red-300 bg-red-950/30 border border-red-900/40 rounded-lg p-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-[10px] uppercase tracking-wide text-red-300/80">resolve failed</div>
                        <div className="break-words">{resolveState.message}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(resolveState.message ?? '', '错误信息')}
                        className="shrink-0 inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-red-900/40 hover:bg-red-900/60 text-red-100 text-xs transition-colors"
                      >
                        <Copy className="w-3.5 h-3.5" aria-hidden />
                        复制
                      </button>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {nextButtons.map((b) => (
                        <button
                          key={b.engine}
                          type="button"
                          onClick={() => {
                            setEngine(b.engine);
                            void handleResolveNow(b.engine);
                          }}
                          className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-red-900/40 hover:bg-red-900/60 text-red-100 text-xs font-medium transition-colors"
                        >
                          <RefreshCw className="w-4 h-4" aria-hidden />
                          {b.label}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={handleOpenStyleSettings}
                        className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs font-medium transition-colors"
                      >
                        <Palette className="w-4 h-4" aria-hidden />
                        打开风格设置
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (historyCount === 0) return;
                          const ok = typeof window !== 'undefined' ? window.confirm('确认回退到上一版设计系统？') : true;
                          if (!ok) return;
                          rollbackDesignSystemSnapshot();
                          setDesignSystemLocked(lockAfterRollback);
                        }}
                        disabled={historyCount === 0}
                        className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-60 disabled:hover:bg-zinc-800 text-zinc-100 text-xs font-medium transition-colors"
                      >
                        <RotateCcw className="w-4 h-4" aria-hidden />
                        回退上一版
                      </button>
                    </div>
                  </div>
                ) : null}
              </section>

              <section>
                <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-1">风格</h3>
                <p className="text-zinc-100 font-medium">{snapshot.style.name}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {snapshot.style.keywords.map((k) => (
                    <span
                      key={k}
                      className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 text-xs border border-zinc-700/80"
                    >
                      {k}
                    </span>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-1">版式 / Pattern</h3>
                <p className="text-zinc-300 leading-relaxed whitespace-pre-wrap">{snapshot.pattern.summary}</p>
              </section>

              <section>
                <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">色板</h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {(
                    [
                      ['主色', snapshot.colors.primary],
                      ['次色', snapshot.colors.secondary],
                      ['CTA', snapshot.colors.cta],
                      ['背景', snapshot.colors.background],
                      ['文字', snapshot.colors.text],
                    ] as const
                  ).map(([label, hex]) => {
                    const isHex = /^#[0-9A-Fa-f]{3,8}$/.test(String(hex).trim());
                    return (
                    <div key={label} className="flex items-center gap-2">
                      <span
                        className={`w-8 h-8 rounded-lg border border-zinc-600 shrink-0 shadow-inner ${isHex ? '' : 'bg-zinc-700'}`}
                        style={isHex ? { backgroundColor: hex } : undefined}
                        title={hex}
                        aria-hidden
                      />
                      <div>
                        <div className="text-zinc-500">{label}</div>
                        <div className="text-zinc-300 font-mono truncate max-w-[140px]" title={hex}>
                          {hex}
                        </div>
                      </div>
                    </div>
                  );
                  })}
                </div>
              </section>

              <section>
                <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-1">字体气质</h3>
                <p className="text-zinc-300 leading-relaxed">{snapshot.typography}</p>
              </section>

              <section>
                <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-1">关键效果</h3>
                <p className="text-zinc-300 leading-relaxed">{snapshot.keyEffects}</p>
              </section>

              {snapshotDiff ? (
                <section className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
                      Diff · 对比上一版快照
                      <span className="ml-2 text-[10px] text-zinc-600">(history top1)</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => void copyToClipboard(JSON.stringify(snapshotDiff, null, 2), ' diff JSON')}
                      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" aria-hidden />
                      复制
                    </button>
                  </div>
                  {snapshotDiff.changed.length ? (
                    <div className="mt-2 space-y-2">
                      {snapshotDiff.changed.map((c) => (
                        <div key={c.path} className="text-[11px] text-zinc-400">
                          <div className="font-mono text-zinc-500">{c.path}</div>
                          <div className="mt-0.5 grid grid-cols-2 gap-2">
                            <div className="rounded border border-zinc-800 bg-zinc-950/60 px-2 py-1 break-words">
                              <span className="text-zinc-600">before</span> {c.before}
                            </div>
                            <div className="rounded border border-zinc-800 bg-zinc-950/60 px-2 py-1 break-words">
                              <span className="text-zinc-600">after</span> {c.after}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-2 text-xs text-zinc-500">关键字段无变化（或变化被截断）。</div>
                  )}

                  {snapshotDiff.arrays.length ? (
                    <div className="mt-3 space-y-2">
                      {snapshotDiff.arrays.map((a) => (
                        <div key={a.path} className="text-[11px] text-zinc-400">
                          <div className="font-mono text-zinc-500">{a.path}</div>
                          <div className="mt-1 grid grid-cols-2 gap-2">
                            <div className="rounded border border-zinc-800 bg-zinc-950/60 px-2 py-1">
                              <div className="text-zinc-600">added</div>
                              <div className="mt-0.5 text-zinc-300 break-words">
                                {a.added.length ? a.added.slice(0, 6).join('、') : '—'}
                              </div>
                            </div>
                            <div className="rounded border border-zinc-800 bg-zinc-950/60 px-2 py-1">
                              <div className="text-zinc-600">removed</div>
                              <div className="mt-0.5 text-zinc-300 break-words">
                                {a.removed.length ? a.removed.slice(0, 6).join('、') : '—'}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </section>
              ) : null}

              <section>
                <h3 className="text-xs font-medium text-amber-600/90 uppercase tracking-wide mb-2">反模式（避免）</h3>
                <ul className="list-disc list-inside space-y-1 text-zinc-400 text-xs">
                  {snapshot.antiPatterns.map((a, i) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>
              </section>

              {snapshot.avoidEvidence?.industry ? (
                <section className="rounded-lg border border-zinc-800 bg-zinc-950/40 px-3 py-2">
                  <div className="text-[10px] text-zinc-500 uppercase tracking-wide">avoidEvidence</div>
                  <div className="mt-1 text-xs text-zinc-400">
                    行业：<span className="font-mono">{snapshot.avoidEvidence.industry}</span>
                  </div>
                  <div className="mt-1 text-xs text-zinc-500">
                    强相关：{snapshot.avoidEvidence.matchedAntiPatterns.length} 条 · 命中关键词：
                    {snapshot.avoidEvidence.matchedIndustryKeywords.length
                      ? snapshot.avoidEvidence.matchedIndustryKeywords.join('、')
                      : '—'}
                  </div>
                </section>
              ) : null}

              {snapshot.a11yRules?.length ? (
                <section>
                  <h3 className="text-xs font-medium text-emerald-500/90 uppercase tracking-wide mb-2">
                    A11Y（可访问性）
                  </h3>
                  <ul className="list-disc list-inside space-y-1 text-zinc-400 text-xs">
                    {snapshot.a11yRules.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {tracesByDomain.length ? (
                <section>
                  <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">
                    命中证据（retrievalTrace）
                  </h3>
                  <div className="space-y-2">
                    {tracesByDomain.map(({ domain, items }) => (
                      <details
                        key={domain}
                        className="rounded-lg border border-zinc-800 bg-zinc-950/40 px-3 py-2"
                        open={domain === 'style'}
                      >
                        <summary className="cursor-pointer select-none text-xs text-zinc-300">
                          <span className="font-mono text-zinc-400">{domain}</span>{' '}
                          <span className="text-zinc-500">· top {items.length}</span>
                        </summary>
                        <div className="mt-2 space-y-2">
                          {items.map((t) => (
                            <div key={`${t.domain}:${t.id}`} className="text-[11px] text-zinc-400">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-mono text-zinc-300 break-all">{t.id}</span>
                                <span className="font-mono text-zinc-500 shrink-0">{t.score.toFixed(2)}</span>
                              </div>
                              {t.matchedTags?.length ? (
                                <div className="mt-1 flex flex-wrap gap-1">
                                  {t.matchedTags.slice(0, 10).map((k) => (
                                    <span
                                      key={`${t.id}:${k}`}
                                      className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 text-[10px] border border-zinc-700/70"
                                    >
                                      {k}
                                    </span>
                                  ))}
                                </div>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      </details>
                    ))}
                  </div>
                </section>
              ) : null}

              {snapshot.markdownBlock?.trim() ? (
                <MarkdownInjectBlock markdown={snapshot.markdownBlock} />
              ) : null}

              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleOpenStyleSettings}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors shadow-lg"
                >
                  <Palette className="w-4 h-4 shrink-0" aria-hidden />
                  打开风格设置
                </button>
                <p className="mt-2 text-[11px] text-zinc-500">
                  锁定、重新解析与上传参考图请在左侧「UI 风格选择」面板操作。
                </p>
              </div>
            </>
          )}

          <footer className="pt-3 border-t border-zinc-800 flex items-start gap-2 text-[11px] text-zinc-500 leading-relaxed">
            <BookMarked className="w-4 h-4 shrink-0 text-zinc-600 mt-0.5" aria-hidden />
            <div>
              文档：<span className="font-mono text-zinc-600">docs/DESIGN_SYSTEM_UUPM.md</span>、
              <span className="font-mono text-zinc-600">docs/DESIGN_SYSTEM_EXPERT_AUDIT_FINAL.md</span>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
