// ============================================================
// github-client.js
// Phone Studio — GitHub API Client
// PURPOSE: Save generated content from Phone Studio directly
//          to your phone-studio GitHub repo via the REST API.
//
// USAGE:
//   const client = new GitHubClient();
//   await client.saveToGitHub({
//     filename: '2026-04-11-captions.md',
//     content: '# Captions\n...',
//     directory: 'context/screenshots'
//   });
//
// CONSTANTS — change these to match your repo:
// ============================================================

const GITHUB_CONFIG = {
  OWNER: 'nothinginfinity',          // Your GitHub username
  REPO: 'phone-studio',              // Your repo name
  BRANCH: 'main',                    // Target branch
  COMMITTER_NAME: 'Phone Studio App',
  COMMITTER_EMAIL: 'app@phone-studio',
  API_BASE: 'https://api.github.com',
  TOKEN_STORAGE_KEY: 'ps_github_token', // localStorage key
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 1200,              // Back off between retries
};

// ============================================================
// GitHubTokenManager
// Stores / retrieves / validates your Personal Access Token
// (PAT). Uses localStorage — the closest equivalent to Keychain
// available in a PWA/Safari context. Tokens are NOT synced via
// iCloud (localStorage is device-local), and are never sent
// anywhere except the GitHub API over HTTPS.
// ============================================================

class GitHubTokenManager {
  // Save token to localStorage
  static saveToken(token) {
    const trimmed = (token || '').trim();
    if (!GitHubTokenManager.isValidFormat(trimmed)) {
      throw new Error('Invalid token format. Expected a GitHub PAT (ghp_… or github_pat_…).');
    }
    localStorage.setItem(GITHUB_CONFIG.TOKEN_STORAGE_KEY, trimmed);
  }

  // Retrieve token (returns null if not set)
  static getToken() {
    return localStorage.getItem(GITHUB_CONFIG.TOKEN_STORAGE_KEY) || null;
  }

  // Remove token
  static clearToken() {
    localStorage.removeItem(GITHUB_CONFIG.TOKEN_STORAGE_KEY);
  }

  // Lightweight format check — does NOT make an API call
  static isValidFormat(token) {
    if (!token || typeof token !== 'string') return false;
    // Classic PAT: ghp_XXXX (40 chars after prefix)
    // Fine-grained PAT: github_pat_XXXX
    return /^(ghp_[a-zA-Z0-9]{36,}|github_pat_[a-zA-Z0-9_]{80,})$/.test(token);
  }

  // Validate token against GitHub API (makes a real API call)
  static async validateToken(token) {
    const t = token || GitHubTokenManager.getToken();
    if (!t) return { valid: false, reason: 'No token stored.' };
    try {
      const res = await fetch(`${GITHUB_CONFIG.API_BASE}/user`, {
        headers: {
          Authorization: `Bearer ${t}`,
          Accept: 'application/vnd.github+json',
        },
      });
      if (res.status === 200) {
        const data = await res.json();
        return { valid: true, username: data.login, scopes: res.headers.get('x-oauth-scopes') };
      }
      if (res.status === 401) return { valid: false, reason: 'Token is invalid or expired.' };
      if (res.status === 403) return { valid: false, reason: 'Token lacks required permissions.' };
      return { valid: false, reason: `Unexpected status: ${res.status}` };
    } catch (err) {
      return { valid: false, reason: `Network error: ${err.message}` };
    }
  }

