// V1 MVP: Local LLM integration. All processing on-device, no backend yet.
// V1.1 adds hosted LLM provider support while preserving the local-first path.

// Multi-LLM Provider Configuration
const LLM_PROVIDERS = {
    groq: {
        name: 'Groq',
        apiUrl: 'https://api.groq.com/openai/v1/chat/completions',
        model: 'mixtral-8x7b-32768',
        free: true,
        instructions: 'Get free API key at: https://console.groq.com/keys'
    },
    deepseek: {
        name: 'DeepSeek',
        apiUrl: 'https://api.deepseek.com/chat/completions',
        model: 'deepseek-chat',
        free: false,
        instructions: 'Get API key at: https://platform.deepseek.com/api_keys'
    },
    mistral: {
        name: 'Mistral AI',
        apiUrl: 'https://api.mistral.ai/v1/chat/completions',
        model: 'mistral-7b-instruct',
        free: true,
        instructions: 'Get free API key at: https://console.mistral.ai/api-keys'
    },
    anthropic: {
        name: 'Claude (Anthropic)',
        apiUrl: 'https://api.anthropic.com/v1/messages',
        model: 'claude-3-haiku-20240307',
        free: false,
        instructions: 'Get API key at: https://console.anthropic.com'
    },
    openai: {
        name: 'OpenAI',
        apiUrl: 'https://api.openai.com/v1/chat/completions',
        model: 'gpt-4o-mini',
        free: false,
        instructions: 'Get API key at: https://platform.openai.com/api-keys'
    },
    xai: {
        name: 'xAI (Grok)',
        apiUrl: 'https://api.x.ai/v1/chat/completions',
        model: 'grok-2-1212',
        free: false,
        instructions: 'Get API key at: https://console.x.ai'
    }
};

const CONFIG = {
    defaultProvider: 'groq',
    timeout: 30000,
    DB_NAME: 'PhoneStudio',
    DB_VERSION: 1,
    STORE_NAME: 'screenshots',
};

// Local Storage for API Keys
const ApiKeyManager = {
    save: (provider, apiKey) => {
        localStorage.setItem(`llm_api_key_${provider}`, apiKey);
    },
    get: (provider) => {
        return localStorage.getItem(`llm_api_key_${provider}`) || '';
    },
    getActive: () => {
        const provider = localStorage.getItem('llm_active_provider') || CONFIG.defaultProvider;
        return {
            provider,
            apiKey: ApiKeyManager.get(provider)
        };
    },
    setActive: (provider) => {
        localStorage.setItem('llm_active_provider', provider);
    }
};

