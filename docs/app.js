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

const BatchDB = {
    dbName: 'PhoneStudioBatch',
    storeName: 'processed_photos',
    indexStoreName: 'search_index',

    async init() {
        if (!window.idb?.openDB) {
            throw new Error('IndexedDB helper failed to load.');
        }

        return window.idb.openDB(this.dbName, 1, {
            upgrade(db) {
                if (!db.objectStoreNames.contains('processed_photos')) {
                    db.createObjectStore('processed_photos', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('search_index')) {
                    db.createObjectStore('search_index', { keyPath: 'keyword' });
                }
            }
        });
    },

    async savePhoto(photoData) {
        const db = await this.init();
        await db.put(this.storeName, photoData);
    },

    async getAll() {
        const db = await this.init();
        return db.getAll(this.storeName);
    },

    async getById(id) {
        const db = await this.init();
        return db.get(this.storeName, id);
    },

    async search(query) {
        const db = await this.init();
        const all = await db.getAll(this.storeName);
        const searchText = query.toLowerCase();

        return all.filter((photo) => {
            const keywordPool = [
                ...(photo.keywords || []),
                ...(photo.photo_keywords || []),
                ...(photo.compressed_index?.keywords || []),
                ...(photo.compressed_index?.concepts || [])
            ].join(' ').toLowerCase();

            return (photo.raw_text || '').toLowerCase().includes(searchText) ||
                (photo.llm_output || '').toLowerCase().includes(searchText) ||
                (photo.metadata_string || '').toLowerCase().includes(searchText) ||
                keywordPool.includes(searchText);
        });
    },

    async clear() {
        const db = await this.init();
        await db.clear(this.storeName);
        await db.clear(this.indexStoreName);
    }
};

let batchState = {
    queue: [],
    currentIndex: 0,
    isProcessing: false,
    results: []
};

function getProviderConfig(provider) {
    return LLM_PROVIDERS[provider] || LLM_PROVIDERS[CONFIG.defaultProvider];
}

const SemanticCompressor = {
    async compress(ocrText, llmOutput) {
        try {
            const concepts = this.extractConcepts(ocrText, llmOutput);
            const entities = this.extractEntities(ocrText);
            const contentType = this.classifyContentType(ocrText, llmOutput);
            const summary = this.generateSummary(ocrText, llmOutput);
            const keywords = this.extractKeywords(ocrText, concepts);

            return {
                v: 1,
                type: contentType,
                concepts,
                entities,
                keywords,
                summary,
                confidence: 0.85,
                timestamp: new Date().toISOString().split('T')[0]
            };
        } catch (error) {
            console.error('Compression error:', error);
            return null;
        }
    },

    extractConcepts(ocrText, llmOutput) {
        const combined = `${ocrText} ${llmOutput}`.toLowerCase();
        const conceptPatterns = {
            finance: ['credit', 'funding', 'loan', 'finance', 'financial', 'capital', 'investment', 'payment', 'cost'],
            business: ['business', 'company', 'corporate', 'enterprise', 'organization', 'client', 'service'],
            legal: ['contract', 'agreement', 'legal', 'terms', 'compliance', 'regulatory', 'law'],
            technology: ['software', 'app', 'digital', 'online', 'platform', 'system', 'tech', 'data'],
            marketing: ['marketing', 'branding', 'advertising', 'campaign', 'social', 'content', 'engagement'],
            operations: ['process', 'workflow', 'procedure', 'operations', 'management', 'implementation'],
            communication: ['email', 'contact', 'communication', 'message', 'phone', 'address']
        };

        const foundConcepts = [];
        for (const [concept, keywords] of Object.entries(conceptPatterns)) {
            const matches = keywords.filter((keyword) => combined.includes(keyword));
            if (matches.length >= 2) {
                foundConcepts.push(concept);
            }
        }

        return foundConcepts.length > 0 ? foundConcepts : ['general'];
    },

    extractEntities(ocrText) {
        const words = ocrText.match(/\b[A-Z][a-z]+(?:\s[A-Z][a-z]+)*\b/g) || [];
        const unique = [...new Set(words)];
        return unique.slice(0, 5);
    },

    classifyContentType(ocrText, llmOutput) {
        const combined = `${ocrText} ${llmOutput}`.toLowerCase();

        if (combined.includes('contract') || combined.includes('agreement')) return 'contract';
        if (combined.includes('invoice') || combined.includes('receipt')) return 'invoice';
        if (combined.includes('email') || combined.includes('@')) return 'email';
        if (combined.includes('program') || combined.includes('overview')) return 'program';
        if (combined.includes('proposal') || combined.includes('pitch')) return 'proposal';
        if (combined.includes('analysis') || combined.includes('report')) return 'report';
        if (combined.includes('form') || combined.includes('application')) return 'form';

        return 'document';
    },

    generateSummary(ocrText, llmOutput) {
        if (llmOutput && llmOutput.length > 0) {
            const firstSentence = llmOutput.split(/[\.\?!]+/)[0].trim();
            if (firstSentence.length > 10 && firstSentence.length < 120) {
                return firstSentence.substring(0, 100);
            }
        }

        const sentences = ocrText.split(/[\.\?!]+/);
        const meaningful = sentences.find((sentence) => sentence.trim().length > 20);
        if (meaningful) {
            return meaningful.trim().substring(0, 100);
        }

        return 'Content analysis available';
    },

    extractKeywords(ocrText, concepts) {
        const stopWords = new Set([
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
            'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
            'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might'
        ]);

        const words = ocrText.toLowerCase().match(/\b\w{4,}\b/g) || [];
        const freq = {};

        words.forEach((word) => {
            if (!stopWords.has(word)) {
                freq[word] = (freq[word] || 0) + 1;
            }
        });

        const topWords = Object.entries(freq)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map((entry) => entry[0]);

        return [...new Set([...concepts, ...topWords])].slice(0, 8);
    },

    formatForMetadata(compressed) {
        if (!compressed) return '';

        const parts = [
            `v${compressed.v}`,
            `type:${compressed.type}`,
            `concepts:${compressed.concepts.join(',')}`,
            `keywords:${compressed.keywords.join(',')}`,
            `summary:${compressed.summary.replace(/[|]/g, ' ')}`,
            `date:${compressed.timestamp}`
        ];

        return parts.join('|');
    },

    parseFromMetadata(metadataString) {
        if (!metadataString || !metadataString.startsWith('v')) return null;

        const parts = metadataString.split('|');
        const result = { v: 1 };

        parts.forEach((part) => {
            if (part.startsWith('v')) result.v = parseInt(part.substring(1), 10);
            else if (part.startsWith('type:')) result.type = part.substring(5);
            else if (part.startsWith('concepts:')) result.concepts = part.substring(9).split(',');
            else if (part.startsWith('keywords:')) result.keywords = part.substring(9).split(',');
            else if (part.startsWith('summary:')) result.summary = part.substring(8);
            else if (part.startsWith('date:')) result.timestamp = part.substring(5);
        });

        return result;
    }
};

const PhotoMetadataWriter = {
    generateMetadataPayload(photoData, compressed) {
        return {
            type: 'phone_studio_index',
            version: 1,
            data: {
                title: `${compressed.type.toUpperCase()}: ${compressed.summary}`.substring(0, 120),
                description: SemanticCompressor.formatForMetadata(compressed),
                keywords: compressed.keywords,
                concepts: compressed.concepts,
                entities: compressed.entities || [],
                searchable_text: `${compressed.summary} ${compressed.concepts.join(' ')}`.trim()
            },
            generated: new Date().toISOString(),
            photo_id: photoData.id
        };
    },

    formatForCopyPaste(payload) {
        const { data } = payload;

        return `Phone Studio Index
Title: ${data.title}
Type: ${payload.type}
Concepts: ${data.concepts.join(', ')}
Keywords: ${data.keywords.join(', ')}
Summary: ${data.searchable_text.substring(0, 200)}
Metadata: ${data.description}

[To add to photo: Copy above, go to Photos app, Edit > Info > Description > Paste]`;
    },

    generateShortcutLink(payload) {
        return {
            instruction: 'Open Shortcuts app -> Create automation -> Run when photo is saved',
            data: payload
        };
    }
};

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
    compressedIndex: null,
    photoMetadata: null,
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
    photoMetadataPanel: document.getElementById('photoMetadataPanel'),
    metadataForCopy: document.getElementById('metadataForCopy'),
    copyMetadataBtn: document.getElementById('copyMetadataBtn'),
    semanticPanel: document.getElementById('semanticPanel'),
    semanticType: document.getElementById('semanticType'),
    semanticConcepts: document.getElementById('semanticConcepts'),
    semanticKeywords: document.getElementById('semanticKeywords'),
    semanticEntities: document.getElementById('semanticEntities'),
    semanticSummary: document.getElementById('semanticSummary'),
    semanticSize: document.getElementById('semanticSize'),
    semanticJson: document.getElementById('semanticJson'),
    copySemanticBtn: document.getElementById('copySemanticBtn'),
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
    batchPhotoInput: document.getElementById('batchPhotoInput'),
    selectPhotosBtn: document.getElementById('selectPhotosBtn'),
    photoCountDisplay: document.getElementById('photoCountDisplay'),
    batchOcr: document.getElementById('batchOcr'),
    batchLlm: document.getElementById('batchLlm'),
    batchVariants: document.getElementById('batchVariants'),
    startBatchBtn: document.getElementById('startBatchBtn'),
    batchProgress: document.getElementById('batchProgress'),
    batchStatus: document.getElementById('batchStatus'),
    progressText: document.getElementById('progressText'),
    progressPercent: document.getElementById('progressPercent'),
    progressFill: document.getElementById('progressFill'),
    currentPhotoStatus: document.getElementById('currentPhotoStatus'),
    batchTabBtns: document.querySelectorAll('.batch-tab-btn'),
    batchTabContents: document.querySelectorAll('.batch-tab-content'),
    searchInput: document.getElementById('searchInput'),
    searchBtn: document.getElementById('searchBtn'),
    searchResults: document.getElementById('searchResults'),
    searchCount: document.getElementById('searchCount'),
    resultsContainer: document.getElementById('resultsContainer'),
    searchEmpty: document.getElementById('searchEmpty'),
    clearIndexBtn: document.getElementById('clearIndexBtn'),
    libraryCount: document.getElementById('libraryCount'),
    indexSize: document.getElementById('indexSize'),
    lastUpdated: document.getElementById('lastUpdated'),
    libraryList: document.getElementById('libraryList'),
    libraryItems: document.getElementById('libraryItems'),
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
    updateLibraryDisplay();
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
    elements.copyMetadataBtn.addEventListener('click', copyPhotoMetadata);
    elements.copySemanticBtn.addEventListener('click', copySemantic);
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

    elements.selectPhotosBtn.addEventListener('click', () => {
        elements.batchPhotoInput.click();
    });

    elements.batchPhotoInput.addEventListener('change', (e) => {
        const count = e.target.files.length;
        elements.photoCountDisplay.textContent = count > 0 ? `${count} photo(s) selected` : '';
        elements.startBatchBtn.disabled = count === 0;
    });

    elements.startBatchBtn.addEventListener('click', () => {
        const files = elements.batchPhotoInput.files;
        const options = {
            ocr: elements.batchOcr.checked,
            llm: elements.batchLlm.checked,
            variants: elements.batchVariants.checked
        };

        processBatchPhotos(files, options);
    });

    elements.batchTabBtns.forEach((btn) => {
        btn.addEventListener('click', (e) => {
            switchBatchTab(e.currentTarget.dataset.tab);
        });
    });

    elements.searchBtn.addEventListener('click', () => {
        searchPhotos(elements.searchInput.value);
    });

    elements.searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            searchPhotos(elements.searchInput.value);
        }
    });

    elements.clearIndexBtn.addEventListener('click', async () => {
        if (confirm('Clear all indexed photos? This cannot be undone.')) {
            await BatchDB.clear();
            await updateLibraryDisplay();
            showStatus(elements.batchStatus, '✓ Index cleared', 'success');
        }
    });

    elements.tabBtns.forEach((btn) => {
        btn.addEventListener('click', switchTab);
    });
}

