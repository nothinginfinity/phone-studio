// ============================================================
// github-ui.js
// Phone Studio — GitHub Save UI Components
// PURPOSE: Injects "Save to GitHub" button + modal + toast
//          into the existing Phone Studio PWA UI.
//
// HOW TO ADD:
//   1. Copy this file to docs/
//   2. In index.html, add BEFORE the closing </body>:
//      <script src="github-client.js"></script>
//      <script src="github-ui.js"></script>
//   3. Call GitHubUI.init() anywhere after DOMContentLoaded
// ============================================================

const GitHubUI = (() => {
  'use strict';

  // ── Inject styles (appended to <head> once) ──────────────

  function _injectStyles() {
    if (document.getElementById('ps-github-styles')) return;
    const style = document.createElement('style');
    style.id = 'ps-github-styles';
    style.textContent = `
      /* ── Save to GitHub button ── */
      .ps-github-btn {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 10px 16px;
        background: #238636;
        color: #fff;
        border: none;
        border-radius: 8px;
        font-size: 15px;
        font-weight: 600;
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
        transition: background 0.15s;
      }
      .ps-github-btn:active { background: #196127; }
      .ps-github-btn:disabled { background: #555; cursor: default; }
      .ps-github-btn svg { flex-shrink: 0; }

      /* ── Modal overlay ── */
      .ps-modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.65);
        z-index: 9000;
        display: flex;
        align-items: flex-end;          /* sheet slides up from bottom */
        justify-content: center;
        padding: 0;
        backdrop-filter: blur(4px);
        -webkit-backdrop-filter: blur(4px);
      }
      .ps-modal-overlay.hidden { display: none; }

      .ps-modal {
        background: #1c1c1e;            /* iOS dark sheet */
        border-radius: 16px 16px 0 0;
        width: 100%;
        max-width: 480px;
        padding: 20px 20px 40px;        /* 40px for iPhone home bar */
        box-shadow: 0 -4px 32px rgba(0,0,0,0.4);
        color: #fff;
      }
      .ps-modal h3 {
        margin: 0 0 16px;
        font-size: 17px;
        font-weight: 700;
        text-align: center;
      }
      .ps-modal label {
        display: block;
        font-size: 13px;
        color: #8e8e93;
        margin-bottom: 4px;
        margin-top: 14px;
      }
      .ps-modal input[type="text"],
      .ps-modal select,
      .ps-modal textarea {
        width: 100%;
        box-sizing: border-box;
        background: #2c2c2e;
        border: 1px solid #3a3a3c;
        border-radius: 8px;
        color: #fff;
        padding: 10px 12px;
        font-size: 15px;
        outline: none;
        -webkit-appearance: none;
      }
      .ps-modal select { cursor: pointer; }
      .ps-modal textarea {
        height: 120px;
        resize: vertical;
        font-family: -apple-system, sans-serif;
      }

      .ps-modal-actions {
        display: flex;
        gap: 10px;
        margin-top: 20px;
      }
      .ps-modal-actions button {
        flex: 1;
        padding: 13px;
        border: none;
        border-radius: 10px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
      }
      .ps-btn-cancel {
        background: #3a3a3c;
        color: #fff;
      }
      .ps-btn-save {
        background: #238636;
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
      }
      .ps-btn-save:disabled {
        background: #555;
        cursor: default;
      }
      .ps-spinner {
        width: 16px; height: 16px;
        border: 2px solid rgba(255,255,255,0.3);
        border-top-color: #fff;
        border-radius: 50%;
        animation: ps-spin 0.7s linear infinite;
        display: none;
      }
      .ps-spinner.active { display: block; }
      @keyframes ps-spin { to { transform: rotate(360deg); } }

      /* ── Toast notification ── */
      .ps-toast {
        position: fixed;
        bottom: 90px;                   /* above iPhone home bar */
        left: 50%;
        transform: translateX(-50%) translateY(20px);
        background: #1c1c1e;
        color: #fff;
        padding: 12px 20px;
        border-radius: 24px;
        font-size: 14px;
        font-weight: 600;
        white-space: nowrap;
        box-shadow: 0 4px 20px rgba(0,0,0,0.5);
        z-index: 9999;
        opacity: 0;
        transition: opacity 0.2s, transform 0.2s;
        pointer-events: none;
        border-left: 4px solid #238636;
      }
      .ps-toast.error { border-left-color: #da3633; }
      .ps-toast.visible {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
      }

      /* ── Settings panel rows ── */
      .ps-settings-row {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 0;
        border-bottom: 1px solid #2c2c2e;
      }
      .ps-settings-row:last-child { border-bottom: none; }
      .ps-settings-dot {
        width: 10px; height: 10px;
        border-radius: 50%;
        flex-shrink: 0;
      }
      .ps-settings-dot.green { background: #34c759; }
      .ps-settings-dot.red   { background: #ff3b30; }
      .ps-settings-dot.gray  { background: #8e8e93; }
    `;
    document.head.appendChild(style);
  }

  // ── GitHub icon SVG ──────────────────────────────────────

  const GITHUB_ICON = `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 .3C5.37.3 0 5.67 0 12.3c0 5.31 3.435 9.795 8.205 11.385c.6.105.825-.255.825-.57c0-.285-.015-1.23-.015-2.235c-3.015.555-3.795-.735-4.035-1.41c-.135-.345-.72-1.41-1.23-1.695c-.42-.225-1.02-.78-.015-.795c.945-.015 1.62.87 1.845 1.23c1.08 1.815 2.805 1.305 3.495.99c.105-.78.42-1.305.765-1.605c-2.67-.3-5.46-1.335-5.46-5.925c0-1.305.465-2.385 1.23-3.225c-.12-.3-.54-1.53.12-3.18c0 0 1.005-.315 3.3 1.23c.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23c.66 1.65.24 2.88.12 3.18c.765.84 1.23 1.905 1.23 3.225c0 4.605-2.805 5.625-5.475 5.925c.435.375.81 1.095.81 2.22c0 1.605-.015 2.895-.015 3.3c0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12.3C24 5.67 18.63.3 12 .3Z"/>
  </svg>`;

  // ── Toast ────────────────────────────────────────────────

  let _toastTimer;

  function showToast(message, isError = false, durationMs = 3000) {
    let toast = document.getElementById('ps-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'ps-toast';
      toast.className = 'ps-toast';
      document.body.appendChild(toast);
    }

    clearTimeout(_toastTimer);
    toast.textContent = message;
    toast.classList.toggle('error', isError);
    toast.classList.add('visible');

    _toastTimer = setTimeout(() => {
      toast.classList.remove('visible');
    }, durationMs);
  }

  // ── Save modal ───────────────────────────────────────────

  function _buildModal() {
    if (document.getElementById('ps-save-modal-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'ps-save-modal-overlay';
    overlay.className = 'ps-modal-overlay hidden';
    overlay.innerHTML = `
      <div class="ps-modal" role="dialog" aria-modal="true" aria-label="Save to GitHub">
        <h3>${GITHUB_ICON} Save to GitHub</h3>

        <label for="ps-dir-picker">Directory</label>
        <select id="ps-dir-picker">
          <option value="context/screenshots">📸 context/screenshots</option>
          <option value="context/conversations">💬 context/conversations</option>
          <option value="context/approvals">✅ context/approvals</option>
          <option value="context/scratch">📝 context/scratch</option>
        </select>

        <label for="ps-title-input">Title (used in filename + commit)</label>
        <input type="text" id="ps-title-input" placeholder="e.g. instagram-caption-april" maxlength="60"/>

        <label for="ps-content-textarea">Content</label>
        <textarea id="ps-content-textarea" placeholder="Generated content will appear here…"></textarea>

        <label for="ps-type-picker">Content type</label>
        <select id="ps-type-picker">
          <option value="caption">Caption</option>
          <option value="screenshot">Screenshot output</option>
          <option value="idea">Idea</option>
          <option value="conversation">Conversation</option>
          <option value="approval">Approval</option>
        </select>

        <div class="ps-modal-actions">
          <button class="ps-btn-cancel" id="ps-modal-cancel">Cancel</button>
          <button class="ps-btn-save" id="ps-modal-submit">
            <div class="ps-spinner" id="ps-modal-spinner"></div>
            <span id="ps-modal-btn-label">Save</span>
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // Tap outside to cancel
    overlay.addEventListener('click', e => {
      if (e.target === overlay) _closeModal();
    });

    document.getElementById('ps-modal-cancel').addEventListener('click', _closeModal);
    document.getElementById('ps-modal-submit').addEventListener('click', _handleSave);
  }

  function _openModal(prefillContent = '', prefillType = 'caption') {
    const overlay = document.getElementById('ps-save-modal-overlay');
    if (!overlay) return;

    // Reset state
    const spinner = document.getElementById('ps-modal-spinner');
    const btnLabel = document.getElementById('ps-modal-btn-label');
    const submitBtn = document.getElementById('ps-modal-submit');
    spinner.classList.remove('active');
    btnLabel.textContent = 'Save';
    submitBtn.disabled = false;

    // Pre-fill content if provided
    if (prefillContent) {
      document.getElementById('ps-content-textarea').value = prefillContent;
    }
    if (prefillType) {
      document.getElementById('ps-type-picker').value = prefillType;
    }

    overlay.classList.remove('hidden');
    document.getElementById('ps-title-input').focus();
  }

  function _closeModal() {
    const overlay = document.getElementById('ps-save-modal-overlay');
    if (overlay) overlay.classList.add('hidden');
  }

  async function _handleSave() {
    const token = GitHubTokenManager.getToken();
    if (!token) {
      showToast('⚠️ No GitHub token. Set it in Settings.', true, 4000);
      _closeModal();
      GitHubUI.openTokenSettings();
      return;
    }

    const directory = document.getElementById('ps-dir-picker').value;
    const title     = document.getElementById('ps-title-input').value.trim() || 'output';
    const content   = document.getElementById('ps-content-textarea').value.trim();
    const type      = document.getElementById('ps-type-picker').value;

    if (!content) {
      showToast('Content is empty — nothing to save.', true);
      return;
    }

    // Loading state
    const spinner   = document.getElementById('ps-modal-spinner');
    const btnLabel  = document.getElementById('ps-modal-btn-label');
    const submitBtn = document.getElementById('ps-modal-submit');
    spinner.classList.add('active');
    btnLabel.textContent = 'Saving…';
    submitBtn.disabled = true;

    try {
      const client   = new GitHubClient();
      const filename = GitHubClient.buildFilename(title);
      const markdown = GitHubClient.buildMarkdown({ type, title, content });

      const result = await client.saveToGitHub({ filename, content: markdown, directory, title });

      if (result.success) {
        _closeModal();
        showToast(`✓ Saved! Syncs to Obsidian in ~5 min`, false, 4000);
        // Dispatch custom event so other scripts can react
        document.dispatchEvent(new CustomEvent('ps:github-saved', {
          detail: { path: result.path, url: result.url, filename }
        }));
      } else {
        showToast(`✗ Save failed: ${result.error}`, true, 5000);
        spinner.classList.remove('active');
        btnLabel.textContent = 'Retry';
        submitBtn.disabled = false;
      }
    } catch (err) {
      showToast(`✗ Error: ${err.message}`, true, 5000);
      spinner.classList.remove('active');
      btnLabel.textContent = 'Retry';
      submitBtn.disabled = false;
    }
  }

  // ── Token settings sheet ─────────────────────────────────

  function _buildTokenSettings() {
    if (document.getElementById('ps-token-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'ps-token-overlay';
    overlay.className = 'ps-modal-overlay hidden';
    overlay.innerHTML = `
      <div class="ps-modal" role="dialog" aria-modal="true" aria-label="GitHub Token Settings">
        <h3>${GITHUB_ICON} GitHub Token</h3>

        <div id="ps-token-status" style="margin-bottom:12px;font-size:13px;color:#8e8e93;text-align:center;">
          Checking token…
        </div>

        <label for="ps-token-input">Personal Access Token (PAT)</label>
        <input type="text" id="ps-token-input"
               placeholder="ghp_xxxxxxxxxxxx"
               autocomplete="off" autocorrect="off" spellcheck="false"/>

        <p style="font-size:12px;color:#8e8e93;margin-top:8px;line-height:1.5;">
          Create a token at <strong>github.com → Settings → Developer Settings → PAT → Tokens (classic)</strong>.
          Required scopes: <code>repo</code> (full control of private repositories).
          Token is stored locally on this device only.
        </p>

        <div class="ps-modal-actions">
          <button class="ps-btn-cancel" id="ps-token-cancel">Cancel</button>
          <button class="ps-btn-save" id="ps-token-save">
            <div class="ps-spinner" id="ps-token-spinner"></div>
            <span id="ps-token-btn-label">Validate & Save</span>
          </button>
        </div>

        <button id="ps-token-clear"
          style="margin-top:14px;width:100%;background:none;border:none;color:#ff3b30;font-size:14px;cursor:pointer;padding:10px;">
          Remove Token
        </button>
      </div>
    `;

    document.body.appendChild(overlay);

    overlay.addEventListener('click', e => {
      if (e.target === overlay) _closeTokenSettings();
    });

    document.getElementById('ps-token-cancel').addEventListener('click', _closeTokenSettings);
    document.getElementById('ps-token-save').addEventListener('click', _handleTokenSave);
    document.getElementById('ps-token-clear').addEventListener('click', () => {
      GitHubTokenManager.clearToken();
      document.getElementById('ps-token-input').value = '';
      _refreshTokenStatus();
      showToast('Token removed.');
    });
  }

  async function _refreshTokenStatus() {
    const statusEl = document.getElementById('ps-token-status');
    if (!statusEl) return;
    statusEl.textContent = 'Checking token…';

    const token = GitHubTokenManager.getToken();
    if (!token) {
      statusEl.innerHTML = `<span style="color:#ff3b30">● No token stored</span>`;
      return;
    }

    const result = await GitHubTokenManager.validateToken(token);
    if (result.valid) {
      statusEl.innerHTML = `<span style="color:#34c759">● Connected as @${result.username}</span>`;
    } else {
      statusEl.innerHTML = `<span style="color:#ff3b30">● ${result.reason}</span>`;
    }
  }

  async function _handleTokenSave() {
    const rawToken = document.getElementById('ps-token-input').value.trim();
    if (!rawToken) {
      showToast('Paste your GitHub token first.', true);
      return;
    }

    if (!GitHubTokenManager.isValidFormat(rawToken)) {
      showToast('Invalid token format. Must start with ghp_ or github_pat_', true, 4000);
      return;
    }

    const spinner  = document.getElementById('ps-token-spinner');
    const btnLabel = document.getElementById('ps-token-btn-label');
    const saveBtn  = document.getElementById('ps-token-save');
    spinner.classList.add('active');
    btnLabel.textContent = 'Validating…';
    saveBtn.disabled = true;

    const result = await GitHubTokenManager.validateToken(rawToken);

    spinner.classList.remove('active');
    saveBtn.disabled = false;

    if (result.valid) {
      GitHubTokenManager.saveToken(rawToken);
      btnLabel.textContent = 'Validate & Save';
      _refreshTokenStatus();
      document.getElementById('ps-token-input').value = '';
      _closeTokenSettings();
      showToast(`✓ Token saved! Connected as @${result.username}`, false, 4000);
    } else {
      btnLabel.textContent = 'Validate & Save';
      showToast(`✗ ${result.reason}`, true, 5000);
    }
  }

  function _closeTokenSettings() {
    const overlay = document.getElementById('ps-token-overlay');
    if (overlay) overlay.classList.add('hidden');
  }

  // ── "Save to GitHub" button factory ─────────────────────

  function createSaveButton(options = {}) {
    const {
      label = 'Save to GitHub',
      prefillContent = '',   // optional: pre-fill content area
      prefillType = 'caption',
      className = '',
    } = options;

    const btn = document.createElement('button');
    btn.className = `ps-github-btn ${className}`.trim();
    btn.innerHTML = `${GITHUB_ICON} ${label}`;
    btn.addEventListener('click', () => _openModal(prefillContent, prefillType));
    return btn;
  }

  // ── Public API ────────────────────────────────────────────

  function init() {
    _injectStyles();
    _buildModal();
    _buildTokenSettings();

    // Validate token on startup (non-blocking)
    const token = GitHubTokenManager.getToken();
    if (token) {
      GitHubTokenManager.validateToken(token).then(result => {
        if (!result.valid) {
          showToast('⚠️ GitHub token expired. Update in Settings.', true, 5000);
        }
      });
    }

    console.log('[Phone Studio] GitHub bridge ready.');
  }

  function openSaveModal(prefillContent = '', prefillType = 'caption') {
    _openModal(prefillContent, prefillType);
  }

  function openTokenSettings() {
    const overlay = document.getElementById('ps-token-overlay');
    if (!overlay) { _buildTokenSettings(); }
    document.getElementById('ps-token-overlay').classList.remove('hidden');
    _refreshTokenStatus();
  }

  return {
    init,
    openSaveModal,
    openTokenSettings,
    showToast,
    createSaveButton,
  };
})();

// Auto-init when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', GitHubUI.init);
} else {
  GitHubUI.init();
}
