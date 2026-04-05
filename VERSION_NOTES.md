# Phone Studio Versions

## V5 - Content Creation Wizard

**New Features:**
- 4-step guided content creation wizard
- Platform templates for Instagram, TikTok, LinkedIn, Blog, Email, and Twitter/X
- Source selection modes:
  - Random picks from the library
  - Search by topic
  - Manual multi-select
  - Combine photos and memos
  - Jump to upload or record more source material
- In-app review, editing, copy, and download for generated drafts

**Workflow:**
1. Open `Create Content`
2. Choose a platform
3. Pick source material from indexed photos and memos
4. Generate a draft with the active LLM
5. Edit, copy, or download

## iPhone UX Pass - App-Like Home & Install Guidance

**New Features:**
- App-style home dashboard with quick-launch cards
- First-run install prompt for Add to Home Screen on iPhone
- Sticky quick dock for Home, Record, Search, and Library
- Larger and more prominent voice recording entry point
- Optional fast-launch guidance for Shortcut / Action Button setup

## V3.1 Enhanced - iCloud Voice Memo Export + Import

**New Features:**
- In-app iOS Shortcut setup guide for Voice Memos export
- iCloud Drive / Files bridge for matching audio and transcript pairs
- One-click `Check iCloud Drive` and `Import All` workflow
- Imported memos are summarized, indexed, and marked as iCloud imports
- Manual transcript-paste import remains as a fallback

**Workflow:**
1. Record in Voice Memos
2. Run `Export to Phone Studio`
3. Save audio + transcript files with matching names
4. Check iCloud Drive from Phone Studio
5. Import matched memo pairs into the local memo library

## V4 Foundation - Comprehensive LLM Provider Support

**New Features:**
- Provider directory expanded to 15+ BYOK options
- Active-provider summary in Settings
- Multi-key local storage with saved-key switching
- Provider comparison modal for cost, speed, and free-tier review
- Legacy API keys migrate into the new settings model automatically

**Current Text Workflow Providers:**
- Groq, Groq 8B Fast, DeepSeek, Mistral, Cerebras, Fireworks, Together
- OpenAI, Claude, Claude 3.5 Sonnet, Cohere, xAI, Gemini, Perplexity

**Directory-Only Foundations For Later V4.x Work:**
- EXA
- Runway
- Replicate
- Hugging Face

## V3.1 - Voice Memo Import & Search

**New Features:**
- Voice memo import tab
- Voice memo IndexedDB store
- Transcript summarization and key-point extraction
- Unified search across photos and memos
- Audio playback inside the detail modal

**Workflow:**
1. Import memo files
2. Paste the transcript text
3. Summarize and index
4. Search alongside photos in one interface

## V2.6 - Enhanced Semantic Search & Browse

**Major Improvements:**
- Full-featured semantic search interface
- Filters for content type, confidence, and sort mode
- Visual result cards with metadata and previews
- Quick-search shortcuts from the library
- JSON export for result sets
- Modal detail view for indexed photos

**User Experience:**
- Search `finance` and find related photos instantly
- Filter to `contract` and browse only contract-like records
- See concepts, keywords, summaries, and previews without opening each record
- Export matching result sets for downstream workflows

## V2.5 - Semantic Compression (Current)

**New Features:**
- Semantic compression engine
- Photo metadata generation
- Compressed index format for compact embedding
- Concept and keyword extraction
- Entity recognition
- Content-type classification

**Files:**
- `docs/index.html`
- `docs/app.js`
- `docs/styles.css`

**Key Components:**
- `SemanticCompressor`
- `PhotoMetadataWriter`
- Metadata display UI
- Copy-to-clipboard flow for Photos metadata

**Workflow:**
1. Screenshot is processed normally.
2. Semantic compression generates an index.
3. User copies metadata to the photo description.
4. The photo becomes indexed and LLM-ready.

**Next (V3):**
- Native iOS app for auto-metadata embedding
- Semantic search interface
- Embedding vectors for similarity search
- iOS Shortcuts automation

## V2 - Batch Processing & Search

**New Features:**
- Bulk upload UI for photo batches
- Batch OCR and optional LLM analysis
- Local IndexedDB batch library
- Full-text search across processed photos
- Library stats and recent-item views

**Key Components:**
- `BatchDB`
- `processBatchPhotos()`
- Search and library tabs
- Progress bar and queue state

## Storage Breakdown

Per photo:
- Full OCR: 2-5 KB stored locally in IndexedDB
- Full LLM: 1-3 KB stored locally in IndexedDB
- Semantic compressed: roughly 300-500 bytes for photo description
- Total footprint on device: about 5 KB local plus 0.5 KB embedded

100 photos:
- Local storage: about 500 KB
- Photo metadata: about 50 KB
- Total: about 550 KB

## V1 Features

- Screenshot upload with in-browser preview
- OCR extraction with Tesseract.js
- Manual LLM prompt selection
- Local processing through Locally AI with Llama 3.2 3B
- JSON, Markdown, and raw output views
- JSON download and clipboard copy
- Debug panel for LLM, OCR, storage, and endpoint status
- Local IndexedDB persistence for processed records

## V1.5 Features

- Groq 70B plus Groq 8B fast model options
- Voice recording linked to screenshot records
- Variant generation for Instagram, TikTok, email, LinkedIn, and ideas
- Lead extraction for emails and phone numbers
- Approval state now defaults to `pending_review`
- Richer JSON output with voice, lead, and variant metadata

## Known Limitations

- LLM processing is manually triggered
- No scheduling workflow yet
- No backend sync yet
- No automated social posting
- OCR quality still depends on screenshot clarity
- Voice notes are linked locally but not transcribed yet
- Offline support is limited to cached app shell assets

## V2 Roadmap

- Backend sync and multi-device continuity
- Instagram and TikTok auto-posting
- CRM integration and contact routing
- Analytics and performance tracking
