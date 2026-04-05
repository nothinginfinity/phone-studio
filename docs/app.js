// V1 MVP: Local LLM integration. All processing on-device, no backend yet.
// V1.5 adds hosted LLMs, voice linking, variants, and lead extraction.

const LLM_PROVIDERS = {
    groq: {
        name: 'Groq',
        apiUrl: 'https://api.groq.com/openai/v1/chat/completions',
        model: 'llama-3.1-70b-versatile',
        free: true,
        instructions: 'Get free API key at: https://console.groq.com/keys (60 requests/min free tier)'
    },
    groq_fast: {
        name: 'Groq (Fast)',
        apiUrl: 'https://api.groq.com/openai/v1/chat/completions',
        model: 'llama-3.1-8b-instant',
        free: true,
        instructions: 'Same Groq API key. This is the fast/light model. Get key at: https://console.groq.com/keys'
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
    variantTimeout: 20000,
    DB_NAME: 'PhoneStudio',
    DB_VERSION: 1,
    STORE_NAME: 'screenshots',
};

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

let db = null;
let mediaRecorder = null;
let mediaStream = null;
let audioChunks = [];

let state = {
    screenshot: null,
    rawText: '',
    llmOutput: '',
    voiceRecording: null,
    voiceDataUrl: null,
    voiceDurationSeconds: null,
    variants: [],
    leads: [],
    currentRecord: null,
    metadata: {
        timestamp: null,
        imageSize: null,
        ocrConfidence: null,
        voiceLinked: false,
    }
};

const elements = {
    uploadBtn: document.getElementById('uploadBtn'),
    screenshotInput: document.getElementById('screenshotInput'),
    imagePreview: document.getElementById('imagePreview'),
    recordVoiceBtn: document.getElementById('recordVoiceBtn'),
    stopRecordBtn: document.getElementById('stopRecordBtn'),
    clearVoiceBtn: document.getElementById('clearVoiceBtn'),
    voicePreview: document.getElementById('voicePreview'),
    voicePlayback: document.getElementById('voicePlayback'),
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
    generateVariantsBtn: document.getElementById('generateVariantsBtn'),
    variantsOutput: document.getElementById('variantsOutput'),
    variantsContainer: document.getElementById('variantsContainer'),
    extractLeadsBtn: document.getElementById('extractLeadsBtn'),
    leadsOutput: document.getElementById('leadsOutput'),
    leadsContainer: document.getElementById('leadsContainer'),
    leadsStatus: document.getElementById('leadsStatus'),
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
    variantInstagram: document.getElementById('variantInstagram'),
    variantTiktok: document.getElementById('variantTiktok'),
    variantEmail: document.getElementById('variantEmail'),
    variantLinkedin: document.getElementById('variantLinkedin'),
    variantIdeas: document.getElementById('variantIdeas'),
};

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
    elements.generateVariantsBtn.addEventListener('click', generateVariants);
    elements.extractLeadsBtn.addEventListener('click', extractLeads);
    elements.downloadBtn.addEventListener('click', downloadJSON);
    elements.copyBtn.addEventListener('click', copyJSON);
    elements.resetBtn.addEventListener('click', resetApp);
    elements.llmPrompt.addEventListener('change', toggleCustomPrompt);
    elements.voicePlayback.addEventListener('loadedmetadata', handleVoiceMetadata);

    initVoiceControls();

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
        showStatus(elements.llmStatus, `✓ ${getProviderConfig(provider).name} API key saved locally`, 'success');
        updateEndpointDebug(provider);
        checkLLMStatus();
    });

    elements.tabBtns.forEach((btn) => {
        btn.addEventListener('click', switchTab);
    });
}

