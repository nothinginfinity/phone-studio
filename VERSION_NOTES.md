# Phone Studio Version Notes

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