async function processBatchPhotos(files, options) {
    if (!files || files.length === 0) {
        showStatus(elements.batchStatus, '✗ No photos selected', 'error');
        return;
    }

    batchState.queue = Array.from(files);
    batchState.currentIndex = 0;
    batchState.isProcessing = true;
    batchState.results = [];

    showBatchProgress(true);
    elements.batchStatus.classList.add('hidden');

    for (let i = 0; i < batchState.queue.length; i += 1) {
        if (!batchState.isProcessing) break;

        batchState.currentIndex = i;
        await processOnePhoto(batchState.queue[i], options, i, batchState.queue.length);
        updateBatchProgressUI(i + 1, batchState.queue.length);
    }

    batchState.isProcessing = false;
    showBatchProgress(false);
    showStatus(
        elements.batchStatus,
        `✓ Processed ${batchState.results.length} photo(s) successfully`,
        'success'
    );

    await updateLibraryDisplay();
}

async function processOnePhoto(file, options, index, total) {
    return new Promise((resolve) => {
        const reader = new FileReader();

        reader.onload = async (event) => {
            try {
                const photoData = {
                    id: `photo_${Date.now()}_${index}`,
                    timestamp: new Date().toISOString(),
                    file_name: file.name,
                    raw_image: event.target.result,
                    raw_text: '',
                    llm_output: '',
                    keywords: [],
                    generated_variants: [],
                    metadata: {
                        file_size: file.size,
                        image_size: null
                    }
                };

                elements.currentPhotoStatus.textContent = `${index + 1}/${total}: Preparing ${file.name}...`;

                await setBatchImageSize(photoData, event.target.result);

                if (options.ocr) {
                    elements.currentPhotoStatus.textContent = `${index + 1}/${total}: Running OCR on ${file.name}...`;

                    try {
                        const { data: { text } } = await Tesseract.recognize(event.target.result, 'eng');
                        photoData.raw_text = text;
                    } catch (error) {
                        console.error('OCR failed:', error);
                    }
                }

                if (options.llm && photoData.raw_text) {
                    elements.currentPhotoStatus.textContent = `${index + 1}/${total}: Processing with LLM...`;

                    const { provider, apiKey } = ApiKeyManager.getActive();
                    if (apiKey) {
                        try {
                            const content = await requestLLM({
                                provider,
                                apiKey,
                                systemPrompt: 'Extract key information and return JSON with topics, structure, and keywords.',
                                userPrompt: `Analyze this extracted text and provide key topics, structure, and 3-5 keywords. Return as JSON.\n\nText:\n${photoData.raw_text}`,
                                temperature: 0.5,
                                maxTokens: 500,
                                timeout: 15000
                            });

                            photoData.llm_output = content;

                            try {
                                const parsed = JSON.parse(content);
                                photoData.keywords = parsed.keywords || extractKeywords(photoData.raw_text);
                            } catch (error) {
                                photoData.keywords = extractKeywords(photoData.raw_text);
                            }
                        } catch (error) {
                            console.error('LLM failed:', error);
                            photoData.keywords = extractKeywords(photoData.raw_text);
                        }
                    }
                } else if (photoData.raw_text) {
                    photoData.keywords = extractKeywords(photoData.raw_text);
                }

                if (options.variants && photoData.raw_text) {
                    elements.currentPhotoStatus.textContent = `${index + 1}/${total}: Generating variants...`;
                    photoData.generated_variants = await generateBatchVariantsForPhoto(photoData);
                }

                const enriched = await enrichPhotoDataWithSemanticCompression(photoData);
                await BatchDB.savePhoto(enriched);
                batchState.results.push(enriched);
                resolve();
            } catch (error) {
                console.error('Error processing photo:', error);
                resolve();
            }
        };

        reader.readAsDataURL(file);
    });
}

