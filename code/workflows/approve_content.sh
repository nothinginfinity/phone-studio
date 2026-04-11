#!/bin/bash
# ============================================================
# approve_content.sh
# PURPOSE: Move a draft from context/scratch/ to context/approvals/
#          and commit it as "approved"
#
# USAGE:
#   ./approve_content.sh context/scratch/2026-04-11-my-draft.md instagram
#
# REQUIRES: git, configured GitHub remote
# ============================================================

set -e

SOURCE_FILE="$1"
PLATFORM="${2:-all}"

if [ -z "$SOURCE_FILE" ] || [ ! -f "$SOURCE_FILE" ]; then
    echo "Usage: $0 <path-to-draft-file> [platform]"
    echo "Example: $0 context/scratch/2026-04-11-post.md instagram"
    exit 1
fi

BASENAME=$(basename "$SOURCE_FILE")
DATE=$(date +%Y-%m-%d)

# Determine target approval file
if [ "$PLATFORM" = "instagram" ]; then
    TARGET="context/approvals/instagram_posts.md"
elif [ "$PLATFORM" = "all" ] || [ "$PLATFORM" = "general" ]; then
    TARGET="context/approvals/captions.md"
else
    TARGET="context/approvals/${PLATFORM}_posts.md"
fi

# Append draft content to approval file with header
{
    echo ""
    echo "---"
    echo ""
    echo "## ${DATE}: $(basename "$SOURCE_FILE" .md)"
    echo ""
    echo "**Status**: APPROVED $(date -u +%Y-%m-%dT%H:%M:%SZ)"
    echo "**Platform**: $PLATFORM"
    echo ""
    cat "$SOURCE_FILE"
} >> "$TARGET"

# Remove from scratch
rm "$SOURCE_FILE"

# Commit
git add "$TARGET" "$SOURCE_FILE"
git commit -m "approve: $BASENAME → $PLATFORM"
git push

echo "Approved: $BASENAME → $TARGET"