function initVoiceControls() {
    if (!elements.recordVoiceBtn || !elements.stopRecordBtn || !elements.clearVoiceBtn) {
        return;
    }

    if (window.PointerEvent) {
        elements.recordVoiceBtn.addEventListener('pointerdown', async (event) => {
            event.preventDefault();
            if (event.pointerId !== undefined && elements.recordVoiceBtn.setPointerCapture) {
                try {
                    elements.recordVoiceBtn.setPointerCapture(event.pointerId);
                } catch (error) {
                    // Ignore capture errors.
                }
            }
            await startVoiceRecording();
        });

        const stopEvents = ['pointerup', 'pointercancel', 'lostpointercapture', 'pointerleave'];
        stopEvents.forEach((eventName) => {
            elements.recordVoiceBtn.addEventListener(eventName, (event) => {
                event.preventDefault();
                stopVoiceRecording();
            });
        });
    } else {
        elements.recordVoiceBtn.addEventListener('click', async () => {
            if (mediaRecorder?.state === 'recording') {
                stopVoiceRecording();
            } else {
                await startVoiceRecording();
            }
        });
    }

    elements.stopRecordBtn.addEventListener('click', stopVoiceRecording);
    elements.clearVoiceBtn.addEventListener('click', clearVoiceRecording);
}

function updateVoiceButtons(isRecording) {
    elements.recordVoiceBtn.textContent = isRecording
        ? '🎙️ Recording... release to stop'
        : '🎙️ Record Voice (Hold to Record)';
    elements.stopRecordBtn.style.display = isRecording ? 'inline-block' : 'none';
    elements.stopRecordBtn.disabled = !isRecording;
}

async function ensureMediaRecorder() {
    if (mediaRecorder) {
        return true;
    }

    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
        setLastError('Voice recording is not supported in this browser.');
        showStatus(elements.llmStatus, '✗ Voice recording is not supported on this device/browser.', 'error');
        return false;
    }

    try {
        mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(mediaStream);

        mediaRecorder.ondataavailable = (event) => {
            if (event.data?.size) {
                audioChunks.push(event.data);
            }
        };

        mediaRecorder.onstop = () => {
            const audioBlob = new Blob(audioChunks, { type: mediaRecorder.mimeType || 'audio/webm' });
            audioChunks = [];

            if (state.voiceDataUrl) {
                URL.revokeObjectURL(state.voiceDataUrl);
            }

            state.voiceRecording = audioBlob;
            state.voiceDataUrl = URL.createObjectURL(audioBlob);
            state.voiceDurationSeconds = estimateAudioDuration(audioBlob);
            state.metadata.voiceLinked = true;

            elements.voicePlayback.src = state.voiceDataUrl;
            elements.voicePreview.classList.remove('hidden');
            updateVoiceButtons(false);

            buildOutput().catch((error) => {
                setLastError(`Output refresh failed: ${error.message}`);
            });
        };

        return true;
    } catch (error) {
        console.error('Microphone access denied:', error);
        setLastError(`Microphone access failed: ${error.message}`);
        showStatus(elements.llmStatus, '✗ Microphone access denied or unavailable.', 'error');
        return false;
    }
}

async function startVoiceRecording() {
    const ready = await ensureMediaRecorder();
    if (!ready || !mediaRecorder || mediaRecorder.state !== 'inactive') {
        return;
    }

    clearLastError();
    audioChunks = [];
    mediaRecorder.start();
    updateVoiceButtons(true);
}

function stopVoiceRecording() {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
    }
}

function clearVoiceRecording() {
    if (state.voiceDataUrl) {
        URL.revokeObjectURL(state.voiceDataUrl);
    }

    state.voiceRecording = null;
    state.voiceDataUrl = null;
    state.voiceDurationSeconds = null;
    state.metadata.voiceLinked = false;
    audioChunks = [];
    elements.voicePlayback.removeAttribute('src');
    elements.voicePreview.classList.add('hidden');
    updateVoiceButtons(false);

    buildOutput().catch((error) => {
        setLastError(`Output refresh failed: ${error.message}`);
    });
}

function handleVoiceMetadata() {
    if (Number.isFinite(elements.voicePlayback.duration) && elements.voicePlayback.duration > 0) {
        state.voiceDurationSeconds = Math.round(elements.voicePlayback.duration);
    }
}