async function generateBatchVariantsForPhoto(photoData) {
    const { provider, apiKey } = ApiKeyManager.getActive();
    if (!apiKey) {
        return [];
    }

    try {
        const response = await requestLLM({
            provider,
            apiKey,
            systemPrompt: 'Return concise JSON only.',
            userPrompt: `Create JSON with keys instagram, email, linkedin for this content.\n\n${photoData.llm_output || photoData.raw_text}`,
            temperature: 0.7,
            maxTokens: 400,
            timeout: 12000
        });
        const parsed = JSON.parse(response);
        return Object.entries(parsed).map(([type, content]) => ({ type, content }));
    } catch (error) {
        console.error('Batch variants failed:', error);
        return [];
    }
}

function extractKeywords(text) {
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'is', 'are', 'was', 'were']);
    const words = text.toLowerCase().match(/\b\w{4,}\b/g) || [];
    const freq = {};

    words.forEach((word) => {
        if (!stopWords.has(word)) {
            freq[word] = (freq[word] || 0) + 1;
        }
    });

    return Object.entries(freq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map((entry) => entry[0]);
}

function updateBatchProgressUI(current, total) {
    const percent = Math.round((current / total) * 100);
    elements.progressText.textContent = `Processing ${current}/${total}`;
    elements.progressPercent.textContent = `${percent}%`;
    elements.progressFill.style.width = `${percent}%`;
}

