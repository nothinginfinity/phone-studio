# Workflows

End-to-end content creation workflows for Phone Studio.
Each workflow is a sequence of steps you take from raw input to published content.

---

## Workflow 1: Voice → Caption → Post

**Time**: ~15 minutes  
**Input**: A voice memo recorded on iPhone  
**Output**: Platform-ready caption saved to `context/approvals/`

```
1. Record voice memo in iPhone Voice Memos
2. Run "Export to Phone Studio" Shortcut
   → Saves audio + transcript to iCloud Drive/PhoneStudio/
3. Open Phone Studio PWA → Voice Memos tab
4. Tap "Check iCloud Drive" → Import memo
5. Phone Studio Dock transcribes (Whisper) + summarizes (Mistral)
6. Tap "Create Content" → select platform
7. Dock reads context from GitHub (brand voice + approved examples)
8. Phi-3 generates 3 caption variants
9. Review → Edit → Tap "Save as Approved"
10. Content auto-saved to context/approvals/
    OR manually: git add + commit + push
```

---

## Workflow 2: Screenshot → Lead → CRM

**Time**: ~5 minutes  
**Input**: A screenshot of a conversation, email, or DM  
**Output**: Structured lead data, routed to CRM

```
1. Take screenshot on iPhone
2. Open Phone Studio → "Upload Screenshot"
3. OCR extracts text
4. LLM extracts: name, email, phone, company, intent
5. Claude 3 routes lead based on product_features.md
6. Lead exported as JSON → paste into CRM
```

---

## Workflow 3: Idea → Content Calendar

**Time**: ~10 minutes  
**Input**: A topic or theme you want to cover  
**Output**: Ideas added to `knowledge/content_calendar.json`

```
1. Open Perplexity Computer
2. Ask: "Generate 5 content ideas about [topic]"
   → Perplexity reads your GitHub context (brand voice, calendar, recent convos)
3. Review ideas
4. Pick 2–3 → add to knowledge/content_calendar.json
5. Commit and push
```

---

## Workflow 4: Weekly Planning

**Time**: ~20 minutes (Mondays)  
**Trigger**: Auto-generated weekly digest OR manual review

```
1. GitHub Action runs every Monday → generates context/digests/weekly_YYYY-WW.md
2. Open the digest file → review what worked last week
3. Open Perplexity Computer with the digest as context
4. Plan next week's content calendar
5. Update knowledge/content_calendar.json
6. Commit and push
```

---

## Workflow 5: Save Perplexity Conversation

**Time**: ~1 minute  
**Use when**: You had a useful Perplexity session you want to reference later

```
Option A (GitHub Actions):
  1. Go to GitHub → Actions → "Ingest Perplexity Output"
  2. Click "Run workflow"
  3. Enter title + paste conversation
  4. Run → auto-committed to context/conversations/

Option B (manual, from iPhone):
  1. Open Working Copy → pull latest
  2. Create file: context/conversations/YYYY-MM-DD-title.md
  3. Paste conversation
  4. Commit + push
```

---

*See also: [docs/API_REFERENCE.md](API_REFERENCE.md) for MCP server endpoints*
