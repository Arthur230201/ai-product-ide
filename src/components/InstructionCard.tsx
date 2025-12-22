'use client';

import React from 'react';
import { User, Calendar } from 'lucide-react';

interface InstructionCardProps {
  title: string;
  status: '进行中' | '已完成' | '待处理';
  avatar?: string;
  name: string;
  date: string;
  sourceTags?: string[];
  showActionButton?: boolean;
  onActionClick?: () => void;
  indicatorColor?: string;
  category?: string; // 指令类别，用于动态设置指示条颜色
}

export function InstructionCard({
  title,
  status,
  avatar,
  name,
  date,
  sourceTags = [],
  showActionButton = false,
  onActionClick,
  indicatorColor,
  category,
}: InstructionCardProps) {
  const statusStyles = {
    '进行中': 'bg-blue-50 text-blue-600',
    '已完成': 'bg-green-50 text-green-600',
    '待处理': 'bg-gray-50 text-gray-600',
  };

  // 根据category动态设置指示条颜色
  // "创意落地"使用紫色，其他使用蓝色
  const getIndicatorColor = (): string => {
    if (indicatorColor) {
      return indicatorColor;
    }
    if (category === '创意落地') {
      return 'bg-purple-500';
    }
    return 'bg-blue-500';
  };

  return (
    <div className="relative bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      {/* Left Indicator Bar - CRITICAL: Must be visible on every card */}
      <div 
        className={`absolute left-0 top-0 h-full w-2 ${getIndicatorColor()} rounded-l-lg`}
      />

      {/* Card Body - Vertical Column */}
      {/* Add left padding to prevent content overlap with indicator bar */}
      <div className="flex flex-col pl-5 pr-4 pt-3 pb-3">
        {/* Header Row: Title + Status Badge */}
        <div className="flex items-center gap-2 mb-2">
          <h3 className="flex-1 font-semibold text-gray-900 text-sm">
            {title}
          </h3>
          <span className={`px-2 py-0.5 text-xs font-medium rounded ${statusStyles[status]}`}>
            {status}
          </span>
        </div>

        {/* Meta Row: Avatar + Name + Date */}
        <div className="flex items-center gap-2 mb-2">
          {avatar ? (
            <img 
              src={avatar} 
              alt={name}
              className="w-5 h-5 rounded-full"
            />
          ) : (
            <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center">
              <User className="w-3 h-3 text-gray-500" />
            </div>
          )}
          <span className="text-xs text-gray-400">{name}</span>
          <span className="text-xs text-gray-400">•</span>
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3 text-gray-400" />
            <span className="text-xs text-gray-400">{date}</span>
          </div>
        </div>

        {/* Footer Row: Source Tags (Left) + Action Button (Right) */}
        <div className="flex items-center justify-between">
          {/* Source Tags */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {sourceTags.map((tag, index) => (
              <span
                key={index}
                className="px-2 py-0.5 text-xs text-gray-500 bg-gray-100 rounded"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Action Button (Only if needed) */}
          {showActionButton && (
            <button
              onClick={onActionClick}
              className="h-8 px-3 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
            >
              催办
            </button>
          )}
        </div>
      </div>
    </div>
  );
}


