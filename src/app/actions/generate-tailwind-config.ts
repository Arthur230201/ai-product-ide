'use server';

import { createServerAction } from 'zsa';
import { z } from 'zod';
import { log, logError } from '@/lib/logger';
import { getTextModel, ensureOpenAIKey } from '@/lib/ai-config';
import { callText } from '@/lib/ai/llm';

const generateTailwindConfigSchema = z.object({
  designRequirement: z.string().describe('用户的设计需求描述（如"深蓝/淡蓝"、"深色主题"等）'),
  existingConfig: z.string().optional().describe('现有的 tailwind.config 对象（JSON 字符串）'),
  htmlContext: z.string().optional().describe('HTML 上下文，用于分析使用的颜色类名'),
});

/**
 * Layer 2: 语义配置层 - AI 生成 tailwind.config
 * 
 * 核心原则：
 * - 严禁 AI 直接修改 HTML 标签里的颜色类名
 * - AI 的唯一任务是根据用户需求，生成 tailwind.config 对象
 * - 通过覆盖 Tailwind 默认色板，实现"换肤不换骨"
 */
export const generateTailwindConfig = createServerAction()
  .input(generateTailwindConfigSchema)
  .handler(async ({ input }) => {
    try {
      ensureOpenAIKey();
      const { designRequirement, existingConfig, htmlContext } = input;

      log('🎨 [generateTailwindConfig] 开始生成语义配置', {
        designRequirement,
        hasExistingConfig: !!existingConfig,
        hasHtmlContext: !!htmlContext,
      });

      // 分析 HTML 中使用的颜色类名（如果提供了 HTML 上下文）
      let colorClasses: string[] = [];
      if (htmlContext) {
        // 提取所有 bg-*, text-*, border-* 等颜色类名
        const colorClassPattern = /\b(bg|text|border|ring|divide|from|via|to)-(\w+)-(\d+)\b/g;
        const matches = htmlContext.matchAll(colorClassPattern);
        colorClasses = Array.from(matches, (m: RegExpMatchArray) => m[0]);
        // 去重
        colorClasses = [...new Set(colorClasses)];
      }

      // 构建系统提示词
      const systemPrompt = `# Role: JIT Configuration Architect
你是一个 Tailwind CSS JIT 配置专家。
你的任务不是重写 HTML 结构，而是生成一个 \`tailwind.config\` 对象来接管视觉风格。

# 核心任务流程
1. **分析意图**：根据用户输入的颜色要求（如"深蓝/淡蓝"、"深色主题"等）。
2. **定义语义变量**：
   - 必须定义 \`primary\`: 主色调。
   - 必须定义 \`background\`: 全局背景色。
   - 必须定义 \`surface\`: 卡片/容器背景色。
3. **输出 Config**：仅输出 \`tailwind.config\` 的 JavaScript 对象代码（不包含 <script> 标签）。

# 严格约束 (Constraints)
- **禁止修改 HTML 标签**：不要去把 \`<div class="bg-blue-500">\` 改成 \`<div class="bg-[#xxxx]">\`。
- **映射逻辑**：
  - 如果用户 HTML 里用的是 \`bg-blue-600\`，你在 Config 里把 \`blue: { 600: '#您的深蓝HEX' }\` 进行覆盖。
  - 通过覆盖 Tailwind 默认色板，实现"换肤不换骨"。
- **输出格式**：只输出 JavaScript 对象，格式如下：
  \`\`\`javascript
  {
    theme: {
      extend: {
        colors: {
          // 覆盖默认蓝色，接管所有相关组件
          blue: {
            50: '#F0F9FF',
            600: '#1E3A8A', // 您的深蓝主色
          },
          // 定义语义化别名
          primary: '#1E3A8A',
          background: '#F3F4F6',
          surface: '#FFFFFF',
        }
      }
    },
    darkMode: 'class', // 强制手动模式，防止随系统变黑
  }
  \`\`\`

# 示例
用户需求："深蓝色主题"
HTML 中使用了：bg-blue-600, text-blue-500
输出：
\`\`\`javascript
{
  theme: {
    extend: {
      colors: {
        blue: {
          600: '#1E3A8A', // 覆盖默认 blue-600 为深蓝
          500: '#2563EB', // 覆盖默认 blue-500
        },
        primary: '#1E3A8A',
        background: '#F3F4F6',
        surface: '#FFFFFF',
      }
    }
  },
  darkMode: 'class',
}
\`\`\``;

      // 构建用户提示词
      let userPrompt = `用户设计需求：${designRequirement}\n\n`;
      
      if (htmlContext) {
        userPrompt += `HTML 中使用的颜色类名：${colorClasses.slice(0, 20).join(', ')}${colorClasses.length > 20 ? '...' : ''}\n\n`;
      }
      
      if (existingConfig) {
        userPrompt += `现有配置（可选，可以在此基础上修改）：\n\`\`\`javascript\n${existingConfig}\n\`\`\`\n\n`;
      }
      
      userPrompt += `请根据上述需求生成 tailwind.config 对象。只输出 JavaScript 对象代码，不要包含 <script> 标签或其他说明文字。`;

      // 调用 AI 生成配置
      const model = getTextModel();
      const result = await callText({
        model,
        prompt: `${systemPrompt}\n\n${userPrompt}`,
        actionName: 'generateTailwindConfig',
        mode: 'config',
      });

      if (!result.ok) {
        // Return error union instead of throwing
        return {
          config: `{
  theme: {
    extend: {
      colors: {
        primary: '#1E3A8A',
        background: '#F3F4F6',
        surface: '#FFFFFF',
      }
    }
  },
  darkMode: 'class',
}`,
          success: false,
          error: result.message,
        };
      }

      let configCode = result.data.trim();

      // 清理输出：移除可能的 markdown 代码块标记
      configCode = configCode.replace(/^```(?:javascript|js|json)?\n?/i, '');
      configCode = configCode.replace(/\n?```$/i, '');
      configCode = configCode.trim();

      // 验证输出是否为有效的 JavaScript 对象
      try {
        // 尝试解析（包装成对象以便验证）
        const testCode = `(${configCode})`;
        eval(testCode);
      } catch (parseError) {
        logError('⚠️ [generateTailwindConfig] 生成的配置无法解析，使用默认配置', parseError);
        // 如果解析失败，返回默认配置
        configCode = `{
  theme: {
    extend: {
      colors: {
        primary: '#1E3A8A',
        background: '#F3F4F6',
        surface: '#FFFFFF',
      }
    }
  },
  darkMode: 'class',
}`;
      }

      log('✅ [generateTailwindConfig] 配置生成成功', {
        configLength: configCode.length,
      });

      return {
        config: configCode,
        success: true,
      };
    } catch (error) {
      logError('❌ [generateTailwindConfig] 生成配置失败', error);
      
      // 返回默认配置作为降级方案
      return {
        config: `{
  theme: {
    extend: {
      colors: {
        primary: '#1E3A8A',
        background: '#F3F4F6',
        surface: '#FFFFFF',
      }
    }
  },
  darkMode: 'class',
}`,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  });

