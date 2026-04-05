# Phone Studio

iPhone-first AI content studio PWA.

Phone Studio V1 turns screenshots into structured content using on-device OCR plus a locally running LLM. The initial setup is done on Mac, then the repo can be maintained from iPhone with Git and iOS code editor apps.

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

For local LLM testing:
- Keep Locally AI running on the same device.
- Load the Llama 3.2 3B model.
- Confirm the in-app debug panel shows the localhost endpoint and a connected status.

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
- Auto-variant generation
- Lead extraction
- Basic scheduling
- Better offline caching and sync controls

### V2
- Backend sync
- Instagram and TikTok auto-posting
- CRM integration
- Cross-device workflow