function estimateAudioDuration(audioBlob) {
    return Math.max(1, Math.round(audioBlob.size / 16000));
}

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
        state.leads = extractLeadEntries(state.rawText);

        elements.rawText.value = state.rawText;
        showStatus(elements.ocrStatus, `✓ OCR complete (${Math.round(confidence)}% confidence)`, 'success');
        elements.llmBtn.disabled = false;
        elements.extractLeadsBtn.disabled = false;

        await buildOutput();
    } catch (error) {
        console.error('OCR Error:', error);
        setLastError(`OCR failed: ${error.message}`);
        showStatus(elements.ocrStatus, `✗ OCR failed: ${error.message}`, 'error');
    } finally {
        elements.ocrBtn.disabled = false;
    }
}

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
        state.llmOutput = await requestLLM({
            provider,
            apiKey,
            systemPrompt: 'You are a content strategist helping extract structured information from screenshots.',
            userPrompt: prompt,
            temperature: 0.7,
            maxTokens: 2000,
            timeout: CONFIG.timeout
        });

        if (!state.llmOutput) {
            throw new Error(`No text was returned by ${providerConfig.name}.`);
        }

        await buildOutput();
        showStatus(elements.llmStatus, `✓ ${providerConfig.name} processing complete`, 'success');

        elements.downloadBtn.disabled = false;
        elements.copyBtn.disabled = false;
        elements.generateVariantsBtn.disabled = false;
    } catch (error) {
        console.error('LLM Error:', error);
        setLastError(`LLM failed: ${error.message}`);
        showStatus(elements.llmStatus, `✗ LLM failed: ${error.message}`, 'error');
    } finally {
        elements.llmBtn.disabled = false;
    }
}

async function requestLLM({ provider, apiKey, systemPrompt, userPrompt, temperature = 0.7, maxTokens = 2000, timeout = CONFIG.timeout }) {
    const providerConfig = getProviderConfig(provider);
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
            max_tokens: maxTokens,
            messages: [
                {
                    role: 'user',
                    content: `${systemPrompt}\n\n${userPrompt}`
                }
            ]
        };
    } else {
        requestBody = {
            model: providerConfig.model,
            messages: [
                {
                    role: 'system',
                    content: systemPrompt
                },
                {
                    role: 'user',
                    content: userPrompt
                }
            ],
            temperature,
            max_tokens: maxTokens
        };
    }

    const response = await fetchWithTimeout(providerConfig.apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
    }, timeout);

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
    if (provider === 'anthropic') {
        return data?.content?.find((block) => block.type === 'text')?.text || '';
    }

    return data?.choices?.[0]?.message?.content || '';
}

function buildPrompt() {
    const promptType = elements.llmPrompt.value;
    const text = state.rawText;
    const voiceContext = state.metadata.voiceLinked
        ? `\n\nVoice note context:\n${state.voiceDurationSeconds || estimateAudioDuration(state.voiceRecording)} second recording linked. Use it as additional creative context even though transcript is not available.`
        : '';

    const prompts = {
        structure: `Extract and structure this text into JSON format with sections for: headings, paragraphs, links, and lists. Return ONLY valid JSON.

Text:
${text}${voiceContext}`,
        markdown: `Convert this text into clean, well-formatted Markdown. Preserve structure and add appropriate formatting.

Text:
${text}${voiceContext}`,
        caption: `Generate a 1-2 sentence Instagram caption based on this screenshot content. Be engaging and on-brand.

Text:
${text}${voiceContext}`,
        ideas: `Generate 3 content ideas (blog post, social post, email) based on this screenshot. List each with a title and 1-line description.

Text:
${text}${voiceContext}`,
        custom: elements.customPrompt.value || `Analyze this text:
${text}${voiceContext}`
    };

    return prompts[promptType] || prompts.structure;
}

