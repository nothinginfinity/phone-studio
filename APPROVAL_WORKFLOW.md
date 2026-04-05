# Phone Studio V1 - Approval Workflow

## User Journey: Screenshot → Approval → Post

### Phase 1: Capture (Your iPhone)
1. **Screenshot** - User takes screenshot of text/website
2. **OCR** - PWA extracts text via Tesseract.js
3. **LLM** - Local Llama 3.2 3B processes extracted text
4. **Review** - Raw text displayed for manual correction
5. **Structure** - JSON generated with metadata

### Phase 2: Approval Queue
Status flow:
```
draft → pending_review → approved → scheduled → posted
   ↓
   └─ rejected → back to draft
```

Each screenshot enters approval queue with:
- Original image (if user wants to keep it)
- Extracted text (OCR output)
- LLM-processed content
- Associated recordings (if linked)

### Phase 3: Content Generation from Screenshot
From one screenshot, generate variants:
```
Screenshot → Instagram Caption
          → TikTok Caption (shorter)
          → Email Headline
          → Blog Post Snippet
          → LinkedIn Post
```

Each variant has own approval state.

### Phase 4: Lead Routing (CRM)
If screenshot contains contact info:
1. Auto-extract email/phone
2. Create or update CRM contact
3. Tag with "from_screenshot"
4. Route to appropriate pipeline

Example:
```
Screenshot contains: "Contact john@acme.com"
→ New contact created
→ Tagged: "screenshot_source", "email_lead"
→ Next action: "Add to email sequence"
```

## V1 Approval UI Mockup

```
┌─────────────────────────────────────┐
│ Screenshot Approval Queue           │
├─────────────────────────────────────┤
│                                     │
│ [Pending: 3]  [Approved: 5]        │
│                                     │
├─────────────────────────────────────┤
│ 📷 Screenshot #001                 │
│ Timestamp: 2:14 PM                 │
│ Confidence: 92%                    │
│                                     │
│ Text Preview:                      │
│ "Contact us at hello@acme.com"     │
│                                     │
│ 🤖 LLM Output:                     │
│ "Premium solutions for teams"      │
│                                     │
│ Variants: 3 generated              │
│ Leads: 1 extracted                 │
│                                     │
│ [✓ Approve] [↻ Edit] [✗ Reject]   │
└─────────────────────────────────────┘
```

## Approval States & Actions

### Draft
- User reviewing extracted text
- Can edit raw text manually
- Can regenerate LLM output with different prompt
- Action: → Move to Pending Review

### Pending Review
- Waiting for approval
- All variants visible
- Can approve/reject individual variants
- Can add notes/tags
- Action: → Approve / → Reject / → Back to Draft

### Approved
- Ready for scheduling
- Variants locked (can't edit)
- Can link to voice recordings
- Can generate social posts
- Action: → Schedule / → Archive

### Scheduled
- Post queued for specific time
- Linked to voice recording/content series
- Auto-posting via official API
- Action: → Post / → Reschedule

### Posted
- Live on Instagram/TikTok
- Record posted_at timestamp
- Link to analytics
- Action: → Archive / → View Analytics

### Rejected
- Not approved for publishing
- Can return to Draft for edits
- Keep for reference/learning
- Action: → Back to Draft / → Delete

## V1 Approval Flow (Simplified for MVP)

```
User Takes Screenshot
        ↓
PWA: Extract Text (OCR) + Process (LLM)
        ↓
Show: Raw Text + LLM Output
        ↓
User Reviews & Approves?
        ├─ YES → Save JSON, show variants
        │         Ask: "Generate post variants?"
        │         ├─ YES → Auto-generate 3 variants
        │         └─ NO → Save & wait for manual approval
        │
        └─ NO → Edit text, regenerate, or discard

User Approves Variants?
        ├─ YES → Mark as "Ready to Post"
        │         Show: "Link voice recording? [Yes/No]"
        │         Show: "Schedule post time?"
        │
        └─ NO → Edit variants individually

User Schedules Post?
        ├─ YES → Set time, platform (Instagram/TikTok)
        │         Auto-post via official API at scheduled time
        │
        └─ NO → Save as draft, schedule manually later
```

## V1 Storage & Sync

**Local** (on iPhone):
- All screenshots, OCR results, LLM outputs stored in IndexedDB
- All variants and approvals tracked locally
- Works completely offline

**Optional Sync** (V1.5):
- If user adds backend: POST approved screenshots to server
- Backup to cloud storage
- Enable cross-device access

## Lead Capture from Screenshots

When screenshot contains email/phone:
```
1. LLM flags: "Contact info detected: john@acme.com"
2. PWA extracts and creates lead record
3. Lead linked to screenshot + recording + contact
4. In CRM: New/updated contact with tags
5. User can configure: Auto-create contact? Auto-email? Auto-SMS?
```

Example lead extraction prompt:
```
"Extract all email addresses, phone numbers, and names from this text. 
Return as JSON array: [{ type: 'email', value: '...' }, ...]"
```

## V1 MVP Scope for Approval
- ✅ Screenshot capture + OCR
- ✅ LLM processing + output review
- ✅ Manual approve/reject
- ✅ Generate 3 content variants
- ✅ Basic lead extraction
- ✅ Save approved screenshots as JSON
- ⏳ Schedule posts (V1.5)
- ⏳ Auto-post to Instagram/TikTok (V1.5)
- ⏳ Cloud sync (V2)

## V1 Approval Workflow Example (Your Day)

9:00 AM - You capture screenshot of competitor's website
9:01 AM - PWA extracts text, runs LLM
9:02 AM - Review: 92% OCR confidence, LLM generated caption
9:03 AM - Click "Approve" → 3 variants generated
9:04 AM - Review variants, select best one
9:05 AM - Click "Link voice recording" → Select recording from earlier
9:06 AM - Click "Schedule Post" → Set for 2:00 PM
9:07 AM - PWA shows: "Ready! Will post at 2:00 PM"
2:00 PM - Auto-posted to Instagram + TikTok via API
2:01 PM - Lead from screenshot (email) auto-added to CRM
