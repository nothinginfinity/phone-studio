# Phone Studio → GitHub Bridge: Integration Guide

## What was built (and why it's JavaScript, not Swift)

Your Phone Studio app is a **Progressive Web App** (PWA) — the code lives in `docs/` as
HTML, CSS, and JavaScript running inside Safari. There's no Xcode project.

The GitHub bridge is therefore two JavaScript files that drop straight into `docs/`:

| File | Purpose |
|------|---------|
| `docs/github-client.js` | GitHub API client + token manager |
| `docs/github-ui.js` | Save button, modal, toast, settings sheet |
| `.github/workflows/ingest-outputs.yml` | Auto-indexes all saved files |

No CocoaPods, no SPM, no Xcode, no App Store update required.

---

## Part 1: Add the GitHub Bridge to Phone Studio

### Step 1 — Copy files to repo

```
phone-studio/
  docs/
    app.js              ← existing
    index.html          ← existing (you will edit this)
    styles.css          ← existing
    github-client.js    ← ADD THIS
    github-ui.js        ← ADD THIS
  .github/
    workflows/
      ingest-outputs.yml  ← ADD THIS
```

### Step 2 — Update index.html

Open `docs/index.html`. Before the closing `</body>` tag, add:

```html
<!-- GitHub Bridge -->
<script src="github-client.js"></script>
<script src="github-ui.js"></script>
```

The UI scripts auto-initialize on DOM load. No other changes needed in index.html.

### Step 3 — Add "Save to GitHub" button to your UI

#### Option A: Quick inline button (add anywhere in index.html)

```html
<button class="ps-github-btn" onclick="GitHubUI.openSaveModal()">
  Save to GitHub
</button>
```

#### Option B: Pre-fill with current output (add to app.js)

After your LLM response is rendered, call:

```javascript
// Get the generated text from wherever your app stores it
const generatedContent = document.getElementById('your-output-element').innerText;

// Open the save modal with the content pre-filled
GitHubUI.openSaveModal(generatedContent, 'caption');
```

#### Option C: Dynamic button injected next to output

In `app.js`, after you render LLM output:

```javascript
// Create button dynamically
const saveBtn = GitHubUI.createSaveButton({
  label: 'Save to GitHub',
  prefillContent: generatedText,
  prefillType: 'caption',
});

// Append next to your output container
document.getElementById('output-container').appendChild(saveBtn);
```

### Step 4 — Add GitHub Token Settings to your Settings UI

If you have a settings panel or gear icon, wire it up:

```javascript
// Call this when user taps Settings → GitHub Token
GitHubUI.openTokenSettings();
```

Or add a standalone button:

```html
<button onclick="GitHubUI.openTokenSettings()">GitHub Token Settings</button>
```

---

## Part 2: Create a GitHub Personal Access Token (PAT)

