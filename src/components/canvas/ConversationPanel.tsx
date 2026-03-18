'use client';

import React, { useRef, useEffect } from 'react';
import { Send, Bot, User, MessageCircle, PanelRightClose } from 'lucide-react';
import { useCanvasStore } from '@/store/canvas-store';
import type { ConversationMessage, ClarificationOption } from '@/store/canvas-store';
import { clsx } from 'clsx';
import { CommandBar } from './CommandBar';

export interface ConversationPanelProps {
  /** 用户回复澄清或输入后续说明时调用（由 CommandBar 传入，内部会带上 context 再调 generateGraph） */
  onSubmitReply?: (reply: string) => void;
  /** 是否正在发送（禁用输入与选项点击） */
  isSubmitting?: boolean;
  /** 收起面板为窄轨时调用 */
  onCollapse?: () => void;
}

export function ConversationPanel({ onSubmitReply, isSubmitting, onCollapse }: ConversationPanelProps) {
  const {
    conversationMessages,
    pendingClarificationContext,
    nodeEditSpecClarify,
    appendConversationMessage,
    setPendingClarificationReply,
    setPendingNodeEditSpecFollowUp,
  } = useCanvasStore();
  const [replyDraft, setReplyDraft] = React.useState('');
  const [selectedViewport, setSelectedViewport] = React.useState<'mobile' | 'desktop' | null>(null);
  const listEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationMessages.length]);

  const lastAssistant = [...conversationMessages].reverse().find((m) => m.role === 'assistant');
  useEffect(() => {
    if (lastAssistant?.clarification?.viewportOptions) setSelectedViewport(null);
    // 仅在新的一条澄清消息出现时重置视口选择，依赖 lastAssistant?.id 即可
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastAssistant?.id]);

  const viewportPrefix = (): string => {
    const v = selectedViewport === 'desktop' ? '桌面端' : '移动端';
    return `视口：${v}`;
  };

  const handleSendReply = () => {
    const text = replyDraft.trim();
    if (!text || isSubmitting) return;
    if (nodeEditSpecClarify) {
      appendConversationMessage({
        id: `user-${Date.now()}`,
        role: 'user',
        content: text,
        status: 'done',
      });
      setPendingNodeEditSpecFollowUp({
        nodeId: nodeEditSpecClarify.nodeId,
        rounds: [...nodeEditSpecClarify.rounds, text],
      });
      setReplyDraft('');
      return;
    }
    if (!pendingClarificationContext) return;
    const reply = `${viewportPrefix()}；补充：${text}`;
    appendConversationMessage({
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      status: 'done',
    });
    setPendingClarificationReply(reply);
    setReplyDraft('');
    onSubmitReply?.(reply);
  };

  const handleOptionClick = (option: ClarificationOption) => {
    if (isSubmitting) return;
    if (nodeEditSpecClarify) {
      appendConversationMessage({
        id: `user-${Date.now()}`,
        role: 'user',
        content: option.label,
        status: 'done',
      });
      setPendingNodeEditSpecFollowUp({
        nodeId: nodeEditSpecClarify.nodeId,
        rounds: [...nodeEditSpecClarify.rounds, option.label],
      });
      return;
    }
    if (!pendingClarificationContext) return;
    const reply = `${viewportPrefix()}；场景：${option.label}`;
    appendConversationMessage({
      id: `user-${Date.now()}`,
      role: 'user',
      content: option.label,
      status: 'done',
    });
    setPendingClarificationReply(reply);
    onSubmitReply?.(reply);
  };

  const hasClarification = pendingClarificationContext !== null || nodeEditSpecClarify !== null;
  const showOptions = hasClarification && lastAssistant?.clarification?.options?.length;

  return (
    <div
      className="flex flex-col h-full overflow-hidden bg-zinc-900"
      role="region"
      aria-label="AI 对话"
    >
      <div className="flex-shrink-0 flex items-center justify-between gap-2 px-4 py-3 border-b border-zinc-800">
        <div className="flex items-center gap-2 min-w-0">
          <MessageCircle className="w-5 h-5 text-cyan-400 shrink-0" aria-hidden />
          <span className="font-medium text-zinc-100 truncate">AI 对话</span>
        </div>
        {onCollapse && (
          <button
            type="button"
            onClick={onCollapse}
            className="p-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors shrink-0"
            title="收起到侧边"
            aria-label="收起到侧边"
          >
            <PanelRightClose className="w-4 h-4" />
          </button>
        )}
      </div>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-3 flex flex-col gap-4" role="log" aria-live="polite">
          {conversationMessages.length === 0 ? (
            <div className="text-zinc-500 text-sm py-8 space-y-3">
              <p>在这里可以看到你的输入与 AI 的回复；当需求不够明确时，AI 会在这里追问，你只需选择或输入补充说明即可。</p>
              <p className="text-cyan-400/90 text-xs">
                在节点编辑页：当前 Tab 为「UI / 需求 / 实现 / 测试」时，输入分别针对界面与交互、PRD、技术实现、测试用例。画布底部输入框发送后对话显示在此。
              </p>
            </div>
          ) : (
            conversationMessages.map((m) => (
              <div
                key={m.id}
                className={clsx(
                  'flex',
                  m.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={clsx(
                    'flex items-start gap-2 max-w-[90%] rounded-xl px-3 py-2.5',
                    m.role === 'user'
                      ? 'bg-cyan-500/20 border border-cyan-500/30'
                      : 'bg-zinc-800 border border-zinc-700',
                    m.status === 'error' && 'border-red-500/50 text-red-300'
                  )}
                >
                  {m.role === 'assistant' && (
                    <Bot className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" aria-hidden />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm text-zinc-100 break-words whitespace-pre-wrap">{m.content}</p>
                    {m.role === 'user' && m.attachmentSummary && (
                      <p className="text-xs text-zinc-500 mt-1">{m.attachmentSummary}</p>
                    )}
                    {m.role === 'assistant' && m.clarification && (
                      <div className="mt-3 space-y-3">
                        {m.clarification.viewportOptions && m.clarification.viewportOptions.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-xs text-zinc-400">{m.clarification.viewportQuestion ?? '请选择使用设备类型'}</p>
                            <div className="flex gap-2">
                              {m.clarification.viewportOptions.map((opt) => (
                                <button
                                  key={opt.id}
                                  type="button"
                                  disabled={isSubmitting}
                                  onClick={() => setSelectedViewport(opt.id as 'mobile' | 'desktop')}
                                  className={clsx(
                                    'rounded-xl px-4 py-2.5 text-sm font-medium border transition-colors',
                                    selectedViewport === opt.id
                                      ? 'bg-cyan-600 border-cyan-500 text-white'
                                      : 'bg-zinc-700/80 border-zinc-600 text-zinc-100 hover:bg-cyan-600/20 hover:border-cyan-500/40'
                                  )}
                                >
                                  {opt.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                        {m.clarification.question && (
                          <p className="text-xs text-zinc-400">{m.clarification.question}</p>
                        )}
                        {m.clarification.options?.length > 0 && (
                          <div className="flex flex-col gap-2">
                            {m.clarification.options.map((opt) => (
                              <button
                                key={opt.id}
                                type="button"
                                disabled={isSubmitting}
                                onClick={() => handleOptionClick(opt)}
                                className="w-full text-left rounded-xl px-4 py-3 bg-zinc-700/80 hover:bg-cyan-600/20 border border-zinc-600 hover:border-cyan-500/40 text-zinc-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <span className="block font-medium text-sm">{opt.label}</span>
                                {opt.desc && (
                                  <span className="block text-xs text-zinc-500 mt-1 line-clamp-2">{opt.desc}</span>
                                )}
                                {opt.example && (
                                  <span className="block text-xs text-zinc-600 mt-1 line-clamp-1">{opt.example}</span>
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {m.role === 'user' && (
                    <User className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" aria-hidden />
                  )}
                </div>
              </div>
            ))
          )}
          <div ref={listEndRef} />
        </div>

        {/* 底部：澄清时显示输入框 + 发送，或提示 */}
        {hasClarification && (
          <div className="flex-shrink-0 border-t border-zinc-800 p-3 space-y-2">
            <p className="text-xs text-zinc-500">
              {nodeEditSpecClarify
                ? '选择上方选项或输入补充说明后发送，将据此更新本节点需求。'
                : '选择上方选项或输入补充说明后发送，AI 将根据你的回复继续生成。'}
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={replyDraft}
                onChange={(e) => setReplyDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendReply();
                  }
                }}
                placeholder="输入补充说明…"
                disabled={isSubmitting}
                className="flex-1 px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder-zinc-500 text-sm focus:outline-none focus:border-cyan-500/50 disabled:opacity-50"
              />
              <button
                type="button"
                onClick={handleSendReply}
                disabled={!replyDraft.trim() || isSubmitting}
                className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                发送
              </button>
            </div>
          </div>
        )}

        {/* 建图输入区：直接放在常驻对话框下方 */}
        <div className="flex-shrink-0 bg-zinc-900/50">
          <CommandBar embedInPanel />
        </div>
    </div>
  );
}
