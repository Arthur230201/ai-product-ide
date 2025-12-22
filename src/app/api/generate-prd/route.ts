import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

export async function POST(request: NextRequest) {
  try {
    // 检查环境变量
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY 未配置' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { nodes, projectMeta, globalRules } = body;

    if (!nodes || !Array.isArray(nodes) || nodes.length === 0) {
      return NextResponse.json(
        { error: '节点数据无效' },
        { status: 400 }
      );
    }

    // 获取项目画像配置
    const meta = projectMeta || {
      projectName: '未命名项目',
      industry: 'General Internet',
      targetAudience: 'General Users',
      description: '',
      version: '1.0.0',
    };

    const { projectName, industry, targetAudience, description } = meta;

    // 根据行业动态调整语调和风格
    let toneInstruction = '';
    const industryLower = industry.toLowerCase();
    if (industryLower.includes('gaming') || industryLower.includes('游戏') || 
        industryLower.includes('social') || industryLower.includes('社交')) {
      toneInstruction = '采用生动、用户导向、富有创意的语调，注重用户体验和互动性。';
    } else if (industryLower.includes('finance') || industryLower.includes('fintech') || 
               industryLower.includes('healthcare') || industryLower.includes('医疗') ||
               industryLower.includes('logistics') || industryLower.includes('物流')) {
      toneInstruction = '采用严谨、专业、安全优先的语调，注重合规性、准确性和安全性。';
    } else {
      toneInstruction = '采用清晰、专业、用户友好的语调。';
    }

    // 构建节点信息摘要
    const nodesSummary = nodes.map((node: any) => {
      const spec = node.spec || {};
      const requirements = Array.isArray(spec.requirements) 
        ? spec.requirements.join('\n') 
        : (spec.requirements || '');
      return {
        label: node.label || node.id,
        type: node.type || 'page',
        title: spec.title || node.label,
        requirements: requirements,
      };
    });

    // 构建系统提示词
    const systemPrompt = `# Role
You are a Senior Product Manager specializing in the **${industry}** industry.
Your target audience is **${targetAudience}**.

# Project Context
Project Name: "${projectName}"
Core Value: ${description || '未指定'}

# Task
Generate a professional PRD (Product Requirements Document) based on the provided nodes and global rules.

# Tone & Style Guidelines
${toneInstruction}
- Always focus on the specific terminologies used in ${industry}.
- If the user provided sparse information, infer functional details based on the industry context (e.g., "If it's a login node in FinTech, assume 2FA is needed").

# Output Structure
1. Overview (项目概述)
2. User Roles & Flows (用户角色和流程)
3. Module Details (模块详情 - 为每个节点生成详细需求)
4. Non-Functional Requirements (非功能性需求 - 性能/安全性，适配 ${industry} 行业)

# Requirements
- Use concise Chinese descriptions
- Focus on features relevant to ${targetAudience}
- Use terminology specific to ${industry}`;

    // 构建用户提示词
    const nodesContent = nodesSummary.map((node: any) => {
      return `### ${node.label} (${node.type})
标题: ${node.title}
需求:
${node.requirements || '待补充'}`;
    }).join('\n\n');

    const globalRulesContent = globalRules ? `
性能要求: ${globalRules.performance || ''}
安全要求: ${globalRules.security || ''}
兼容性要求: ${globalRules.compatibility || ''}
错误处理: ${globalRules.errorHandling || ''}
数据追踪: ${globalRules.dataTracking || ''}` : '';

    const userPrompt = `请基于以下信息生成完整的 PRD 文档：

项目画像：
- 项目名称: ${projectName}
- 行业: ${industry}
- 目标用户: ${targetAudience}
- 项目简介: ${description || '未指定'}

节点列表：
${nodesContent}

全局规则：
${globalRulesContent}

要求：
1. 生成完整的 PRD 文档，包含概述、用户角色、模块详情和非功能性需求
2. 为每个节点生成详细的功能需求
3. 使用 ${industry} 行业的术语
4. 关注 ${targetAudience} 用户的需求
5. 输出 Markdown 格式`;

    const result = await generateText({
      model: openai('gpt-4o'),
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      temperature: 0.5,
    });

    const markdown = result.text.trim();

    return NextResponse.json({
      markdown,
    });
  } catch (error) {
    console.error('Generate PRD error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '生成 PRD 失败' },
      { status: 500 }
    );
  }
}