  // Check if token has repo write scope (needed to commit files)
  static async hasRepoWriteAccess() {
    const token = GitHubTokenManager.getToken();
    if (!token) return false;
    try {
      const res = await fetch(
        `${GITHUB_CONFIG.API_BASE}/repos/${GITHUB_CONFIG.OWNER}/${GITHUB_CONFIG.REPO}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github+json',
          },
        }
      );
      if (res.status === 200) {
        const data = await res.json();
        return data.permissions?.push === true;
      }
      return false;
    } catch {
      return false;
    }
  }
}

// ============================================================
// GitHubClient
// Core API client — handles encoding, SHA lookup, upsert,
// retries, and rate-limit awareness.
// ============================================================

class GitHubClient {
  constructor() {
    this._requestCount = 0;
  }

  // ── Internal helpers ──────────────────────────────────────

  _headers() {
    const token = GitHubTokenManager.getToken();
    if (!token) throw new Error('GitHub token not set. Go to Settings → GitHub Token.');
    return {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28',
    };
  }

  _encodedContent(text) {
    // TextEncoder → Uint8Array → base64
    // Works in all modern Safari/iOS versions
    const bytes = new TextEncoder().encode(text);
    let binary = '';
    bytes.forEach(b => (binary += String.fromCharCode(b)));
    return btoa(binary);
  }

  _buildFilePath(directory, filename) {
    // Normalise directory (strip leading/trailing slashes)
    const dir = directory.replace(/^\/|\/$/g, '');
    return `${dir}/${filename}`;
  }

  // Exponential-backoff sleep
  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ── SHA lookup (needed for updates, not creates) ──────────

  async _getFileSHA(path) {
    try {
      const res = await fetch(
        `${GITHUB_CONFIG.API_BASE}/repos/${GITHUB_CONFIG.OWNER}/${GITHUB_CONFIG.REPO}/contents/${path}?ref=${GITHUB_CONFIG.BRANCH}`,
        { headers: this._headers() }
      );
      if (res.status === 200) {
        const data = await res.json();
        return data.sha || null;
      }
      return null; // 404 = file doesn't exist yet (create mode)
    } catch {
      return null;
    }
  }

  // ── Core upsert (create or update a file) ────────────────

  async _upsertFile(path, content, commitMessage) {
    const sha = await this._getFileSHA(path);
    const body = {
      message: commitMessage,
      content: this._encodedContent(content),
      branch: GITHUB_CONFIG.BRANCH,
      committer: {
        name: GITHUB_CONFIG.COMMITTER_NAME,
        email: GITHUB_CONFIG.COMMITTER_EMAIL,
      },
    };
    if (sha) body.sha = sha; // required for updates

    const res = await fetch(
      `${GITHUB_CONFIG.API_BASE}/repos/${GITHUB_CONFIG.OWNER}/${GITHUB_CONFIG.REPO}/contents/${path}`,
      {
        method: 'PUT',
        headers: this._headers(),
        body: JSON.stringify(body),
      }
    );

    // Handle rate limiting
    if (res.status === 429 || res.status === 403) {
      const resetHeader = res.headers.get('x-ratelimit-reset');
      const waitUntil = resetHeader ? parseInt(resetHeader) * 1000 : Date.now() + 60000;
      const waitMs = Math.max(waitUntil - Date.now(), 5000);
      throw new RateLimitError(`GitHub rate limit hit. Retry in ${Math.ceil(waitMs / 1000)}s.`, waitMs);
    }

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.message || `GitHub API error ${res.status}`);
    }

    return await res.json();
  }

  // ── Public: saveToGitHub ──────────────────────────────────
  //
  // @param {string} filename   e.g. "2026-04-11-captions.md"
  // @param {string} content    Markdown text to save
  // @param {string} directory  e.g. "context/screenshots"
  // @param {string} [title]    Optional human title for commit message
  // @returns {Promise<SaveResult>}
  //
  async saveToGitHub({ filename, content, directory, title }) {
    // Validate inputs
    if (!filename) throw new Error('filename is required.');
    if (!content)  throw new Error('content is required.');
    if (!directory) throw new Error('directory is required.');

    const path = this._buildFilePath(directory, filename);
    const commitMsg = `add: ${title || filename} [phone-studio]`;

    let lastError;
    for (let attempt = 1; attempt <= GITHUB_CONFIG.MAX_RETRIES; attempt++) {
      try {
        const result = await this._upsertFile(path, content, commitMsg);
        return {
          success: true,
          path,
          url: result.content?.html_url || null,
          sha: result.content?.sha || null,
          attempt,
        };
      } catch (err) {
        lastError = err;
        if (err instanceof RateLimitError) {
          // For rate limits, wait the required time then retry once
          await this._sleep(Math.min(err.waitMs, 65000));
          continue;
        }
        if (attempt < GITHUB_CONFIG.MAX_RETRIES) {
          // Exponential back-off for transient network errors
          await this._sleep(GITHUB_CONFIG.RETRY_DELAY_MS * attempt);
          continue;
        }
        break;
      }
    }

    return {
      success: false,
      path,
      error: lastError?.message || 'Unknown error',
    };
  }

  // ── Convenience: build formatted markdown for Phone Studio outputs ──

  static buildMarkdown({ type, title, content, metadata = {} }) {
    const now = new Date();
    const iso = now.toISOString();
    const date = iso.slice(0, 10);
    const time = iso.slice(11, 19) + 'Z';

    // YAML frontmatter matching existing DATA_SCHEMA
    const frontmatter = [
      '---',
      `date: "${date}"`,
      `time: "${time}"`,
      `title: "${title || 'Untitled'}"`,
      `type: "${type || 'output'}"`,   // screenshot | caption | idea | conversation | approval
      `status: "inbox"`,               // inbox | approved | rejected | archived
      `platform: "phone-studio"`,
      `llm: "${metadata.llm || 'unknown'}"`,
      metadata.prompt_type ? `prompt_type: "${metadata.prompt_type}"` : null,
      metadata.ocr_confidence ? `ocr_confidence: ${metadata.ocr_confidence}` : null,
      metadata.tags ? `tags: [${metadata.tags.map(t => `"${t}"`).join(', ')}]` : null,
      '---',
    ].filter(Boolean).join('\n');

    return `${frontmatter}\n\n# ${title || 'Untitled'}\n\n${content}\n`;
  }

  // ── Convenience: auto-generate filename from title + date ──

  static buildFilename(title, extension = 'md') {
    const date = new Date().toISOString().slice(0, 10);
    const slug = (title || 'output')
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .slice(0, 40);
    return `${date}-${slug}.${extension}`;
  }
}

// ── Custom error types ────────────────────────────────────────

class RateLimitError extends Error {
  constructor(message, waitMs) {
    super(message);
    this.name = 'RateLimitError';
    this.waitMs = waitMs;
  }
}

// ── Directory constants (use these in UI pickers) ─────────────

const PS_DIRECTORIES = {
  SCREENSHOTS:   'context/screenshots',
  CONVERSATIONS: 'context/conversations',
  APPROVALS:     'context/approvals',
  SCRATCH:       'context/scratch',
};

// Export for use in app.js
if (typeof module !== 'undefined') {
  module.exports = { GitHubClient, GitHubTokenManager, PS_DIRECTORIES, GITHUB_CONFIG };
}
