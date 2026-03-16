# UIUXProMax 全局安装（所有项目可用）

[UIUXProMax](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) 官方通过 `uipro init --ai cursor` 会在**当前项目**生成 `.cursor/commands/` 与 `.shared/ui-ux-pro-max/`，仅对当前仓库生效。

若希望**所有项目（包括新建项目）**都能使用该设计能力，需要把技能安装到 Cursor 的**全局 Skills 目录**。

## 原理

Cursor 会从以下位置加载 Skills（[官方说明](https://cursor.com/help/customization/skills)）：

- 项目级：`.agents/skills/`、`.cursor/skills/`
- **全局**：`~/.cursor/skills/`（对所有项目生效）

兼容目录（也会被加载）：`~/.claude/skills/`、`~/.codex/skills/`。

将 UIUXProMax 的 skill 放入 `~/.cursor/skills/` 后，任意项目（含新建仓库）中都可使用 `/ui-ux-pro-max` 或通过 @ 引用该技能。

## 方式一：一键脚本（推荐）

在项目根目录执行：

```bash
./scripts/install-ui-ux-pro-max-global.sh
```

脚本会：

1. 在 `~/.cursor/repos/` 下克隆或更新 `ui-ux-pro-max-skill` 仓库
2. 在 `~/.cursor/skills/` 下为每个技能创建符号链接（如 `ui-ux-pro-max`、`design-system`、`ui-styling` 等）
3. 技能内的 `data`、`scripts` 等仍指向仓库内路径，设计系统与脚本可正常使用

## 方式二：手动执行

```bash
# 1. 创建目录
mkdir -p ~/.cursor/skills
mkdir -p ~/.cursor/repos
cd ~/.cursor/repos

# 2. 克隆仓库（若已存在可改为 cd ui-ux-pro-max-skill && git pull）
git clone https://github.com/nextlevelbuilder/ui-ux-pro-max-skill.git
cd ui-ux-pro-max-skill

# 3. 将 .claude/skills 下的每个技能链接到全局目录
for name in .claude/skills/*/; do
  ln -sf "$(pwd)/${name}" ~/.cursor/skills/$(basename "$name")
done
```

## 验证

1. 重启或重新打开 Cursor（若已打开）。
2. 在任意项目（包括新项目）中打开 Agent 对话，输入 `/` 或 `@`，应能看到 `ui-ux-pro-max` 等技能。
3. 或直接输入自然语言 UI/UX 需求（如 “Build a landing page for my SaaS”），技能会在匹配时自动参与。

## 与项目级安装的关系

- **仅全局**：只做上述步骤，不在各项目里执行 `uipro init --ai cursor`。所有项目共享同一份技能，无需每个仓库都装一遍。
- **项目级 + 全局**：若某项目需要用到官方 CLI 生成的 `.shared/` 或 Cursor Command（如某条固定命令），可在该项目内再执行一次 `uipro init --ai cursor`；技能本身仍以全局为准，不会冲突。

## 更新

重新执行安装脚本即可拉取最新版本；或手动：

```bash
cd ~/.cursor/repos/ui-ux-pro-max-skill && git pull
```

符号链接无需重做，内容会随仓库更新生效。
