#!/bin/bash
# What is left to port from the fork, per path.
#
# After Slice 2's real merge the fork tip is an ancestor of the integration
# branch, so `git merge-base` returns the fork tip itself and `git merge` /
# `git merge-tree` against the fork report nothing left, whether or not later
# commits dropped what the fork added. Ancestry no longer answers the question.
# This asks it per file instead: a three-way merge of each path against the
# ORIGINAL (pre-merge) base, compared with what the integration branch has now.
#
# Usage: whats-left.sh [--base REV] [--ours REV] [--theirs REV] [--pending] [path ...]
#   --base    the pre-merge merge-base   (default: 2b2a7c719bb3546df8c78ddeaf95256535ee2dd3)
#   --ours    the integration branch     (default: HEAD)
#   --theirs  the fork tip               (default: 4cfc3763)
#   --pending print only paths that are not LANDED
#   path ...  limit to these paths (default: every path the fork changed since base)
#
# One line per path, "<status>\t<path>":
#   LANDED          ours already contains every fork change to this path
#   fork-adds:N     merging the fork's changes would add N lines ours lacks
#   CONFLICT:N      the fork's changes conflict with ours in N hunks
#   ours-deleted    the fork changed the path; ours no longer has it (dropped on
#                   purpose, or lost: the plan's "permanently dead" list says which)
#   fork-deletes    the fork deleted the path; ours still has it
#   binary-differs  a binary file that differs between ours and the fork
#
# Exit 0 = report printed (whatever it says). Exit 2 = usage or bad revision.
set -u

BASE=2b2a7c719bb3546df8c78ddeaf95256535ee2dd3
OURS=HEAD
THEIRS=4cfc3763
PENDING=0
PATHS=()

usage() { sed -n '2,27p' "$0" | sed 's/^# \{0,1\}//'; }

while [ $# -gt 0 ]; do
  case "$1" in
    --base) BASE="${2:-}"; shift 2 ;;
    --ours) OURS="${2:-}"; shift 2 ;;
    --theirs) THEIRS="${2:-}"; shift 2 ;;
    --pending) PENDING=1; shift ;;
    -h|--help) usage; exit 0 ;;
    --) shift; while [ $# -gt 0 ]; do PATHS+=("$1"); shift; done ;;
    -*) echo "whats-left: unknown option $1" >&2; exit 2 ;;
    *) PATHS+=("$1"); shift ;;
  esac
done

for rev in "$BASE" "$OURS" "$THEIRS"; do
  if ! git rev-parse --verify --quiet "${rev}^{commit}" >/dev/null; then
    echo "whats-left: not a commit: '$rev'" >&2
    exit 2
  fi
done

SCRATCH="$(mktemp -d)"
trap 'rm -rf "$SCRATCH"' EXIT

has() { git cat-file -e "$1:$2" 2>/dev/null; }

# status_of <path> -> prints the status word for one path
status_of() {
  local p="$1"
  local in_base=0 in_ours=0 in_theirs=0
  has "$BASE" "$p" && in_base=1
  has "$OURS" "$p" && in_ours=1
  has "$THEIRS" "$p" && in_theirs=1

  if [ "$in_theirs" -eq 0 ]; then
    # The fork deleted it (or never had it). Nothing to port unless ours kept it.
    if [ "$in_ours" -eq 1 ] && [ "$in_base" -eq 1 ]; then echo "fork-deletes"; else echo "LANDED"; fi
    return
  fi
  if [ "$in_ours" -eq 0 ]; then
    echo "ours-deleted"
    return
  fi

  git show "$OURS:$p" > "$SCRATCH/ours"
  git show "$THEIRS:$p" > "$SCRATCH/theirs"
  if [ "$in_base" -eq 1 ]; then git show "$BASE:$p" > "$SCRATCH/base"; else : > "$SCRATCH/base"; fi

  if cmp -s "$SCRATCH/ours" "$SCRATCH/theirs"; then
    echo "LANDED"
    return
  fi

  local conflicts
  git merge-file -p "$SCRATCH/ours" "$SCRATCH/base" "$SCRATCH/theirs" > "$SCRATCH/merged" 2>/dev/null
  conflicts=$?
  if [ "$conflicts" -ge 128 ]; then
    # merge-file refuses binary input.
    echo "binary-differs"
    return
  fi
  if [ "$conflicts" -gt 0 ]; then
    echo "CONFLICT:$conflicts"
    return
  fi
  if cmp -s "$SCRATCH/ours" "$SCRATCH/merged"; then
    echo "LANDED"
    return
  fi
  local added
  added="$(git diff --no-index --numstat "$SCRATCH/ours" "$SCRATCH/merged" | cut -f1)"
  echo "fork-adds:${added:-0}"
}

if [ "${#PATHS[@]}" -eq 0 ]; then
  git diff --name-only -z --no-renames "$BASE" "$THEIRS" > "$SCRATCH/paths"
else
  printf '%s\0' "${PATHS[@]}" > "$SCRATCH/paths"
fi

total=0
landed=0
while IFS= read -r -d '' p; do
  status="$(status_of "$p")"
  total=$((total + 1))
  if [ "$status" = "LANDED" ]; then
    landed=$((landed + 1))
    [ "$PENDING" -eq 1 ] && continue
  fi
  printf '%s\t%s\n' "$status" "$p"
done < "$SCRATCH/paths"

echo "whats-left: $total path(s) the fork changed since ${BASE:0:8}; $landed landed, $((total - landed)) pending (ours=$OURS theirs=$THEIRS)" >&2
