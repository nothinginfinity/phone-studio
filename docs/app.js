// V1 MVP: Local LLM integration. All processing on-device, no backend yet.
// V1.5 adds hosted LLMs, voice linking, variants, and lead extraction.

const LLM_PROVIDERS = {
    groq: {
        name: 'Groq',
        category: 'Text Generation',
        apiUrl: 'https://api.groq.com/openai/v1/chat/completions',
        model: 'llama-3.1-70b-versatile',
        free: true,
        costPer1M: 0,
        speed: 'Very Fast',
        instructions: 'Get free API key at: https://console.groq.com/keys (60 requests/min)',
        signupUrl: 'https://console.groq.com/keys',
        supportsChat: true
    },
    groq_fast: {
        name: 'Groq 8B Fast',
        category: 'Text Generation',
        apiUrl: 'https://api.groq.com/openai/v1/chat/completions',
        model: 'llama-3.1-8b-instant',
        free: true,
        costPer1M: 0,
        speed: 'Very Fast',
        instructions: 'Same Groq API key. Use this for fast drafts and lower-latency tests.',
        signupUrl: 'https://console.groq.com/keys',
        supportsChat: true
    },
    openai: {
        name: 'OpenAI',
        category: 'Text + Vision',
        apiUrl: 'https://api.openai.com/v1/chat/completions',
        model: 'gpt-4o-mini',
        free: false,
        costPer1M: 150,
        speed: 'Fast',
        instructions: 'Get API key at: https://platform.openai.com/api-keys',
        signupUrl: 'https://platform.openai.com/signup',
        supportsChat: true
    },
    anthropic: {
        name: 'Claude (Anthropic)',
        category: 'Text Generation',
        apiUrl: 'https://api.anthropic.com/v1/messages',
        model: 'claude-3-5-sonnet-20241022',
        free: false,
        costPer1M: 300,
        speed: 'Medium',
        instructions: 'Get API key at: https://console.anthropic.com/api-keys',
        signupUrl: 'https://console.anthropic.com',
        supportsChat: true
    },
    anthropic_sonnet: {
        name: 'Claude 3.5 Sonnet',
        category: 'Text Generation (Premium)',
        apiUrl: 'https://api.anthropic.com/v1/messages',
        model: 'claude-3-5-sonnet-20241022',
        free: false,
        costPer1M: 300,
        speed: 'Medium',
        instructions: 'Same as Claude. Use for high-quality long-form content.',
        signupUrl: 'https://console.anthropic.com',
        supportsChat: true
    },
    deepseek: {
        name: 'DeepSeek',
        category: 'Text Generation',
        apiUrl: 'https://api.deepseek.com/chat/completions',
        model: 'deepseek-chat',
        free: false,
        costPer1M: 27,
        speed: 'Very Fast',
        instructions: 'Get API key at: https://platform.deepseek.com/api-keys',
        signupUrl: 'https://platform.deepseek.com',
        supportsChat: true
    },
    mistral: {
        name: 'Mistral AI',
        category: 'Text Generation',
        apiUrl: 'https://api.mistral.ai/v1/chat/completions',
        model: 'mistral-medium',
        free: true,
        costPer1M: 81,
        speed: 'Fast',
        instructions: 'Get free API key at: https://console.mistral.ai/api-keys',
        signupUrl: 'https://console.mistral.ai/api-keys',
        supportsChat: true
    },
    xai: {
        name: 'xAI (Grok)',
        category: 'Text Generation',
        apiUrl: 'https://api.x.ai/v1/chat/completions',
        model: 'grok-beta',
        free: false,
        costPer1M: 500,
        speed: 'Medium',
        instructions: 'Get API key at: https://console.x.ai/api-keys',
        signupUrl: 'https://console.x.ai',
        supportsChat: true
    },
    cerebras: {
        name: 'Cerebras',
        category: 'Text Generation',
        apiUrl: 'https://api.cerebras.ai/v1/chat/completions',
        model: 'llama-3.1-70b',
        free: false,
        costPer1M: 120,
        speed: 'Very Fast',
        instructions: 'Get API key at: https://cloud.cerebras.ai/api-keys',
        signupUrl: 'https://cloud.cerebras.ai',
        supportsChat: true
    },
    fireworks: {
        name: 'Fireworks AI',
        category: 'Text Generation',
        apiUrl: 'https://api.fireworks.ai/inference/v1/chat/completions',
        model: 'accounts/fireworks/models/llama-v3p1-70b-instruct',
        free: false,
        costPer1M: 90,
        speed: 'Very Fast',
        instructions: 'Get API key at: https://console.fireworks.ai/api-keys',
        signupUrl: 'https://console.fireworks.ai',
        supportsChat: true
    },
    google_gemini: {
        name: 'Google Gemini',
        category: 'Text + Vision',
        apiUrl: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
        model: 'gemini-1.5-flash',
        free: true,
        costPer1M: 75,
        speed: 'Fast',
        instructions: 'Get free API key at: https://ai.google.dev/api-keys',
        signupUrl: 'https://ai.google.dev',
        supportsChat: true
    },
    cohere: {
        name: 'Cohere',
        category: 'Text Generation',
        apiUrl: 'https://api.cohere.ai/v1/chat',
        model: 'command-r-plus',
        free: false,
        costPer1M: 300,
        speed: 'Medium',
        instructions: 'Get API key at: https://dashboard.cohere.com/api-keys',
        signupUrl: 'https://dashboard.cohere.com',
        supportsChat: true
    },
    together: {
        name: 'Together AI',
        category: 'Text Generation',
        apiUrl: 'https://api.together.xyz/v1/chat/completions',
        model: 'meta-llama/Llama-3-70b-chat-hf',
        free: false,
        costPer1M: 90,
        speed: 'Very Fast',
        instructions: 'Get API key at: https://www.together.ai/api',
        signupUrl: 'https://www.together.ai',
        supportsChat: true
    },
    perplexity: {
        name: 'Perplexity',
        category: 'Text + Search',
        apiUrl: 'https://api.perplexity.ai/chat/completions',
        model: 'llama-3.1-sonar-small-128k-online',
        free: false,
        costPer1M: 200,
        speed: 'Fast',
        instructions: 'Get API key at: https://www.perplexity.ai/api',
        signupUrl: 'https://www.perplexity.ai',
        supportsChat: true
    },
    exa: {
        name: 'EXA (Search)',
        category: 'Search + Research',
        apiUrl: 'https://api.exa.ai/search',
        model: 'search',
        free: false,
        costPer1M: null,
        speed: 'Fast',
        instructions: 'Get API key at: https://dashboard.exa.ai/api-key',
        signupUrl: 'https://exa.ai',
        supportsChat: false
    },
    runway: {
        name: 'Runway',
        category: 'Video Generation',
        apiUrl: 'https://api.runwayml.com/v1/tasks',
        model: 'gen3',
        free: false,
        costPer1M: null,
        speed: 'Slow (Video)',
        instructions: 'Get API key at: https://app.runwayml.com/settings/api-keys',
        signupUrl: 'https://runwayml.com',
        supportsChat: false
    },
    replicate: {
        name: 'Replicate',
        category: 'Multimodal',
        apiUrl: 'https://api.replicate.com/v1/predictions',
        model: 'custom',
        free: false,
        costPer1M: null,
        speed: 'Variable',
        instructions: 'Get API key at: https://replicate.com/account/api-tokens',
        signupUrl: 'https://replicate.com',
        supportsChat: false
    },
    huggingface: {
        name: 'Hugging Face',
        category: 'Multimodal',
        apiUrl: 'https://api-inference.huggingface.co/models',
        model: 'custom',
        free: false,
        costPer1M: null,
        speed: 'Variable',
        instructions: 'Get API key at: https://huggingface.co/settings/tokens',
        signupUrl: 'https://huggingface.co',
        supportsChat: false
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

const BATCH_DB_NAME = 'PhoneStudioBatch';
const BATCH_DB_VERSION = 3;

const ApiKeyManager = {
    storageKey: 'phoneStudioApiKeys',
    activeProviderKey: 'phoneStudioActiveProvider',
    legacyPrefix: 'llm_api_key_',
    legacyActiveProviderKey: 'llm_active_provider',

    migrateLegacyStorage() {
        const currentKeys = this.getAllSavedKeys();
        const migratedKeys = { ...currentKeys };

        Object.keys(LLM_PROVIDERS).forEach((providerId) => {
            const legacyValue = localStorage.getItem(`${this.legacyPrefix}${providerId}`);
            if (legacyValue && !migratedKeys[providerId]) {
                migratedKeys[providerId] = legacyValue;
            }
        });

        if (Object.keys(migratedKeys).length > 0) {
            localStorage.setItem(this.storageKey, JSON.stringify(migratedKeys));
        }

        const currentActive = localStorage.getItem(this.activeProviderKey);
        const legacyActive = localStorage.getItem(this.legacyActiveProviderKey);
        if (!currentActive && legacyActive && LLM_PROVIDERS[legacyActive]) {
            localStorage.setItem(this.activeProviderKey, legacyActive);
        }
    },

    getAllProviders() {
        return Object.keys(LLM_PROVIDERS).map((key) => ({
            id: key,
            ...LLM_PROVIDERS[key]
        }));
    },

    getProvider(providerId) {
        return LLM_PROVIDERS[providerId] || null;
    },

    getProviderInfo(providerId) {
        const provider = this.getProvider(providerId);
        if (!provider) return null;

        return {
            name: provider.name,
            category: provider.category,
            cost: Number.isFinite(provider.costPer1M) ? `$${provider.costPer1M}/1M tokens` : 'Variable pricing',
            speed: provider.speed,
            instructions: provider.instructions,
            signupUrl: provider.signupUrl,
            isFree: provider.free,
            supportsChat: provider.supportsChat !== false
        };
    },

    saveApiKey(providerId, apiKey) {
        const keys = this.getAllSavedKeys();
        keys[providerId] = apiKey;
        localStorage.setItem(this.storageKey, JSON.stringify(keys));
        localStorage.setItem(`${this.legacyPrefix}${providerId}`, apiKey);
        return true;
    },

    getApiKey(providerId) {
        const keys = this.getAllSavedKeys();
        if (keys[providerId]) {
            return keys[providerId];
        }

        return localStorage.getItem(`${this.legacyPrefix}${providerId}`) || '';
    },

    getAllSavedKeys() {
        const stored = localStorage.getItem(this.storageKey);
        if (!stored) {
            return {};
        }

        try {
            return JSON.parse(stored) || {};
        } catch (error) {
            console.warn('Failed to parse saved API keys:', error);
            return {};
        }
    },

    deleteApiKey(providerId) {
        const keys = this.getAllSavedKeys();
        delete keys[providerId];
        localStorage.setItem(this.storageKey, JSON.stringify(keys));
        localStorage.removeItem(`${this.legacyPrefix}${providerId}`);
    },

    getActive() {
        const activeId = localStorage.getItem(this.activeProviderKey) || localStorage.getItem(this.legacyActiveProviderKey) || CONFIG.defaultProvider;
        const apiKey = this.getApiKey(activeId);

        if (!apiKey) {
            const allKeys = this.getAllSavedKeys();
            const firstAvailable = Object.keys(allKeys)[0];
            if (firstAvailable) {
                return {
                    provider: firstAvailable,
                    apiKey: allKeys[firstAvailable]
                };
            }
        }

        return {
            provider: LLM_PROVIDERS[activeId] ? activeId : CONFIG.defaultProvider,
            apiKey
        };
    },

    setActive(providerId) {
        const resolved = LLM_PROVIDERS[providerId] ? providerId : CONFIG.defaultProvider;
        localStorage.setItem(this.activeProviderKey, resolved);
        localStorage.setItem(this.legacyActiveProviderKey, resolved);
    },

    save(providerId, apiKey) {
        return this.saveApiKey(providerId, apiKey);
    },

    get(providerId) {
        return this.getApiKey(providerId);
    }
};

const ProfileManager = {
    storageKey: 'phoneStudioCreatorProfile',

    defaultProfile() {
        return {
            name: '',
            brand: '',
            title: '',
            email: '',
            website: '',
            phone: '',
            instagram: '',
            linkedin: '',
            x: '',
            cta: '',
            bio: ''
        };
    },

    getProfile() {
        const stored = localStorage.getItem(this.storageKey);
        if (!stored) {
            return this.defaultProfile();
        }

        try {
            return {
                ...this.defaultProfile(),
                ...(JSON.parse(stored) || {})
            };
        } catch (error) {
            console.warn('Failed to parse creator profile:', error);
            return this.defaultProfile();
        }
    },

    saveProfile(profile) {
        localStorage.setItem(this.storageKey, JSON.stringify({
            ...this.defaultProfile(),
            ...profile
        }));
    },

    clearProfile() {
        localStorage.removeItem(this.storageKey);
    }
};

const BatchDB = {
    dbName: BATCH_DB_NAME,
    storeName: 'processed_photos',
    indexStoreName: 'search_index',
    voiceStoreName: 'voice_memos',
    draftStoreName: 'content_drafts',

    async init() {
        if (!window.idb?.openDB) {
            throw new Error('IndexedDB helper failed to load.');
        }

        return window.idb.openDB(this.dbName, BATCH_DB_VERSION, {
            upgrade(db) {
                if (!db.objectStoreNames.contains('processed_photos')) {
                    db.createObjectStore('processed_photos', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('search_index')) {
                    db.createObjectStore('search_index', { keyPath: 'keyword' });
                }
                if (!db.objectStoreNames.contains('voice_memos')) {
                    db.createObjectStore('voice_memos', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('content_drafts')) {
                    const draftStore = db.createObjectStore('content_drafts', { keyPath: 'id' });
                    draftStore.createIndex('approval_state', 'approval_state', { unique: false });
                    draftStore.createIndex('platform', 'platform', { unique: false });
                    draftStore.createIndex('updated_at', 'updated_at', { unique: false });
                }
            }
        });
    },

    async savePhoto(photoData) {
        const db = await this.init();
        await db.put(this.storeName, {
            approval_state: 'pending_review',
            ...photoData
        });
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

const ContentDraftDB = {
    storeName: BatchDB.draftStoreName,

    async init() {
        return BatchDB.init();
    },

    async saveDraft(draftData) {
        const db = await this.init();
        await db.put(this.storeName, draftData);
    },

    async getAll() {
        const db = await this.init();
        return db.getAll(this.storeName);
    },

    async getById(id) {
        const db = await this.init();
        return db.get(this.storeName, id);
    },

    async deleteDraft(id) {
        const db = await this.init();
        await db.delete(this.storeName, id);
    }
};

let batchState = {
    queue: [],
    currentIndex: 0,
    isProcessing: false,
    results: []
};

let currentSearchResults = [];
let voiceState = {
    queue: [],
    currentIndex: 0,
    isProcessing: false,
    results: []
};
let currentICloudMemos = [];
const contentWizardState = {
    currentStep: 1,
    platform: null,
    source: null,
    selectedContent: [],
    generatedContent: '',
    draftId: null,
    searchQuery: '',
    step2Mode: 'source',
    isGenerating: false,
    runId: 0
};
const reviewState = {
    selectedDraftId: null
};

const VoiceMemoProcessor = {
    async processVoiceMemo(file, transcript, options) {
        try {
            const memoData = {
                id: `memo_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
                timestamp: new Date().toISOString(),
                file_name: file.name,
                file_size: file.size,
                duration_seconds: await this.getAudioDuration(file),
                audio_data: null,
                raw_transcript: transcript || '',
                summary: '',
                key_points: [],
                compressed_index: null,
                metadata: {
                    format: file.type,
                    processed_at: new Date().toISOString()
                },
                approval_state: 'pending_review'
            };

            await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    memoData.audio_data = e.target.result;
                    resolve();
                };
                reader.readAsDataURL(file);
            });

            if (transcript && options.summarize) {
                const { summary, keyPoints } = await this.summarizeTranscript(transcript);
                memoData.summary = summary;
                memoData.key_points = options.extractKeypoints ? keyPoints : [];
            } else {
                memoData.summary = transcript.substring(0, 200);
            }

            memoData.compressed_index = await SemanticCompressor.compress(
                transcript,
                memoData.summary
            );

            return memoData;
        } catch (error) {
            console.error('Voice memo processing error:', error);
            return null;
        }
    },

    async getAudioDuration(file) {
        return new Promise((resolve) => {
            const audio = new Audio();
            const objectUrl = URL.createObjectURL(file);

            audio.addEventListener('loadedmetadata', () => {
                resolve(Math.round(audio.duration));
                URL.revokeObjectURL(objectUrl);
            });

            audio.addEventListener('error', () => {
                URL.revokeObjectURL(objectUrl);
                resolve(0);
            });

            audio.src = objectUrl;
        });
    },

    async summarizeTranscript(transcript) {
        const { provider, apiKey } = ApiKeyManager.getActive();

        if (!apiKey) {
            return {
                summary: transcript.substring(0, 200),
                keyPoints: []
            };
        }

        try {
            const prompt = `Analyze this voice memo transcript and provide:
1. A concise 1-2 sentence summary
2. 3-5 key points or action items

Transcript:
${transcript}`;

            const content = await requestLLM({
                provider,
                apiKey,
                systemPrompt: 'You are a professional note-taker. Extract key insights from voice transcripts.',
                userPrompt: prompt,
                temperature: 0.7,
                maxTokens: 500,
                timeout: CONFIG.timeout
            });

            const lines = content.split('\n');
            const summary = lines
                .filter((line) => line.trim().length > 0)
                .slice(0, 2)
                .join(' ')
                .substring(0, 200);

            const keyPoints = lines
                .filter((line) => line.includes('-') || line.includes('•') || line.includes('*'))
                .slice(0, 5)
                .map((line) => line.replace(/^[-•*\s]+/, '').trim());

            return { summary, keyPoints };
        } catch (error) {
            console.error('Summarization error:', error);
            return {
                summary: transcript.substring(0, 200),
                keyPoints: []
            };
        }
    }
};

const VoiceMemoDB = {
    storeName: BatchDB.voiceStoreName,

    async init() {
        return BatchDB.init();
    },

    async saveMemo(memoData) {
        const db = await this.init();
        await db.put(this.storeName, {
            approval_state: 'pending_review',
            ...memoData
        });
    },

    async getAll() {
        const db = await this.init();
        return db.getAll(this.storeName);
    },

    async getById(id) {
        const db = await this.init();
        return db.get(this.storeName, id);
    },

    async clear() {
        const db = await this.init();
        await db.clear(this.storeName);
    }
};

const iCloudVoiceMemoBridge = {
    basePath: 'PhoneStudio',
    audioFolder: 'audio',
    transcriptFolder: 'transcripts',
    processedFolder: 'processed',

    async checkICloud() {
        try {
            const exportFiles = await this.getExportFiles();
            if (exportFiles.length === 0) {
                return {
                    found: 0,
                    memos: [],
                    error: 'No exported files selected or found.'
                };
            }

            const audioFiles = exportFiles.filter((file) => this.isAudioFile(file.name));
            const transcriptFiles = exportFiles.filter((file) => this.isTranscriptFile(file.name));

            if (audioFiles.length === 0) {
                return {
                    found: 0,
                    memos: [],
                    error: 'No audio files found. Export memos first or choose the exported audio files.'
                };
            }

            const matched = this.matchAudioWithTranscripts(audioFiles, transcriptFiles);
            const existingMemos = await VoiceMemoDB.getAll();
            const filtered = this.filterAlreadyImported(matched, existingMemos);

            return {
                found: filtered.length,
                memos: filtered,
                error: null
            };
        } catch (error) {
            console.error('iCloud check error:', error);
            return {
                found: 0,
                memos: [],
                error: error.message
            };
        }
    },

    async getExportFiles() {
        if ('showDirectoryPicker' in window) {
            try {
                const directoryHandle = await window.showDirectoryPicker({ mode: 'read' });
                const files = await this.readFilesRecursively(directoryHandle);
                if (files.length > 0) {
                    return files;
                }
            } catch (error) {
                if (error?.name !== 'AbortError') {
                    console.warn('Directory access unavailable, falling back to file selection:', error);
                } else {
                    return [];
                }
            }
        }

        return this.getUserFileSelection();
    },

    async readFilesRecursively(directoryHandle, parentPath = '') {
        const files = [];

        for await (const entry of directoryHandle.values()) {
            const entryPath = parentPath ? `${parentPath}/${entry.name}` : entry.name;

            if (entry.kind === 'file') {
                const file = await entry.getFile();
                files.push({
                    name: entry.name,
                    path: entryPath,
                    file,
                    size: file.size,
                    modified: new Date(file.lastModified).toISOString()
                });
                continue;
            }

            if (entry.kind === 'directory') {
                const nestedFiles = await this.readFilesRecursively(entry, entryPath);
                files.push(...nestedFiles);
            }
        }

        return files;
    },

    async getUserFileSelection() {
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = true;
        input.accept = '.m4a,.mp4,.wav,.mp3,.txt,audio/*,text/plain';

        return new Promise((resolve) => {
            input.addEventListener('change', (e) => {
                const files = Array.from(e.target.files || []).map((file) => ({
                    name: file.name,
                    path: file.name,
                    file,
                    size: file.size,
                    modified: new Date(file.lastModified).toISOString()
                }));
                resolve(files);
            }, { once: true });

            input.click();
        });
    },

    matchAudioWithTranscripts(audioFiles, transcriptFiles) {
        return audioFiles.flatMap((audioFile) => {
            const baseName = audioFile.name.replace(/\.[^/.]+$/, '');
            const transcriptFile = transcriptFiles.find((item) => item.name.replace(/\.[^/.]+$/, '') === baseName);

            if (!transcriptFile) {
                return [];
            }

            return [{
                id: `icloud_${baseName}`,
                baseName,
                audioFile,
                transcriptFile,
                timestamp: audioFile.modified || new Date().toISOString(),
                readyForImport: true
            }];
        });
    },

    filterAlreadyImported(memos, existingMemos) {
        const importedPaths = new Set(
            existingMemos
                .filter((memo) => memo.imported_from_icloud && memo.icloud_path)
                .map((memo) => memo.icloud_path)
        );

        return memos.filter((memo) => !importedPaths.has(memo.baseName));
    },

    isAudioFile(filename) {
        return /\.(m4a|mp4|wav|mp3|mpeg)$/i.test(filename);
    },

    isTranscriptFile(filename) {
        return /\.txt$/i.test(filename);
    },

    async importMemo(matched, options = { summarize: true, extractKeypoints: true }) {
        try {
            const transcriptText = await this.readTextFile(matched.transcriptFile.file);
            const memoData = await VoiceMemoProcessor.processVoiceMemo(
                matched.audioFile.file,
                transcriptText,
                options
            );

            if (!memoData) {
                return { success: false, error: 'Failed to process memo.' };
            }

            memoData.imported_from_icloud = true;
            memoData.icloud_path = matched.baseName;
            memoData.transcript_source = 'ios_voice_memos';
            memoData.file_name = matched.audioFile.name;

            await VoiceMemoDB.saveMemo(memoData);
            return { success: true, memoData };
        } catch (error) {
            console.error('Import error:', error);
            return { success: false, error: error.message };
        }
    },

    async readTextFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result || '');
            reader.onerror = reject;
            reader.readAsText(file);
        });
    }
};

const SemanticSearch = {
    async search(query, filters = {}) {
        const startTime = performance.now();
        const all = await BatchDB.getAll();

        if (all.length === 0) {
            return { results: [], total: 0, count: 0, time: 0, query };
        }

        const results = this.filterAndRank(all, query, filters);
        const endTime = performance.now();

        return {
            results,
            total: all.length,
            count: results.length,
            time: (endTime - startTime).toFixed(0),
            query
        };
    },

    filterAndRank(photos, query, filters) {
        let results = [...photos];

        if (filters.type) {
            results = results.filter((photo) => photo.compressed_index?.type === filters.type);
        }

        if (filters.confidence > 0) {
            results = results.filter((photo) =>
                ((photo.compressed_index?.confidence || 0) * 100) >= filters.confidence
            );
        }

        if (query && query.trim()) {
            results = results
                .map((photo) => ({
                    ...photo,
                    relevanceScore: this.calculateRelevance(photo, query)
                }))
                .filter((photo) => photo.relevanceScore > 0);

            if (filters.sortBy === 'relevance' || !filters.sortBy || filters.sortBy === 'recent') {
                results.sort((a, b) => b.relevanceScore - a.relevanceScore);
            }
        }

        if (filters.sortBy === 'recent') {
            results.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        } else if (filters.sortBy === 'oldest') {
            results.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        } else if (filters.sortBy === 'type') {
            results.sort((a, b) => (a.compressed_index?.type || '').localeCompare(b.compressed_index?.type || ''));
        }

        return results;
    },

    calculateRelevance(photo, query) {
        const queryLower = query.toLowerCase();
        const compressed = photo.compressed_index || {};
        let score = 0;

        if (compressed.summary?.toLowerCase().includes(queryLower)) score += 50;
        if (compressed.concepts?.some((concept) => concept.toLowerCase().includes(queryLower))) score += 30;
        if (compressed.keywords?.some((keyword) => keyword.toLowerCase().includes(queryLower))) score += 20;
        if (compressed.entities?.some((entity) => entity.toLowerCase().includes(queryLower))) score += 15;
        if (photo.raw_text?.toLowerCase().includes(queryLower)) score += 10;
        if (photo.llm_output?.toLowerCase().includes(queryLower)) score += 10;

        return score;
    }
};

const UnifiedSearch = {
    async search(query, filters = {}) {
        const startTime = performance.now();
        const photoResults = filters.type === 'memo'
            ? { results: [], total: 0 }
            : await SemanticSearch.search(query, filters);

        let memoResults = [];
        if (!filters.type || filters.type === 'memo') {
            const allMemos = await VoiceMemoDB.getAll();
            memoResults = this.filterMemos(allMemos, query, filters);
        }

        const combined = [
            ...photoResults.results.map((result) => ({ ...result, source: 'photo' })),
            ...memoResults.map((result) => ({ ...result, source: 'memo' }))
        ];

        if (filters.sortBy === 'recent') {
            combined.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        } else if (filters.sortBy === 'oldest') {
            combined.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        } else if (filters.sortBy === 'type') {
            combined.sort((a, b) => (a.compressed_index?.type || a.source || '').localeCompare(b.compressed_index?.type || b.source || ''));
        } else {
            combined.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
        }

        const endTime = performance.now();
        return {
            results: combined,
            photos: photoResults.results.length,
            memos: memoResults.length,
            total: photoResults.total + memoResults.length,
            count: combined.length,
            time: (endTime - startTime).toFixed(0),
            query
        };
    },

    filterMemos(memos, query, filters = {}) {
        let results = [...memos];
        if (filters.confidence > 0) {
            results = results.filter((memo) => ((memo.compressed_index?.confidence || 0) * 100) >= filters.confidence);
        }

        if (!query.trim()) {
            return results;
        }

        const queryLower = query.toLowerCase();
        return results
            .map((memo) => ({
                ...memo,
                relevanceScore: this.calculateMemoRelevance(memo, queryLower)
            }))
            .filter((memo) => memo.relevanceScore > 0)
            .sort((a, b) => b.relevanceScore - a.relevanceScore);
    },

    calculateMemoRelevance(memo, queryLower) {
        let score = 0;
        if (memo.summary?.toLowerCase().includes(queryLower)) score += 50;
        if (memo.key_points?.some((point) => point.toLowerCase().includes(queryLower))) score += 30;
        if (memo.raw_transcript?.toLowerCase().includes(queryLower)) score += 10;
        if (memo.compressed_index?.keywords?.some((keyword) => keyword.toLowerCase().includes(queryLower))) score += 20;
        return score;
    }
};

function getProviderConfig(provider) {
    return LLM_PROVIDERS[provider] || LLM_PROVIDERS[CONFIG.defaultProvider];
}

function isIOSDevice() {
    const userAgent = navigator.userAgent || '';
    return /iPhone|iPad|iPod/.test(userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

function isStandaloneMode() {
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

function updateInstallExperience() {
    const standalone = isStandaloneMode();
    const dismissed = localStorage.getItem(INSTALL_PROMPT_DISMISSED_KEY) === 'true';
    const shouldShowInstallPrompt = isIOSDevice() && !standalone && !dismissed;

    elements.installPrompt.classList.toggle('hidden', !shouldShowInstallPrompt);
    elements.installStateBadge.textContent = standalone ? 'Installed' : 'Safari Mode';
    elements.installStateBadge.classList.toggle('app-badge-secondary', !standalone);
}

async function updateHomeDashboard() {
    const active = ApiKeyManager.getActive();
    const provider = getProviderConfig(active.provider);
    elements.dashboardActiveProvider.textContent = provider.name;

    try {
        const [photos, memos, drafts] = await Promise.all([
            BatchDB.getAll().catch(() => []),
            VoiceMemoDB.getAll().catch(() => []),
            ContentDraftDB.getAll().catch(() => [])
        ]);

        elements.dashboardPhotoCount.textContent = String(photos.length);
        elements.dashboardMemoCount.textContent = String(memos.length);
        if (elements.dashboardDraftCount) {
            elements.dashboardDraftCount.textContent = String(
                drafts.filter((draft) => draft.approval_state === 'pending_review' || draft.approval_state === 'approved').length
            );
        }
    } catch (error) {
        console.error('Dashboard update failed:', error);
    }
}

function scrollToPanel(panel) {
    if (!panel) return;
    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    highlightPanel(panel);
}

function highlightPanel(panel) {
    if (!panel) return;
    panel.classList.add('panel-highlight');
    window.setTimeout(() => panel.classList.remove('panel-highlight'), 1500);
}

async function openQuickRecorder() {
    scrollToPanel(elements.voiceRecorderPanel);

    if (mediaRecorder?.state === 'recording') {
        stopVoiceRecording();
        return;
    }

    await startVoiceRecording();
}

function openQuickSearch() {
    switchBatchTab('search');
    scrollToPanel(elements.batchProcessorPanel);
    window.setTimeout(() => {
        elements.searchInput.focus({ preventScroll: true });
    }, 300);
}

function openQuickLibrary() {
    switchBatchTab('library');
    scrollToPanel(elements.batchProcessorPanel);
}

function openQuickVoiceHub() {
    switchBatchTab('voiceMemos');
    scrollToPanel(elements.batchProcessorPanel);
}

function openQuickReviewQueue() {
    switchBatchTab('review');
    scrollToPanel(elements.batchProcessorPanel);
}

function resetContentWizardState() {
    contentWizardState.currentStep = 1;
    contentWizardState.platform = null;
    contentWizardState.source = null;
    contentWizardState.selectedContent = [];
    contentWizardState.generatedContent = '';
    contentWizardState.draftId = null;
    contentWizardState.searchQuery = '';
    contentWizardState.step2Mode = 'source';
    contentWizardState.isGenerating = false;
    contentWizardState.runId += 1;
}

function openContentWizard() {
    resetContentWizardState();
    elements.platformGrid.querySelectorAll('.platform-card').forEach((card) => card.classList.remove('selected'));
    elements.contentCreationWizard.classList.remove('hidden');
    elements.contentCreationWizard.setAttribute('aria-hidden', 'false');
    showWizardStep(1);
}

function closeWizard() {
    elements.contentCreationWizard.classList.add('hidden');
    elements.contentCreationWizard.setAttribute('aria-hidden', 'true');
    resetContentWizardState();
    clearWizardSelections();
    elements.platformGrid.querySelectorAll('.platform-card').forEach((card) => card.classList.remove('selected'));
    elements.generatedContentPreview.textContent = '';
    elements.editableContent.value = '';
    elements.generationProgress.style.width = '0%';
    elements.generationStatus.textContent = 'Analyzing content...';
    elements.contentSearchInput.value = '';
    elements.searchResultsForContent.classList.add('hidden');
}

function showWizardStep(step) {
    contentWizardState.currentStep = step;
    [
        elements.step1Platform,
        elements.step2Source,
        elements.step2BSearch,
        elements.step2CManual,
        elements.step3Generate,
        elements.step4Review
    ].forEach((element) => element.classList.add('hidden'));

    if (step === 1) {
        elements.step1Platform.classList.remove('hidden');
    } else if (step === 2) {
        if (contentWizardState.step2Mode === 'search') {
            elements.step2BSearch.classList.remove('hidden');
        } else if (contentWizardState.step2Mode === 'manual') {
            elements.step2CManual.classList.remove('hidden');
        } else {
            elements.step2Source.classList.remove('hidden');
        }
    } else if (step === 3) {
        elements.step3Generate.classList.remove('hidden');
        if (!contentWizardState.isGenerating && !contentWizardState.generatedContent) {
            generateContent();
        }
    } else if (step === 4) {
        elements.step4Review.classList.remove('hidden');
    }

    elements.wizardStep.textContent = `Step ${step} of 4`;
    updateWizardButtons();
}

function updateWizardButtons() {
    const isRootSourceStep = contentWizardState.currentStep === 2 && contentWizardState.step2Mode === 'source';
    elements.prevBtn.style.display = contentWizardState.currentStep === 1 ? 'none' : 'block';
    elements.nextBtn.style.display = contentWizardState.currentStep === 3 || isRootSourceStep ? 'none' : 'block';

    if (contentWizardState.currentStep === 1) {
        elements.nextBtn.textContent = 'Next →';
        elements.nextBtn.disabled = !contentWizardState.platform;
        return;
    }

    if (contentWizardState.currentStep === 2) {
        elements.nextBtn.textContent = 'Generate →';
        const requiresMultiple = contentWizardState.source === 'combine';
        const selectedCount = contentWizardState.selectedContent.length;
        elements.nextBtn.disabled = requiresMultiple ? selectedCount < 2 : selectedCount < 1;
        return;
    }

    if (contentWizardState.currentStep === 4) {
        elements.nextBtn.textContent = '✓ Done';
        elements.nextBtn.disabled = !elements.editableContent.value.trim();
        return;
    }

    elements.nextBtn.textContent = 'Next →';
    elements.nextBtn.disabled = false;
}

function selectPlatform(platform) {
    contentWizardState.platform = platform;
    elements.platformGrid.querySelectorAll('.platform-card').forEach((card) => {
        card.classList.toggle('selected', card.dataset.platform === platform);
    });
    showWizardStep(2);
}

function clearWizardSelections() {
    contentWizardState.selectedContent = [];
    if (elements.selectionCount) {
        elements.selectionCount.innerHTML = '<strong>0</strong> items selected';
    }
    if (elements.contentSelectionGrid) {
        elements.contentSelectionGrid.querySelectorAll('.content-item').forEach((item) => {
            item.classList.remove('selected');
        });
    }
    if (elements.contentSearchItems) {
        elements.contentSearchItems.querySelectorAll('.content-item-small').forEach((item) => {
            item.classList.remove('selected');
        });
    }
}

function getWizardItemType(item) {
    return item.raw_transcript || item.source === 'memo' ? 'memo' : 'photo';
}

function getWizardItemId(item) {
    return `${getWizardItemType(item)}:${item.id}`;
}

function toggleWizardItemSelection(item) {
    const itemId = getWizardItemId(item);
    const exists = contentWizardState.selectedContent.some((selected) => getWizardItemId(selected) === itemId);

    if (exists) {
        contentWizardState.selectedContent = contentWizardState.selectedContent.filter((selected) => getWizardItemId(selected) !== itemId);
    } else {
        contentWizardState.selectedContent.push(item);
    }

    const selectedCount = contentWizardState.selectedContent.length;
    elements.selectionCount.innerHTML = `<strong>${selectedCount}</strong> items selected`;
    updateWizardButtons();
}

async function getWizardLibraryItems() {
    const [photos, memos] = await Promise.all([BatchDB.getAll(), VoiceMemoDB.getAll()]);
    return [
        ...photos.map((item) => ({ ...item, source: 'photo' })),
        ...memos.map((item) => ({ ...item, source: 'memo' }))
    ];
}

async function selectRandomContent() {
    const libraryItems = await getWizardLibraryItems();
    if (libraryItems.length === 0) {
        showStatus(elements.llmStatus, '✗ No indexed content yet. Upload images or record memos first.', 'error');
        return;
    }

    const shuffled = [...libraryItems].sort(() => Math.random() - 0.5);
    const count = Math.min(shuffled.length, Math.max(2, Math.floor(Math.random() * 3) + 2));
    contentWizardState.selectedContent = shuffled.slice(0, count);
    moveToContentGeneration();
}

function showSearchForContent() {
    contentWizardState.step2Mode = 'search';
    clearWizardSelections();
    elements.contentSearchInput.value = '';
    elements.contentSearchItems.innerHTML = '';
    elements.searchResultsForContent.classList.add('hidden');
    showWizardStep(2);
    window.setTimeout(() => elements.contentSearchInput.focus({ preventScroll: true }), 100);
}

async function showManualSelection(mode = 'manual') {
    contentWizardState.step2Mode = 'manual';
    contentWizardState.source = mode;
    clearWizardSelections();

    const libraryItems = await getWizardLibraryItems();
    elements.contentSelectionGrid.innerHTML = '';

    if (libraryItems.length === 0) {
        elements.contentSelectionGrid.innerHTML = '<p class="help-text">No indexed content yet. Add screenshots or voice memos first.</p>';
        showWizardStep(2);
        return;
    }

    libraryItems.forEach((item, index) => {
        elements.contentSelectionGrid.appendChild(createSelectableContent(item, index));
    });

    showWizardStep(2);
}

function createSelectableContent(item, index) {
    const type = getWizardItemType(item);
    const element = document.createElement('button');
    element.type = 'button';
    element.className = 'content-item';
    element.dataset.index = String(index);
    element.dataset.itemId = getWizardItemId(item);

    const thumbnail = document.createElement('div');
    thumbnail.className = 'content-item-thumbnail';
    thumbnail.textContent = type === 'photo' ? '📷' : '🎙️';

    const name = document.createElement('div');
    name.className = 'content-item-name';
    name.textContent = item.file_name || `${type === 'photo' ? 'Photo' : 'Memo'} ${index + 1}`;

    element.appendChild(thumbnail);
    element.appendChild(name);
    element.addEventListener('click', () => {
        element.classList.toggle('selected');
        toggleWizardItemSelection(item);
    });

    return element;
}

async function performContentSearch() {
    const query = elements.contentSearchInput.value.trim();
    contentWizardState.searchQuery = query;

    if (query.length < 2) {
        elements.searchResultsForContent.classList.add('hidden');
        elements.contentSearchItems.innerHTML = '';
        clearWizardSelections();
        return;
    }

    const results = await UnifiedSearch.search(query, { sortBy: 'relevance', confidence: 0 });
    displaySearchResultsForContent(results.results.slice(0, 12));
}

function displaySearchResultsForContent(results) {
    clearWizardSelections();
    elements.searchResultsForContent.classList.remove('hidden');
    elements.contentSearchCount.textContent = String(results.length);
    elements.contentSearchItems.innerHTML = '';

    if (results.length === 0) {
        elements.contentSearchItems.innerHTML = '<p class="help-text">No results found. Try a different topic.</p>';
        return;
    }

    results.forEach((item) => {
        const type = getWizardItemType(item);
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'content-item-small';
        button.dataset.itemId = getWizardItemId(item);
        const summary = type === 'photo'
            ? item.compressed_index?.summary || (item.raw_text || '').slice(0, 80)
            : item.summary || (item.raw_transcript || '').slice(0, 80);
        button.innerHTML = `
            <strong>${type === 'photo' ? '📷' : '🎙️'} ${escapeHtml(item.file_name || 'Item')}</strong>
            <div class="help-text">${escapeHtml(summary || 'No summary available.')}</div>
        `;
        button.addEventListener('click', () => {
            button.classList.toggle('selected');
            toggleWizardItemSelection(item);
        });
        elements.contentSearchItems.appendChild(button);
    });
}

function moveToContentGeneration() {
    contentWizardState.generatedContent = '';
    contentWizardState.currentStep = 3;
    showWizardStep(3);
}

function getPlatformLabel(platform) {
    const labels = {
        instagram: 'Instagram',
        tiktok: 'TikTok',
        linkedin: 'LinkedIn',
        blog: 'Blog Post',
        email: 'Email',
        twitter: 'Twitter'
    };
    return labels[platform] || platform;
}

function summariseWizardSource(item) {
    if (getWizardItemType(item) === 'memo') {
        return [
            `Voice Memo: ${item.file_name || item.id}`,
            `Summary: ${item.summary || 'No summary available.'}`,
            `Key Points: ${(item.key_points || []).join(', ') || 'None'}`,
            `Transcript Excerpt: ${(item.raw_transcript || '').slice(0, 500)}`
        ].join('\n');
    }

    return [
        `Photo: ${item.file_name || item.id}`,
        `Summary: ${item.compressed_index?.summary || 'No summary available.'}`,
        `Concepts: ${(item.compressed_index?.concepts || []).join(', ') || 'None'}`,
        `Keywords: ${(item.compressed_index?.keywords || []).join(', ') || 'None'}`,
        `OCR Excerpt: ${(item.raw_text || '').slice(0, 500)}`
    ].join('\n');
}

function buildContentPrompt(selectedContent, platform) {
    const contentSummary = selectedContent
        .map((item, index) => `Source ${index + 1}\n${summariseWizardSource(item)}`)
        .join('\n\n');
    const profileContext = buildCreatorProfileContext();

    const platformPrompts = {
        instagram: `Create an engaging Instagram caption based on this source material.\n\n${contentSummary}\n\nRequirements:\n- Strong hook in the opening line\n- Use relevant emojis sparingly\n- Include 3-5 hashtags\n- Keep it under 200 words\n- End with a call to action\n- Return clean plain text only, not markdown`,
        tiktok: `Create a TikTok script and hook based on this source material.\n\n${contentSummary}\n\nRequirements:\n- First 3 seconds must grab attention\n- 30-60 second script structure\n- Include 3 concrete points\n- End with a clear CTA\n- Return clean plain text only, not markdown`,
        linkedin: `Create a professional LinkedIn post based on this source material.\n\n${contentSummary}\n\nRequirements:\n- Start with a compelling insight\n- 200-300 words\n- Professional but conversational tone\n- Include 1-2 concrete takeaways\n- End with an engagement question\n- Use the creator profile when appropriate\n- Return clean plain text only, not markdown`,
        blog: `Create a blog post outline based on this source material.\n\n${contentSummary}\n\nRequirements:\n- SEO-friendly title\n- 5-section outline with subheadings\n- Include examples or proof points\n- End with a call to action\n- Use the creator profile when appropriate\n- Return clean plain text only, not markdown`,
        email: `Create an email newsletter draft based on this source material.\n\n${contentSummary}\n\nRequirements:\n- Subject line under 50 characters\n- Preview text\n- Clear structure with 3-4 key insights\n- Include a strong CTA\n- Use the creator profile for signature or sender details where appropriate\n- Return clean plain text only, not markdown`,
        twitter: `Create a Twitter/X thread based on this source material.\n\n${contentSummary}\n\nRequirements:\n- 5-7 connected tweets\n- Use 1/, 2/, etc.\n- Keep each post under 280 characters\n- End with engagement or CTA\n- Return clean plain text only, not markdown`
    };

    return [platformPrompts[platform] || platformPrompts.instagram, profileContext]
        .filter(Boolean)
        .join('\n\n');
}

function buildDraftTitle(platform, content) {
    const firstLine = (content || '')
        .split('\n')
        .map((line) => line.trim())
        .find(Boolean);
    const label = getPlatformLabel(platform || 'content');
    return firstLine
        ? `${label}: ${firstLine}`.substring(0, 96)
        : `${label} Draft ${new Date().toLocaleDateString()}`;
}

function buildDraftSources(items) {
    return items.map((item) => {
        const type = getWizardItemType(item);
        const summary = type === 'memo'
            ? item.summary || (item.raw_transcript || '').slice(0, 180)
            : item.compressed_index?.summary || (item.raw_text || '').slice(0, 180);

        return {
            id: item.id,
            type,
            file_name: item.file_name || `${type === 'memo' ? 'Memo' : 'Photo'} ${item.id}`,
            summary: summary || 'No summary available.'
        };
    });
}

function getCreatorProfile() {
    return ProfileManager.getProfile();
}

function hasCreatorProfile(profile = getCreatorProfile()) {
    return Object.values(profile).some((value) => String(value || '').trim().length > 0);
}

function buildCreatorProfileContext(profile = getCreatorProfile()) {
    if (!hasCreatorProfile(profile)) {
        return '';
    }

    const lines = [];
    if (profile.name) lines.push(`Name: ${profile.name}`);
    if (profile.brand) lines.push(`Brand: ${profile.brand}`);
    if (profile.title) lines.push(`Role: ${profile.title}`);
    if (profile.email) lines.push(`Email: ${profile.email}`);
    if (profile.website) lines.push(`Website: ${profile.website}`);
    if (profile.phone) lines.push(`Phone: ${profile.phone}`);
    if (profile.instagram) lines.push(`Instagram: ${profile.instagram}`);
    if (profile.linkedin) lines.push(`LinkedIn: ${profile.linkedin}`);
    if (profile.x) lines.push(`X/Twitter: ${profile.x}`);
    if (profile.cta) lines.push(`Preferred CTA: ${profile.cta}`);
    if (profile.bio) lines.push(`Bio: ${profile.bio}`);

    return `Creator profile to use when appropriate:\n${lines.join('\n')}`;
}

function extractLabeledSection(content, labels) {
    const normalized = content.replace(/\r\n/g, '\n');
    for (const label of labels) {
        const pattern = new RegExp(`(?:^|\\n)${label}\\s*:?\\s*(.+)`, 'i');
        const match = normalized.match(pattern);
        if (match?.[1]) {
            return match[1].trim();
        }
    }
    return '';
}

function appendSignatureIfMissing(content, profile, platform) {
    if (!hasCreatorProfile(profile)) {
        return content.trim();
    }

    const normalized = content.trim();
    if (platform !== 'email' && platform !== 'blog' && platform !== 'linkedin') {
        return normalized;
    }

    const signatureBits = [
        profile.name,
        profile.title,
        profile.brand
    ].filter(Boolean);

    const contactBits = [
        profile.email,
        profile.phone,
        profile.website
    ].filter(Boolean);

    const socialBits = [
        profile.instagram,
        profile.linkedin,
        profile.x
    ].filter(Boolean);

    if (signatureBits.length === 0 && contactBits.length === 0 && socialBits.length === 0 && !profile.bio) {
        return normalized;
    }

    const signatureLines = [
        signatureBits.join(' • '),
        profile.bio,
        contactBits.join(' • '),
        socialBits.join(' • ')
    ].filter(Boolean);

    if (signatureLines.some((line) => normalized.toLowerCase().includes(line.toLowerCase()))) {
        return normalized;
    }

    const closing = platform === 'email' ? 'Best,' : 'Written by';
    return `${normalized}\n\n${closing}\n${signatureLines.join('\n')}`;
}

function cleanupDraftFormatting(content, platform, profile = getCreatorProfile()) {
    if (!content) {
        return '';
    }

    let cleaned = content
        .replace(/\r\n/g, '\n')
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/^#{1,6}\s*/gm, '')
        .replace(/[ \t]+\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();

    cleaned = cleaned
        .replace(/^subject\s*:\s*/im, 'Subject: ')
        .replace(/^preview text\s*:\s*/im, 'Preview Text: ')
        .replace(/^preheader\s*:\s*/im, 'Preview Text: ');

    cleaned = cleaned
        .replace(/\[your name\]|\{\{name\}\}/gi, profile.name || '')
        .replace(/\[your company\]|\{\{brand\}\}/gi, profile.brand || '')
        .replace(/\[your email\]|\{\{email\}\}/gi, profile.email || '')
        .replace(/\[your website\]|\{\{website\}\}/gi, profile.website || '')
        .replace(/\[your instagram\]|\{\{instagram\}\}/gi, profile.instagram || '')
        .replace(/\[your linkedin\]|\{\{linkedin\}\}/gi, profile.linkedin || '')
        .replace(/\[your x\]|\{\{x\}\}/gi, profile.x || '')
        .replace(/\[your cta\]|\{\{cta\}\}/gi, profile.cta || '');

    if (platform === 'email') {
        const subject = extractLabeledSection(cleaned, ['subject']);
        const preview = extractLabeledSection(cleaned, ['preview text', 'preheader']);
        const body = cleaned
            .replace(/(?:^|\n)subject\s*:.*$/gim, '')
            .replace(/(?:^|\n)(preview text|preheader)\s*:.*$/gim, '')
            .trim();

        const emailSections = [];
        if (subject) emailSections.push(`Subject: ${subject}`);
        if (preview) emailSections.push(`Preview Text: ${preview}`);
        emailSections.push(appendSignatureIfMissing(body, profile, platform));
        cleaned = emailSections.filter(Boolean).join('\n\n');
    } else {
        cleaned = appendSignatureIfMissing(cleaned, profile, platform);
    }

    return cleaned.replace(/\n{3,}/g, '\n\n').trim();
}

async function saveGeneratedDraft(approvalState = 'pending_review') {
    const content = elements.editableContent.value.trim();
    if (!content) {
        showStatus(elements.llmStatus, '✗ Draft is empty. Generate or edit content first.', 'error');
        return null;
    }

    const now = new Date().toISOString();
    const existing = contentWizardState.draftId
        ? await ContentDraftDB.getById(contentWizardState.draftId)
        : null;
    const draftId = existing?.id || `draft_${Date.now()}`;
    const approval = approvalState || existing?.approval_state || 'pending_review';
    const draftRecord = {
        id: draftId,
        created_at: existing?.created_at || now,
        updated_at: now,
        timestamp: existing?.timestamp || now,
        platform: contentWizardState.platform || existing?.platform || 'content',
        title: buildDraftTitle(contentWizardState.platform || existing?.platform, content),
        content,
        preview: content.slice(0, 220),
        source_count: contentWizardState.selectedContent.length || existing?.source_count || 0,
        sources: contentWizardState.selectedContent.length > 0
            ? buildDraftSources(contentWizardState.selectedContent)
            : (existing?.sources || []),
        provider: ApiKeyManager.getActive().provider,
        approval_state: approval,
        export_state: approval === 'exported' ? 'exported' : (existing?.export_state || 'not_exported'),
        exported_at: existing?.exported_at || null
    };

    await ContentDraftDB.saveDraft(draftRecord);
    contentWizardState.draftId = draftId;
    await updateReviewQueueDisplay();
    await updateHomeDashboard();
    return draftRecord;
}

async function generateContent() {
    const runId = contentWizardState.runId;
    const { provider, apiKey } = ApiKeyManager.getActive();
    const providerConfig = getProviderConfig(provider);

    if (!providerSupportsChat(provider)) {
        elements.generationStatus.textContent = `${providerConfig.name} is not available for content generation yet. Switch to a text provider in Settings.`;
        return;
    }

    if (!apiKey) {
        elements.generationStatus.textContent = 'No API key set for the active provider. Add one in Settings first.';
        return;
    }

    contentWizardState.isGenerating = true;
    elements.generatedPlatform.textContent = getPlatformLabel(contentWizardState.platform);
    updateGenerationProgress(12, 'Preparing source material...');

    try {
        const prompt = buildContentPrompt(contentWizardState.selectedContent, contentWizardState.platform);
        updateGenerationProgress(36, `Sending to ${providerConfig.name}...`);

        const response = await requestLLM({
            provider,
            apiKey,
            systemPrompt: 'You are an expert content creator. Produce polished, platform-optimized content from source notes and screenshots.',
            userPrompt: prompt,
            temperature: 0.75,
            maxTokens: 1200,
            timeout: CONFIG.timeout
        });

        updateGenerationProgress(82, 'Formatting draft...');
        if (runId !== contentWizardState.runId) {
            return;
        }
        contentWizardState.generatedContent = response || '';
        elements.generatedContentPreview.textContent = contentWizardState.generatedContent;
        elements.editableContent.value = contentWizardState.generatedContent;
        updateGenerationProgress(100, 'Draft ready.');
        contentWizardState.isGenerating = false;
        showWizardStep(4);
    } catch (error) {
        if (runId !== contentWizardState.runId) {
            return;
        }
        console.error('Generation error:', error);
        elements.generationStatus.textContent = `Error: ${error.message}`;
        contentWizardState.isGenerating = false;
    }
}

function updateGenerationProgress(percent, message) {
    elements.generationProgress.style.width = `${percent}%`;
    elements.generationStatus.textContent = message;
}

async function copyGeneratedContent() {
    const content = elements.editableContent.value.trim();
    if (!content) return;
    await copyText(content, '✓ Content copied to clipboard');
}

function downloadGeneratedContent() {
    const content = elements.editableContent.value.trim();
    if (!content) return;

    const platform = contentWizardState.platform || 'content';
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `phone-studio-${platform}-${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showStatus(elements.llmStatus, '✓ Draft downloaded', 'success');
}

async function handleSaveDraft() {
    const draft = await saveGeneratedDraft('pending_review');
    if (!draft) return;
    showStatus(elements.llmStatus, '✓ Draft saved to review queue', 'success');
}

async function handleApproveDraft() {
    const draft = await saveGeneratedDraft('approved');
    if (!draft) return;
    showStatus(elements.llmStatus, '✓ Draft saved as approved', 'success');
}

async function polishDraftContent(content, platform) {
    const cleaned = cleanupDraftFormatting(content, platform);
    const { provider, apiKey } = ApiKeyManager.getActive();

    if (!apiKey || !providerSupportsChat(provider)) {
        return cleaned;
    }

    try {
        const profileContext = buildCreatorProfileContext();
        const polished = await requestLLM({
            provider,
            apiKey,
            systemPrompt: 'You are an expert editor. Clean up formatting, preserve meaning, remove markdown artifacts, and return polished plain text only.',
            userPrompt: [
                `Polish this ${getPlatformLabel(platform || 'content')} draft.`,
                'Requirements:',
                '- Remove markdown artifacts like **, headings, and awkward labels unless they are useful',
                '- Preserve all important meaning',
                '- Keep the tone polished and ready to send or post',
                '- Use the creator profile where appropriate, but do not invent missing facts',
                '- Return plain text only',
                profileContext,
                'Draft:',
                cleaned
            ].filter(Boolean).join('\n\n'),
            temperature: 0.35,
            maxTokens: 1400,
            timeout: CONFIG.timeout
        });

        return cleanupDraftFormatting(polished || cleaned, platform);
    } catch (error) {
        console.error('Draft polish failed:', error);
        return cleaned;
    }
}

async function handlePolishGeneratedDraft() {
    const content = elements.editableContent.value.trim();
    if (!content) {
        showStatus(elements.llmStatus, '✗ No draft to polish yet', 'error');
        return;
    }

    elements.polishDraftBtn.disabled = true;
    showStatus(elements.llmStatus, '✨ Polishing draft...', 'loading');
    try {
        const polished = await polishDraftContent(content, contentWizardState.platform);
        elements.editableContent.value = polished;
        elements.generatedContentPreview.textContent = polished;
        contentWizardState.generatedContent = polished;
        showStatus(elements.llmStatus, '✓ Draft polished', 'success');
    } finally {
        elements.polishDraftBtn.disabled = false;
    }
}

async function handlePolishReviewDraft() {
    const content = elements.reviewDraftEditor.value.trim();
    if (!content || !reviewState.selectedDraftId) {
        showStatus(elements.batchStatus, '✗ No saved draft selected', 'error');
        return;
    }

    const draft = await ContentDraftDB.getById(reviewState.selectedDraftId);
    if (!draft) {
        clearReviewEditor();
        return;
    }

    elements.polishReviewDraftBtn.disabled = true;
    showStatus(elements.batchStatus, '✨ Polishing draft...', 'loading');
    try {
        const polished = await polishDraftContent(content, draft.platform);
        elements.reviewDraftEditor.value = polished;
        showStatus(elements.batchStatus, '✓ Draft polished', 'success');
    } finally {
        elements.polishReviewDraftBtn.disabled = false;
    }
}

function nextStep() {
    if (contentWizardState.currentStep === 1) {
        if (!contentWizardState.platform) {
            showStatus(elements.llmStatus, '✗ Choose a platform first', 'error');
            return;
        }
        showWizardStep(2);
        return;
    }

    if (contentWizardState.currentStep === 2) {
        const required = contentWizardState.source === 'combine' ? 2 : 1;
        if (contentWizardState.selectedContent.length < required) {
            showStatus(elements.llmStatus, `✗ Select at least ${required} item(s)`, 'error');
            return;
        }
        moveToContentGeneration();
        return;
    }

    if (contentWizardState.currentStep === 4) {
        copyGeneratedContent().finally(closeWizard);
    }
}

function previousStep() {
    if (contentWizardState.currentStep === 4 || contentWizardState.currentStep === 3) {
        contentWizardState.step2Mode = 'source';
        showWizardStep(2);
        return;
    }

    if (contentWizardState.currentStep === 2 && contentWizardState.step2Mode !== 'source') {
        contentWizardState.step2Mode = 'source';
        clearWizardSelections();
        showWizardStep(2);
        return;
    }

    if (contentWizardState.currentStep > 1) {
        showWizardStep(contentWizardState.currentStep - 1);
    }
}

function selectSource(source) {
    contentWizardState.source = source;

    if (source === 'random') {
        selectRandomContent();
        return;
    }

    if (source === 'search') {
        showSearchForContent();
        return;
    }

    if (source === 'manual') {
        showManualSelection('manual');
        return;
    }

    if (source === 'combine') {
        showManualSelection('combine');
        return;
    }

    if (source === 'upload') {
        closeWizard();
        scrollToPanel(elements.screenshotPanel);
        elements.uploadBtn.click();
        showStatus(elements.llmStatus, '✓ Add a screenshot, then return to Create Content when it is indexed.', 'success');
        return;
    }

    if (source === 'record') {
        closeWizard();
        openQuickVoiceHub();
        openQuickRecorder();
        return;
    }
}

function providerSupportsChat(provider) {
    return getProviderConfig(provider).supportsChat !== false;
}

function formatProviderCost(costPer1M) {
    return Number.isFinite(costPer1M) ? `$${costPer1M}/1M tokens` : 'Variable pricing';
}

function toggleSaveApiKeyButton() {
    if (!elements.saveApiKeyBtn) return;
    const hasProvider = Boolean(elements.providerSelect?.value);
    const hasKey = Boolean(elements.apiKeyInput?.value.trim());
    elements.saveApiKeyBtn.disabled = !(hasProvider && hasKey);
}

function populateProfileForm(profile = getCreatorProfile()) {
    elements.profileNameInput.value = profile.name || '';
    elements.profileBrandInput.value = profile.brand || '';
    elements.profileTitleInput.value = profile.title || '';
    elements.profileEmailInput.value = profile.email || '';
    elements.profileWebsiteInput.value = profile.website || '';
    elements.profilePhoneInput.value = profile.phone || '';
    elements.profileInstagramInput.value = profile.instagram || '';
    elements.profileLinkedinInput.value = profile.linkedin || '';
    elements.profileXInput.value = profile.x || '';
    elements.profileCtaInput.value = profile.cta || '';
    elements.profileBioInput.value = profile.bio || '';
}

function readProfileForm() {
    return {
        name: elements.profileNameInput.value.trim(),
        brand: elements.profileBrandInput.value.trim(),
        title: elements.profileTitleInput.value.trim(),
        email: elements.profileEmailInput.value.trim(),
        website: elements.profileWebsiteInput.value.trim(),
        phone: elements.profilePhoneInput.value.trim(),
        instagram: elements.profileInstagramInput.value.trim(),
        linkedin: elements.profileLinkedinInput.value.trim(),
        x: elements.profileXInput.value.trim(),
        cta: elements.profileCtaInput.value.trim(),
        bio: elements.profileBioInput.value.trim()
    };
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
const INSTALL_PROMPT_DISMISSED_KEY = 'phoneStudioInstallPromptDismissed';

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
    installStateBadge: document.getElementById('installStateBadge'),
    installPrompt: document.getElementById('installPrompt'),
    dismissInstallPromptBtn: document.getElementById('dismissInstallPromptBtn'),
    dashboardActiveProvider: document.getElementById('dashboardActiveProvider'),
    dashboardPhotoCount: document.getElementById('dashboardPhotoCount'),
    dashboardMemoCount: document.getElementById('dashboardMemoCount'),
    dashboardDraftCount: document.getElementById('dashboardDraftCount'),
    quickRecordBtn: document.getElementById('quickRecordBtn'),
    quickScreenshotBtn: document.getElementById('quickScreenshotBtn'),
    quickSearchBtn: document.getElementById('quickSearchBtn'),
    quickVoiceHubBtn: document.getElementById('quickVoiceHubBtn'),
    quickReviewBtn: document.getElementById('quickReviewBtn'),
    createContentBtn: document.getElementById('createContentBtn'),
    contentCreationWizard: document.getElementById('contentCreationWizard'),
    wizardStep: document.getElementById('wizardStep'),
    step1Platform: document.getElementById('step1Platform'),
    step2Source: document.getElementById('step2Source'),
    step2BSearch: document.getElementById('step2BSearch'),
    step2CManual: document.getElementById('step2CManual'),
    step3Generate: document.getElementById('step3Generate'),
    step4Review: document.getElementById('step4Review'),
    platformGrid: document.getElementById('platformGrid'),
    randomSourceBtn: document.getElementById('randomSourceBtn'),
    searchSourceBtn: document.getElementById('searchSourceBtn'),
    manualSourceBtn: document.getElementById('manualSourceBtn'),
    uploadMoreBtn: document.getElementById('uploadMoreBtn'),
    recordMoreBtn: document.getElementById('recordMoreBtn'),
    combineSourceBtn: document.getElementById('combineSourceBtn'),
    contentSearchInput: document.getElementById('contentSearchInput'),
    searchResultsForContent: document.getElementById('searchResultsForContent'),
    contentSearchCount: document.getElementById('contentSearchCount'),
    contentSearchItems: document.getElementById('contentSearchItems'),
    contentSelectionGrid: document.getElementById('contentSelectionGrid'),
    selectionCount: document.getElementById('selectionCount'),
    generatedPlatform: document.getElementById('generatedPlatform'),
    generationProgress: document.getElementById('generationProgress'),
    generationStatus: document.getElementById('generationStatus'),
    generatedContentPreview: document.getElementById('generatedContentPreview'),
    editableContent: document.getElementById('editableContent'),
    polishDraftBtn: document.getElementById('polishDraftBtn'),
    saveDraftBtn: document.getElementById('saveDraftBtn'),
    approveDraftBtn: document.getElementById('approveDraftBtn'),
    copyGeneratedContentBtn: document.getElementById('copyGeneratedContentBtn'),
    downloadGeneratedContentBtn: document.getElementById('downloadGeneratedContentBtn'),
    prevBtn: document.getElementById('prevBtn'),
    nextBtn: document.getElementById('nextBtn'),
    closeWizardBtn: document.getElementById('closeWizardBtn'),
    dockHomeBtn: document.getElementById('dockHomeBtn'),
    dockRecordBtn: document.getElementById('dockRecordBtn'),
    dockSearchBtn: document.getElementById('dockSearchBtn'),
    dockLibraryBtn: document.getElementById('dockLibraryBtn'),
    appHomePanel: document.getElementById('appHomePanel'),
    screenshotPanel: document.getElementById('screenshotPanel'),
    voiceRecorderPanel: document.getElementById('voiceRecorderPanel'),
    batchProcessorPanel: document.getElementById('batchProcessorPanel'),
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
    currentProviderName: document.getElementById('currentProviderName'),
    currentProviderCost: document.getElementById('currentProviderCost'),
    currentProviderSpeed: document.getElementById('currentProviderSpeed'),
    providerSelect: document.getElementById('providerSelect'),
    providerInfoCard: document.getElementById('providerInfoCard'),
    providerCategory: document.getElementById('providerCategory'),
    providerCost: document.getElementById('providerCost'),
    providerSpeed: document.getElementById('providerSpeed'),
    saveApiKeyBtn: document.getElementById('saveApiKeyBtn'),
    getApiKeyBtn: document.getElementById('getApiKeyBtn'),
    apiKeyInput: document.getElementById('apiKeyInput'),
    providerInstructions: document.getElementById('providerInstructions'),
    savedKeysList: document.getElementById('savedKeysList'),
    profileNameInput: document.getElementById('profileNameInput'),
    profileBrandInput: document.getElementById('profileBrandInput'),
    profileTitleInput: document.getElementById('profileTitleInput'),
    profileEmailInput: document.getElementById('profileEmailInput'),
    profileWebsiteInput: document.getElementById('profileWebsiteInput'),
    profilePhoneInput: document.getElementById('profilePhoneInput'),
    profileInstagramInput: document.getElementById('profileInstagramInput'),
    profileLinkedinInput: document.getElementById('profileLinkedinInput'),
    profileXInput: document.getElementById('profileXInput'),
    profileCtaInput: document.getElementById('profileCtaInput'),
    profileBioInput: document.getElementById('profileBioInput'),
    saveProfileBtn: document.getElementById('saveProfileBtn'),
    clearProfileBtn: document.getElementById('clearProfileBtn'),
    showComparisonBtn: document.getElementById('showComparisonBtn'),
    providerComparisonModal: document.getElementById('providerComparisonModal'),
    closeComparisonBtn: document.getElementById('closeComparisonBtn'),
    comparisonTableBody: document.getElementById('comparisonTableBody'),
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
    filterType: document.getElementById('filterType'),
    sortBy: document.getElementById('sortBy'),
    confidenceFilter: document.getElementById('confidenceFilter'),
    confidenceValue: document.getElementById('confidenceValue'),
    searchStats: document.getElementById('searchStats'),
    resultCount: document.getElementById('resultCount'),
    searchTime: document.getElementById('searchTime'),
    searchResults: document.getElementById('searchResults'),
    searchCount: document.getElementById('searchCount'),
    resultsContainer: document.getElementById('resultsContainer'),
    searchEmpty: document.getElementById('searchEmpty'),
    quickActions: document.getElementById('quickActions'),
    exportResultsBtn: document.getElementById('exportResultsBtn'),
    clearSearchBtn: document.getElementById('clearSearchBtn'),
    clearIndexBtn: document.getElementById('clearIndexBtn'),
    libraryCount: document.getElementById('libraryCount'),
    indexSize: document.getElementById('indexSize'),
    lastUpdated: document.getElementById('lastUpdated'),
    libraryList: document.getElementById('libraryList'),
    libraryItems: document.getElementById('libraryItems'),
    reviewStatusFilter: document.getElementById('reviewStatusFilter'),
    reviewPlatformFilter: document.getElementById('reviewPlatformFilter'),
    reviewSearchInput: document.getElementById('reviewSearchInput'),
    exportApprovedBundleBtn: document.getElementById('exportApprovedBundleBtn'),
    refreshReviewQueueBtn: document.getElementById('refreshReviewQueueBtn'),
    reviewPendingCount: document.getElementById('reviewPendingCount'),
    reviewApprovedCount: document.getElementById('reviewApprovedCount'),
    reviewExportedCount: document.getElementById('reviewExportedCount'),
    reviewQueueEmpty: document.getElementById('reviewQueueEmpty'),
    reviewQueueList: document.getElementById('reviewQueueList'),
    reviewEditorPanel: document.getElementById('reviewEditorPanel'),
    reviewEditorTitle: document.getElementById('reviewEditorTitle'),
    reviewEditorMeta: document.getElementById('reviewEditorMeta'),
    reviewEditorStatusBadge: document.getElementById('reviewEditorStatusBadge'),
    reviewEditorSources: document.getElementById('reviewEditorSources'),
    reviewDraftEditor: document.getElementById('reviewDraftEditor'),
    polishReviewDraftBtn: document.getElementById('polishReviewDraftBtn'),
    saveReviewDraftBtn: document.getElementById('saveReviewDraftBtn'),
    approveReviewDraftBtn: document.getElementById('approveReviewDraftBtn'),
    moveToPendingBtn: document.getElementById('moveToPendingBtn'),
    exportReviewTxtBtn: document.getElementById('exportReviewTxtBtn'),
    exportReviewJsonBtn: document.getElementById('exportReviewJsonBtn'),
    deleteReviewDraftBtn: document.getElementById('deleteReviewDraftBtn'),
    quickSearchBtns: document.querySelectorAll('.quick-search-btn'),
    showShortcutBtn: document.getElementById('showShortcutBtn'),
    copyShortcutBtn: document.getElementById('copyShortcutBtn'),
    shortcutModal: document.getElementById('shortcutModal'),
    closeShortcutModalBtn: document.getElementById('closeShortcutModalBtn'),
    checkICloudBtn: document.getElementById('checkICloudBtn'),
    icloudStatus: document.getElementById('icloudStatus'),
    icloudMemosList: document.getElementById('icloudMemosList'),
    foundMemosCount: document.getElementById('foundMemosCount'),
    icloudMemosContainer: document.getElementById('icloudMemosContainer'),
    importAllICloudBtn: document.getElementById('importAllICloudBtn'),
    refreshICloudBtn: document.getElementById('refreshICloudBtn'),
    voiceMemoInput: document.getElementById('voiceMemoInput'),
    selectVoiceMemosBtn: document.getElementById('selectVoiceMemosBtn'),
    voiceMemoCountDisplay: document.getElementById('voiceMemoCountDisplay'),
    voiceSummarize: document.getElementById('voiceSummarize'),
    voiceExtractKeypoints: document.getElementById('voiceExtractKeypoints'),
    startVoiceProcessBtn: document.getElementById('startVoiceProcessBtn'),
    voiceProgress: document.getElementById('voiceProgress'),
    voiceProgressText: document.getElementById('voiceProgressText'),
    voiceProgressPercent: document.getElementById('voiceProgressPercent'),
    voiceProgressFill: document.getElementById('voiceProgressFill'),
    currentVoiceStatus: document.getElementById('currentVoiceStatus'),
    voiceStatus: document.getElementById('voiceStatus'),
    voiceMemoCount: document.getElementById('voiceMemoCount'),
    voiceMemoTotalDuration: document.getElementById('voiceMemoTotalDuration'),
    voiceMemoLastUpdated: document.getElementById('voiceMemoLastUpdated'),
    clearVoiceIndexBtn: document.getElementById('clearVoiceIndexBtn'),
    voiceMemoList: document.getElementById('voiceMemoList'),
    voiceMemoItems: document.getElementById('voiceMemoItems'),
    resultModal: document.getElementById('resultModal'),
    modalTitle: document.getElementById('modalTitle'),
    modalSummary: document.getElementById('modalSummary'),
    modalMetadata: document.getElementById('modalMetadata'),
    modalAudioSection: document.getElementById('modalAudioSection'),
    modalAudioPlayer: document.getElementById('modalAudioPlayer'),
    modalRawText: document.getElementById('modalRawText'),
    modalLlmOutput: document.getElementById('modalLlmOutput'),
    modalCopyJsonBtn: document.getElementById('modalCopyJsonBtn'),
    modalCloseBtn: document.getElementById('modalCloseBtn'),
    closeResultModalBtn: document.getElementById('closeResultModalBtn'),
    variantInstagram: document.getElementById('variantInstagram'),
    variantTiktok: document.getElementById('variantTiktok'),
    variantEmail: document.getElementById('variantEmail'),
    variantLinkedin: document.getElementById('variantLinkedin'),
    variantIdeas: document.getElementById('variantIdeas'),
};

document.addEventListener('DOMContentLoaded', () => {
    ApiKeyManager.migrateLegacyStorage();
    const { provider: activeProvider } = ApiKeyManager.getActive();
    ApiKeyManager.setActive(activeProvider);
    elements.providerSelect.value = activeProvider;
    elements.apiKeyInput.value = ApiKeyManager.get(activeProvider);
    displayProviderInfo(activeProvider);
    populateProfileForm();
    toggleSaveApiKeyButton();
    updateCurrentProvider();
    updateSavedKeysList();
    updateEndpointDebug(activeProvider);
    updateInstallExperience();
    updateHomeDashboard();

    initEventListeners();
    registerServiceWorker();
    initDatabase();
    checkLLMStatus();
    updateTesseractStatus();
    updateLibraryDisplay();
    updateVoiceLibraryDisplay();
    updateReviewQueueDisplay();
});

function initEventListeners() {
    elements.dismissInstallPromptBtn.addEventListener('click', () => {
        localStorage.setItem(INSTALL_PROMPT_DISMISSED_KEY, 'true');
        updateInstallExperience();
    });
    elements.quickRecordBtn.addEventListener('click', openQuickRecorder);
    elements.quickScreenshotBtn.addEventListener('click', () => {
        scrollToPanel(elements.screenshotPanel);
        elements.uploadBtn.click();
    });
    elements.quickSearchBtn.addEventListener('click', openQuickSearch);
    elements.quickVoiceHubBtn.addEventListener('click', openQuickVoiceHub);
    elements.quickReviewBtn.addEventListener('click', openQuickReviewQueue);
    elements.createContentBtn.addEventListener('click', openContentWizard);
    elements.platformGrid.addEventListener('click', (e) => {
        const button = e.target.closest('.platform-card[data-platform]');
        if (!button) return;
        selectPlatform(button.dataset.platform);
    });
    elements.randomSourceBtn.addEventListener('click', () => selectSource('random'));
    elements.searchSourceBtn.addEventListener('click', () => selectSource('search'));
    elements.manualSourceBtn.addEventListener('click', () => selectSource('manual'));
    elements.uploadMoreBtn.addEventListener('click', () => selectSource('upload'));
    elements.recordMoreBtn.addEventListener('click', () => selectSource('record'));
    elements.combineSourceBtn.addEventListener('click', () => selectSource('combine'));
    elements.contentSearchInput.addEventListener('input', performContentSearch);
    elements.prevBtn.addEventListener('click', previousStep);
    elements.nextBtn.addEventListener('click', nextStep);
    elements.closeWizardBtn.addEventListener('click', closeWizard);
    elements.contentCreationWizard.addEventListener('click', (e) => {
        if (e.target === elements.contentCreationWizard) {
            closeWizard();
        }
    });
    elements.polishDraftBtn.addEventListener('click', handlePolishGeneratedDraft);
    elements.saveDraftBtn.addEventListener('click', handleSaveDraft);
    elements.approveDraftBtn.addEventListener('click', handleApproveDraft);
    elements.copyGeneratedContentBtn.addEventListener('click', copyGeneratedContent);
    elements.downloadGeneratedContentBtn.addEventListener('click', downloadGeneratedContent);
    elements.editableContent.addEventListener('input', () => {
        elements.generatedContentPreview.textContent = elements.editableContent.value;
        updateWizardButtons();
    });
    elements.dockHomeBtn.addEventListener('click', () => {
        scrollToPanel(elements.appHomePanel);
    });
    elements.dockRecordBtn.addEventListener('click', openQuickRecorder);
    elements.dockSearchBtn.addEventListener('click', openQuickSearch);
    elements.dockLibraryBtn.addEventListener('click', openQuickLibrary);
    window.addEventListener('pageshow', updateInstallExperience);
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            updateInstallExperience();
        }
    });
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

    elements.providerSelect.addEventListener('change', (e) => {
        const providerId = e.target.value;
        if (!providerId) {
            elements.providerInfoCard.classList.add('hidden');
            elements.apiKeyInput.value = '';
            toggleSaveApiKeyButton();
            return;
        }

        displayProviderInfo(providerId);
        ApiKeyManager.setActive(providerId);
        elements.apiKeyInput.value = ApiKeyManager.get(providerId);
        updateEndpointDebug(providerId);
        updateCurrentProvider();
        toggleSaveApiKeyButton();
        checkLLMStatus();
    });

    elements.apiKeyInput.addEventListener('input', () => {
        toggleSaveApiKeyButton();
    });

    elements.saveApiKeyBtn.addEventListener('click', () => {
        const providerId = elements.providerSelect.value;
        const apiKey = elements.apiKeyInput.value.trim();

        if (!providerId || !apiKey) {
            setLastError('Select a provider and enter an API key.');
            showStatus(elements.llmStatus, '✗ Select provider and enter API key', 'error');
            return;
        }

        ApiKeyManager.saveApiKey(providerId, apiKey);
        ApiKeyManager.setActive(providerId);
        clearLastError();
        showStatus(elements.llmStatus, `✓ ${getProviderConfig(providerId).name} API key saved`, 'success');

        elements.providerSelect.value = '';
        elements.apiKeyInput.value = '';
        elements.providerInfoCard.classList.add('hidden');
        toggleSaveApiKeyButton();

        updateSavedKeysList();
        updateCurrentProvider();
        updateEndpointDebug(providerId);
        checkLLMStatus();
    });

    elements.saveProfileBtn.addEventListener('click', () => {
        ProfileManager.saveProfile(readProfileForm());
        showStatus(elements.llmStatus, '✓ Creator profile saved locally', 'success');
    });
    elements.clearProfileBtn.addEventListener('click', () => {
        if (!confirm('Clear your saved creator profile?')) {
            return;
        }
        ProfileManager.clearProfile();
        populateProfileForm(ProfileManager.defaultProfile());
        showStatus(elements.llmStatus, '✓ Creator profile cleared', 'success');
    });

    elements.getApiKeyBtn.addEventListener('click', openApiKeyPage);
    elements.showComparisonBtn.addEventListener('click', showProviderComparison);
    elements.closeComparisonBtn.addEventListener('click', closeComparison);
    elements.providerComparisonModal.addEventListener('click', (e) => {
        if (e.target === elements.providerComparisonModal) {
            closeComparison();
        }
    });
    elements.savedKeysList.addEventListener('click', (e) => {
        const actionButton = e.target.closest('button[data-action]');
        if (!actionButton) return;

        const { action, provider } = actionButton.dataset;
        if (!provider) return;

        if (action === 'use') {
            setActiveProvider(provider);
        } else if (action === 'delete') {
            deleteApiKeyConfirm(provider);
        }
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

    elements.searchBtn.addEventListener('click', performSearch);
    elements.searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
    elements.filterType.addEventListener('change', performSearch);
    elements.sortBy.addEventListener('change', performSearch);
    elements.confidenceFilter.addEventListener('input', (e) => {
        const value = e.target.value;
        elements.confidenceValue.textContent = value === '0' ? 'All' : `${value}%+`;
        performSearch();
    });
    elements.exportResultsBtn.addEventListener('click', exportSearchResults);
    elements.clearSearchBtn.addEventListener('click', clearSearch);
    elements.quickSearchBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
            quickSearch(btn.dataset.term);
        });
    });
    elements.reviewStatusFilter.addEventListener('change', updateReviewQueueDisplay);
    elements.reviewPlatformFilter.addEventListener('change', updateReviewQueueDisplay);
    elements.reviewSearchInput.addEventListener('input', updateReviewQueueDisplay);
    elements.exportApprovedBundleBtn.addEventListener('click', exportApprovedDraftBundle);
    elements.refreshReviewQueueBtn.addEventListener('click', updateReviewQueueDisplay);
    elements.reviewQueueList.addEventListener('click', async (e) => {
        const button = e.target.closest('button[data-review-action]');
        if (!button) return;

        const { reviewAction, draftId } = button.dataset;
        if (!draftId) return;

        if (reviewAction === 'open') {
            await openDraftForReview(draftId);
        } else if (reviewAction === 'approve') {
            await openDraftForReview(draftId);
            await updateSelectedDraftApprovalState('approved');
        } else if (reviewAction === 'exportTxt') {
            await exportDraftById(draftId, 'txt');
        } else if (reviewAction === 'exportJson') {
            await exportDraftById(draftId, 'json');
        }
    });
    elements.saveReviewDraftBtn.addEventListener('click', saveReviewDraftChanges);
    elements.polishReviewDraftBtn.addEventListener('click', handlePolishReviewDraft);
    elements.approveReviewDraftBtn.addEventListener('click', () => updateSelectedDraftApprovalState('approved'));
    elements.moveToPendingBtn.addEventListener('click', () => updateSelectedDraftApprovalState('pending_review'));
    elements.exportReviewTxtBtn.addEventListener('click', () => {
        if (reviewState.selectedDraftId) {
            exportDraftById(reviewState.selectedDraftId, 'txt');
        }
    });
    elements.exportReviewJsonBtn.addEventListener('click', () => {
        if (reviewState.selectedDraftId) {
            exportDraftById(reviewState.selectedDraftId, 'json');
        }
    });
    elements.deleteReviewDraftBtn.addEventListener('click', deleteSelectedDraft);

    elements.showShortcutBtn.addEventListener('click', () => {
        elements.shortcutModal.classList.remove('hidden');
    });
    elements.copyShortcutBtn.addEventListener('click', copyShortcutCode);
    elements.closeShortcutModalBtn.addEventListener('click', closeShortcutModal);
    elements.shortcutModal.addEventListener('click', (e) => {
        if (e.target === elements.shortcutModal) {
            closeShortcutModal();
        }
    });
    elements.checkICloudBtn.addEventListener('click', async () => {
        elements.checkICloudBtn.disabled = true;
        showStatus(elements.icloudStatus, '☁️ Checking iCloud Drive...', 'info');

        const result = await iCloudVoiceMemoBridge.checkICloud();

        if (result.error) {
            currentICloudMemos = [];
            elements.icloudMemosList.classList.add('hidden');
            showStatus(elements.icloudStatus, `✗ Error: ${result.error}`, 'error');
            elements.checkICloudBtn.disabled = false;
            return;
        }

        if (result.found === 0) {
            currentICloudMemos = [];
            elements.icloudMemosList.classList.add('hidden');
            showStatus(elements.icloudStatus, '✓ No new memos found. Run the Shortcut first or choose the exported files.', 'info');
            elements.checkICloudBtn.disabled = false;
            return;
        }

        displayICloudMemos(result.memos);
        elements.icloudMemosList.classList.remove('hidden');
        showStatus(elements.icloudStatus, `✓ Found ${result.found} memo(s) ready to import`, 'success');
        elements.checkICloudBtn.disabled = false;
    });
    elements.importAllICloudBtn.addEventListener('click', importAllICloudMemos);
    elements.refreshICloudBtn.addEventListener('click', () => {
        elements.checkICloudBtn.click();
    });
    elements.icloudMemosContainer.addEventListener('click', (e) => {
        const button = e.target.closest('button[data-icloud-index]');
        if (!button) return;

        const index = Number(button.dataset.icloudIndex);
        if (!Number.isNaN(index)) {
            importSingleICloudMemo(index);
        }
    });
    elements.selectVoiceMemosBtn.addEventListener('click', () => {
        elements.voiceMemoInput.click();
    });
    elements.voiceMemoInput.addEventListener('change', (e) => {
        const count = e.target.files.length;
        elements.voiceMemoCountDisplay.textContent = count > 0 ? `${count} memo(s) selected` : '';
        elements.startVoiceProcessBtn.disabled = count === 0;
    });
    elements.startVoiceProcessBtn.addEventListener('click', () => {
        const files = elements.voiceMemoInput.files;
        const options = {
            summarize: elements.voiceSummarize.checked,
            extractKeypoints: elements.voiceExtractKeypoints.checked
        };
        processVoiceMemos(files, options);
    });
    elements.clearVoiceIndexBtn.addEventListener('click', async () => {
        if (confirm('Clear all voice memos? This cannot be undone.')) {
            await VoiceMemoDB.clear();
            await updateVoiceLibraryDisplay();
            showStatus(elements.voiceStatus, '✓ Voice index cleared', 'success');
        }
    });
    elements.modalCloseBtn.addEventListener('click', closeResultModal);
    elements.closeResultModalBtn.addEventListener('click', closeResultModal);
    elements.modalCopyJsonBtn.addEventListener('click', async () => {
        const activeId = elements.resultModal.dataset.photoId || elements.resultModal.dataset.memoId;
        if (!activeId) return;
        const photo = currentSearchResults.find((item) => item.id === activeId);
        if (photo) {
            await copyText(JSON.stringify(photo, null, 2), '✓ Result JSON copied');
        }
    });
    elements.resultModal.addEventListener('click', (e) => {
        if (e.target === elements.resultModal) {
            closeResultModal();
        }
    });

    elements.clearIndexBtn.addEventListener('click', async () => {
        if (confirm('Clear all indexed photos? This cannot be undone.')) {
            await BatchDB.clear();
            await updateLibraryDisplay();
            showStatus(elements.batchStatus, '✓ Index cleared', 'success');
            showSearchEmpty();
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

async function processVoiceMemos(files, options) {
    if (!files || files.length === 0) {
        showStatus(elements.voiceStatus, '✗ No memos selected', 'error');
        return;
    }

    voiceState.queue = Array.from(files);
    voiceState.currentIndex = 0;
    voiceState.isProcessing = true;
    voiceState.results = [];
    elements.voiceProgress.classList.remove('hidden');
    elements.voiceStatus.classList.add('hidden');

    for (let i = 0; i < voiceState.queue.length; i += 1) {
        if (!voiceState.isProcessing) break;

        voiceState.currentIndex = i;
        await processOneVoiceMemo(voiceState.queue[i], options, i, voiceState.queue.length);
        updateVoiceProgressUI(i + 1, voiceState.queue.length);
    }

    voiceState.isProcessing = false;
    elements.voiceProgress.classList.add('hidden');
    showStatus(
        elements.voiceStatus,
        `✓ Processed ${voiceState.results.length} voice memos`,
        'success'
    );

    await updateVoiceLibraryDisplay();
}

async function processOneVoiceMemo(file, options, index, total) {
    try {
        elements.currentVoiceStatus.textContent = `${index + 1}/${total}: Processing "${file.name}"...`;
        const transcript = window.prompt(
            `Paste the transcript for "${file.name}" (or leave blank to skip):`,
            ''
        ) || '';

        const memoData = await VoiceMemoProcessor.processVoiceMemo(file, transcript, options);
        if (memoData) {
            await VoiceMemoDB.saveMemo(memoData);
            voiceState.results.push(memoData);
        }
    } catch (error) {
        console.error('Error processing memo:', error);
    }
}

function displayICloudMemos(memos) {
    currentICloudMemos = memos;
    elements.icloudMemosContainer.innerHTML = '';
    elements.foundMemosCount.textContent = String(memos.length);

    memos.forEach((memo, index) => {
        const item = document.createElement('div');
        item.className = 'icloud-memo-item';
        item.dataset.memoId = memo.id;
        item.dataset.memoIndex = String(index);

        const audioSize = memo.audioFile?.size ? `${(memo.audioFile.size / 1024 / 1024).toFixed(1)}MB` : 'Unknown size';

        item.innerHTML = `
            <div class="icloud-memo-info">
                <div class="icloud-memo-name">${escapeHtml(memo.baseName)}</div>
                <div class="icloud-memo-meta">
                    Audio: ${escapeHtml(audioSize)} • Transcript: ${escapeHtml(memo.transcriptFile.name)}
                </div>
            </div>
            <div class="icloud-memo-status">✓ Ready</div>
            <button class="btn btn-secondary btn-small" type="button" data-icloud-index="${index}">
                Import
            </button>
        `;

        elements.icloudMemosContainer.appendChild(item);
    });
}

async function importSingleICloudMemo(index) {
    const memo = currentICloudMemos[index];
    if (!memo) return;

    const result = await iCloudVoiceMemoBridge.importMemo(memo, {
        summarize: elements.voiceSummarize.checked,
        extractKeypoints: elements.voiceExtractKeypoints.checked
    });

    if (result.success) {
        currentICloudMemos = currentICloudMemos.filter((_, itemIndex) => itemIndex !== index);
        if (currentICloudMemos.length > 0) {
            displayICloudMemos(currentICloudMemos);
        } else {
            elements.icloudMemosList.classList.add('hidden');
        }
        await updateVoiceLibraryDisplay();
        showStatus(elements.icloudStatus, `✓ Imported: ${memo.baseName}`, 'success');
        return;
    }

    showStatus(elements.icloudStatus, `✗ Failed: ${result.error}`, 'error');
}

async function importAllICloudMemos() {
    if (currentICloudMemos.length === 0) {
        showStatus(elements.icloudStatus, '✗ No iCloud memos queued for import.', 'error');
        return;
    }

    elements.importAllICloudBtn.disabled = true;
    let imported = 0;
    let failed = 0;

    for (const memo of currentICloudMemos) {
        const result = await iCloudVoiceMemoBridge.importMemo(memo, {
            summarize: elements.voiceSummarize.checked,
            extractKeypoints: elements.voiceExtractKeypoints.checked
        });

        if (result.success) {
            imported += 1;
        } else {
            failed += 1;
        }
    }

    const message = `✓ Imported ${imported} memo(s)${failed > 0 ? `, ${failed} failed` : ''}`;
    showStatus(elements.icloudStatus, message, imported > 0 ? 'success' : 'error');

    currentICloudMemos = [];
    elements.icloudMemosList.classList.add('hidden');
    elements.importAllICloudBtn.disabled = false;
    await updateVoiceLibraryDisplay();
}

function closeShortcutModal() {
    elements.shortcutModal.classList.add('hidden');
}

async function copyShortcutCode() {
    const instructions = `Export to Phone Studio - iOS Shortcuts Recipe

1. Create a shortcut named "Export to Phone Studio"
2. Ask for Voice Memo
3. Get File of provided voice memo
4. Get Details of provided voice memo
5. Get or copy the transcript from Voice Memos
6. Get Current Date and format it as MEMO_[ISO date]
7. Save audio to iCloud Drive/PhoneStudio/audio/
8. Save transcript to iCloud Drive/PhoneStudio/transcripts/
9. Show Result: Exported to Phone Studio!

Then: record memo -> run shortcut -> open Phone Studio -> Check iCloud Drive -> Import All`;

    try {
        await navigator.clipboard.writeText(instructions);
        showStatus(elements.voiceStatus, '✓ Shortcut recipe copied', 'success');
    } catch (error) {
        const blob = new Blob([instructions], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'ExportToPhoneStudio-Shortcut-Instructions.txt';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        showStatus(elements.voiceStatus, '✓ Shortcut recipe downloaded', 'success');
    }
}

function updateVoiceProgressUI(current, total) {
    const percent = Math.round((current / total) * 100);
    elements.voiceProgressText.textContent = `Processing ${current}/${total}`;
    elements.voiceProgressPercent.textContent = `${percent}%`;
    elements.voiceProgressFill.style.width = `${percent}%`;
}

async function updateVoiceLibraryDisplay() {
    try {
        const all = await VoiceMemoDB.getAll();
        elements.voiceMemoCount.textContent = String(all.length);

        const totalSeconds = all.reduce((sum, memo) => sum + (memo.duration_seconds || 0), 0);
        elements.voiceMemoTotalDuration.textContent = String(Math.round(totalSeconds / 60));

        if (all.length > 0) {
            elements.voiceMemoLastUpdated.textContent = new Date(all[all.length - 1].timestamp).toLocaleString();
            elements.voiceMemoItems.innerHTML = '';

            all.slice(-5).reverse().forEach((memo) => {
                const item = document.createElement('div');
                item.className = 'voice-memo-item';

                const info = document.createElement('div');
                info.className = 'voice-memo-item-info';
                const sourceLabel = memo.imported_from_icloud ? ' • iCloud import' : '';
                info.innerHTML = `
                    <div class="voice-memo-item-title">${escapeHtml(memo.file_name)}</div>
                    <div class="voice-memo-item-meta">${new Date(memo.timestamp).toLocaleDateString()} • ${Math.round((memo.duration_seconds || 0) / 60)} min${escapeHtml(sourceLabel)}</div>
                `;

                const actions = document.createElement('div');
                actions.className = 'voice-memo-item-actions';

                const viewButton = document.createElement('button');
                viewButton.className = 'btn btn-secondary btn-small';
                viewButton.textContent = 'View';
                viewButton.addEventListener('click', () => {
                    viewVoiceMemo(memo.id);
                });

                const playButton = document.createElement('button');
                playButton.className = 'btn btn-secondary btn-small';
                playButton.textContent = 'Play';
                playButton.addEventListener('click', () => {
                    playVoiceMemo(memo.id);
                });

                actions.appendChild(viewButton);
                actions.appendChild(playButton);
                item.appendChild(info);
                item.appendChild(actions);
                elements.voiceMemoItems.appendChild(item);
            });

            elements.voiceMemoList.classList.remove('hidden');
            elements.voiceMemoList.classList.add('active');
        } else {
            elements.voiceMemoLastUpdated.textContent = 'Never';
            elements.voiceMemoItems.innerHTML = '';
            elements.voiceMemoList.classList.add('hidden');
            elements.voiceMemoList.classList.remove('active');
        }
    } catch (error) {
        console.error('Voice library display failed:', error);
    }

    updateHomeDashboard();
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

async function performSearch() {
    const query = elements.searchInput.value;
    const filters = {
        type: elements.filterType.value,
        sortBy: elements.sortBy.value,
        confidence: parseInt(elements.confidenceFilter.value, 10)
    };

    if (!query.trim() && !filters.type) {
        showSearchEmpty();
        return;
    }

    const results = await UnifiedSearch.search(query, filters);
    displayUnifiedResults(results);
}

function displayUnifiedResults(results) {
    currentSearchResults = results.results;
    elements.searchEmpty.classList.add('hidden');
    elements.searchStats.classList.remove('hidden');
    elements.searchResults.classList.remove('hidden');
    elements.quickActions.classList.remove('hidden');
    elements.resultCount.textContent = String(results.count);
    elements.searchTime.textContent = `(${results.photos} photos, ${results.memos} memos, ${results.time}ms)`;
    elements.resultsContainer.innerHTML = '';

    if (results.count === 0) {
        elements.resultsContainer.innerHTML = '<p class="help-text">No results found. Try different keywords.</p>';
        return;
    }

    results.results.forEach((item, index) => {
        const card = item.source === 'memo'
            ? createMemoResultCard(item, index)
            : createResultCard(item, index);
        elements.resultsContainer.appendChild(card);
    });
}

function createResultCard(photo, index) {
    const card = document.createElement('div');
    card.className = 'result-card';

    const compressed = photo.compressed_index || {};
    const preview = (photo.raw_text || '').substring(0, 150).replace(/\n/g, ' ');
    const timestamp = new Date(photo.timestamp).toLocaleDateString();
    const summary = compressed.summary || 'N/A';

    const conceptsHtml = (compressed.concepts || [])
        .slice(0, 3)
        .map((concept) => `<span class="concept-tag">${escapeHtml(concept)}</span>`)
        .join('');

    const keywordsHtml = (compressed.keywords || [])
        .slice(0, 4)
        .map((keyword) => `<span class="keyword-tag">${escapeHtml(keyword)}</span>`)
        .join('');

    card.innerHTML = `
        <div class="result-header">
            <div class="result-title">
                <span class="result-type-badge">${escapeHtml(compressed.type || 'DOC')}</span>
                <h4>${escapeHtml(photo.file_name || `Photo ${index + 1}`)}</h4>
            </div>
            <span class="result-date">${timestamp}</span>
            <div class="result-actions">
                <button class="btn btn-secondary result-view-btn" data-photo-id="${photo.id}">View</button>
                <button class="btn btn-secondary result-copy-btn" data-photo-id="${photo.id}">Copy</button>
            </div>
        </div>
        <div class="result-content">
            <p><strong>Summary:</strong> ${escapeHtml(summary)}</p>
            ${conceptsHtml ? `<div class="result-concepts">${conceptsHtml}</div>` : ''}
            ${keywordsHtml ? `<div class="result-keywords">${keywordsHtml}</div>` : ''}
            <div class="result-preview">${escapeHtml(preview)}...</div>
        </div>
    `;

    card.querySelector('.result-view-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        viewPhotoDetail(photo.id);
    });

    card.querySelector('.result-copy-btn').addEventListener('click', async (e) => {
        e.stopPropagation();
        await copyPhotoJson(photo.id);
    });

    card.addEventListener('click', () => {
        viewPhotoDetail(photo.id);
    });

    return card;
}

function createMemoResultCard(memo, index) {
    const card = document.createElement('div');
    card.className = 'result-card';

    const keyPointsHtml = (memo.key_points || [])
        .slice(0, 2)
        .map((point) => `<span class="keyword-tag">${escapeHtml(point)}</span>`)
        .join('');

    const duration = Math.round((memo.duration_seconds || 0) / 60);
    const date = new Date(memo.timestamp).toLocaleDateString();
    const preview = (memo.raw_transcript || '').substring(0, 150).replace(/\n/g, ' ');

    card.innerHTML = `
        <div class="result-header">
            <div class="result-title">
                <span class="result-type-badge">MEMO</span>
                <h4>${escapeHtml(memo.file_name || `Memo ${index + 1}`)}</h4>
            </div>
            <span class="result-date">${date} • ${duration} min</span>
            <div class="result-actions">
                <button class="btn btn-secondary result-view-btn" data-memo-id="${memo.id}">View</button>
                <button class="btn btn-secondary result-play-btn" data-memo-id="${memo.id}">▶️ Play</button>
            </div>
        </div>
        <div class="result-content">
            <p><strong>Summary:</strong> ${escapeHtml(memo.summary || 'N/A')}</p>
            ${keyPointsHtml ? `<div class="result-keywords">${keyPointsHtml}</div>` : ''}
            <div class="result-preview">${escapeHtml(preview)}...</div>
        </div>
    `;

    card.querySelector('.result-view-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        viewVoiceMemo(memo.id);
    });

    card.querySelector('.result-play-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        playVoiceMemo(memo.id);
    });

    card.addEventListener('click', () => {
        viewVoiceMemo(memo.id);
    });

    return card;
}

function showSearchEmpty() {
    currentSearchResults = [];
    elements.searchEmpty.classList.remove('hidden');
    elements.searchStats.classList.add('hidden');
    elements.searchResults.classList.add('hidden');
    elements.quickActions.classList.add('hidden');
    elements.resultsContainer.innerHTML = '';
}

async function viewPhotoDetail(id) {
    let photo = currentSearchResults.find((item) => item.id === id);
    if (!photo) {
        photo = await BatchDB.getById(id);
    }
    if (!photo) return;

    const compressed = photo.compressed_index || {};
    elements.resultModal.dataset.photoId = photo.id;
    delete elements.resultModal.dataset.memoId;
    elements.modalTitle.textContent = photo.file_name || 'Photo Details';
    elements.modalSummary.textContent = compressed.summary || 'No semantic summary available.';
    elements.modalMetadata.textContent = `Type: ${compressed.type || 'document'} | Concepts: ${(compressed.concepts || []).join(', ') || 'None'} | Keywords: ${(compressed.keywords || []).join(', ') || 'None'}`;
    elements.modalAudioSection.classList.add('hidden');
    elements.modalAudioPlayer.pause();
    elements.modalAudioPlayer.removeAttribute('src');
    elements.modalRawText.textContent = photo.raw_text || 'No OCR text stored.';
    elements.modalLlmOutput.textContent = photo.llm_output || 'No LLM output stored.';
    elements.resultModal.classList.remove('hidden');
}

async function viewVoiceMemo(id) {
    let memo = currentSearchResults.find((item) => item.id === id);
    if (!memo) {
        memo = await VoiceMemoDB.getById(id);
    }
    if (!memo) return;

    const compressed = memo.compressed_index || {};
    delete elements.resultModal.dataset.photoId;
    elements.resultModal.dataset.memoId = memo.id;
    elements.modalTitle.textContent = memo.file_name || 'Voice Memo';
    elements.modalSummary.textContent = memo.summary || 'No summary available.';
    elements.modalMetadata.textContent = `Type: memo | Key points: ${(memo.key_points || []).join(' • ') || 'None'} | Keywords: ${(compressed.keywords || []).join(', ') || 'None'}`;
    elements.modalAudioSection.classList.remove('hidden');
    elements.modalAudioPlayer.src = memo.audio_data || '';
    elements.modalRawText.textContent = memo.raw_transcript || 'No transcript stored.';
    elements.modalLlmOutput.textContent = (memo.key_points || []).join('\n') || 'No extracted key points stored.';
    elements.resultModal.classList.remove('hidden');
}

function closeResultModal() {
    elements.resultModal.classList.add('hidden');
    elements.modalAudioPlayer.pause();
    elements.modalAudioPlayer.removeAttribute('src');
    elements.modalAudioSection.classList.add('hidden');
    delete elements.resultModal.dataset.photoId;
    delete elements.resultModal.dataset.memoId;
}

async function copyPhotoJson(id) {
    let photo = currentSearchResults.find((item) => item.id === id);
    if (!photo) {
        photo = await BatchDB.getById(id);
    }
    if (photo) {
        await copyText(JSON.stringify(photo, null, 2), '✓ Photo JSON copied');
    }
}

async function exportSearchResults() {
    const query = elements.searchInput.value;
    const filters = {
        type: elements.filterType.value,
        sortBy: elements.sortBy.value,
        confidence: parseInt(elements.confidenceFilter.value, 10)
    };

    const results = await UnifiedSearch.search(query, filters);
    const exportData = {
        export_date: new Date().toISOString(),
        query,
        filters,
        total_results: results.count,
        items: results.results.map((item) => ({
            id: item.id,
            file_name: item.file_name,
            source: item.source,
            timestamp: item.timestamp,
            compressed_index: item.compressed_index,
            raw_text: item.raw_text || item.raw_transcript,
            llm_output: item.llm_output || item.summary
        }))
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `phone-studio-export-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showStatus(elements.batchStatus, '✓ Results exported as JSON', 'success');
}

function clearSearch() {
    elements.searchInput.value = '';
    elements.filterType.value = '';
    elements.sortBy.value = 'recent';
    elements.confidenceFilter.value = '0';
    elements.confidenceValue.textContent = 'All';
    showSearchEmpty();
}

function quickSearch(term) {
    switchBatchTab('search');
    elements.searchInput.value = term;
    performSearch();

    setTimeout(() => {
        elements.searchResults.scrollIntoView({ behavior: 'smooth' });
    }, 100);
}

function formatApprovalLabel(state) {
    const labels = {
        pending_review: 'Pending Review',
        approved: 'Approved',
        exported: 'Exported'
    };
    return labels[state] || 'Draft';
}

async function updateReviewQueueDisplay() {
    try {
        const drafts = await ContentDraftDB.getAll();
        const sorted = drafts.sort((a, b) => new Date(b.updated_at || b.timestamp) - new Date(a.updated_at || a.timestamp));
        const statusFilter = elements.reviewStatusFilter.value;
        const platformFilter = elements.reviewPlatformFilter.value;
        const query = elements.reviewSearchInput.value.trim().toLowerCase();

        elements.reviewPendingCount.textContent = String(drafts.filter((draft) => draft.approval_state === 'pending_review').length);
        elements.reviewApprovedCount.textContent = String(drafts.filter((draft) => draft.approval_state === 'approved').length);
        elements.reviewExportedCount.textContent = String(drafts.filter((draft) => draft.approval_state === 'exported').length);

        const filtered = sorted.filter((draft) => {
            if (statusFilter && draft.approval_state !== statusFilter) {
                return false;
            }
            if (platformFilter && draft.platform !== platformFilter) {
                return false;
            }
            if (!query) {
                return true;
            }

            const sourceSummary = (draft.sources || [])
                .map((source) => `${source.file_name} ${source.summary}`)
                .join(' ')
                .toLowerCase();

            return [
                draft.title,
                draft.content,
                draft.platform,
                draft.preview,
                sourceSummary
            ].join(' ').toLowerCase().includes(query);
        });

        elements.reviewQueueList.innerHTML = '';
        if (filtered.length === 0) {
            elements.reviewQueueEmpty.classList.remove('hidden');
            elements.reviewQueueList.classList.add('hidden');
        } else {
            elements.reviewQueueEmpty.classList.add('hidden');
            elements.reviewQueueList.classList.remove('hidden');
            filtered.forEach((draft) => {
                elements.reviewQueueList.appendChild(createReviewQueueCard(draft));
            });
        }

        if (reviewState.selectedDraftId) {
            const selected = drafts.find((draft) => draft.id === reviewState.selectedDraftId);
            if (selected) {
                populateReviewEditor(selected);
            } else {
                clearReviewEditor();
            }
        }
    } catch (error) {
        console.error('Review queue update failed:', error);
    }
}

function createReviewQueueCard(draft) {
    const card = document.createElement('div');
    card.className = 'review-card';
    const statusClass = draft.approval_state === 'approved'
        ? 'approved'
        : draft.approval_state === 'exported'
            ? 'exported'
            : 'pending';
    const sourceNames = (draft.sources || [])
        .slice(0, 2)
        .map((source) => source.file_name)
        .join(' • ');

    card.innerHTML = `
        <div class="review-card-header">
            <div>
                <h4>${escapeHtml(draft.title || 'Untitled Draft')}</h4>
                <p class="help-text">${escapeHtml(getPlatformLabel(draft.platform || 'content'))} • ${new Date(draft.updated_at || draft.timestamp).toLocaleString()}</p>
            </div>
            <span class="review-status-badge ${statusClass}">${escapeHtml(formatApprovalLabel(draft.approval_state))}</span>
        </div>
        <p class="review-card-preview">${escapeHtml(draft.preview || draft.content.slice(0, 220))}</p>
        <p class="help-text">${escapeHtml(sourceNames || `${draft.source_count || 0} source items`)}</p>
        <div class="review-card-actions">
            <button class="btn btn-secondary btn-small" type="button" data-review-action="open" data-draft-id="${draft.id}">Open</button>
            <button class="btn btn-outline btn-small" type="button" data-review-action="approve" data-draft-id="${draft.id}">Approve</button>
            <button class="btn btn-secondary btn-small" type="button" data-review-action="exportTxt" data-draft-id="${draft.id}">TXT</button>
            <button class="btn btn-secondary btn-small" type="button" data-review-action="exportJson" data-draft-id="${draft.id}">JSON</button>
        </div>
    `;

    return card;
}

async function openDraftForReview(draftId) {
    const draft = await ContentDraftDB.getById(draftId);
    if (!draft) {
        return;
    }

    reviewState.selectedDraftId = draftId;
    populateReviewEditor(draft);
    elements.reviewEditorPanel.classList.remove('hidden');
    elements.reviewEditorPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function populateReviewEditor(draft) {
    reviewState.selectedDraftId = draft.id;
    elements.reviewEditorTitle.textContent = draft.title || 'Review Draft';
    elements.reviewEditorMeta.textContent = `${getPlatformLabel(draft.platform || 'content')} • ${formatApprovalLabel(draft.approval_state)} • ${draft.source_count || 0} source item(s)`;
    elements.reviewEditorStatusBadge.textContent = formatApprovalLabel(draft.approval_state);
    elements.reviewEditorStatusBadge.className = `review-status-badge ${
        draft.approval_state === 'approved'
            ? 'approved'
            : draft.approval_state === 'exported'
                ? 'exported'
                : 'pending'
    }`;
    elements.reviewDraftEditor.value = draft.content || '';
    elements.reviewEditorSources.innerHTML = '';

    (draft.sources || []).forEach((source) => {
        const item = document.createElement('div');
        item.className = 'review-source-item';
        item.innerHTML = `
            <strong>${escapeHtml(source.type === 'memo' ? '🎙️' : '📷')} ${escapeHtml(source.file_name || 'Source')}</strong>
            <p class="help-text">${escapeHtml(source.summary || 'No summary available.')}</p>
        `;
        elements.reviewEditorSources.appendChild(item);
    });
}

function clearReviewEditor() {
    reviewState.selectedDraftId = null;
    elements.reviewEditorPanel.classList.add('hidden');
    elements.reviewEditorTitle.textContent = 'Review Draft';
    elements.reviewEditorMeta.textContent = 'Platform • status • source count';
    elements.reviewEditorStatusBadge.textContent = 'Pending Review';
    elements.reviewEditorStatusBadge.className = 'review-status-badge';
    elements.reviewDraftEditor.value = '';
    elements.reviewEditorSources.innerHTML = '';
}

async function saveReviewDraftChanges() {
    if (!reviewState.selectedDraftId) {
        return;
    }

    const draft = await ContentDraftDB.getById(reviewState.selectedDraftId);
    if (!draft) {
        clearReviewEditor();
        return;
    }

    const content = elements.reviewDraftEditor.value.trim();
    if (!content) {
        showStatus(elements.batchStatus, '✗ Draft content cannot be empty', 'error');
        return;
    }

    await ContentDraftDB.saveDraft({
        ...draft,
        content,
        preview: content.slice(0, 220),
        title: buildDraftTitle(draft.platform, content),
        updated_at: new Date().toISOString()
    });

    await updateReviewQueueDisplay();
    showStatus(elements.batchStatus, '✓ Draft changes saved', 'success');
}

async function updateSelectedDraftApprovalState(nextState) {
    if (!reviewState.selectedDraftId) {
        return;
    }

    const draft = await ContentDraftDB.getById(reviewState.selectedDraftId);
    if (!draft) {
        clearReviewEditor();
        return;
    }

    await ContentDraftDB.saveDraft({
        ...draft,
        content: elements.reviewDraftEditor.value.trim() || draft.content,
        preview: (elements.reviewDraftEditor.value.trim() || draft.content).slice(0, 220),
        approval_state: nextState,
        export_state: nextState === 'exported' ? 'exported' : draft.export_state,
        exported_at: nextState === 'exported' ? new Date().toISOString() : draft.exported_at,
        updated_at: new Date().toISOString()
    });

    await updateReviewQueueDisplay();
    await updateHomeDashboard();
    showStatus(elements.batchStatus, `✓ Draft marked ${formatApprovalLabel(nextState).toLowerCase()}`, 'success');
}

function downloadTextFile(content, filename) {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function downloadJsonFile(data, filename) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

async function exportDraftById(draftId, format = 'txt') {
    const draft = await ContentDraftDB.getById(draftId);
    if (!draft) {
        return;
    }

    if (format === 'json') {
        downloadJsonFile(draft, `${draft.id}.json`);
    } else {
        downloadTextFile(draft.content, `${draft.id}.txt`);
    }

    await ContentDraftDB.saveDraft({
        ...draft,
        approval_state: 'exported',
        export_state: 'exported',
        exported_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    });

    await updateReviewQueueDisplay();
    await updateHomeDashboard();
    showStatus(elements.batchStatus, `✓ Draft exported as ${format.toUpperCase()}`, 'success');
}

async function exportApprovedDraftBundle() {
    const drafts = await ContentDraftDB.getAll();
    const approved = drafts.filter((draft) => draft.approval_state === 'approved' || draft.approval_state === 'exported');

    if (approved.length === 0) {
        showStatus(elements.batchStatus, '✗ No approved drafts to export yet', 'error');
        return;
    }

    downloadJsonFile({
        exported_at: new Date().toISOString(),
        draft_count: approved.length,
        items: approved
    }, `phone-studio-approved-bundle-${Date.now()}.json`);

    await Promise.all(approved.map((draft) => ContentDraftDB.saveDraft({
        ...draft,
        approval_state: 'exported',
        export_state: 'exported',
        exported_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    })));

    await updateReviewQueueDisplay();
    await updateHomeDashboard();
    showStatus(elements.batchStatus, '✓ Approved bundle exported', 'success');
}

async function deleteSelectedDraft() {
    if (!reviewState.selectedDraftId) {
        return;
    }

    if (!confirm('Delete this saved draft? This cannot be undone.')) {
        return;
    }

    await ContentDraftDB.deleteDraft(reviewState.selectedDraftId);
    clearReviewEditor();
    await updateReviewQueueDisplay();
    await updateHomeDashboard();
    showStatus(elements.batchStatus, '✓ Draft deleted', 'success');
}

async function playVoiceMemo(memoId) {
    await viewVoiceMemo(memoId);
    try {
        await elements.modalAudioPlayer.play();
    } catch (error) {
        // Playback may still require an additional user gesture on some devices.
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

    if (tabName === 'review') {
        updateReviewQueueDisplay();
    }
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

    updateHomeDashboard();
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
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

    if (elements.quickRecordBtn) {
        const title = elements.quickRecordBtn.querySelector('.quick-launch-title');
        const copy = elements.quickRecordBtn.querySelector('.quick-launch-copy');
        elements.quickRecordBtn.classList.toggle('quick-launch-card-live', isRecording);
        if (title) {
            title.textContent = isRecording ? 'Stop Recording' : 'Record Now';
        }
        if (copy) {
            copy.textContent = isRecording
                ? 'Recording is active. Tap again to stop and save the note.'
                : 'Start or stop a voice note without hunting through the workflow.';
        }
    }

    if (elements.dockRecordBtn) {
        elements.dockRecordBtn.textContent = isRecording ? 'Stop' : 'Record';
    }
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

    if (!providerSupportsChat(provider)) {
        const message = `${providerConfig.name} is listed in Settings, but this step currently supports text-generation providers only.`;
        setLastError(message);
        showStatus(elements.llmStatus, `✗ ${message}`, 'error');
        return;
    }

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
    if (!providerSupportsChat(provider)) {
        throw new Error(`${providerConfig.name} is not available for this text-generation workflow yet.`);
    }

    let requestBody;
    let headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
    };
    let requestUrl = providerConfig.apiUrl;

    if (provider === 'anthropic' || provider === 'anthropic_sonnet') {
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
    } else if (provider === 'google_gemini') {
        headers = {
            'Content-Type': 'application/json'
        };
        requestUrl = `${providerConfig.apiUrl}?key=${encodeURIComponent(apiKey)}`;
        requestBody = {
            contents: [
                {
                    parts: [
                        {
                            text: `${systemPrompt}\n\n${userPrompt}`
                        }
                    ]
                }
            ],
            generationConfig: {
                temperature,
                maxOutputTokens: maxTokens
            }
        };
    } else if (provider === 'cohere') {
        requestBody = {
            model: providerConfig.model,
            preamble: systemPrompt,
            message: userPrompt,
            temperature,
            max_tokens: maxTokens
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

    const response = await fetchWithTimeout(requestUrl, {
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
    if (provider === 'anthropic' || provider === 'anthropic_sonnet') {
        return data?.content?.find((block) => block.type === 'text')?.text || '';
    }

    if (provider === 'google_gemini') {
        return data?.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('\n').trim() || '';
    }

    if (provider === 'cohere') {
        return data?.text || data?.message?.content?.[0]?.text || '';
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
    if (!providerSupportsChat(provider)) {
        showStatus(elements.llmStatus, `✗ ${getProviderConfig(provider).name} is not available for text variants yet`, 'error');
        return;
    }

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
    const providerConfig = getProviderConfig(provider);
    const providerName = providerConfig.name;

    if (apiKey) {
        elements.llmStatusDebug.textContent = `✓ ${providerName} (API key set)`;
        elements.llmStatusDebug.style.color = '#34d399';
    } else {
        elements.llmStatusDebug.textContent = `⚠ ${providerName} (No API key)`;
        elements.llmStatusDebug.style.color = 'var(--accent)';
    }

    updateCurrentProvider();
    updateEndpointDebug(provider);
    updateHomeDashboard();
}

function updateTesseractStatus() {
    if (window.Tesseract) {
        elements.tesseractStatusDebug.textContent = '✓ Ready';
        elements.tesseractStatusDebug.style.color = '#34d399';
    } else {
        elements.tesseractStatusDebug.textContent = '⏳ Loading...';
    }
}

function displayProviderInfo(providerId) {
    const provider = ApiKeyManager.getProvider(providerId);
    if (!provider) return;

    elements.providerCategory.textContent = provider.category || 'General';
    elements.providerCost.textContent = formatProviderCost(provider.costPer1M);
    elements.providerSpeed.textContent = provider.speed || 'Unknown';
    elements.providerInstructions.textContent = provider.instructions || 'No instructions available.';
    elements.getApiKeyBtn.dataset.signupUrl = provider.signupUrl || '';
    elements.providerInfoCard.classList.remove('hidden');
}

function openApiKeyPage() {
    const signupUrl = elements.getApiKeyBtn.dataset.signupUrl;
    if (signupUrl) {
        window.open(signupUrl, '_blank', 'noopener');
    }
}

function updateSavedKeysList() {
    const container = elements.savedKeysList;
    const allKeys = ApiKeyManager.getAllSavedKeys();

    if (Object.keys(allKeys).length === 0) {
        container.innerHTML = '<p class="help-text">No API keys saved yet. Add one to get started.</p>';
        return;
    }

    container.innerHTML = '';
    Object.entries(allKeys).forEach(([providerId, key]) => {
        const provider = ApiKeyManager.getProvider(providerId);
        if (!provider) return;

        const item = document.createElement('div');
        item.className = 'saved-key-item';

        const keyPreview = key.length > 8
            ? `${key.substring(0, 4)}...${key.substring(key.length - 4)}`
            : 'Saved';

        item.innerHTML = `
            <div>
                <div class="saved-key-name">${provider.name}</div>
                <div class="help-text" style="font-size: 11px;">${keyPreview}</div>
            </div>
            <div class="saved-key-actions">
                <button class="btn btn-secondary" type="button" data-action="use" data-provider="${providerId}">
                    Use
                </button>
                <button class="btn btn-outline" type="button" data-action="delete" data-provider="${providerId}">
                    Delete
                </button>
            </div>
        `;
        container.appendChild(item);
    });
}

function updateCurrentProvider() {
    const active = ApiKeyManager.getActive();
    const provider = getProviderConfig(active.provider);
    const hasKey = Boolean(active.apiKey);

    elements.currentProviderName.textContent = provider.name;
    elements.currentProviderCost.textContent = `Cost: ${formatProviderCost(provider.costPer1M)}`;
    elements.currentProviderSpeed.textContent = `Speed: ${provider.speed || 'Unknown'}${hasKey ? '' : ' • No key saved'}`;
}

function setActiveProvider(providerId) {
    ApiKeyManager.setActive(providerId);
    elements.providerSelect.value = providerId;
    elements.apiKeyInput.value = ApiKeyManager.getApiKey(providerId);
    displayProviderInfo(providerId);
    toggleSaveApiKeyButton();
    updateCurrentProvider();
    updateEndpointDebug(providerId);
    checkLLMStatus();
    showStatus(elements.llmStatus, `✓ Switched to ${getProviderConfig(providerId).name}`, 'success');
}

function deleteApiKeyConfirm(providerId) {
    if (!confirm(`Delete ${getProviderConfig(providerId).name} API key?`)) {
        return;
    }

    ApiKeyManager.deleteApiKey(providerId);
    if (elements.providerSelect.value === providerId) {
        elements.apiKeyInput.value = '';
        toggleSaveApiKeyButton();
    }
    updateSavedKeysList();
    updateCurrentProvider();
    checkLLMStatus();
    showStatus(elements.llmStatus, '✓ API key deleted', 'success');
}

function showProviderComparison() {
    elements.comparisonTableBody.innerHTML = '';
    ApiKeyManager.getAllProviders().forEach((provider) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${provider.name}</td>
            <td>${provider.category || 'General'}</td>
            <td>${provider.speed || 'Unknown'}</td>
            <td>${Number.isFinite(provider.costPer1M) ? `$${provider.costPer1M}` : 'N/A'}</td>
            <td>${provider.free ? '✅' : '❌'}</td>
        `;
        elements.comparisonTableBody.appendChild(row);
    });

    elements.providerComparisonModal.classList.remove('hidden');
}

function closeComparison() {
    elements.providerComparisonModal.classList.add('hidden');
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
