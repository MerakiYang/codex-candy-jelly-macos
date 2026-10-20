#!/bin/bash
ROOT="$(cd "$(dirname "$0")" && pwd)"
/bin/bash "$ROOT/scripts/run.sh" start
status=$?
if [[ $status -ne 0 ]]; then read -r -p 'Press Return to close. ' _; fi
exit "$status"