async function generateVariants() {
    if (!state.llmOutput && !state.rawText) {
        showStatus(elements.llmStatus, '✗ Generate JSON first', 'error');
        return;
    }

    const { provider, apiKey } = ApiKeyManager.getActive();
    if (!apiKey) {
        showStatus(elements.llmStatus, '✗ No API key set. Add one in Settings.', 'error');
        return;
    }

    const selectedVariants = {
        instagram: elements.variantInstagram.checked,
        tiktok: elements.variantTiktok.checked,
        email: elements.variantEmail.checked,
        linkedin: elements.variantLinkedin.checked,
        ideas: elements.variantIdeas.checked,
    };

    const variantPrompts = {
        instagram: 'Write a single Instagram caption (max 150 chars) for this content:',
        tiktok: 'Write a TikTok caption (max 80 chars) for this content:',
        email: 'Write an email subject line and one-line preview for this content:',
        linkedin: 'Write a professional LinkedIn post (2-3 sentences) for this content:',
        ideas: 'Generate 3 distinct content ideas from this information, each with a title and one-line description:'
    };

    const sourceText = state.llmOutput || state.rawText;
    const variants = [];

    elements.generateVariantsBtn.disabled = true;
    showStatus(elements.llmStatus, 'Generating variants...', 'loading');

    try {
        for (const [type, isSelected] of Object.entries(selectedVariants)) {
            if (!isSelected) continue;

            const prompt = `${variantPrompts[type]}\n\n${sourceText}`;
            const content = await requestLLM({
                provider,
                apiKey,
                systemPrompt: 'You are a content creation expert.',
                userPrompt: prompt,
                temperature: 0.8,
                maxTokens: 500,
                timeout: CONFIG.variantTimeout
            });

            if (content) {
                variants.push({ type, content });
            }
        }

        state.variants = variants;
        displayVariants(variants);
        await buildOutput();
        showStatus(elements.llmStatus, `✓ Generated ${variants.length} variants`, 'success');
    } catch (error) {
        setLastError(`Variant generation failed: ${error.message}`);
        showStatus(elements.llmStatus, `✗ Variant generation failed: ${error.message}`, 'error');
    } finally {
        elements.generateVariantsBtn.disabled = false;
    }
}

function displayVariants(variants) {
    elements.variantsContainer.innerHTML = '';

    variants.forEach((variant) => {
        const card = document.createElement('div');
        card.className = 'variant-card';

        const heading = document.createElement('h4');
        heading.textContent = formatVariantLabel(variant.type);

        const body = document.createElement('p');
        body.textContent = variant.content;

        const copyButton = document.createElement('button');
        copyButton.className = 'btn btn-secondary';
        copyButton.textContent = '📋 Copy';
        copyButton.addEventListener('click', () => {
            copyText(variant.content, '✓ Variant copied!');
        });

        card.appendChild(heading);
        card.appendChild(body);
        card.appendChild(copyButton);
        elements.variantsContainer.appendChild(card);
    });

    elements.variantsOutput.classList.toggle('hidden', variants.length === 0);
}

function formatVariantLabel(type) {
    const labels = {
        instagram: 'Instagram Caption',
        tiktok: 'TikTok Caption',
        email: 'Email Subject + Preview',
        linkedin: 'LinkedIn Post',
        ideas: 'Content Ideas'
    };
    return labels[type] || type;
}

function extractLeadEntries(text) {
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const phoneRegex = /(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)\d{3}[-.\s]?\d{4}/g;

    const emails = [...new Set(text.match(emailRegex) || [])];
    const phones = [...new Set((text.match(phoneRegex) || []).map((value) => value.trim()))];

    return [
        ...emails.map((value) => ({ type: 'email', value })),
        ...phones.map((value) => ({ type: 'phone', value }))
    ];
}

async function extractLeads() {
    state.leads = extractLeadEntries(state.rawText);
    elements.leadsContainer.innerHTML = '';

    if (state.leads.length === 0) {
        elements.leadsOutput.classList.add('hidden');
        elements.leadsStatus.textContent = 'No emails or phone numbers found.';
        await buildOutput();
        return;
    }

    state.leads.forEach((lead) => {
        const item = document.createElement('div');
        item.className = 'lead-item';

        const label = document.createElement('strong');
        label.textContent = lead.type.toUpperCase();

        const value = document.createElement('p');
        value.textContent = lead.value;

        const copyButton = document.createElement('button');
        copyButton.className = 'btn btn-secondary';
        copyButton.style.padding = '4px';
        copyButton.style.fontSize = '12px';
        copyButton.textContent = 'Copy';
        copyButton.addEventListener('click', () => {
            copyText(lead.value, '✓ Lead copied!');
        });

        item.appendChild(label);
        item.appendChild(value);
        item.appendChild(copyButton);
        elements.leadsContainer.appendChild(item);
    });

    elements.leadsOutput.classList.remove('hidden');
    elements.leadsStatus.textContent = `Found ${state.leads.length} contact(s)`;
    await buildOutput();
}

