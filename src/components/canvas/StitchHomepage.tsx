'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Sparkles, FolderPlus, Smartphone, Monitor, ChevronRight, FileStack, Paperclip } from 'lucide-react';
import { useCanvasStore } from '@/store/canvas-store';
import { clsx } from 'clsx';
import { getProjectList, getProjectData, type ProjectListItem } from '@/lib/project-list-storage';
import { toast } from 'sonner';

const SIDEBAR_WIDTH_PX = 220;

/** 首页「开始设计」通过自定义事件触发建图，避免 store 被 rehydrate 覆盖导致不触发 */
export const STITCH_START_DESIGN_EVENT = 'stitch-start-design';
export type StitchStartDesignDetail = {
  prompt: string;
  media: { mediaBase64: string; mediaType: 'image' | 'video' } | null;
  /** 首页选择的「应用」= mobile、「Web」= desktop，用于锁定节点详情中的 UI 预览视口 */
  viewport?: 'mobile' | 'desktop';
};

/** 试试这些描述：点击即触发生成 */
const EXAMPLE_PROMPTS = [
  {
    label: '打车 App',
    prompt: '我要做一个打车 app，包含乘客端下单、行程、订单与支付',
  },
  {
    label: '听歌 App',
    prompt: '我需要一个听歌app',
  },
  {
    label: '进销存系统',
    prompt: '我需要一个进销存系统',
  },
  {
    label: '购物软件',
    prompt: '我需要一个购物软件',
  },
];

/** 开始新的：仅「应用」「Web」为可选项；「设计」为文案非按钮 */
const START_TYPES = [
  { id: 'app', label: '应用', icon: Smartphone },
  { id: 'web', label: 'Web', icon: Monitor },
] as const;

