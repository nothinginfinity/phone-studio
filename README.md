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

## LLM Provider Setup

Phone Studio supports multiple LLM providers:

- **Groq 70B** (Free, recommended): Get key at https://console.groq.com/keys
- **Groq 8B Fast** (Free): Same Groq key, faster testing model
- **Mistral** (Free): Get key at https://console.mistral.ai/api-keys
- **DeepSeek**: Get key at https://platform.deepseek.com/api_keys
- **OpenAI**: Get key at https://platform.openai.com/api-keys
- **Claude (Anthropic)**: Get key at https://console.anthropic.com
- **xAI (Grok)**: Get key at https://console.x.ai

In the PWA, go to Settings panel -> Select provider -> Paste API key -> Save.

Your API keys are stored locally on your device and never sent to our servers.

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
