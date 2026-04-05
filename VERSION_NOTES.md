# Phone Studio Versions

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
