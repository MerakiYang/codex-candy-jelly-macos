#!/bin/bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
/usr/bin/pbcopy < "$ROOT/themes/candy-jelly-light.txt"
echo 'Light theme copied. In Codex Settings > Appearance, choose Import for the light theme and paste.'
echo '浅色主题已复制。在 Codex 设置的外观页面，选择浅色主题的 Import 并粘贴。'
read -r -p 'Press Return to close. ' _
