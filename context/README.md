# context/ — Working Memory

This folder is your **frequently updated** layer. It changes constantly as you create content.

Think of it as short-term memory for your LLMs.

## Subfolders

| Folder | Purpose |
|--------|---------|
| `conversations/` | Raw outputs from Perplexity Computer sessions |
| `transcripts/` | Voice memo and podcast transcripts |
| `approvals/` | **Source of truth** — approved, final content only |
| `scratch/` | Drafts and in-progress work — not yet approved |
| `digests/` | Auto-generated weekly summaries |

## How LLMs Use This

When Phone Studio Dock or Perplexity Computer generates content, it reads:
1. `context/approvals/` — to match the tone of what you've already approved
2. `context/conversations/INDEX.md` — to avoid repeating recent topics
3. `context/digests/` — to understand what worked last week

## Workflow

```
Voice memo / screenshot → Phone Studio Dock
    → LLM generates caption
    → You review in app
    → If approved: save to context/approvals/
    → If rejected: save to context/scratch/ for later editing
```

## File Naming Convention

```
YYYY-MM-DD-short-description.md
```

Examples:
- `2026-04-11-podcast-script-ep05.md`
- `2026-04-12-instagram-carousel-sustainability.md`
