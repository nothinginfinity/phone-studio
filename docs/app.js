// V1 MVP: Local LLM integration. All processing on-device, no backend yet.
const CONFIG = {
    LLM_API: 'http://localhost:8000/v1/chat/completions',
    LLM_HEALTH_ENDPOINTS: [
        'http://localhost:8000/health',
        'http://localhost:8000/v1/models'
    ],
    LLM_MODEL: 'default',
    LLM_TIMEOUT: 30000,
    HEALTH_TIMEOUT: 5000,
    DB_NAME: 'PhoneStudio',
    DB_VERSION: 1,
    STORE_NAME: 'screenshots',
};

// State
let db = null;
let state = {
    screenshot: null,
    rawText: '',
    llmOutput: '',
    currentRecord: null,
    metadata: {
        timestamp: null,
        imageSize: null,
        ocrConfidence: null,
    }
};

// DOM Elements
const elements = {
    uploadBtn: document.getElementById('uploadBtn'),
    screenshotInput: document.getElementById('screenshotInput'),
    imagePreview: document.getElementById('imagePreview'),
    ocrBtn: document.getElementById('ocrBtn'),
    ocrStatus: document.getElementById('ocrStatus'),
    rawText: document.getElementById('rawText'),
    llmBtn: document.getElementById('llmBtn'),
    llmStatus: document.getElementById('llmStatus'),
    llmPrompt: document.getElementById('llmPrompt'),
    customPrompt: document.getElementById('customPrompt'),
    jsonOutput: document.getElementById('jsonOutput'),
    markdownOutput: document.getElementById('markdownOutput'),
    rawOutput: document.getElementById('rawOutput'),
    downloadBtn: document.getElementById('downloadBtn'),
    copyBtn: document.getElementById('copyBtn'),
    resetBtn: document.getElementById('resetBtn'),
    tabBtns: document.querySelectorAll('.tab-btn'),
    llmStatusDebug: document.getElementById('llmStatusDebug'),
    tesseractStatusDebug: document.getElementById('tesseractStatusDebug'),
    endpointDebug: document.getElementById('endpointDebug'),
    storageStatusDebug: document.getElementById('storageStatusDebug'),
    lastErrorDebug: document.getElementById('lastErrorDebug'),
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    elements.endpointDebug.textContent = new URL(CONFIG.LLM_API).origin;
    initEventListeners();
    registerServiceWorker();
    initDatabase();
    checkLLMConnection();
    updateTesseractStatus();
});

function initEventListeners() {
    elements.uploadBtn.addEventListener('click', () => {
        elements.screenshotInput.click();
    });

    elements.screenshotInput.addEventListener('change', handleScreenshotUpload);
    elements.ocrBtn.addEventListener('click', runOCR);
    elements.llmBtn.addEventListener('click', sendToLLM);
    elements.downloadBtn.addEventListener('click', downloadJSON);
    elements.copyBtn.addEventListener('click', copyJSON);
    elements.resetBtn.addEventListener('click', resetApp);
    elements.llmPrompt.addEventListener('change', toggleCustomPrompt);
    elements.tabBtns.forEach(btn => {
        btn.addEventListener('click', switchTab);
    });
}

// Screenshot Upload
function handleScreenshotUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        clearLastError();
        state.screenshot = event.target.result;
        state.metadata.timestamp = new Date().toISOString();

        // Show preview
        elements.imagePreview.src = state.screenshot;
        elements.imagePreview.classList.remove('hidden');

        // Enable OCR button
        elements.ocrBtn.disabled = false;

        // Show image info
        const img = new Image();
        img.onload = () => {
            state.metadata.imageSize = { width: img.width, height: img.height };
        };
        img.src = state.screenshot;
    };
    reader.readAsDataURL(file);
}

// OCR Processing
async function runOCR() {
    if (!state.screenshot) return;

    showStatus(elements.ocrStatus, 'Loading OCR engine...', 'loading');
    elements.ocrBtn.disabled = true;
    clearLastError();

    try {
        const { data: { text, confidence } } = await Tesseract.recognize(
            state.screenshot,
            'eng',
            {
                logger: m => console.log('OCR:', m)
            }
        );

        state.rawText = text;
        state.metadata.ocrConfidence = confidence;

        elements.rawText.value = state.rawText;
        showStatus(elements.ocrStatus, `✓ OCR complete (${Math.round(confidence)}% confidence)`, 'success');

        // Enable LLM button
        elements.llmBtn.disabled = false;
    } catch (error) {
        console.error('OCR Error:', error);
        setLastError(`OCR failed: ${error.message}`);
        showStatus(elements.ocrStatus, `✗ OCR failed: ${error.message}`, 'error');
    } finally {
        elements.ocrBtn.disabled = false;
    }
}

