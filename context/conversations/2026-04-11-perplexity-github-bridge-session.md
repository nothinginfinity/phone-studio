---
date: "2026-04-11"
time: "20:15:00Z"
title: "Perplexity - GitHub Bridge Design Session"
type: "conversation"
status: "inbox"
platform: "phone-studio"
llm: "perplexity-computer"
tags: ["perplexity", "architecture", "github", "phone-studio"]
---

# Perplexity - GitHub Bridge Design Session

## Summary

Conversation with Perplexity Computer designing the GitHub bridge for Phone Studio.
Key decisions made about PWA architecture vs native Swift, localStorage for token storage,
and the ingest-outputs.yml workflow design.

## Conversation

**Me:** I want to connect my Phone Studio PWA to GitHub so generated content saves automatically...

**Perplexity:** Since your Phone Studio app is a PWA (JavaScript + HTML running in Safari),
the GitHub bridge should be JavaScript modules that drop into your existing docs/ folder.
No Xcode, no Swift required. Here's the architecture...

[Full conversation content pasted here]

## Action Items

- [ ] Add github-client.js to docs/
- [ ] Add github-ui.js to docs/
- [ ] Update index.html to include new scripts
- [ ] Create GitHub PAT with repo scope
- [ ] Deploy ingest-outputs.yml workflow
- [ ] Set up Obsidian git sync

## Backlinks

Related files:
- [[2026-04-11-instagram-caption-fitness]] (first file saved via bridge)
- [[ARCHITECTURE]] (repo architecture doc)
