# Context Schema

This document defines the structure and contracts for all context files in this repo.
LLMs and tools rely on this schema to know what to expect in each file.

---

## Conversation Files (`context/conversations/`)

**Filename format**: `YYYY-MM-DD-short-slug.md`

**Frontmatter (YAML)**:
```yaml
---
date: 2026-04-11          # ISO date
title: "slug-or-title"    # Short descriptive title
platform: perplexity      # Source: perplexity | voice | manual | dock
status: saved             # saved | draft | archived
saved_at: 2026-04-11T...  # ISO timestamp (auto-set by MCP)
---
```

**Body**: Full conversation text in Markdown.

---

## Approval Files (`context/approvals/`)

**instagram_posts.md structure**:
```markdown
## YYYY-MM-DD: Post Title

**Caption (APPROVED)**
[final caption text]

**Hashtags**: #tag1 #tag2
**Status**: Posted / Draft
**Engagement**: N likes, N comments
**LLM Used**: [model name]
**Brand Adherence**: ✓ [note]
```

**captions.md structure**:
```markdown
## YYYY-MM-DD: [Platform] — [Title]

**Platform**: instagram / linkedin / twitter / tiktok
**Caption**: [Final text]
**Posted**: Yes / No / Scheduled YYYY-MM-DD
**LLM**: [model used]
```

---

## Content Calendar (`knowledge/content_calendar.json`)

```json
{
  "content": [
    {
      "id": "YYYY-MM-DD-platform-slug",      // Unique ID
      "date": "YYYY-MM-DD",                   // Planned publish date
      "platform": "instagram",               // instagram|twitter|linkedin|podcast|tiktok
      "title": "Post title",
      "format": "carousel",                  // single-image|carousel|reel|thread|long-form|podcast
      "topics": ["topic1", "topic2"],         // For dedup checking
      "status": "planning",                  // planning|draft|approved|posted|archived
      "draft_url": "",                        // Optional: path to draft file
      "notes": ""
    }
  ]
}
```

---

## MCP Context Response (from `get_context`)

When the MCP server returns context for LLM inference:

```json
{
  "brand_voice": "string — full content of docs/BRAND_VOICE.md",
  "audience": "string — full content of knowledge/audience.md",
  "llm_routing": "string — full content of docs/LLM_ROUTING.md",
  "fetched_at": "ISO timestamp",
  "task_type": "write_captions | generate_ideas | route_lead | general",

  // Conditional — only present for write_captions:
  "approved_instagram": "string",
  "approved_captions": "string",

  // Conditional — only present for generate_ideas:
  "recent_conversations": [ { "filename": "...", "content": "..." } ],
  "content_calendar": "string",
  "content_strategy": "string",

  // Conditional — only present for route_lead:
  "product_features": "string"
}
```

---

## Digest Files (`context/digests/`)

**Filename format**: `weekly_YYYY-WNN.md`

Auto-generated every Monday by the `generate-weekly-digest` GitHub Action.
Contains: summary of approved content, patterns, and suggestions for next week.

---

*This schema is intentionally minimal for V1 — extend it as your workflow evolves.*