function showBatchProgress(show) {
    elements.batchProgress.classList.toggle('hidden', !show);
}

async function searchPhotos(query) {
    if (!query.trim()) {
        elements.searchResults.classList.add('hidden');
        elements.searchEmpty.style.display = 'block';
        return;
    }

    const results = await BatchDB.search(query);
    elements.resultsContainer.innerHTML = '';

    if (results.length === 0) {
        elements.searchCount.textContent = 'No results found';
        elements.searchResults.classList.add('hidden');
        elements.searchEmpty.style.display = 'block';
        return;
    }

    results.forEach((result) => {
        const card = document.createElement('div');
        card.className = 'result-card';

        const preview = (result.raw_text || '').substring(0, 150).replace(/\n/g, ' ');
        const keywords = (result.photo_keywords || result.keywords || []).join(', ') || 'N/A';

        card.innerHTML = `
            <h4>${result.file_name}</h4>
            <p><strong>Keywords:</strong> ${keywords}</p>
            <p><strong>Date:</strong> ${new Date(result.timestamp).toLocaleDateString()}</p>
            <div class="result-preview">${preview}...</div>
        `;

        card.addEventListener('click', () => showPhotoDetail(result));
        elements.resultsContainer.appendChild(card);
    });

    elements.searchCount.textContent = `Found ${results.length} result(s)`;
    elements.searchResults.classList.remove('hidden');
    elements.searchEmpty.style.display = 'none';
}

