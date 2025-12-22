'use client';

import React, { useState } from 'react';
import { InstructionCard } from './InstructionCard';
import { InstructionHeader } from './InstructionHeader';

/**
 * Example usage of InstructionCard and InstructionHeader components
 */
export function InstructionExample() {
  const [searchValue, setSearchValue] = useState('');
  const [sortValue, setSortValue] = useState('latest');

  const instructions = [
    {
      id: 1,
      title: '完成用户登录功能开发',
      status: '进行中' as const,
      name: '张三',
      date: '2024-01-15',
      sourceTags: ['前端', 'React'],
      showActionButton: true,
      indicatorColor: 'bg-blue-500',
    },
    {
      id: 2,
      title: '优化数据库查询性能',
      status: '待处理' as const,
      name: '李四',
      date: '2024-01-14',
      sourceTags: ['后端', '数据库'],
      showActionButton: false,
      indicatorColor: 'bg-gray-500',
    },
    {
      id: 3,
      title: '修复支付接口bug',
      status: '已完成' as const,
      name: '王五',
      date: '2024-01-13',
      sourceTags: ['后端', 'API'],
      showActionButton: false,
      indicatorColor: 'bg-green-500',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <InstructionHeader
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        sortValue={sortValue}
        onSortChange={setSortValue}
      />

      {/* Card List */}
      <div className="p-4 space-y-3">
        {instructions.map((instruction) => (
          <InstructionCard
            key={instruction.id}
            title={instruction.title}
            status={instruction.status}
            name={instruction.name}
            date={instruction.date}
            sourceTags={instruction.sourceTags}
            showActionButton={instruction.showActionButton}
            onActionClick={() => {
              console.log('催办:', instruction.id);
            }}
            indicatorColor={instruction.indicatorColor}
          />
        ))}
      </div>
    </div>
  );
}


