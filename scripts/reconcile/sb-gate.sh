#!/bin/bash
# Full reconcile gate, clean-tree. Usage: sb-gate.sh <worktree> <logprefix>
# <logprefix> must be absolute (e.g. /tmp/sbgate/slice-x); logs land at <logprefix>-<step>.log,
# per-step exit codes + final unit/e2e counts at <logprefix>-summary.log.
# Baseline + landing protocol: docs/plans/2026-09-23-m3e-fork-main-reconciliation.md §5.
set -u
case "${2:-}" in /*) ;; *) echo "logprefix must be an absolute path" >&2; exit 98 ;; esac
cd "$1" || exit 99
P="$2"
mkdir -p "$(dirname "$P")"
step() { name=$1; shift; "$@" > "$P-$name.log" 2>&1; c=$?; echo "$name EXIT:$c" | tee -a "$P-summary.log"; return $c; }
: > "$P-summary.log"
[ -f version.json ] || cp /Users/jack/Documents/code/silverbullet-m3e/version.json .
step ci npm ci || step install npm install || exit 1
step build npm run build || exit 1
step cargo cargo build -p silverbullet -p sb || exit 1
./target/debug/silverbullet --version >> "$P-summary.log" 2>&1; git log -1 --format='HEAD %h %s' >> "$P-summary.log"
step check npm run check
step unit npm test
RUST_MIN_STACK=67108864 step lint npm run lint
step e2e npm run test:e2e
tail -5 "$P-unit.log" | grep -E 'Test Files|Tests' >> "$P-summary.log"
grep -E '^\s+[0-9]+ (passed|failed|flaky|skipped)' "$P-e2e.log" >> "$P-summary.log"
echo DONE >> "$P-summary.log"
