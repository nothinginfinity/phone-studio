#!/bin/bash
# ============================================================
# save_conversation.sh
# PURPOSE: Quick shell script to save a conversation from CLI
#          Useful when running from iPhone via SSH/Shelly/a-Shell
#
# USAGE:
#   ./save_conversation.sh "my-post-title" "path/to/content.md"
#   ./save_conversation.sh "my-post-title" -  (read from stdin)
#
# REQUIRES: git, configured GitHub remote
# ============================================================

set -e

TITLE="${1:-untitled}"
SOURCE="${2:-}"
DATE=$(date +%Y-%m-%d)
SLUG=$(echo "$TITLE" | tr '[:upper:]' '[:lower:]' | sed 's/ /-/g')
OUTFILE="context/conversations/${DATE}-${SLUG}.md"

# Read content
if [ "$SOURCE" = "-" ] || [ -z "$SOURCE" ]; then
    echo "Paste content (end with Ctrl+D):"
    CONTENT=$(cat)
elif [ -f "$SOURCE" ]; then
    CONTENT=$(cat "$SOURCE")
else
    CONTENT="$SOURCE"
fi

# Write file
cat > "$OUTFILE" <<EOF
---
date: $DATE
title: "$TITLE"
platform: manual
status: saved
saved_at: $(date -u +%Y-%m-%dT%H:%M:%SZ)
---

# $TITLE

$CONTENT
EOF

echo "Saved: $OUTFILE"

# Commit and push
git add "$OUTFILE"
git commit -m "save: $TITLE"
git push

echo "Pushed to GitHub"