function getProviderConfig(provider) {
    return LLM_PROVIDERS[provider] || LLM_PROVIDERS[CONFIG.defaultProvider];
}

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
    llmProvider: document.getElementById('llmProvider'),
    apiKey: document.getElementById('apiKey'),
    saveApiKeyBtn: document.getElementById('saveApiKeyBtn'),
    providerInstructions: document.getElementById('providerInstructions'),
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    const savedProvider = localStorage.getItem('llm_active_provider');
    const activeProvider = LLM_PROVIDERS[savedProvider] ? savedProvider : CONFIG.defaultProvider;
    ApiKeyManager.setActive(activeProvider);
    elements.llmProvider.value = activeProvider;
    elements.apiKey.value = ApiKeyManager.get(activeProvider);
    updateProviderInstructions(activeProvider);
    updateEndpointDebug(activeProvider);

    initEventListeners();
    registerServiceWorker();
    initDatabase();
    checkLLMStatus();
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
    elements.llmProvider.addEventListener('change', (e) => {
        const provider = e.target.value;
        ApiKeyManager.setActive(provider);
        elements.apiKey.value = ApiKeyManager.get(provider);
        updateProviderInstructions(provider);
        updateEndpointDebug(provider);
        checkLLMStatus();
    });
    elements.saveApiKeyBtn.addEventListener('click', () => {
        const provider = elements.llmProvider.value;
        const apiKey = elements.apiKey.value.trim();

        if (!apiKey) {
            setLastError('API key cannot be empty.');
            showStatus(elements.llmStatus, '✗ API key cannot be empty', 'error');
            return;
        }

        ApiKeyManager.setActive(provider);
        ApiKeyManager.save(provider, apiKey);
        clearLastError();
        showStatus(elements.llmStatus, `✓ ${LLM_PROVIDERS[provider].name} API key saved locally`, 'success');
        updateEndpointDebug(provider);
        checkLLMStatus();
    });
    elements.tabBtns.forEach((btn) => {
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

        elements.imagePreview.src = state.screenshot;
        elements.imagePreview.classList.remove('hidden');
        elements.ocrBtn.disabled = false;

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
                logger: (message) => console.log('OCR:', message)
            }
        );

        state.rawText = text;
        state.metadata.ocrConfidence = confidence;

        elements.rawText.value = state.rawText;
        showStatus(elements.ocrStatus, `✓ OCR complete (${Math.round(confidence)}% confidence)`, 'success');
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

    const { provider, apiKey } = ApiKeyManager.getActive();
    const providerConfig = getProviderConfig(provider);

    if (!apiKey) {
        setLastError('No API key set for the selected provider.');
        showStatus(elements.llmStatus, '✗ No API key set. Add one in Settings.', 'error');
        return;
    }

    showStatus(elements.llmStatus, `Sending to ${providerConfig.name}...`, 'loading');
    elements.llmBtn.disabled = true;
    clearLastError();

    try {
        const prompt = buildPrompt();
        let requestBody;
        let headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        };

        if (provider === 'anthropic') {
            headers = {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
                'anthropic-dangerous-direct-browser-access': 'true'
            };
            requestBody = {
                model: providerConfig.model,
                max_tokens: 2000,
                messages: [
                    {
                        role: 'user',
                        content: `You are a content strategist helping extract structured information from screenshots.\n\n${prompt}`
                    }
                ]
            };
        } else {
            requestBody = {
                model: providerConfig.model,
                messages: [
                    {
                        role: 'system',
                        content: 'You are a content strategist helping extract structured information from screenshots.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 2000
            };
        }

        const response = await fetchWithTimeout(providerConfig.apiUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify(requestBody),
        }, CONFIG.timeout);

        if (!response.ok) {
            const errorText = await response.text();
            let message = response.statusText;

            if (errorText) {
                try {
                    const errorData = JSON.parse(errorText);
                    message = errorData.error?.message || errorData.message || errorText;
                } catch (parseError) {
                    message = errorText;
                }
            }

            throw new Error(`${providerConfig.name} error: ${message}`);
        }

        const data = await response.json();
        let llmOutput = '';

        if (provider === 'anthropic') {
            llmOutput = data?.content?.find((block) => block.type === 'text')?.text || '';
        } else {
            llmOutput = data?.choices?.[0]?.message?.content || '';
        }

        state.llmOutput = llmOutput;

        if (!state.llmOutput) {
            throw new Error(`No text was returned by ${providerConfig.name}.`);
        }

        await buildOutput();
        showStatus(elements.llmStatus, `✓ ${providerConfig.name} processing complete`, 'success');

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
    const { provider } = ApiKeyManager.getActive();
    const providerConfig = getProviderConfig(provider);
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
            llm_provider: provider,
            llm_model: providerConfig.model || null,
        },
        llm_ready: true,
        approval_state: 'draft',
        linked_voice_id: null,
    };

    state.currentRecord = output;
    elements.jsonOutput.value = JSON.stringify(output, null, 2);
    elements.rawOutput.value = state.rawText;
    elements.markdownOutput.value = state.llmOutput;

    await persistRecord(output);
}

// Download JSON
function downloadJSON() {
    const json = elements.jsonOutput.value;
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `screenshot_${Date.now()}.json`;
    link.click();
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
    elements.imagePreview.removeAttribute('src');
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

    elements.tabBtns.forEach((btn) => btn.classList.remove('active'));
    e.target.classList.add('active');

    elements.jsonOutput.classList.add('hidden');
    elements.markdownOutput.classList.add('hidden');
    elements.rawOutput.classList.add('hidden');

    if (tab === 'json') elements.jsonOutput.classList.remove('hidden');
    else if (tab === 'markdown') elements.markdownOutput.classList.remove('hidden');
    else if (tab === 'raw') elements.rawOutput.classList.remove('hidden');
}

async function checkLLMStatus() {
    const { provider, apiKey } = ApiKeyManager.getActive();
    const providerName = getProviderConfig(provider).name;

    if (apiKey) {
        elements.llmStatusDebug.textContent = `✓ ${providerName} (API key set)`;
        elements.llmStatusDebug.style.color = '#34d399';
    } else {
        elements.llmStatusDebug.textContent = `⚠ ${providerName} (No API key)`;
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

function updateProviderInstructions(provider) {
    const config = getProviderConfig(provider);
    elements.providerInstructions.innerHTML = `
        <strong>${config.name}${config.free ? ' (Free)' : ''}</strong><br>
        ${config.instructions}
    `;
}

function updateEndpointDebug(provider) {
    elements.endpointDebug.textContent = getProviderConfig(provider).apiUrl;
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

async function fetchWithTimeout(url, options = {}, timeout = CONFIG.timeout) {
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

setInterval(checkLLMStatus, 5000);
