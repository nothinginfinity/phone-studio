# Phone Studio Architecture

## PWA Architecture

Phone Studio V1 is a static, GitHub Pages-friendly progressive web app hosted from the [`docs/`](/Users/kanelawaccount/phone-studio/docs) directory. The app shell is plain HTML, CSS, and JavaScript to keep the repository easy to maintain from iPhone-based editors later.

Core runtime pieces:
- `index.html`: mobile-first shell and workflow UI
- `styles.css`: iPhone-first styling and dark theme
- `app.js`: OCR, local LLM requests, output formatting, and local persistence
- `manifest.json`: install metadata for Safari and PWA-compatible browsers
- `service-worker.js`: basic cache for the app shell

## Local LLM Integration

V1 assumes **Locally AI** is running on the same device with **Llama 3.2 3B** loaded. The app sends requests to:

- Health checks: `http://localhost:8000/health`, `http://localhost:8000/v1/models`
- Chat completions: `http://localhost:8000/v1/chat/completions`

This keeps inference on-device and avoids a backend dependency for the MVP.

## Data Flow

Primary pipeline:

1. User uploads a screenshot in Safari.
2. `Tesseract.js` performs OCR in-browser.
3. Extracted text is displayed for review.
4. The selected prompt is sent to the local LLM.
5. The returned response is wrapped into a JSON record.
6. The JSON record is shown in the UI, available for copy/download, and saved locally.

High-level transformation:

`Screenshot -> OCR text -> prompt selection -> local LLM -> structured JSON/Markdown/raw output`

## Local Storage

V1 persists processed records in **IndexedDB** under the `PhoneStudio` database. The current implementation stores screenshot-derived records in a `screenshots` object store keyed by generated record ID, with indexes for `timestamp` and `approval_state`.

This provides:
- On-device persistence without a backend
- Safer recovery if Safari reloads
- A foundation for approval queues and scheduling

## Future Backend Integration Path

The backend path is intentionally deferred until V2. When needed, the transition is:

1. Keep the PWA as the mobile capture client.
2. POST approved records to a backend API after local validation.
3. Store canonical records in a hosted database.
4. Add sync, scheduling, publishing, CRM, and analytics services incrementally.

Expected future backend responsibilities:
- Cross-device sync
- Approval workflow orchestration
- Variant generation pipelines
- Instagram and TikTok publishing
- CRM lead and contact management
