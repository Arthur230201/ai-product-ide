#!/usr/bin/env bash
# 将 UIUXProMax 安装到 Cursor 全局 Skills 目录，使所有项目（含新建）可用。
# 使用：./scripts/install-ui-ux-pro-max-global.sh

set -e

REPO_URL="https://github.com/nextlevelbuilder/ui-ux-pro-max-skill.git"
INSTALL_DIR="${HOME}/.cursor/repos/ui-ux-pro-max-skill"
SKILLS_GLOBAL="${HOME}/.cursor/skills"
SOURCES_DIR=".claude/skills"

mkdir -p "$SKILLS_GLOBAL"
mkdir -p "$(dirname "$INSTALL_DIR")"

if [[ ! -d "$INSTALL_DIR/.git" ]]; then
  echo "Cloning ui-ux-pro-max-skill into $INSTALL_DIR ..."
  git clone "$REPO_URL" "$INSTALL_DIR"
else
  echo "Updating existing repo in $INSTALL_DIR ..."
  (cd "$INSTALL_DIR" && git pull --rebase)
fi

if [[ ! -d "$INSTALL_DIR/$SOURCES_DIR" ]]; then
  echo "Error: $INSTALL_DIR/$SOURCES_DIR not found. Repo layout may have changed." >&2
  exit 1
fi

echo "Linking skills into $SKILLS_GLOBAL ..."
for dir in "$INSTALL_DIR/$SOURCES_DIR"/*/; do
  name=$(basename "$dir")
  target="$SKILLS_GLOBAL/$name"
  ln -sf "$dir" "$target"
  echo "  - $name"
done

echo "Done. UIUXProMax (and related skills) are now available globally."
echo "Restart Cursor or open a new project to use /ui-ux-pro-max or @ui-ux-pro-max in any project."
