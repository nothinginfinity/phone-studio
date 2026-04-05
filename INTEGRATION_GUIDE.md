# Phone Studio V1 - Technical Integration Guide

## Mac Development Setup

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

## GitHub Pages Setup

1. Create the repository as public.
2. Push the `main` branch.
3. In repository settings, enable GitHub Pages:
   - Source: `Deploy from branch`
   - Branch: `main`
   - Folder: `/docs`
4. Open `https://yourusername.github.io/phone-studio`.
5. Add the app to the iPhone home screen from Safari.

## iPhone Setup

### 1. Get the PWA Running

**Option A: GitHub Pages**
- Recommended for V1
- No backend required
- Good fit for ongoing iPhone edits

**Option B: Local Mac Preview**
- Run `python -m http.server 8000`
- Open `http://localhost:8000/docs`

### 2. Install the Local LLM

- Install **Locally AI**
- Download **Llama 3.2 3B**
- Keep the app open while testing
- Expect the API on `http://localhost:8000`

### 3. First Run Checklist

- [ ] PWA loads in Safari
- [ ] Locally AI is open and the model is loaded
- [ ] Debug panel shows the localhost endpoint
- [ ] Debug panel shows `LLM Status: ✓ Connected`
- [ ] Screenshot upload works
- [ ] OCR extracts readable text
- [ ] LLM processing returns output
- [ ] JSON saves and downloads correctly

## LLM Request Flow

`Screenshot -> OCR -> prompt selection -> localhost LLM -> response -> JSON record`

Phone Studio uses:
- `http://localhost:8000/health`
- `http://localhost:8000/v1/models`
- `http://localhost:8000/v1/chat/completions`

This keeps processing local to the device.

## IndexedDB Storage

V1 saves processed records in IndexedDB:
- Database: `PhoneStudio`
- Store: `screenshots`
- Indexes: `timestamp`, `approval_state`

This gives the MVP a local persistence layer without introducing a backend yet.

## Troubleshooting

**LLM shows not connected**
- Confirm Locally AI is open
- Confirm Llama 3.2 3B is loaded
- Check whether `http://localhost:8000` is reachable on the same device
- Use the debug panel's endpoint and last error fields

**LLM processing fails**
- Retry after Locally AI finishes loading the model
- Check whether the debug panel shows a stale or missing connection
- Reduce prompt complexity if the model is under memory pressure

**OCR quality is weak**
- Use higher-resolution screenshots
- Avoid low-contrast text
- Test with printed fonts before testing stylized graphics

**PWA behaves inconsistently offline**
- Load the app once online so the shell can cache
- Remember that V1 only caches the local app shell, not every remote dependency

## iPhone Development Workflow

Later, developers can:

1. Use Working Copy to clone the repo on iPhone.
2. Edit files in Codepoint, Prompt, or CodeRunner.
3. Commit and push changes from Working Copy.
4. Let GitHub Pages redeploy automatically.
5. Test updates immediately in Safari.
