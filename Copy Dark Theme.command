#!/bin/bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
/usr/bin/pbcopy < "$ROOT/themes/candy-jelly-dark.txt"
echo 'Dark theme copied. In Codex Settings > Appearance, choose Import for the dark theme and paste.'
echo '深色主题已复制。在 Codex 设置的外观页面，选择深色主题的 Import 并粘贴。'
read -r -p 'Press Return to close. ' _
