# Phone Studio V1 - Data Schema

## Screenshot to JSON Flow

### Core Screenshot JSON Structure
```json
{
  "id": "screenshot_001",
  "timestamp": "2026-04-05T09:14:00Z",
  "source_type": "screenshot_ocr",
  "raw_text": "Full extracted text from OCR...",
  "llm_output": "Processed output from local LLM...",
  "metadata": {
    "image_size": {
      "width": 1179,
      "height": 2556
    },
    "ocr_confidence": 0.92,
    "prompt_type": "structure"
  },
  "llm_ready": true,
  "linked_voice_id": null,
  "screenshot_deleted": false
}
```

### Screenshot Record (with approval state)
```json
{
  "id": "screenshot_001",
  "user_id": "jared_001",
  "timestamp": "2026-04-05T09:14:00Z",
  "screenshot_data": {
    "raw_text": "...",
    "llm_output": "...",
    "metadata": { ... }
  },
  "approval_state": "pending_review",
  "linked_recording_id": "recording_001",
  "linked_post_ids": [],
  "created_at": "2026-04-05T09:14:00Z",
  "updated_at": "2026-04-05T09:14:00Z"
}
```

## Variants Generated from Screenshot
```json
{
  "id": "variant_001",
  "screenshot_id": "screenshot_001",
  "variant_type": "instagram_caption",
  "content": "Engaging caption here...",
  "metadata": {
    "character_count": 145,
    "hashtags": 5,
    "emojis": 2
  },
  "approval_state": "pending",
  "approved_by": null,
  "approved_at": null
}
```

## Lead Capture from Screenshot
```json
{
  "id": "lead_001",
  "screenshot_id": "screenshot_001",
  "lead_type": "email",
  "lead_value": "user@example.com",
  "extracted_context": "Found in footer of captured screenshot",
  "status": "new",
  "crm_synced": false
}
```

## CRM Contact Unified Record
```json
{
  "id": "contact_001",
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "source": [
    "screenshot_001",
    "recording_002"
  ],
  "interaction_history": [
    {
      "type": "screenshot",
      "screenshot_id": "screenshot_001",
      "context": "Engaged with Instagram caption",
      "timestamp": "2026-04-05T09:14:00Z"
    }
  ],
  "status": "lead",
  "tags": ["potential_customer", "high_intent"],
  "next_action": "Follow up email"
}
```

## Video/Post Staging
```json
{
  "id": "post_001",
  "type": "instagram_post",
  "status": "draft",
  "content": {
    "caption": "Generated from screenshot_001 + recording_002",
    "media_urls": ["video_001.mp4"],
    "hashtags": ["#content", "#studio"]
  },
  "source_materials": {
    "screenshots": ["screenshot_001"],
    "voice_recordings": ["recording_002"]
  },
  "approval_chain": [
    {
      "stage": "content_review",
      "status": "pending",
      "assigned_to": "jared",
      "comments": ""
    }
  ],
  "scheduled_post_time": "2026-04-05T14:00:00Z",
  "posted_at": null
}
```

## Local Storage Schema (IndexedDB for PWA)
```
Database: "PhoneStudio"

Stores:
1. "screenshots" 
   - keyPath: "id"
   - indexes: ["timestamp", "approval_state", "linked_recording_id"]

2. "variants"
   - keyPath: "id"
   - indexes: ["screenshot_id", "variant_type", "approval_state"]

3. "leads"
   - keyPath: "id"
   - indexes: ["screenshot_id", "lead_type", "status"]

4. "contacts"
   - keyPath: "id"
   - indexes: ["email", "phone", "source"]

5. "posts"
   - keyPath: "id"
   - indexes: ["status", "type", "scheduled_post_time"]

6. "recordings"
   - keyPath: "id"
   - indexes: ["timestamp", "linked_screenshot_ids"]
```
