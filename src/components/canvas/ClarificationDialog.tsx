'use client';

import React from 'react';
import { X, Sparkles, ArrowRight } from 'lucide-react';

interface ClarificationOption {
  id: string;
  label: string;
  desc: string;
  example: string;
}

interface ClarificationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
  question: string;
  options: ClarificationOption[];
  onSelectOption: (option: ClarificationOption) => void;
  onUseScenario: (option: ClarificationOption) => void;
  originalPrompt?: string;
}

export function ClarificationDialog({
  isOpen,
  onClose,
  message,
  question,
  options,
  onSelectOption,
  onUseScenario,
  originalPrompt,
}: ClarificationDialogProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-3xl mx-4 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Sparkles className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-zinc-200">需要更多信息</h2>
              <p className="text-sm text-zinc-400">请选择最符合您需求的业务场景</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
            aria-label="关闭"
          >
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 消息 */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <p className="text-sm text-zinc-200">{message}</p>
            {originalPrompt && (
              <div className="mt-3 pt-3 border-t border-blue-500/20">
                <p className="text-xs text-zinc-400 mb-1">您的原始输入：</p>
                <p className="text-sm text-zinc-300 italic">"{originalPrompt}"</p>
              </div>
            )}
          </div>

          {/* 问题 */}
          <div>
            <p className="text-base font-medium text-zinc-200 mb-4">{question}</p>
          </div>

          {/* 选项列表 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {options.map((option) => (
              <div
                key={option.id}
                className="group relative bg-zinc-950 border border-zinc-800 rounded-xl p-5 hover:border-purple-500/50 transition-all cursor-pointer"
              >
                {/* 选项内容 */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <h3 className="text-base font-semibold text-zinc-200 group-hover:text-purple-400 transition-colors">
                      {option.label}
                    </h3>
                    <span className="text-xs font-medium px-2 py-1 rounded bg-purple-500/20 text-purple-400 border border-purple-500/30">
                      {option.id}
                    </span>
                  </div>
                  
                  <p className="text-sm text-zinc-400 leading-relaxed">{option.desc}</p>
                  
                  <div className="pt-2 border-t border-zinc-800">
                    <p className="text-xs text-zinc-500 mb-1">功能示例：</p>
                    <p className="text-xs text-zinc-400">{option.example}</p>
                  </div>
                </div>

                {/* 操作按钮 */}
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => onSelectOption(option)}
                    className="flex-1 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <span>编辑描述</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onUseScenario(option)}
                    className="flex-1 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 text-sm font-medium rounded-lg border border-purple-500/30 transition-colors flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>快速生成</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 底部提示 */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950/50">
          <p className="text-xs text-zinc-500 text-center">
            提示：点击"编辑描述"可以基于此场景修改您的需求，点击"快速生成"将直接生成该场景的产品结构
          </p>
        </div>
      </div>
    </div>
  );
}

