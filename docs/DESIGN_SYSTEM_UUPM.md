# UIUXProMax Python 检索路径（可选）

在 **智能推荐**（`stylePreset === auto`）且**未锁定快照**时，若开启本路径，将优先执行本地 `search.py --design-system`，失败则回退 **LLM 推荐**（与 M1 一致）。

> **注意（2026-03）**：生产环境默认优先走 **TS 引擎**（见 [DESIGN_SYSTEM_TS_ENGINE.md](./DESIGN_SYSTEM_TS_ENGINE.md)），Python 路径仅作为本地对齐/验证与数据扩充的可选能力。

## 环境变量

| 变量 | 必填 | 说明 |
|------|------|------|
| `DESIGN_SYSTEM_UUPM_ENABLED` | 是 | 设为 `1` 才尝试 Python |
| `UIUXPROMAX_SKILL_ROOT` | 二选一 | ui-ux-pro-max-skill 仓库根目录（含 `src/ui-ux-pro-max/scripts/search.py`） |
| `DESIGN_SYSTEM_SEARCH_PY` | 二选一 | `search.py` 的绝对路径 |
| `DESIGN_SYSTEM_PYTHON_BIN` | 否 | 默认 `python3` |
| `DESIGN_SYSTEM_PYTHON_TIMEOUT_MS` | 否 | 默认 `30000`，最小 `3000` |
| `UIUXPROMAX_ENGINE_VERSION` | 否 | 写入快照 `engineVersion`，默认 `uupm-search-py@1` |

## 本机准备

```bash
git clone https://github.com/nextlevelbuilder/ui-ux-pro-max-skill.git ~/ui-ux-pro-max-skill
cd ~/ui-ux-pro-max-skill/src/ui-ux-pro-max
python3 -m pip install -r requirements.txt   # 若仓库提供
```

`.env.local` 示例：

```env
DESIGN_SYSTEM_UUPM_ENABLED=1
UIUXPROMAX_SKILL_ROOT=/Users/you/ui-ux-pro-max-skill
```

## 限制

- **Vercel Serverless**：通常无 Python/数据文件，请**不要**在生产开启；仅本地或 Docker 全栈环境使用。
- stdout 上限 **512KB**，超时默认 **30s**；超界则自动回退 LLM。

## 上游命令（对照）

```bash
python3 search.py "<行业+描述+节点名>" --design-system --project-name "项目名" --format markdown
```
