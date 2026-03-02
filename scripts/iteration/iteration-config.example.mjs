#!/usr/bin/env node
/**
 * 迭代框架示例配置（本项目适配）
 *
 * 基于 docs/expert-team/ITERATION_SCRIPT_DELIBERATION.md 三轮商议结论。
 * audit 阶段调用 scripts/self-check.mjs，将 build/lint/tsc 结果转为 scores 与 issues。
 * produce、decideAndFix、executeFix 均为占位（可选/no-op）。
 *
 * Usage:
 *   node scripts/iteration/iteration-runner.mjs --example
 *   node scripts/iteration/iteration-runner.mjs --config scripts/iteration/iteration-config.example.mjs
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const root = join(__dirname, '../..');

async function produce(projectId, roundNumber, options) {
  // 可选：首轮或非 skipFullRebuild 时调用 generate-graph/ui-pipeline（mock）
  // 本项目首轮采用 no-op，仅对已有产出物做 audit
  return { success: true, artifactSummary: {}, baseline: {}, after: {} };
}

async function audit(projectId, roundNumber, options) {
  // 调用 self-check.mjs，解析 build/lint/tsc 结果
  const rawDir = join(root, 'docs/self-check/raw');
  const reportPath = join(root, 'docs/self-check/REPORT.md');

  try {
    execSync('node scripts/self-check.mjs', { cwd: root, stdio: 'pipe', timeout: 15 * 60 * 1000 });
  } catch (_) {
    // self-check 可能因 build/lint/tsc 失败而非零退出，继续解析
  }

  const issues = [];
  let buildScore = 0;
  let lintScore = 0;
  let tscScore = 0;

  // 从 REPORT.md 解析 pass/fail；self-check 输出 "Build: **pass**" 或 "Build: **fail**"
  const parseStatus = (name) => {
    if (!existsSync(reportPath)) return 'unknown';
    const content = readFileSync(reportPath, 'utf-8');
    const re = new RegExp(`${name}:\\s*\\*\\*(pass|fail)\\*\\*`, 'i');
    const m = content.match(re);
    return m ? m[1].toLowerCase() : 'unknown';
  };

  const build = { status: parseStatus('Build') };
  const lint = { status: parseStatus('Lint') };
  const tsc = { status: parseStatus('TSC') };

  if (build.status === 'fail') {
    buildScore = 0;
    issues.push({
      type: 'build_fail',
      severity: 'P0',
      title: 'Build 失败',
      message: 'pnpm run build 未通过',
      description: '请检查 docs/self-check/raw/build.log',
      source: 'system',
    });
  } else {
    buildScore = 100;
  }
  if (lint.status === 'fail') {
    lintScore = 0;
    issues.push({
      type: 'lint_fail',
      severity: 'P1',
      title: 'Lint 失败',
      message: 'pnpm run lint 未通过',
      description: '请检查 docs/self-check/raw/lint.log',
      source: 'system',
    });
  } else {
    lintScore = 100;
  }
  if (tsc.status === 'fail') {
    tscScore = 0;
    issues.push({
      type: 'tsc_fail',
      severity: 'P0',
      title: 'TSC 失败',
      message: 'tsc --noEmit 未通过',
      description: '请检查 docs/self-check/raw/tsc.log',
      source: 'system',
    });
  } else {
    tscScore = 100;
  }

  const overallScore = Math.round((buildScore + lintScore + tscScore) / 3);

  return {
    overallScore,
    scores: { build: buildScore, lint: lintScore, tsc: tscScore, overall: overallScore },
    issues,
    fixActions: issues.map((i) => ({
      strategy: `fix_${i.type}`,
      priority: i.severity === 'P0' ? 1 : 2,
      metric: i.type,
      description: `修复 ${i.title}`,
    })),
  };
}

async function collectProblems(projectId, roundNumber, auditResult, roundResult) {
  return (auditResult.issues ?? []).map((issue, i) => ({
    problemId: `p-${roundNumber}-${i}`,
    source: issue.source ?? 'system',
    type: issue.type ?? 'unknown',
    severity: issue.severity ?? 'P2',
    title: issue.title ?? issue.message ?? 'Unknown',
    description: issue.description ?? issue.message ?? '',
    context: { round: roundNumber },
    expectedBehavior: 'Build/Lint/TSC 全部通过',
    actualBehavior: issue.message ?? issue.title ?? '未通过',
    relatedFixActions: (auditResult.fixActions ?? []).filter((fa) => fa.metric === issue.type),
  }));
}

async function decideAndFix(projectId, roundNumber, problem, options) {
  // 占位：不自动执行修复，仅返回 null（跳过修复）
  // 若需启用，可返回 { approved: true, strategy: problem.relatedFixActions?.[0]?.strategy ?? 'fix_unknown', fixAction: {} }
  return null;
}

export default {
  projectId: 'ai-product-ide',
  MAX_ROUNDS: 3,
  TARGET_SCORE: 100,
  REPORT_DIR: join(root, 'scripts/iteration-reports'),
  ROUND_REPORT_NAME: 'iteration-report.json',
  SKIP_REBUILD_IF_LAST_HAD_FIXES: false,
  FAILED_STRATEGY_POLICY: 'ban',

  produce,
  audit,
  collectProblems,
  decideAndFix,
};
