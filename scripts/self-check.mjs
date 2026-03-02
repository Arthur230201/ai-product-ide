#!/usr/bin/env node
/**
 * 项目自检脚本
 * 检查：build/lint/typecheck、LLM调用入口、JSON解析失败链路、429/ECONNRESET、uiCode.substring崩溃、HTML渲染危险点
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');
const docsDir = join(projectRoot, 'docs');

// 确保 docs 目录存在
if (!existsSync(docsDir)) {
  execSync(`mkdir -p "${docsDir}"`, { cwd: projectRoot });
}

const report = {
  timestamp: new Date().toISOString(),
  checks: {},
  issues: [],
  summary: {}
};

const log = (msg) => {
  console.log(`[${new Date().toISOString()}] ${msg}`);
  return msg;
};

// 1. Build/Lint/TypeCheck
log('🔍 检查 build/lint/typecheck...');
try {
  const buildStart = Date.now();
  execSync('npm run build', { 
    cwd: projectRoot, 
    stdio: 'pipe',
    timeout: 300000 // 5分钟超时
  });
  report.checks.build = {
    status: 'pass',
    duration: Date.now() - buildStart
  };
  log('✅ Build 通过');
} catch (e) {
  report.checks.build = {
    status: 'fail',
    error: e.message,
    stderr: e.stderr?.toString() || ''
  };
  log('❌ Build 失败');
}

try {
  const lintStart = Date.now();
  execSync('npm run lint', { 
    cwd: projectRoot, 
    stdio: 'pipe',
    timeout: 60000
  });
  report.checks.lint = {
    status: 'pass',
    duration: Date.now() - lintStart
  };
  log('✅ Lint 通过');
} catch (e) {
  report.checks.lint = {
    status: 'fail',
    error: e.message,
    stderr: e.stderr?.toString() || ''
  };
  log('❌ Lint 失败');
}

try {
  const typecheckStart = Date.now();
  execSync('npx tsc --noEmit', { 
    cwd: projectRoot, 
    stdio: 'pipe',
    timeout: 120000
  });
  report.checks.typecheck = {
    status: 'pass',
    duration: Date.now() - typecheckStart
  };
  log('✅ TypeCheck 通过');
} catch (e) {
  report.checks.typecheck = {
    status: 'fail',
    error: e.message,
    stderr: e.stderr?.toString() || ''
  };
  log('❌ TypeCheck 失败');
}

// 2. LLM 调用入口清单
log('🔍 扫描 LLM 调用入口...');
const llmEntries = [];
const srcDir = join(projectRoot, 'src');

function scanFile(filePath, relativePath) {
  try {
    const content = readFileSync(filePath, 'utf-8');
    
    // 查找 generateText, generateObject, streamText 等调用
    const llmPatterns = [
      /generateText\s*\(/g,
      /generateObject\s*\(/g,
      /streamText\s*\(/g,
      /getOpenAIClient\s*\(/g,
      /getVisionModel\s*\(/g,
      /getTextModel\s*\(/g,
    ];
    
    const matches = [];
    llmPatterns.forEach((pattern, idx) => {
      const patternNames = ['generateText', 'generateObject', 'streamText', 'getOpenAIClient', 'getVisionModel', 'getTextModel'];
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const lineNum = content.substring(0, match.index).split('\n').length;
        matches.push({
          type: patternNames[idx],
          line: lineNum,
          context: content.substring(Math.max(0, match.index - 50), Math.min(content.length, match.index + 100))
        });
      }
    });
    
    if (matches.length > 0) {
      llmEntries.push({
        file: relativePath,
        matches
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
        scanFile(fullPath, relativePath);
      }
    }
  } catch (e) {
    // 忽略目录读取错误
  }
}

scanDirectory(srcDir);
report.checks.llmEntries = {
  count: llmEntries.length,
  entries: llmEntries
};
log(`✅ 找到 ${llmEntries.length} 个文件包含 LLM 调用`);

// 3. JSON 解析失败链路
log('🔍 扫描 JSON 解析失败链路...');
const jsonParseIssues = [];
const jsonPatterns = [
  /JSON\.parse\s*\(/g,
  /JSON\.stringify\s*\(/g,
  /NoObjectGeneratedError/g,
  /AI_JSONParseError/g,
];

function scanJsonIssues(filePath, relativePath) {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const issues = [];
    
    jsonPatterns.forEach((pattern, idx) => {
      const patternNames = ['JSON.parse', 'JSON.stringify', 'NoObjectGeneratedError', 'AI_JSONParseError'];
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const lineNum = content.substring(0, match.index).split('\n').length;
        const context = content.substring(Math.max(0, match.index - 100), Math.min(content.length, match.index + 200));
        
        // 检查是否有 try-catch
        const beforeContext = content.substring(0, match.index);
        const hasTryCatch = /try\s*\{/.test(beforeContext);
        
        issues.push({
          type: patternNames[idx],
          line: lineNum,
          hasErrorHandling: hasTryCatch,
          context: context.substring(0, 300)
        });
      }
    });
    
    if (issues.length > 0) {
      jsonParseIssues.push({
        file: relativePath,
        issues
      });
    }
  } catch (e) {
    // 忽略
  }
}

function scanJsonDirectory(dir, basePath = '') {
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      const relativePath = join(basePath, entry.name);
      
      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
        scanJsonDirectory(fullPath, relativePath);
      } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
        scanJsonIssues(fullPath, relativePath);
      }
    }
  } catch (e) {
    // 忽略
  }
}

scanJsonDirectory(srcDir);
report.checks.jsonParseIssues = {
  count: jsonParseIssues.length,
  entries: jsonParseIssues
};
log(`✅ 找到 ${jsonParseIssues.length} 个文件包含 JSON 解析相关代码`);

// 4. 429/ECONNRESET 链路
log('🔍 扫描 429/ECONNRESET 错误处理...');
const networkErrorIssues = [];
const networkPatterns = [
  /429/g,
  /rate.?limit/gi,
  /ECONNRESET/gi,
  /ECONNREFUSED/gi,
  /ETIMEDOUT/gi,
  /fetch failed/gi,
  /Too Many Requests/gi,
  /isRateLimitError/g,
  /isNetworkError/g,
];

function scanNetworkIssues(filePath, relativePath) {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const issues = [];
    
    networkPatterns.forEach((pattern) => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const lineNum = content.substring(0, match.index).split('\n').length;
        const context = content.substring(Math.max(0, match.index - 100), Math.min(content.length, match.index + 200));
        
        issues.push({
          line: lineNum,
          match: match[0],
          context: context.substring(0, 300)
        });
      }
    });
    
    if (issues.length > 0) {
      networkErrorIssues.push({
        file: relativePath,
        issues
      });
    }
  } catch (e) {
    // 忽略
  }
}

function scanNetworkDirectory(dir, basePath = '') {
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      const relativePath = join(basePath, entry.name);
      
      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
        scanNetworkDirectory(fullPath, relativePath);
      } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
        scanNetworkIssues(fullPath, relativePath);
      }
    }
  } catch (e) {
    // 忽略
  }
}

scanNetworkDirectory(srcDir);
report.checks.networkErrorIssues = {
  count: networkErrorIssues.length,
  entries: networkErrorIssues
};
log(`✅ 找到 ${networkErrorIssues.length} 个文件包含网络错误处理代码`);

// 5. uiCode.substring 崩溃定位
log('🔍 扫描 uiCode.substring 使用...');
const substringIssues = [];
const substringPatterns = [
  /uiCode\.substring/g,
  /\.substring\s*\(/g,
  /\.substr\s*\(/g,
];

function scanSubstringIssues(filePath, relativePath) {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const issues = [];
    
    substringPatterns.forEach((pattern) => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const lineNum = content.substring(0, match.index).split('\n').length;
        const context = content.substring(Math.max(0, match.index - 100), Math.min(content.length, match.index + 200));
        
        // 检查前面是否有类型检查
        const beforeContext = content.substring(Math.max(0, match.index - 200), match.index);
        const hasTypeCheck = /typeof|instanceof|if\s*\(.*\?/.test(beforeContext);
        
        issues.push({
          line: lineNum,
          match: match[0],
          hasTypeCheck,
          context: context.substring(0, 300)
        });
      }
    });
    
    if (issues.length > 0) {
      substringIssues.push({
        file: relativePath,
        issues
      });
    }
  } catch (e) {
    // 忽略
  }
}

function scanSubstringDirectory(dir, basePath = '') {
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      const relativePath = join(basePath, entry.name);
      
      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
        scanSubstringDirectory(fullPath, relativePath);
      } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
        scanSubstringIssues(fullPath, relativePath);
      }
    }
  } catch (e) {
    // 忽略
  }
}

scanSubstringDirectory(srcDir);
report.checks.substringIssues = {
  count: substringIssues.length,
  entries: substringIssues
};
log(`✅ 找到 ${substringIssues.length} 个文件包含 substring 调用`);

// 6. HTML 渲染危险点扫描
log('🔍 扫描 HTML 渲染危险点...');
const htmlRenderIssues = [];
const htmlPatterns = [
  /dangerouslySetInnerHTML/g,
  /innerHTML\s*=/g,
  /document\.write/g,
  /eval\s*\(/g,
  /new Function/g,
];

function scanHtmlIssues(filePath, relativePath) {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const issues = [];
    
    htmlPatterns.forEach((pattern) => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const lineNum = content.substring(0, match.index).split('\n').length;
        const context = content.substring(Math.max(0, match.index - 100), Math.min(content.length, match.index + 200));
        
        // 检查是否有 sanitize
        const beforeContext = content.substring(Math.max(0, match.index - 300), match.index);
        const hasSanitize = /sanitize|DOMPurify|escape/.test(beforeContext);
        
        issues.push({
          line: lineNum,
          match: match[0],
          hasSanitize,
          context: context.substring(0, 300)
        });
      }
    });
    
    if (issues.length > 0) {
      htmlRenderIssues.push({
        file: relativePath,
        issues
      });
    }
  } catch (e) {
    // 忽略
  }
}

function scanHtmlDirectory(dir, basePath = '') {
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      const relativePath = join(basePath, entry.name);
      
      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
        scanHtmlDirectory(fullPath, relativePath);
      } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
        scanHtmlIssues(fullPath, relativePath);
      }
    }
  } catch (e) {
    // 忽略
  }
}

scanHtmlDirectory(srcDir);
report.checks.htmlRenderIssues = {
  count: htmlRenderIssues.length,
  entries: htmlRenderIssues
};
log(`✅ 找到 ${htmlRenderIssues.length} 个文件包含 HTML 渲染相关代码`);

// 生成摘要
report.summary = {
  buildStatus: report.checks.build?.status || 'unknown',
  lintStatus: report.checks.lint?.status || 'unknown',
  typecheckStatus: report.checks.typecheck?.status || 'unknown',
  llmEntryCount: report.checks.llmEntries?.count || 0,
  jsonIssueCount: report.checks.jsonParseIssues?.count || 0,
  networkIssueCount: report.checks.networkErrorIssues?.count || 0,
  substringIssueCount: report.checks.substringIssues?.count || 0,
  htmlRenderIssueCount: report.checks.htmlRenderIssues?.count || 0,
};

// 写入报告
const reportPath = join(docsDir, '项目自检报告.md');
const reportContent = `# 项目自检报告

生成时间: ${report.timestamp}

## 摘要

- Build: ${report.summary.buildStatus}
- Lint: ${report.summary.lintStatus}
- TypeCheck: ${report.summary.typecheckStatus}
- LLM 调用入口: ${report.summary.llmEntryCount} 个文件
- JSON 解析相关: ${report.summary.jsonIssueCount} 个文件
- 网络错误处理: ${report.summary.networkIssueCount} 个文件
- substring 使用: ${report.summary.substringIssueCount} 个文件
- HTML 渲染相关: ${report.summary.htmlRenderIssueCount} 个文件

## 详细结果

### Build 检查
\`\`\`json
${JSON.stringify(report.checks.build, null, 2)}
\`\`\`

### Lint 检查
\`\`\`json
${JSON.stringify(report.checks.lint, null, 2)}
\`\`\`

### TypeCheck 检查
\`\`\`json
${JSON.stringify(report.checks.typecheck, null, 2)}
\`\`\`

### LLM 调用入口清单
共找到 ${report.summary.llmEntryCount} 个文件包含 LLM 调用：

${report.checks.llmEntries?.entries?.map(e => `- **${e.file}**: ${e.matches.length} 处调用`).join('\n') || '无'}

### JSON 解析失败链路
共找到 ${report.summary.jsonIssueCount} 个文件包含 JSON 解析相关代码：

${report.checks.jsonParseIssues?.entries?.map(e => `- **${e.file}**: ${e.issues.length} 处`).join('\n') || '无'}

### 429/ECONNRESET 错误处理
共找到 ${report.summary.networkIssueCount} 个文件包含网络错误处理：

${report.checks.networkErrorIssues?.entries?.map(e => `- **${e.file}**: ${e.issues.length} 处`).join('\n') || '无'}

### uiCode.substring 使用
共找到 ${report.summary.substringIssueCount} 个文件包含 substring 调用：

${report.checks.substringIssues?.entries?.map(e => `- **${e.file}**: ${e.issues.length} 处`).join('\n') || '无'}

### HTML 渲染危险点
共找到 ${report.summary.htmlRenderIssueCount} 个文件包含 HTML 渲染相关代码：

${report.checks.htmlRenderIssues?.entries?.map(e => `- **${e.file}**: ${e.issues.length} 处`).join('\n') || '无'}

## 完整 JSON 数据

\`\`\`json
${JSON.stringify(report, null, 2)}
\`\`\`
`;

writeFileSync(reportPath, reportContent, 'utf-8');
log(`✅ 报告已写入: ${reportPath}`);

// 写入原始输出日志
const logPath = join(docsDir, '自检原始输出.log');
const logContent = `# 自检原始输出

生成时间: ${report.timestamp}

## 完整 JSON 输出

\`\`\`json
${JSON.stringify(report, null, 2)}
\`\`\`
`;

writeFileSync(logPath, logContent, 'utf-8');
log(`✅ 原始输出已写入: ${logPath}`);

// 7. Prompt Hotspots 扫描（超长 prompt 拼接点）
log('🔍 扫描 Prompt Hotspots...');
const promptHotspots = [];

function scanPromptHotspots(filePath, relativePath) {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    
    // 查找 prompt 相关模式
    const promptPatterns = [
      /systemPrompt\s*[=:]/gi,
      /userPrompt\s*[=:]/gi,
      /prompt\s*[=:]/gi,
      /const\s+\w*[Pp]rompt\s*=/g,
      /template\s*[=:]/gi,
      /messages\s*[:=]/g,
    ];
    
    promptPatterns.forEach((pattern) => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const lineNum = content.substring(0, match.index).split('\n').length;
        
        // 提取 prompt 内容（向后查找直到下一个语句或函数结束）
        const afterMatch = content.substring(match.index);
        const promptEnd = afterMatch.search(/[;}\n]\s*(?:const|let|var|function|export|return|if|for|while)/);
        const promptContent = promptEnd > 0 
          ? afterMatch.substring(0, promptEnd)
          : afterMatch.substring(0, Math.min(5000, afterMatch.length));
        
        // 估算 token 数（粗略：1 token ≈ 4 字符）
        const estimatedTokens = Math.ceil(promptContent.length / 4);
        
        // 检查是否包含字符串拼接
        const hasConcatenation = /\+|\.concat|template|interpolat/i.test(promptContent);
        
        // 检查是否包含模板字符串
        const hasTemplate = /`[\s\S]*\$\{/g.test(promptContent);
        
        if (estimatedTokens > 1000 || hasConcatenation || hasTemplate) {
          promptHotspots.push({
            file: relativePath,
            line: lineNum,
            estimatedTokens,
            hasConcatenation,
            hasTemplate,
            preview: promptContent.substring(0, 200),
            fullLength: promptContent.length
          });
        }
      }
    });
  } catch (e) {
    // 忽略
  }
}

function scanPromptDirectory(dir, basePath = '') {
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      const relativePath = join(basePath, entry.name);
      
      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
        scanPromptDirectory(fullPath, relativePath);
      } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
        scanPromptHotspots(fullPath, relativePath);
      }
    }
  } catch (e) {
    // 忽略
  }
}

scanPromptDirectory(srcDir);
promptHotspots.sort((a, b) => b.estimatedTokens - a.estimatedTokens);

const promptHotspotsContent = `# Prompt Hotspots 分析

生成时间: ${new Date().toISOString()}

共找到 ${promptHotspots.length} 个潜在超长 prompt 拼接点。

## Top 10 超长 Prompt 拼接点

${promptHotspots.slice(0, 10).map((spot, idx) => {
  return `${idx + 1}. **${spot.file}:${spot.line}**
   - 估算 Token 数: ${spot.estimatedTokens}
   - 内容长度: ${spot.fullLength} 字符
   - 包含字符串拼接: ${spot.hasConcatenation ? '是' : '否'}
   - 包含模板字符串: ${spot.hasTemplate ? '是' : '否'}
   - 预览: \`${spot.preview.replace(/`/g, '\\`').substring(0, 150)}...\`
`;
}).join('\n')}

## 所有 Prompt Hotspots

${promptHotspots.map((spot, idx) => {
  return `${idx + 1}. **${spot.file}:${spot.line}** - ${spot.estimatedTokens} tokens`;
}).join('\n')}
`;

const promptHotspotsPath = join(docsDir, 'prompt-hotspots.md');
writeFileSync(promptHotspotsPath, promptHotspotsContent, 'utf-8');
log(`✅ Prompt Hotspots 已写入: ${promptHotspotsPath}`);

// 8. Error Hotspots 扫描（定位各种错误）
log('🔍 扫描 Error Hotspots...');
const errorHotspots = {
  rateLimit: [],
  networkError: [],
  jsonParseError: [],
  substringError: []
};

function scanErrorHotspots(filePath, relativePath) {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    
    // 429 / Rate Limit
    const rateLimitPatterns = [
      /429/g,
      /rate.?limit/gi,
      /Too Many Requests/gi,
      /cooldown/gi,
      /retry.*after/gi,
    ];
    
    rateLimitPatterns.forEach((pattern) => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const lineNum = content.substring(0, match.index).split('\n').length;
        const context = content.substring(Math.max(0, match.index - 200), Math.min(content.length, match.index + 200));
        
        errorHotspots.rateLimit.push({
          file: relativePath,
          line: lineNum,
          match: match[0],
          context: context.substring(0, 300)
        });
      }
    });
    
    // ECONNRESET / Network Error
    const networkPatterns = [
      /ECONNRESET/gi,
      /ECONNREFUSED/gi,
      /ETIMEDOUT/gi,
      /fetch failed/gi,
      /network error/gi,
    ];
    
    networkPatterns.forEach((pattern) => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const lineNum = content.substring(0, match.index).split('\n').length;
        const context = content.substring(Math.max(0, match.index - 200), Math.min(content.length, match.index + 200));
        
        errorHotspots.networkError.push({
          file: relativePath,
          line: lineNum,
          match: match[0],
          context: context.substring(0, 300)
        });
      }
    });
    
    // JSON Parse Error
    const jsonParsePatterns = [
      /NoObjectGeneratedError/gi,
      /JSONParseError/gi,
      /AI_JSONParseError/gi,
      /JSON\.parse.*catch/gi,
    ];
    
    jsonParsePatterns.forEach((pattern) => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const lineNum = content.substring(0, match.index).split('\n').length;
        const context = content.substring(Math.max(0, match.index - 200), Math.min(content.length, match.index + 200));
        
        errorHotspots.jsonParseError.push({
          file: relativePath,
          line: lineNum,
          match: match[0],
          context: context.substring(0, 300)
        });
      }
    });
    
    // substring Error
    const substringPatterns = [
      /substring is not a function/gi,
      /uiCode\.substring/gi,
      /\.substring\s*\(/g,
    ];
    
    substringPatterns.forEach((pattern) => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const lineNum = content.substring(0, match.index).split('\n').length;
        const context = content.substring(Math.max(0, match.index - 200), Math.min(content.length, match.index + 200));
        
        // 检查前面是否有类型检查
        const beforeContext = content.substring(Math.max(0, match.index - 300), match.index);
        const hasTypeCheck = /typeof|instanceof|if\s*\(.*\?/.test(beforeContext);
        
        errorHotspots.substringError.push({
          file: relativePath,
          line: lineNum,
          match: match[0],
          hasTypeCheck,
          context: context.substring(0, 300)
        });
      }
    });
  } catch (e) {
    // 忽略
  }
}

function scanErrorDirectory(dir, basePath = '') {
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      const relativePath = join(basePath, entry.name);
      
      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
        scanErrorDirectory(fullPath, relativePath);
      } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
        scanErrorHotspots(fullPath, relativePath);
      }
    }
  } catch (e) {
    // 忽略
  }
}

scanErrorDirectory(srcDir);

const errorHotspotsContent = `# Error Hotspots 分析

生成时间: ${new Date().toISOString()}

## 429 / Rate Limit 错误处理

共找到 ${errorHotspots.rateLimit.length} 处：

${errorHotspots.rateLimit.map((spot, idx) => {
  return `${idx + 1}. **${spot.file}:${spot.line}**
   - 匹配: \`${spot.match}\`
   - 上下文: \`${spot.context.substring(0, 150)}...\`
`;
}).join('\n') || '无'}

## ECONNRESET / Network Error 处理

共找到 ${errorHotspots.networkError.length} 处：

${errorHotspots.networkError.map((spot, idx) => {
  return `${idx + 1}. **${spot.file}:${spot.line}**
   - 匹配: \`${spot.match}\`
   - 上下文: \`${spot.context.substring(0, 150)}...\`
`;
}).join('\n') || '无'}

## NoObjectGeneratedError / JSON Parse Error

共找到 ${errorHotspots.jsonParseError.length} 处：

${errorHotspots.jsonParseError.map((spot, idx) => {
  return `${idx + 1}. **${spot.file}:${spot.line}**
   - 匹配: \`${spot.match}\`
   - 上下文: \`${spot.context.substring(0, 150)}...\`
`;
}).join('\n') || '无'}

## uiCode.substring 错误

共找到 ${errorHotspots.substringError.length} 处：

${errorHotspots.substringError.map((spot, idx) => {
  return `${idx + 1}. **${spot.file}:${spot.line}**
   - 匹配: \`${spot.match}\`
   - 有类型检查: ${spot.hasTypeCheck ? '是' : '否'}
   - 上下文: \`${spot.context.substring(0, 150)}...\`
`;
}).join('\n') || '无'}
`;

const errorHotspotsPath = join(docsDir, 'error-hotspots.md');
writeFileSync(errorHotspotsPath, errorHotspotsContent, 'utf-8');
log(`✅ Error Hotspots 已写入: ${errorHotspotsPath}`);

// 9. 生成增强的 llm-callmap.md（如果 profile-llm-path.mjs 已运行，这里只做补充）
// 注意：llm-callmap.md 应该由 profile-llm-path.mjs 生成，这里只做检查
if (!existsSync(join(docsDir, 'llm-callmap.md'))) {
  log('⚠️  llm-callmap.md 不存在，请运行: node scripts/profile-llm-path.mjs');
}

console.log('\n✅ 自检完成！');
process.exit(0);