// LLM Processing
async function sendToLLM() {
    if (!state.rawText) return;

    showStatus(elements.llmStatus, 'Connecting to local LLM...', 'loading');
    elements.llmBtn.disabled = true;
    clearLastError();

    try {
        const llmReachable = await pingLLM();
        if (!llmReachable) {
            throw new Error('Locally AI is not reachable on http://localhost:8000. Open the app, start Llama 3.2 3B, and try again.');
        }

        const prompt = buildPrompt();

        const response = await fetchWithTimeout(CONFIG.LLM_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: CONFIG.LLM_MODEL,
                messages: [
                    { role: 'system', content: 'You are a content strategist helping extract structured information from screenshots.' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.7,
                max_tokens: 2000,
            }),
        }, CONFIG.LLM_TIMEOUT);

        if (!response.ok) {
            throw new Error(`LLM API error: ${response.status}`);
        }

        const data = await response.json();
        state.llmOutput = data?.choices?.[0]?.message?.content || '';

        if (!state.llmOutput) {
            throw new Error('LLM returned an empty response. Confirm the model is loaded in Locally AI.');
        }

        // Build final JSON
        await buildOutput();
        showStatus(elements.llmStatus, '✓ LLM processing complete', 'success');

        // Enable download/copy buttons
        elements.downloadBtn.disabled = false;
        elements.copyBtn.disabled = false;
    } catch (error) {
        console.error('LLM Error:', error);
        setLastError(`LLM failed: ${error.message}`);
        showStatus(elements.llmStatus, `✗ LLM failed: ${error.message}`, 'error');
    } finally {
        elements.llmBtn.disabled = false;
    }
}

// Build Prompt based on selection
function buildPrompt() {
    const promptType = elements.llmPrompt.value;
    const text = state.rawText;

    const prompts = {
        structure: `Extract and structure this text into JSON format with sections for: headings, paragraphs, links, and lists. Return ONLY valid JSON.

Text:
${text}`,
        markdown: `Convert this text into clean, well-formatted Markdown. Preserve structure and add appropriate formatting.

Text:
${text}`,
        caption: `Generate a 1-2 sentence Instagram caption based on this screenshot content. Be engaging and on-brand.

Text:
${text}`,
        ideas: `Generate 3 content ideas (blog post, social post, email) based on this screenshot. List each with a title and 1-line description.

Text:
${text}`,
        custom: elements.customPrompt.value || `Analyze this text:
${text}`
    };

    return prompts[promptType] || prompts.structure;
}

// Build Output JSON
async function buildOutput() {
    const output = {
        id: `screenshot_${Date.now()}`,
        timestamp: state.metadata.timestamp,
        source_type: 'screenshot_ocr',
        raw_text: state.rawText,
        llm_output: state.llmOutput,
        metadata: {
            image_size: state.metadata.imageSize,
            ocr_confidence: state.metadata.ocrConfidence,
            prompt_type: elements.llmPrompt.value,
        },
        llm_ready: true,
        approval_state: 'draft',
        linked_voice_id: null, // To be set by user later
    };

    state.currentRecord = output;
    elements.jsonOutput.value = JSON.stringify(output, null, 2);
    elements.rawOutput.value = state.rawText;

    // Generate markdown
    elements.markdownOutput.value = state.llmOutput;
    await persistRecord(output);
}

