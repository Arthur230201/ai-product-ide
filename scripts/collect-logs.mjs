#!/usr/bin/env node
/**
 * 失败日志归档脚本
 * 在项目根目录搜索 *.log / next 日志，提取包含关键词的片段
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, dirname, extname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');
const docsDir = join(projectRoot, 'docs');

// 确保 docs 目录存在
if (!existsSync(docsDir)) {
  const { execSync } = await import('child_process');
  execSync(`mkdir -p "${docsDir}"`, { cwd: projectRoot });
}

// 关键词列表
const keywords = [
  'Rate limit exceeded',
  'Too Many Requests',
  'ECONNRESET',
  'fetch failed',
  'NoObjectGeneratedError',
  'AI_JSONParseError',
  'uiCode.substring',
];

const snippets = [];

function extractContext(content, matchIndex, linesBefore = 30, linesAfter = 30) {
  const lines = content.split('\n');
  const matchLine = content.substring(0, matchIndex).split('\n').length - 1;
  
  const startLine = Math.max(0, matchLine - linesBefore);
  const endLine = Math.min(lines.length, matchLine + linesAfter);
  
  return {
    lineNumber: matchLine + 1,
    context: lines.slice(startLine, endLine).join('\n'),
    matchLine: lines[matchLine]
  };
}

function scanFile(filePath, relativePath) {
  try {
    const stats = statSync(filePath);
    // 只处理小于 10MB 的文件
    if (stats.size > 10 * 1024 * 1024) {
      return;
    }
    
    const content = readFileSync(filePath, 'utf-8');
    
    keywords.forEach(keyword => {
      const regex = new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      let match;
      
      while ((match = regex.exec(content)) !== null) {
        const context = extractContext(content, match.index);
        snippets.push({
          file: relativePath,
          keyword,
          ...context,
          timestamp: new Date().toISOString()
        });
      }
    });
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
      
      // 跳过 node_modules 和 .next
      if (entry.name === 'node_modules' || entry.name === '.next' || entry.name.startsWith('.')) {
        continue;
      }
      
      if (entry.isDirectory()) {
        scanDirectory(fullPath, relativePath);
      } else if (entry.isFile()) {
        // 检查文件扩展名
        const ext = extname(entry.name).toLowerCase();
        if (ext === '.log' || entry.name.includes('log') || entry.name.includes('error')) {
          scanFile(fullPath, relativePath);
        }
      }
    }
  } catch (e) {
    // 忽略目录读取错误
  }
}

console.log('🔍 搜索日志文件...');

// 搜索项目根目录
scanDirectory(projectRoot);

// 搜索 .next 目录（如果存在）
const nextDir = join(projectRoot, '.next');
if (existsSync(nextDir)) {
  scanDirectory(nextDir, '.next');
}

// 按关键词分组
const groupedSnippets = {};
keywords.forEach(keyword => {
  groupedSnippets[keyword] = snippets.filter(s => 
    s.keyword.toLowerCase() === keyword.toLowerCase()
  );
});

// 生成报告
const reportContent = `# 失败日志归档

生成时间: ${new Date().toISOString()}

共找到 ${snippets.length} 个匹配片段。

## 按关键词分组

${keywords.map(keyword => {
  const matches = groupedSnippets[keyword] || [];
  if (matches.length === 0) {
    return `### ${keyword}

未找到匹配项。

`;
  }
  
  return `### ${keyword}

找到 ${matches.length} 个匹配项：

${matches.map((snippet, idx) => {
  return `#### 片段 ${idx + 1}: ${snippet.file}:${snippet.lineNumber}

\`\`\`
${snippet.context}
\`\`\`

匹配行: \`${snippet.matchLine}\`

`;
}).join('\n')}`;
}).join('\n')}

## 所有片段（按文件分组）

${Object.entries(
  snippets.reduce((acc, snippet) => {
    if (!acc[snippet.file]) {
      acc[snippet.file] = [];
    }
    acc[snippet.file].push(snippet);
    return acc;
  }, {})
).map(([file, fileSnippets]) => {
  return `### ${file}

共 ${fileSnippets.length} 个匹配项：

${fileSnippets.map((snippet, idx) => {
  return `#### 片段 ${idx + 1}: ${snippet.keyword} (Line ${snippet.lineNumber})

\`\`\`
${snippet.context}
\`\`\`

`;
}).join('\n')}`;
}).join('\n\n')}

## 统计信息

${keywords.map(keyword => {
  const count = (groupedSnippets[keyword] || []).length;
  return `- **${keyword}**: ${count} 个匹配项`;
}).join('\n')}
`;

const reportPath = join(docsDir, 'log-snippets.md');
writeFileSync(reportPath, reportContent, 'utf-8');
console.log(`✅ 日志归档已写入: ${reportPath}`);
console.log(`   共找到 ${snippets.length} 个匹配片段`);

if (snippets.length === 0) {
  console.log('⚠️  未找到任何日志文件，可能原因：');
  console.log('   1. 项目尚未运行过');
  console.log('   2. 日志文件已被清理');
  console.log('   3. 日志文件不在项目根目录');
}

console.log('\n✅ 日志归档完成！');

