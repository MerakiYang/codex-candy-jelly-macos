#!/bin/bash
ROOT="$(cd "$(dirname "$0")" && pwd)"
/bin/bash "$ROOT/scripts/run.sh" restore
status=$?
read -r -p 'Press Return to close. ' _
exit "$status"