// Download JSON
function downloadJSON() {
    const json = elements.jsonOutput.value;
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `screenshot_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

// Copy JSON
async function copyJSON() {
    try {
        const json = elements.jsonOutput.value;
        if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(json);
        } else {
            elements.jsonOutput.select();
            document.execCommand('copy');
        }
        showStatus(elements.llmStatus, '✓ JSON copied to clipboard', 'success');
    } catch (error) {
        setLastError(`Clipboard copy failed: ${error.message}`);
        showStatus(elements.llmStatus, `✗ Copy failed: ${error.message}`, 'error');
    }
}

// Reset App
function resetApp() {
    state = {
        screenshot: null,
        rawText: '',
        llmOutput: '',
        currentRecord: null,
        metadata: {
            timestamp: null,
            imageSize: null,
            ocrConfidence: null,
        }
    };

    elements.screenshotInput.value = '';
    elements.imagePreview.classList.add('hidden');
    elements.rawText.value = '';
    elements.jsonOutput.value = '';
    elements.markdownOutput.value = '';
    elements.rawOutput.value = '';
    elements.ocrStatus.classList.add('hidden');
    elements.llmStatus.classList.add('hidden');
    elements.customPrompt.value = '';
    elements.customPrompt.style.display = 'none';

    elements.ocrBtn.disabled = true;
    elements.llmBtn.disabled = true;
    elements.downloadBtn.disabled = true;
    elements.copyBtn.disabled = true;
    clearLastError();
}

// Toggle Custom Prompt
function toggleCustomPrompt() {
    if (elements.llmPrompt.value === 'custom') {
        elements.customPrompt.style.display = 'block';
    } else {
        elements.customPrompt.style.display = 'none';
    }
}

// Switch Tabs
function switchTab(e) {
    const tab = e.target.dataset.tab;

    elements.tabBtns.forEach(btn => btn.classList.remove('active'));
    e.target.classList.add('active');

    elements.jsonOutput.classList.add('hidden');
    elements.markdownOutput.classList.add('hidden');
    elements.rawOutput.classList.add('hidden');

    if (tab === 'json') elements.jsonOutput.classList.remove('hidden');
    else if (tab === 'markdown') elements.markdownOutput.classList.remove('hidden');
    else if (tab === 'raw') elements.rawOutput.classList.remove('hidden');
}

// Check LLM Connection
async function checkLLMConnection() {
    try {
        const connected = await pingLLM();
        if (connected) {
            elements.llmStatusDebug.textContent = '✓ Connected';
            elements.llmStatusDebug.style.color = '#34d399';
        } else {
            throw new Error('Not responding');
        }
    } catch (error) {
        elements.llmStatusDebug.textContent = '✗ Not connected (start Locally AI)';
        elements.llmStatusDebug.style.color = 'var(--accent)';
    }
}

// Update Tesseract Status
function updateTesseractStatus() {
    if (window.Tesseract) {
        elements.tesseractStatusDebug.textContent = '✓ Ready';
        elements.tesseractStatusDebug.style.color = '#34d399';
    } else {
        elements.tesseractStatusDebug.textContent = '⏳ Loading...';
    }
}

// Utility: Show Status Message
function showStatus(element, message, type) {
    element.textContent = message;
    element.className = `status-message ${type}`;
    element.classList.remove('hidden');
}

function setLastError(message) {
    elements.lastErrorDebug.textContent = message;
    elements.lastErrorDebug.style.color = 'var(--accent)';
}

function clearLastError() {
    elements.lastErrorDebug.textContent = 'None';
    elements.lastErrorDebug.style.color = 'var(--text-secondary)';
}

function setStorageStatus(message, color = 'var(--text-secondary)') {
    elements.storageStatusDebug.textContent = message;
    elements.storageStatusDebug.style.color = color;
}

async function fetchWithTimeout(url, options = {}, timeout = CONFIG.HEALTH_TIMEOUT) {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), timeout);

    try {
        return await fetch(url, {
            ...options,
            signal: controller.signal,
        });
    } finally {
        window.clearTimeout(timeoutId);
    }
}

async function pingLLM() {
    for (const endpoint of CONFIG.LLM_HEALTH_ENDPOINTS) {
        try {
            const response = await fetchWithTimeout(endpoint, { method: 'GET' }, CONFIG.HEALTH_TIMEOUT);
            if (response.ok) {
                return true;
            }
        } catch (error) {
            // Try the next health endpoint.
        }
    }

    return false;
}

function initDatabase() {
    if (!('indexedDB' in window)) {
        setStorageStatus('IndexedDB unavailable', 'var(--accent)');
        return;
    }

    setStorageStatus('Opening IndexedDB...', 'var(--secondary)');
    const request = indexedDB.open(CONFIG.DB_NAME, CONFIG.DB_VERSION);

    request.onupgradeneeded = (event) => {
        const database = event.target.result;
        if (!database.objectStoreNames.contains(CONFIG.STORE_NAME)) {
            const store = database.createObjectStore(CONFIG.STORE_NAME, { keyPath: 'id' });
            store.createIndex('timestamp', 'timestamp', { unique: false });
            store.createIndex('approval_state', 'approval_state', { unique: false });
        }
    };

    request.onsuccess = () => {
        db = request.result;
        setStorageStatus('IndexedDB ready', '#34d399');
    };

    request.onerror = () => {
        setStorageStatus('IndexedDB failed to open', 'var(--accent)');
        setLastError(`IndexedDB error: ${request.error?.message || 'Unknown error'}`);
    };
}

function persistRecord(record) {
    if (!db) {
        setStorageStatus('IndexedDB not ready yet', 'var(--accent)');
        return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(CONFIG.STORE_NAME, 'readwrite');
        const store = transaction.objectStore(CONFIG.STORE_NAME);
        const request = store.put(record);

        request.onsuccess = () => {
            setStorageStatus(`Saved locally: ${record.id}`, '#34d399');
            resolve();
        };

        request.onerror = () => {
            const message = request.error?.message || 'Unknown storage error';
            setStorageStatus('Local save failed', 'var(--accent)');
            setLastError(`IndexedDB save failed: ${message}`);
            reject(new Error(message));
        };
    });
}

function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;

    window.addEventListener('load', async () => {
        try {
            await navigator.serviceWorker.register('./service-worker.js');
        } catch (error) {
            setLastError(`Service worker registration failed: ${error.message}`);
        }
    });
}

// LLM Connection Monitor (check every 10s)
setInterval(checkLLMConnection, 10000);
