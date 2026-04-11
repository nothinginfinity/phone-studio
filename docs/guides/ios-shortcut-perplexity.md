# iOS Shortcut: Save Perplexity to GitHub

This Shortcut lets you copy a Perplexity Computer conversation and save it
directly to your phone-studio GitHub repo — no app switching, no manual paste.

## Option A: Working Copy App (Recommended)

Working Copy is a full Git client for iOS. It's the cleanest way to
commit files from Shortcuts.

### Setup

1. Install **Working Copy** from App Store (free tier works; Pro unlocks push)
2. In Working Copy: Clone `github.com/nothinginfinity/phone-studio`
3. Use your GitHub PAT when prompted

### Shortcut steps

```
Name: Save to Phone Studio (Perplexity)

1. [Input] Ask for Input
   - Prompt: "Paste the Perplexity conversation"
   - Input type: Text (multiline)
   → Store in: ConversationText

2. [Ask for Input]
   - Prompt: "Short title for this conversation (e.g. caption-ideas-april)"
   → Store in: ConversationTitle

3. [Date]
   - Format: ISO 8601 → "2026-04-11"
   → Store in: TodayDate

4. [Text] Build filename
   Content: [TodayDate]-[ConversationTitle].md
   → Store in: Filename

5. [Text] Build markdown file
   ---
   date: "[TodayDate]"
   title: "[ConversationTitle]"
   type: "conversation"
   status: "inbox"
   platform: "perplexity"
   llm: "perplexity-computer"
   ---

   # [ConversationTitle]

   [ConversationText]
   → Store in: MarkdownContent

6. [Working Copy: Write File]
   - Repository: phone-studio
   - Path: context/conversations/[Filename]
   - Content: [MarkdownContent]

7. [Working Copy: Commit]
   - Repository: phone-studio
   - Message: "add: [Filename] [phone-studio]"

8. [Working Copy: Push]
   - Repository: phone-studio

9. [Show Notification]
   - Title: ✓ Saved to GitHub
   - Body: [Filename] → Obsidian syncs in ~5 min
```

### How to create it

1. Open **Shortcuts** app on iPhone
2. Tap **+** (new shortcut)
3. Add each step above in order
4. Name it "Save to Phone Studio"
5. Add to Home Screen for one-tap access

---

## Option B: GitHub API via Shortcut (No extra app)

Uses the GitHub REST API directly from Shortcuts. Requires your PAT
to be stored in Shortcuts as a text variable.

### Setup

1. Store your PAT in a Shortcut text action (or use Keychain via a base64 trick)
2. Replace `YOUR_PAT_HERE` with your actual token

### Shortcut steps

```
Name: Save to GitHub (API)

1. [Ask for Input]
   - Prompt: "Paste Perplexity conversation"
   → ConversationText

2. [Ask for Input]
   - Prompt: "Title (kebab-case)"
   → ConversationTitle

3. [Date] → ISO 8601 → TodayDate

4. [Text] Filename: [TodayDate]-[ConversationTitle].md

5. [Text] Build markdown (same as Option A)

6. [Base64 Encode] the MarkdownContent text
   → EncodedContent

7. [Get Contents of URL]
   URL: https://api.github.com/repos/nothinginfinity/phone-studio/contents/context/conversations/[Filename]
   Method: PUT
   Headers:
     Authorization: Bearer YOUR_PAT_HERE
     Accept: application/vnd.github+json
     Content-Type: application/json
   Request Body: JSON
     {
       "message": "add: [Filename] [phone-studio]",
       "content": "[EncodedContent]",
       "branch": "main",
       "committer": {
         "name": "Phone Studio App",
         "email": "app@phone-studio"
       }
     }

8. [If] result contains "sha"
   → Show notification: ✓ Saved! File: [Filename]
   [Otherwise]
   → Show alert: Save failed — check token + internet
```

---

## Option C: Phone Studio PWA (Built-in, no Shortcut needed)

The github-ui.js included in this build adds a **Save to GitHub** button
directly inside the Phone Studio PWA. For Perplexity conversations:

1. Copy conversation text from Perplexity app
2. Open Phone Studio PWA in Safari
3. Tap **Save to GitHub**
4. Paste conversation into content area
5. Select directory: `context/conversations`
6. Set type: `conversation`
7. Tap **Save** → done

This is the lowest-friction option if you're already in Phone Studio.

---

## Obsidian sync note

All three options result in a file at `context/conversations/YYYY-MM-DD-title.md`.
The `ingest-outputs.yml` GitHub Action fires within ~30 seconds, updates
`context/conversations/INDEX.md`, and Obsidian-git pulls it within 5 minutes.
Total time from save to searchable in Obsidian: **under 6 minutes**.
