'use client';

import { useState, useRef, useEffect } from 'react';
import { Settings, X } from 'lucide-react';
import { useCanvasStore } from '@/store/canvas-store';

export function AIConfigButton() {
  const { aiConfig, updateAIConfig } = useCanvasStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all bg-zinc-700 hover:bg-zinc-600 text-white cursor-pointer shadow-lg hover:shadow-xl active:scale-95"
        title="配置 AI 模型"
        aria-label="AI 模型配置"
      >
        <Settings className="w-4 h-4" />
        AI 配置
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl z-50">
          <div className="p-4">
            {/* 标题栏 */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-zinc-200">AI 模型配置</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-zinc-800 rounded transition-colors"
                aria-label="关闭"
              >
                <X className="w-4 h-4 text-zinc-400" />
              </button>
            </div>

            {/* 配置表单 */}
            <div className="space-y-4">
              <div className="flex flex-col">
                <label htmlFor="visionModel" className="text-xs font-medium text-zinc-300 mb-1.5">
                  视觉模型 (Vision Model)
                </label>
                <input
                  id="visionModel"
                  type="text"
                  className="w-full bg-zinc-800/50 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50"
                  placeholder="例如：gpt-5-2025-08-07, gpt-4o"
                  value={aiConfig.visionModel}
                  onChange={(e) => updateAIConfig({ visionModel: e.target.value })}
                />
                <p className="text-xs text-zinc-500 mt-1">
                  用于 UI 生成、拓扑解析等需要视觉输入的任务
                </p>
              </div>

              <div className="flex flex-col">
                <label htmlFor="textModel" className="text-xs font-medium text-zinc-300 mb-1.5">
                  文本模型 (Text Model)
                </label>
                <input
                  id="textModel"
                  type="text"
                  className="w-full bg-zinc-800/50 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50"
                  placeholder="例如：gpt-5-2025-08-07, gpt-4o"
                  value={aiConfig.textModel}
                  onChange={(e) => updateAIConfig({ textModel: e.target.value })}
                />
                <p className="text-xs text-zinc-500 mt-1">
                  用于 PRD 生成、代码分析等纯文本任务
                </p>
              </div>

              {/* 提示信息 */}
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-md p-3">
                <p className="text-xs text-blue-300 font-medium mb-1.5">💡 提示</p>
                <ul className="text-xs text-blue-200/80 space-y-0.5 list-disc list-inside">
                  <li>模型名称必须与 OpenAI API 支持的模型名称一致</li>
                  <li>视觉模型需要支持图像输入（如 gpt-4o, gpt-5-2025-08-07）</li>
                  <li>配置会保存在本地，刷新页面后仍然有效</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

