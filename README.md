# Phone Studio

iPhone-first AI content studio PWA.

Phone Studio turns screenshots into structured content with OCR, multi-provider LLM processing, optional voice context, lead extraction, and variant generation. The initial setup is done on Mac, then the repo can be maintained from iPhone with Git and iOS code editor apps.

## Quick Start

```bash
# 1. Clone repo
git clone https://github.com/yourusername/phone-studio.git
cd phone-studio

# 2. Local testing (optional, for Mac preview)
python -m http.server 8000
# Then open: http://localhost:8000/docs

# 3. Edit files in your preferred editor (VS Code, etc.)

# 4. Push to GitHub
git add .
git commit -m "Initial V1 commit: Screenshot OCR + LLM integration"
git push origin main

# 5. GitHub Pages will auto-deploy to:
# https://yourusername.github.io/phone-studio
```

## Local Development

The deployable app lives in [`docs/`](/Users/kanelawaccount/phone-studio/docs). Open [`docs/index.html`](/Users/kanelawaccount/phone-studio/docs/index.html) through a local server instead of `file://` so the manifest and service worker behave correctly.

For LLM testing:
- Select a hosted provider in the in-app Settings panel and save an API key locally.
- The active provider endpoint and key status appear in the debug panel.
- Localhost-based on-device inference remains a future path for the app.

## V4 - Comprehensive LLM Provider Support & Settings

### Supported Providers

**Text Generation:**
- Groq (Free, Very Fast)
- Groq 8B Fast (Free)
- DeepSeek (Cheap, Very Fast)
- Mistral AI (Free tier)
- Cerebras (Very Fast)
- Fireworks AI (Very Fast)
- Together AI (Very Fast)
- OpenAI (High quality)
- Claude / Claude 3.5 Sonnet (High quality)
- Cohere (Research-focused)
- xAI / Grok (Creative)

**Multimodal (Text + Vision/Search):**
- Google Gemini (Free tier, vision)
- Perplexity (Search + context)
- EXA (Advanced search)

**Creative / Multimodal Directory:**
- Runway
- Replicate
- Hugging Face

### Settings & API Keys

Add an API key:
1. Go to `Settings & API Keys`
2. Select a provider from the directory
3. Tap `Get API Key` for the signup link
4. Paste the key and save it locally
5. Use the saved-key list to switch providers later

Provider comparison:
- Compare cost, speed, free-tier status, and category
- Keep multiple API keys saved on-device
- Switch active providers without retyping keys

BYOK model:
- API keys stay in browser storage on your iPhone
- Keys are never sent to Phone Studio servers
- You control which provider is active for content generation
- Existing legacy keys are migrated forward automatically

## V1.5 Features

- Screenshot capture plus OCR extraction
- Multi-LLM support (OpenAI, Groq, DeepSeek, Mistral, Anthropic, xAI)
- Voice recording linking for screenshot context
- Auto-generate content variants for Instagram, TikTok, email, LinkedIn, and idea generation
- Lead extraction for emails and phone numbers
- Approval workflow foundation with `pending_review` output state
- JSON export with richer metadata

### Testing With Groq

Groq offers 60 free requests per minute:

1. Get an API key: https://console.groq.com/keys
2. In Phone Studio Settings, select `Groq 70B` or `Groq 8B`
3. Paste the API key and save

Use Groq for daily testing to keep costs down.

## V2.5 - Semantic Compression & Photo Metadata

Phone Studio now generates semantically compressed metadata for each screenshot.

### What Is Semantic Compression?

Instead of storing only full OCR text, Phone Studio now also extracts:
- Content type such as contract, email, program, or report
- Key concepts such as finance, business, legal, or marketing
- Named entities such as companies or people
- Keywords for search and recall
- A short summary

Target size: roughly **300-500 bytes** for the metadata string, versus several KB for full OCR and analysis.

### How To Use

1. Process a screenshot in Phone Studio.
2. Copy the metadata string from the `Add to Photo Description` panel.
3. Open the Photos app on iPhone.
4. Open the photo info/description field.
5. Paste the metadata and save.

Your photo now carries:
- The visual screenshot
- A semantic index in the description
- Searchable keywords
- Structured metadata for later LLM workflows

### Why This Matters

Each photo becomes a self-contained knowledge unit:
- Backs up to iCloud with context attached
- Is more searchable by semantic meaning
- Can be queried later without re-reading the full OCR every time
- Is easier to share with useful context intact
- Sets up future automation and batch indexing

## V2 Features - Batch Processing & Search

- Process 10-50 photos at once
- Automatic OCR on batch uploads
- Batch LLM analysis
- Optional batch variant generation
- Local IndexedDB library
- Full-text search across processed photos
- Library stats and management

### Workflow

1. Go to `Batch Photo Processor`
2. Click `Select Photos`
3. Choose OCR, LLM, and optional variants
4. Click `Start Batch Processing`
5. Use the `Search Index` tab to search by keywords such as `credit`, `contract`, or `email`
6. Use the `Photo Library` tab to review recent items and clear the index if needed

