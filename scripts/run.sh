#!/bin/bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
NODE="${CANDY_NODE:-}"
if [[ -z "$NODE" ]]; then
  NODE="$(command -v node || true)"
fi
if [[ -z "$NODE" ]]; then
  for candidate in /opt/homebrew/bin/node /usr/local/bin/node; do
    if [[ -x "$candidate" ]]; then NODE="$candidate"; break; fi
  done
fi
if [[ -z "$NODE" || ! -x "$NODE" ]]; then
  echo 'Install Node.js 22 or newer from https://nodejs.org, then run this command again.'
  exit 1
fi
exec "$NODE" "$ROOT/src/cli.mjs" "${1:-help}"