function fileToBase64(file: File): Promise<{ mediaBase64: string; mediaType: 'image' | 'video' }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.replace(/^data:[^;]+;base64,/, '');
      const mediaType = file.type.startsWith('video/') ? 'video' : 'image';
      resolve({ mediaBase64: base64, mediaType });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function StitchHomepage() {
  const { setConversationPanelOpen, clearCanvas, loadProject, isAiCreatePending } = useCanvasStore();
  const [prompt, setPrompt] = useState('');
  const [startType, setStartType] = useState<(typeof START_TYPES)[number]['id']>('app');
  const [projectList, setProjectList] = useState<ProjectListItem[]>([]);
  const [homeAttachment, setHomeAttachment] = useState<{ mediaBase64: string; mediaType: 'image' | 'video' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setProjectList(getProjectList());
  }, []);

  const handleStartDesign = useCallback(() => {
    const text = prompt.trim();
    const hasContent = text || homeAttachment;
    if (!hasContent) return;
    setConversationPanelOpen(true);
    const promptToSend = text || '根据上传的文件生成产品图';
    const viewport = startType === 'web' ? 'desktop' : 'mobile';
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent(STITCH_START_DESIGN_EVENT, {
          detail: { prompt: promptToSend, media: homeAttachment, viewport } as StitchStartDesignDetail,
        })
      );
    }
    setPrompt('');
    setHomeAttachment(null);
  }, [prompt, homeAttachment, startType, setConversationPanelOpen]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    if (!isImage && !isVideo) {
      toast.error('请选择图片或视频文件');
      return;
    }
    fileToBase64(file).then(setHomeAttachment).catch(() => toast.error('文件读取失败'));
    e.target.value = '';
  }, []);

  const handleExampleClick = useCallback(
    (examplePrompt: string) => {
      setConversationPanelOpen(true);
      const viewport = startType === 'web' ? 'desktop' : 'mobile';
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent(STITCH_START_DESIGN_EVENT, {
            detail: { prompt: examplePrompt, media: null, viewport } as StitchStartDesignDetail,
          })
        );
      }
    },
    [startType, setConversationPanelOpen]
  );

  const handleNewProject = useCallback(() => {
    clearCanvas();
    setProjectList(getProjectList());
  }, [clearCanvas]);

  const handleOpenProject = useCallback(
    (id: string) => {
      const data = getProjectData(id);
      if (!data) {
        toast.error('项目数据已损坏或不存在');
        setProjectList(getProjectList());
        return;
      }
      loadProject({ nodes: data.nodes as any, edges: data.edges as any });
    },
    [loadProject]
  );

  return (
    <div className="flex h-full w-full bg-zinc-950 relative">
      {/* 生成画布中：全屏加载态，生成完成后自动切到画布 */}
      {isAiCreatePending && (
        <div data-testid="stitch-creating-overlay" className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-zinc-950/90 backdrop-blur-sm" aria-live="polite">
          <div className="w-10 h-10 border-2 border-zinc-600 border-t-cyan-400 rounded-full animate-spin" />
          <p className="mt-4 text-sm text-zinc-300">正在生成画布…</p>
          <p className="mt-1 text-xs text-zinc-500">完成后将自动进入画布</p>
        </div>
      )}
      {/* 左侧边栏：我的项目列表 */}
      <aside
        className="flex-shrink-0 border-r border-zinc-800 flex flex-col bg-zinc-900/50"
        style={{ width: SIDEBAR_WIDTH_PX }}
        aria-label="我的项目"
      >
        <div className="p-3 border-b border-zinc-800">
          <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-wider">我的项目</h2>
        </div>
        <nav className="flex-1 overflow-auto p-2 space-y-0.5">
          <button
            type="button"
            onClick={handleNewProject}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 text-sm transition-colors"
          >
            <FolderPlus className="w-4 h-4 shrink-0 text-cyan-400" />
            <span>新建项目</span>
          </button>
          {projectList.length === 0 ? (
            <p className="px-3 py-4 text-xs text-zinc-500">暂无项目</p>
          ) : (
            <ul className="space-y-0.5 pt-2">
              {projectList.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => handleOpenProject(item.id)}
                    className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-cyan-300 text-sm transition-colors"
                  >
                    <FileStack className="w-4 h-4 shrink-0 opacity-70" />
                    <span className="truncate flex-1">{item.name}</span>
                    <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-60" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </nav>
      </aside>

      {/* 主内容区：大输入 + 上传 + 开始设计 */}
      <main className="flex-1 min-w-0 flex flex-col items-center justify-center px-8 py-12">
        <div className="w-full max-w-2xl">
          <p className="text-sm font-medium text-zinc-500 mb-3">开始新的</p>
          <div className="flex items-center gap-2 mb-8 flex-wrap">
            {START_TYPES.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setStartType(id)}
                className={clsx(
                  'inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors',
                  startType === id
                    ? 'border-cyan-500/60 bg-cyan-500/10 text-cyan-300'
                    : 'border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300'
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
            <span className="text-sm text-zinc-400">设计</span>
          </div>

          <div className="relative rounded-2xl border-2 border-zinc-700 focus-within:border-cyan-500/50 bg-zinc-900/80 transition-colors">
            <textarea
              data-testid="stitch-home-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleStartDesign();
                }
              }}
              placeholder="例如：我要做一个打车 app，包含乘客端下单、行程、订单与支付"
              rows={4}
              className="w-full resize-none bg-transparent pl-12 pr-4 py-4 pt-4 pb-12 text-zinc-100 placeholder-zinc-400 focus:outline-none text-sm leading-relaxed"
              aria-label="描述设计内容"
            />
            <div className="absolute left-3 top-4 flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                onChange={handleFileSelect}
                className="hidden"
                aria-label="上传文件"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded-lg text-zinc-400 hover:text-cyan-400 hover:bg-zinc-800 transition-colors"
                title="上传文件"
                aria-label="上传文件"
              >
                <Paperclip className="w-4 h-4" />
              </button>
              {homeAttachment && (
                <span className="text-xs text-cyan-400">已选文件</span>
              )}
            </div>
            <div className="absolute bottom-3 right-3 flex items-center gap-2">
              <button
                type="button"
                data-testid="stitch-start-design"
                onClick={handleStartDesign}
                disabled={!prompt.trim() && !homeAttachment}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium text-sm transition-colors shadow-lg"
                aria-label="开始设计"
              >
                <Sparkles className="w-4 h-4" />
                开始设计
              </button>
            </div>
          </div>

          <p className="text-xs text-zinc-500 mt-4 mb-2">试试这些描述</p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_PROMPTS.map(({ label, prompt: examplePrompt }) => (
              <button
                key={label}
                type="button"
                onClick={() => handleExampleClick(examplePrompt)}
                className="px-3 py-1.5 rounded-lg bg-zinc-800/80 border border-zinc-700 text-zinc-300 hover:border-cyan-500/40 hover:text-cyan-300 text-sm transition-colors"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