1. Go to: **github.com → Settings → Developer settings → Personal access tokens → Tokens (classic)**
2. Click **Generate new token (classic)**
3. Give it a name: `phone-studio-ios`
4. Set expiration: **No expiration** (or 1 year)
5. Select scopes: ✅ **repo** (full control of private repositories)
6. Click **Generate token**
7. Copy the token immediately (you won't see it again)

> **Fine-grained PAT alternative** (more secure):
> - Repository access: Only `nothinginfinity/phone-studio`
> - Permissions: Contents → Read and write

### Add token to Phone Studio app

1. Open Phone Studio PWA in Safari
2. Tap any **GitHub Token Settings** button (or call `GitHubUI.openTokenSettings()`)
3. Paste your token
4. Tap **Validate & Save**
5. You'll see: `● Connected as @nothinginfinity`

Token is stored in `localStorage` (device-local, never synced to iCloud, sent only to GitHub API over HTTPS).

---

## Part 3: Deploy the GitHub Action

### Copy the workflow file

Copy `workflows/ingest-outputs.yml` to your repo at:

```
.github/workflows/ingest-outputs.yml
```

This file already exists in your repo as `ingest-outputs.yml` — but this is an updated
version. Replace the existing one.

### Verify it works

1. Push any `.md` file to `context/screenshots/`
2. Go to GitHub → Actions tab
3. You'll see "Ingest Phone Studio Outputs" running
4. After ~30 seconds: `context/screenshots/INDEX.md` is created/updated
5. Commit: `auto: update indexes for context/screenshots/INDEX.md [skip ci]`

### Permissions required

In your GitHub repo settings → Actions → General → Workflow permissions:
Set to **"Read and write permissions"** so the bot can commit INDEX.md files.

---

## Part 4: Set Up Obsidian iOS

### Install Obsidian

Download **Obsidian** from the App Store (free).

### Create or open your vault

- If new: Tap **Create new vault** → name it `phone-studio`
- If existing: Open your vault

### Install obsidian-git plugin

1. In Obsidian: Settings (gear) → Community plugins
2. Turn off **Safe mode**
3. Browse community plugins → search **obsidian-git**
4. Install → Enable

### Configure obsidian-git

Settings → obsidian-git:

| Setting | Value |
|---------|-------|
| **Vault root as Git repo** | ✅ on |
| **Auto pull interval (minutes)** | `5` |
| **Auto push after auto commit** | ✅ on (optional) |
| **Auto pull on startup** | ✅ on |
| **Commit author name** | your name |
| **Commit author email** | your email |

### Connect to your GitHub repo

Obsidian-git uses SSH or HTTPS. The easiest iOS method:

**Option A: Working Copy (recommended)**

1. Install **Working Copy** from App Store
2. Clone `https://github.com/nothinginfinity/phone-studio`
3. In Obsidian: Open vault → point to the Working Copy folder
4. obsidian-git uses Working Copy's Git under the hood

**Option B: iSH (Linux shell on iOS)**

1. Install **iSH** from App Store
2. `apk add git openssh`
3. Clone repo into a shared location
4. Open as Obsidian vault

**Option C: a-Shell**

1. Install **a-Shell** from App Store
2. `lg2 clone https://github.com/nothinginfinity/phone-studio ~/Documents/phone-studio`
3. Open the cloned folder as an Obsidian vault

### Verify sync

1. Save a file from Phone Studio PWA to `context/screenshots/`
2. Wait ~30 seconds for GitHub Action to update INDEX.md
3. Wait ~5 minutes for Obsidian auto-pull OR manually pull in obsidian-git
4. Open Obsidian → `context/screenshots/` → you'll see your file + INDEX.md
5. Click any `[[backlink]]` in INDEX.md → navigates to the file

---

## Part 5: Full Workflow Test

### End-to-end test checklist

```
1. Open Phone Studio PWA in Safari on iPhone
   [ ] App loads

2. Generate some output (screenshot OCR + caption)
   [ ] LLM response appears

3. Tap "Save to GitHub"
   [ ] Modal opens
   [ ] Directory defaults to context/screenshots
   [ ] Content is pre-filled (if using Option B or C integration)

4. Set title: "test-caption"
5. Tap Save
   [ ] Spinner appears
   [ ] Toast shows: "✓ Saved! Syncs to Obsidian in ~5 min"

6. Go to github.com/nothinginfinity/phone-studio
   [ ] File appears: context/screenshots/2026-04-11-test-caption.md

7. GitHub Actions (Actions tab)
   [ ] "Ingest Phone Studio Outputs" starts within ~10 seconds
   [ ] Completes in ~30 seconds
   [ ] context/screenshots/INDEX.md is updated

8. Obsidian (after 5 min or manual pull)
   [ ] New file appears in vault
   [ ] File is searchable
   [ ] INDEX.md shows the new file in its table
   [ ] [[backlink]] in INDEX.md navigates to file
```

---

## Troubleshooting

### "No GitHub token" toast appears

→ Tap Settings → GitHub Token → paste your PAT → Validate & Save

### "Token is invalid or expired"

→ Generate a new PAT at github.com → Settings → Developer settings → PAT
→ Old tokens expire if you set an expiration date

### Save succeeds but GitHub Action doesn't run

→ Check repo: Settings → Actions → General → Workflow permissions → set to "Read and write"
→ Check `.github/workflows/ingest-outputs.yml` exists on main branch

### Obsidian doesn't show new files

→ In Obsidian: obsidian-git panel → tap "Pull" manually
→ Check that obsidian-git is configured with correct repo URL and credentials

### "GitHub API error 422"

→ File already exists with same name. The client auto-fetches SHA for updates —
  check network connection and retry.

### Rate limiting (429 / 403)

→ The client automatically waits and retries. GitHub's unauthenticated limit is 60/hour;
  authenticated PAT limit is 5000/hour. You won't hit this.

---

## File naming reference

All files saved by Phone Studio follow this convention:

```
YYYY-MM-DD-title-slug.md
```

Examples:
```
2026-04-11-instagram-caption-fitness.md
2026-04-11-perplexity-github-bridge-session.md
2026-04-12-approved-reel-caption-april-12.md
```

The date comes from `new Date().toISOString().slice(0, 10)` (device local time, UTC).
Title is kebab-cased, max 40 characters, alphanumeric + hyphens only.

---

## Directory reference

| Directory | Use for | Obsidian folder |
|-----------|---------|-----------------|
| `context/screenshots` | Screenshot OCR outputs, captions, ideas | phone-studio/context/screenshots |
| `context/conversations` | Perplexity Computer sessions, brainstorms | phone-studio/context/conversations |
| `context/approvals` | Final approved content, ready-to-post | phone-studio/context/approvals |
| `context/scratch` | Drafts, in-progress, rejected-but-keep | phone-studio/context/scratch |

---

## Frontmatter schema reference

Every file saved by Phone Studio includes YAML frontmatter:

```yaml
---
date: "2026-04-11"
time: "18:30:00Z"
title: "Short human title"
type: "caption"          # caption | screenshot | idea | conversation | approval
status: "inbox"          # inbox | approved | rejected | archived
platform: "phone-studio"
llm: "claude-3-5-sonnet-20241022"
prompt_type: "write_captions"   # optional
ocr_confidence: 0.94            # optional, from VisionKit
tags: ["instagram", "fitness"]  # optional
---
```

This schema matches `DATA_SCHEMA.md` in your repo and makes files filterable in Obsidian.
