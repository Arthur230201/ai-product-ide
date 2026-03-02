#!/usr/bin/env node
/**
 * LLM 调用路径分析脚本
 * 静态扫描 src/app/actions 与 src/lib/ai 调用点，生成调用图
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');
const srcDir = join(projectRoot, 'src');
const docsDir = join(projectRoot, 'docs');

// 确保 docs 目录存在
if (!existsSync(docsDir)) {
  const { execSync } = await import('child_process');
  execSync(`mkdir -p "${docsDir}"`, { cwd: projectRoot });
}

const callMap = {
  entries: [],
  callGraph: {},
  retryConfigs: {},
  timeoutConfigs: {},
  serialCalls: [],
  parallelCalls: []
};

function extractFunctionName(content, position) {
  // 向前查找函数名
  const before = content.substring(Math.max(0, position - 200), position);
  const funcMatch = before.match(/(?:export\s+)?(?:async\s+)?function\s+(\w+)|const\s+(\w+)\s*=\s*(?:async\s+)?\(|export\s+const\s+(\w+)\s*=/);
  if (funcMatch) {
    return funcMatch[1] || funcMatch[2] || funcMatch[3] || 'anonymous';
  }
  return 'anonymous';
}

function scanFile(filePath, relativePath) {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    
    // 查找 LLM 相关调用
    const patterns = [
      { name: 'generateText', regex: /generateText\s*\(/g },
      { name: 'generateObject', regex: /generateObject\s*\(/g },
      { name: 'streamText', regex: /streamText\s*\(/g },
      { name: 'getOpenAIClient', regex: /getOpenAIClient\s*\(/g },
      { name: 'getVisionModel', regex: /getVisionModel\s*\(/g },
      { name: 'getTextModel', regex: /getTextModel\s*\(/g },
    ];
    
    const calls = [];
    
    patterns.forEach(({ name, regex }) => {
      let match;
      while ((match = regex.exec(content)) !== null) {
        const lineNum = content.substring(0, match.index).split('\n').length;
        const funcName = extractFunctionName(content, match.index);
        
        // 提取上下文（前后各50行）
        const startLine = Math.max(0, lineNum - 50);
        const endLine = Math.min(lines.length, lineNum + 50);
        const context = lines.slice(startLine, endLine).join('\n');
        
        // 检查是否有 retry 配置
        const hasRetry = /retry|retries|maxRetries/i.test(context);
        const retryMatch = context.match(/retry[:\s]*(\d+)|maxRetries[:\s]*(\d+)/i);
        const retryCount = retryMatch ? (parseInt(retryMatch[1] || retryMatch[2]) || 0) : null;
        
        // 检查是否有 timeout 配置
        const hasTimeout = /timeout|TIMEOUT/i.test(context);
        const timeoutMatch = context.match(/timeout[:\s]*(\d+)|TIMEOUT[:\s]*(\d+)/i);
        const timeoutMs = timeoutMatch ? (parseInt(timeoutMatch[1]) || null) : null;
        
        // 检查是否在 Promise.all 中（并行）
        const beforeContext = content.substring(Math.max(0, match.index - 500), match.index);
        const isParallel = /Promise\.all|Promise\.allSettled/.test(beforeContext);
        
        // 检查是否在 await 链中（串行）
        const isSerial = /await\s+/.test(beforeContext);
        
        calls.push({
          type: name,
          line: lineNum,
          function: funcName,
          hasRetry,
          retryCount,
          hasTimeout,
          timeoutMs,
          isParallel,
          isSerial,
          context: context.substring(0, 500)
        });
      }
    });
    
    if (calls.length > 0) {
      callMap.entries.push({
        file: relativePath,
        function: extractFunctionName(content, 0),
        calls
      });
      
      // 构建调用图
      if (!callMap.callGraph[relativePath]) {
        callMap.callGraph[relativePath] = [];
      }
      calls.forEach(call => {
        callMap.callGraph[relativePath].push({
          to: call.type,
          line: call.line,
          retry: call.retryCount,
          timeout: call.timeoutMs,
          parallel: call.isParallel,
          serial: call.isSerial
        });
      });
    }
  } catch (e) {
    // 忽略读取错误
  }
}

function scanDirectory(dir, basePath = '') {
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      const relativePath = join(basePath, entry.name);
      
      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
        scanDirectory(fullPath, relativePath);
      } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
        // 只扫描 actions 和 ai 相关目录
        if (relativePath.includes('actions') || relativePath.includes('ai') || relativePath.includes('openai-client')) {
          scanFile(fullPath, relativePath);
        }
      }
    }
  } catch (e) {
    // 忽略目录读取错误
  }
}

console.log('🔍 扫描 LLM 调用路径...');
scanDirectory(srcDir);

// 分析串行/并行调用
callMap.entries.forEach(entry => {
  entry.calls.forEach(call => {
    if (call.isParallel) {
      callMap.parallelCalls.push({
        file: entry.file,
        line: call.line,
        type: call.type
      });
    } else if (call.isSerial) {
      callMap.serialCalls.push({
        file: entry.file,
        line: call.line,
        type: call.type
      });
    }
  });
});

// 生成报告
const reportContent = `# LLM 调用路径分析

生成时间: ${new Date().toISOString()}

## 调用入口统计

共找到 ${callMap.entries.length} 个文件包含 LLM 调用。

## 调用图

\`\`\`
${Object.entries(callMap.callGraph).map(([file, calls]) => {
  return `${file}\n${calls.map(c => `  -> ${c.to} (line ${c.line})${c.retry ? ` [retry:${c.retry}]` : ''}${c.timeout ? ` [timeout:${c.timeout}ms]` : ''}${c.parallel ? ' [PARALLEL]' : ''}${c.serial ? ' [SERIAL]' : ''}`).join('\n')}`;
}).join('\n\n')}
\`\`\`

## 详细调用清单

${callMap.entries.map(entry => {
  return `### ${entry.file}

函数: \`${entry.function}\`

调用点:
${entry.calls.map(call => {
  return `- **Line ${call.line}**: \`${call.type}\`
  - 函数: \`${call.function}\`
  - Retry: ${call.hasRetry ? (call.retryCount || '配置但未指定数量') : '无'}
  - Timeout: ${call.hasTimeout ? (call.timeoutMs ? `${call.timeoutMs}ms` : '配置但未指定时间') : '无'}
  - 并行: ${call.isParallel ? '是' : '否'}
  - 串行: ${call.isSerial ? '是' : '否'}
`;
}).join('\n')}`;
}).join('\n\n')}

## 串行调用统计

共 ${callMap.serialCalls.length} 个串行调用：

${callMap.serialCalls.map(c => `- ${c.file}:${c.line} (${c.type})`).join('\n')}

## 并行调用统计

共 ${callMap.parallelCalls.length} 个并行调用：

${callMap.parallelCalls.map(c => `- ${c.file}:${c.line} (${c.type})`).join('\n')}

## 完整 JSON 数据

\`\`\`json
${JSON.stringify(callMap, null, 2)}
\`\`\`
`;

const reportPath = join(docsDir, 'llm-callmap.md');
writeFileSync(reportPath, reportContent, 'utf-8');
console.log(`✅ LLM 调用路径分析已写入: ${reportPath}`);

// 分析最可能导致 700s 的路径
const slowPaths = [];
callMap.entries.forEach(entry => {
  entry.calls.forEach(call => {
    // 如果串行调用且没有 timeout，可能是慢路径
    if (call.isSerial && !call.hasTimeout) {
      slowPaths.push({
        file: entry.file,
        line: call.line,
        type: call.type,
        reason: '串行调用且无超时配置',
        severity: 'high'
      });
    }
    // 如果有 retry 但次数很多
    if (call.retryCount && call.retryCount > 3) {
      slowPaths.push({
        file: entry.file,
        line: call.line,
        type: call.type,
        reason: `重试次数过多: ${call.retryCount}`,
        severity: 'medium'
      });
    }
    // 如果 timeout 很长
    if (call.timeoutMs && call.timeoutMs > 60000) {
      slowPaths.push({
        file: entry.file,
        line: call.line,
        type: call.type,
        reason: `超时时间过长: ${call.timeoutMs}ms`,
        severity: 'medium'
      });
    }
  });
});

// 生成性能基准报告
const benchContent = `# 性能基准分析

生成时间: ${new Date().toISOString()}

## 最可能导致 700s 的 Top5 路径

基于静态分析，以下路径最可能导致长时间等待：

${slowPaths.slice(0, 5).map((path, idx) => {
  return `${idx + 1}. **${path.file}:${path.line}** (\`${path.type}\`)
   - 原因: ${path.reason}
   - 严重程度: ${path.severity}
   - 证据: 文件路径 + 行号 + 调用关系
`;
}).join('\n')}

## 所有潜在慢路径

${slowPaths.map((path, idx) => {
  return `${idx + 1}. **${path.file}:${path.line}** (\`${path.type}\`)
   - 原因: ${path.reason}
   - 严重程度: ${path.severity}
`;
}).join('\n')}

## 分析说明

- **串行调用且无超时**: 如果多个 LLM 调用串行执行且没有超时配置，总耗时 = 各调用耗时之和
- **重试次数过多**: 每次重试都会增加总耗时
- **超时时间过长**: 如果单个调用超时时间设置过长，失败重试时会等待很长时间

## 建议

1. 为所有 LLM 调用添加合理的超时配置
2. 将可以并行的调用改为并行执行
3. 限制重试次数，避免无限重试
4. 添加请求队列和限流机制
`;

const benchPath = join(docsDir, 'bench.md');
writeFileSync(benchPath, benchContent, 'utf-8');
console.log(`✅ 性能基准分析已写入: ${benchPath}`);

console.log('\n✅ LLM 调用路径分析完成！');