async function buildOutput() {
    const { provider } = ApiKeyManager.getActive();
    const providerConfig = getProviderConfig(provider);
    const emails = state.leads.filter((lead) => lead.type === 'email').map((lead) => lead.value);
    const phones = state.leads.filter((lead) => lead.type === 'phone').map((lead) => lead.value);
    const output = {
        id: state.currentRecord?.id || `screenshot_${Date.now()}`,
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
            voice_linked: state.metadata.voiceLinked,
            voice_duration: state.voiceRecording
                ? `${state.voiceDurationSeconds || estimateAudioDuration(state.voiceRecording)} seconds`
                : 'None'
        },
        extracted_leads: {
            emails,
            phones,
            lead_count: state.leads.length
        },
        generated_variants: state.variants,
        approval_state: 'pending_review',
        llm_ready: Boolean(state.rawText || state.llmOutput),
        linked_voice_id: null,
        linked_post_ids: [],
    };

    state.currentRecord = output;
    elements.jsonOutput.value = JSON.stringify(output, null, 2);
    elements.rawOutput.value = state.rawText;
    elements.markdownOutput.value = state.llmOutput;

    await persistRecord(output);
}

function downloadJSON() {
    const json = elements.jsonOutput.value;
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${state.currentRecord?.id || `screenshot_${Date.now()}`}.json`;
    link.click();
    URL.revokeObjectURL(url);
}

async function copyJSON() {
    await copyText(elements.jsonOutput.value, '✓ JSON copied to clipboard');
}

async function copyText(text, successMessage = '✓ Copied!') {
    try {
        if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(text);
        } else {
            const helper = document.createElement('textarea');
            helper.value = text;
            document.body.appendChild(helper);
            helper.select();
            document.execCommand('copy');
            document.body.removeChild(helper);
        }
        showStatus(elements.llmStatus, successMessage, 'success');
    } catch (error) {
        setLastError(`Clipboard copy failed: ${error.message}`);
        showStatus(elements.llmStatus, `✗ Copy failed: ${error.message}`, 'error');
    }
}

function resetApp() {
    if (state.voiceDataUrl) {
        URL.revokeObjectURL(state.voiceDataUrl);
    }

    state = {
        screenshot: null,
        rawText: '',
        llmOutput: '',
        voiceRecording: null,
        voiceDataUrl: null,
        voiceDurationSeconds: null,
        variants: [],
        leads: [],
        currentRecord: null,
        metadata: {
            timestamp: null,
            imageSize: null,
            ocrConfidence: null,
            voiceLinked: false,
        }
    };

    audioChunks = [];
    elements.screenshotInput.value = '';
    elements.imagePreview.classList.add('hidden');
    elements.imagePreview.removeAttribute('src');
    elements.voicePlayback.removeAttribute('src');
    elements.voicePreview.classList.add('hidden');
    updateVoiceButtons(false);
    elements.rawText.value = '';
    elements.jsonOutput.value = '';
    elements.markdownOutput.value = '';
    elements.rawOutput.value = '';
    elements.variantsContainer.innerHTML = '';
    elements.variantsOutput.classList.add('hidden');
    elements.leadsContainer.innerHTML = '';
    elements.leadsOutput.classList.add('hidden');
    elements.leadsStatus.textContent = '';
    elements.ocrStatus.classList.add('hidden');
    elements.llmStatus.classList.add('hidden');
    elements.customPrompt.value = '';
    elements.customPrompt.style.display = 'none';

    elements.ocrBtn.disabled = true;
    elements.llmBtn.disabled = true;
    elements.generateVariantsBtn.disabled = true;
    elements.extractLeadsBtn.disabled = true;
    elements.downloadBtn.disabled = true;
    elements.copyBtn.disabled = true;
    clearLastError();
}

function toggleCustomPrompt() {
    if (elements.llmPrompt.value === 'custom') {
        elements.customPrompt.style.display = 'block';
    } else {
        elements.customPrompt.style.display = 'none';
    }
}

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