function showPhotoDetail(photo) {
    alert(`Photo: ${photo.file_name}\n\nKeywords: ${(photo.photo_keywords || photo.keywords || []).join(', ')}\n\nPreview:\n${(photo.raw_text || '').substring(0, 200)}...`);
}

async function viewPhotoDetail(id) {
    const photo = await BatchDB.getById(id);
    if (photo) {
        showPhotoDetail(photo);
    }
}

function switchBatchTab(tabName) {
    elements.batchTabContents.forEach((tab) => {
        tab.classList.remove('active');
    });

    elements.batchTabBtns.forEach((btn) => {
        btn.classList.remove('active');
    });

    document.getElementById(`${tabName}Tab`).classList.add('active');
    document.querySelector(`.batch-tab-btn[data-tab="${tabName}"]`).classList.add('active');
}

async function updateLibraryDisplay() {
    try {
        const all = await BatchDB.getAll();
        elements.libraryCount.textContent = String(all.length);

        const sizeKB = all.reduce((sum, photo) => {
            const textSize = (photo.raw_text || '').length + (photo.llm_output || '').length + (photo.metadata_string || '').length;
            return sum + (textSize / 1024);
        }, 0);
        elements.indexSize.textContent = String(Math.round(sizeKB));

        if (all.length > 0) {
            elements.lastUpdated.textContent = new Date(all[all.length - 1].timestamp).toLocaleString();
            elements.libraryItems.innerHTML = '';

            all.slice(-5).reverse().forEach((photo) => {
                const item = document.createElement('div');
                item.className = 'library-item';

                const label = document.createElement('span');
                label.textContent = `${photo.file_name} (${new Date(photo.timestamp).toLocaleDateString()})`;

                const button = document.createElement('button');
                button.className = 'btn btn-secondary';
                button.textContent = 'View';
                button.addEventListener('click', () => {
                    viewPhotoDetail(photo.id);
                });

                item.appendChild(label);
                item.appendChild(button);
                elements.libraryItems.appendChild(item);
            });

            elements.libraryList.classList.remove('hidden');
        } else {
            elements.lastUpdated.textContent = 'Never';
            elements.libraryItems.innerHTML = '';
            elements.libraryList.classList.add('hidden');
        }
    } catch (error) {
        console.error('Library display failed:', error);
    }
}