All data stays local on the device. No backend required.

## V2.6 - Enhanced Semantic Search & Browse

### Search Features

**Full-Text Search:**
- Search by keywords such as `credit`, `contract`, or `business`
- Searches across concepts, keywords, entities, raw text, and summaries
- Relevance scoring for ranked results

**Filtering:**
- Filter by content type
- Filter by confidence level
- Sort by recent, oldest, relevance, or type

**Results Display:**
- Visual result cards with metadata
- Summary, concepts, keywords, and preview text
- Quick actions for viewing details and copying JSON

**Export:**
- Export matching results as JSON
- Includes compressed index plus OCR and LLM content

### Usage

1. Go to the `Search Index` tab
2. Type a search term such as `credit`, `business`, or `contract`
3. Optionally filter by type or confidence
4. Review the result cards
5. Open `View` for full details or `Copy` for JSON
6. Use `Export Results` to download the current result set

### Quick Search

Use shortcuts in the Library tab:
- `Business`
- `Finance`
- `Contract`
- `Email`

## V3.1 - Voice Memo Import & Search

### Features

**Voice Memo Import:**
- Import multiple memo files from device storage
- Paste iOS Voice Memos transcripts during processing
- Optional LLM summarization
- Key-point extraction
- Semantic indexing for each memo

## V3.1 Enhanced - Voice Memo Workflow with iCloud Export

### Complete Workflow

**1. Record in Voice Memos (iOS):**
- Voice Memos auto-transcribes on-device
- No separate transcription service required

**2. Export via Shortcut:**
- Run `Export to Phone Studio`
- Save audio to `iCloud Drive/PhoneStudio/audio/`
- Save transcript to `iCloud Drive/PhoneStudio/transcripts/`

**3. Import into Phone Studio:**
- Open the `Voice Memos` tab
- Tap `Check iCloud Drive`
- Choose the exported folder or files from Files if prompted
- Review matched memo pairs
- Tap `Import All`

**4. Search and Reuse:**
- Imported memos are summarized and indexed locally
- Search them alongside photos
- Generate downstream content from the indexed memo library

### Setup

1. Follow the in-app `Voice Memo Export Setup` guide.
2. Create the Shortcut recipe shown in the modal.
3. Enable iCloud Drive and Shortcuts sync on iPhone.
4. Grant Files access the first time Phone Studio asks for it.

Manual import remains available as a fallback if the Shortcut or Files flow is not available.

**Voice Memo Search:**
- Search transcripts, summaries, key points, and semantic keywords
- Browse memo results in the same search interface as photos
- Play memo audio while reading transcript and summary

**Unified Search:**
- Search photos and voice memos together
- Result cards show source, summary, and preview
- Detail modal supports both image-derived notes and audio memos

### Usage

1. Go to the `Voice Memos` tab.
2. Select one or more memo files.
3. Paste the transcript for each memo when prompted.
4. Let Phone Studio summarize and index them.
5. Search from the `Search Index` tab to find both photos and memos together.

## GitHub Pages Deployment

1. Create a public GitHub repository named `phone-studio`.
2. Push the `main` branch.
3. In GitHub Settings, enable Pages with:
   - Source: `Deploy from a branch`
   - Branch: `main`
   - Folder: `/docs`
4. Confirm the published URL:
   `https://yourusername.github.io/phone-studio`
5. Add repository topics:
   `pwa`, `ai`, `ios`, `llm`, `content-creation`

Recommended repository description:
`AI-powered content studio for iPhone. Screenshot to JSON with local LLM.`

## iPhone Development Path

After the initial Mac setup, this app is designed to be improved from iPhone. Developers can:

1. Use Working Copy to clone or pull the repo.
2. Open files in iOS editors such as Codepoint, Prompt, or CodeRunner.
3. Edit the PWA directly on iPhone.
4. Commit and push changes through Working Copy.
5. Test immediately in Safari after GitHub Pages deploys.

This app is designed to be improved from iPhone. After initial setup on Mac, developers can edit via iOS code editors like Codepoint or Prompt.

## Repository Layout

```text
phone-studio/
├── docs/
│   ├── index.html
│   ├── app.js
│   ├── styles.css
│   ├── manifest.json
│   └── service-worker.js
├── .gitignore
├── README.md
├── ARCHITECTURE.md
├── DATA_SCHEMA.md
├── APPROVAL_WORKFLOW.md
├── INTEGRATION_GUIDE.md
└── VERSION_NOTES.md
```

## Roadmap

### V1
- Screenshot upload and preview
- OCR with Tesseract.js
- Local LLM processing via Locally AI
- JSON, Markdown, and raw output tabs
- Local IndexedDB save for processed records
- GitHub Pages-ready PWA shell

### V1.5
- Voice recording linked to screenshot workflows
- Auto-variant generation
- Lead extraction
- Basic scheduling and approval pipeline groundwork
- Better offline caching and sync controls

### V2
- Backend sync
- Instagram and TikTok auto-posting
- CRM integration
- Cross-device workflow
