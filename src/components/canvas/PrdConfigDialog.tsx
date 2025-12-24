import React, { useState, useEffect } from 'react';
import { X, Info } from 'lucide-react';
import { PrdOptions } from '@/utils/codeToPrdTable';

interface PrdConfigDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (options: PrdOptions) => void;
  initialValues?: PrdOptions;
  aiInferred?: PrdOptions;
}

const COMMON_ROLES = [
  '员工',
  '经理',
  '管理员',
  '项目经理',
  '产品经理',
  '运营人员',
  '客服人员',
  '财务人员',
];

const COMMON_PREREQUISITES = [
  '用户已登录系统',
  '用户具备相应的访问权限',
  '用户角色已分配',
  '用户已完成实名认证',
  '用户已绑定手机号',
];

export function PrdConfigDialog({
  isOpen,
  onClose,
  onConfirm,
  initialValues,
  aiInferred,
}: PrdConfigDialogProps) {
  const [formData, setFormData] = useState<PrdOptions>({
    userRole: '',
    coreValue: '',
    businessValue: '',
    prerequisites: [],
    pageTitle: '',
  });

  const [customRole, setCustomRole] = useState('');
  const [showCustomRole, setShowCustomRole] = useState(false);
  const [customPrerequisite, setCustomPrerequisite] = useState('');

  // 初始化表单数据：优先级 初始值 > AI推断
  useEffect(() => {
    if (isOpen) {
      setFormData({
        userRole: initialValues?.userRole || aiInferred?.userRole || '',
        coreValue: initialValues?.coreValue || aiInferred?.coreValue || '',
        businessValue: initialValues?.businessValue || aiInferred?.businessValue || '',
        prerequisites: initialValues?.prerequisites || aiInferred?.prerequisites || [],
        pageTitle: initialValues?.pageTitle || aiInferred?.pageTitle || '',
      });
      setShowCustomRole(false);
      setCustomRole('');
      setCustomPrerequisite('');
    }
  }, [isOpen, initialValues, aiInferred]);

  const handleRoleChange = (value: string) => {
    if (value === 'custom') {
      setShowCustomRole(true);
      setFormData({ ...formData, userRole: '' });
    } else {
      setShowCustomRole(false);
      setFormData({ ...formData, userRole: value });
    }
  };

  const handleCustomRoleConfirm = () => {
    if (customRole.trim()) {
      setFormData({ ...formData, userRole: customRole.trim() });
      setShowCustomRole(false);
      setCustomRole('');
    }
  };

  const handlePrerequisiteToggle = (prereq: string) => {
    const current = formData.prerequisites || [];
    if (current.includes(prereq)) {
      setFormData({
        ...formData,
        prerequisites: current.filter(p => p !== prereq),
      });
    } else {
      setFormData({
        ...formData,
        prerequisites: [...current, prereq],
      });
    }
  };

  const handleAddCustomPrerequisite = () => {
    if (customPrerequisite.trim()) {
      const current = formData.prerequisites || [];
      if (!current.includes(customPrerequisite.trim())) {
        setFormData({
          ...formData,
          prerequisites: [...current, customPrerequisite.trim()],
        });
        setCustomPrerequisite('');
      }
    }
  };

  const handleConfirm = () => {
    // 如果选择了自定义角色但还没确认，使用自定义输入的值
    const finalRole = showCustomRole && customRole.trim() 
      ? customRole.trim() 
      : formData.userRole;
    
    if (!finalRole) {
      alert('请选择或输入用户角色');
      return;
    }

    onConfirm({
      ...formData,
      userRole: finalRole,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-zinc-900 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto border border-zinc-800">
        {/* Header */}
        <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">PRD 生成配置</h2>
            <p className="text-sm text-zinc-400 mt-1">
              填写以下信息以生成更准确的业务需求文档
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* 用户角色 */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              用户角色 <span className="text-red-500">*</span>
            </label>
            {!showCustomRole ? (
              <>
                <select
                  value={formData.userRole}
                  onChange={(e) => handleRoleChange(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">请选择...</option>
                  {COMMON_ROLES.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                  <option value="custom">自定义...</option>
                </select>
                {aiInferred?.userRole && !initialValues?.userRole && (
                  <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
                    <Info size={12} />
                    AI推断：{aiInferred.userRole}（可修改）
                  </p>
                )}
              </>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customRole}
                  onChange={(e) => setCustomRole(e.target.value)}
                  placeholder="请输入自定义角色"
                  className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleCustomRoleConfirm();
                    }
                  }}
                />
                <button
                  onClick={handleCustomRoleConfirm}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
                >
                  确认
                </button>
                <button
                  onClick={() => {
                    setShowCustomRole(false);
                    setCustomRole('');
                  }}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded"
                >
                  取消
                </button>
              </div>
            )}
          </div>

          {/* 核心价值 */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              核心价值
            </label>
            <textarea
              value={formData.coreValue}
              onChange={(e) => setFormData({ ...formData, coreValue: e.target.value })}
              placeholder="例如：提供指令管理和流转功能，帮助用户高效处理工作任务"
              className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 h-20 text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            {aiInferred?.coreValue && !initialValues?.coreValue && (
              <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
                <Info size={12} />
                AI推断：{aiInferred.coreValue}
              </p>
            )}
          </div>

          {/* 业务价值 */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              业务价值（用户故事中的&ldquo;so that&rdquo;部分）
            </label>
            <textarea
              value={formData.businessValue}
              onChange={(e) => setFormData({ ...formData, businessValue: e.target.value })}
              placeholder="例如：提升任务处理效率和协作透明度"
              className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 h-20 text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            {aiInferred?.businessValue && !initialValues?.businessValue && (
              <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
                <Info size={12} />
                AI推断：{aiInferred.businessValue}
              </p>
            )}
          </div>

          {/* 前置条件 */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              前置条件
            </label>
            <div className="space-y-2 mb-3">
              {COMMON_PREREQUISITES.map(prereq => (
                <label key={prereq} className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={(formData.prerequisites || []).includes(prereq)}
                    onChange={() => handlePrerequisiteToggle(prereq)}
                    className="mr-2 w-4 h-4 text-blue-600 bg-zinc-800 border-zinc-700 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-zinc-300">{prereq}</span>
                </label>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={customPrerequisite}
                onChange={(e) => setCustomPrerequisite(e.target.value)}
                placeholder="添加自定义前置条件"
                className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddCustomPrerequisite();
                  }
                }}
              />
              <button
                onClick={handleAddCustomPrerequisite}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded"
              >
                添加
              </button>
            </div>
            {aiInferred?.prerequisites && aiInferred.prerequisites.length > 0 && 
             (!initialValues?.prerequisites || initialValues.prerequisites.length === 0) && (
              <p className="text-xs text-zinc-500 mt-2 flex items-center gap-1">
                <Info size={12} />
                AI推断：{aiInferred.prerequisites.join('、')}
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-zinc-900 border-t border-zinc-800 px-6 py-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
          >
            生成 PRD
          </button>
        </div>
      </div>
    </div>
  );
}