function setBatchImageSize(photoData, dataUrl) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            photoData.metadata.image_size = { width: img.width, height: img.height };
            resolve();
        };
        img.onerror = () => resolve();
        img.src = dataUrl;
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
    const compressed = await SemanticCompressor.compress(state.rawText, state.llmOutput);
    const recordId = state.currentRecord?.id || `screenshot_${Date.now()}`;
    const metadataPayload = compressed
        ? PhotoMetadataWriter.generateMetadataPayload(
            {
                id: recordId,
                timestamp: state.metadata.timestamp,
                file_name: 'screenshot'
            },
            compressed
        )
        : null;
    const output = {
        id: recordId,
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
        compressed_index: compressed,
        photo_metadata: metadataPayload,
        approval_state: 'pending_review',
        llm_ready: Boolean(state.rawText || state.llmOutput),
        linked_voice_id: null,
        linked_post_ids: [],
    };

    state.compressedIndex = compressed;
    state.photoMetadata = metadataPayload;
    state.currentRecord = output;
    elements.jsonOutput.value = JSON.stringify(output, null, 2);
    elements.rawOutput.value = state.rawText;
    elements.markdownOutput.value = state.llmOutput;

    showPhotoMetadataPanel(metadataPayload);
    displaySemanticCompression(compressed);

    await persistRecord(output);
}

async function enrichPhotoDataWithSemanticCompression(photoData) {
    const compressed = await SemanticCompressor.compress(
        photoData.raw_text || '',
        photoData.llm_output || ''
    );

    if (!compressed) {
        return photoData;
    }

    return {
        ...photoData,
        compressed_index: compressed,
        metadata_string: SemanticCompressor.formatForMetadata(compressed),
        photo_title: `${compressed.type}: ${compressed.summary}`.substring(0, 120),
        photo_keywords: compressed.keywords,
    };
}

function showPhotoMetadataPanel(payload) {
    if (!payload) {
        elements.photoMetadataPanel.style.display = 'none';
        elements.metadataForCopy.value = '';
        return;
    }

    elements.photoMetadataPanel.style.display = 'block';
    elements.metadataForCopy.value = PhotoMetadataWriter.formatForCopyPaste(payload);
}

function displaySemanticCompression(compressed) {
    if (!compressed) {
        elements.semanticPanel.style.display = 'none';
        elements.semanticJson.value = '';
        return;
    }

    elements.semanticPanel.style.display = 'block';
    elements.semanticType.textContent = compressed.type;
    elements.semanticConcepts.textContent = compressed.concepts.join(', ');
    elements.semanticKeywords.textContent = compressed.keywords.join(', ');
    elements.semanticEntities.textContent = (compressed.entities || []).join(', ') || 'None extracted';
    elements.semanticSummary.textContent = compressed.summary;

    const metadataString = SemanticCompressor.formatForMetadata(compressed);
    const metadataSize = new TextEncoder().encode(metadataString).length;
    elements.semanticSize.textContent = String(metadataSize);
    elements.semanticJson.value = JSON.stringify(compressed, null, 2);
}

async function copyPhotoMetadata() {
    await copyText(elements.metadataForCopy.value, '✓ Metadata copied! Paste into photo description');
}

async function copySemantic() {
    await copyText(elements.semanticJson.value, '✓ Semantic data copied');
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
        compressedIndex: null,
        photoMetadata: null,
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
    elements.metadataForCopy.value = '';
    elements.semanticJson.value = '';
    elements.photoMetadataPanel.style.display = 'none';
    elements.semanticPanel.style.display = 'none';
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
