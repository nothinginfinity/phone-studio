# LLM Routing — Which Model for Which Task

This file tells Phone Studio Dock (and Perplexity Computer) which LLM to use
for each task. Update it as you add new models or adjust for performance.

Machine-readable version: [models/model_config.yaml](../models/model_config.yaml)

---

## Routing Table

| Task | Preferred Model | Location | Latency | Cost | Fallback |
|------|----------------|----------|---------|------|---------|
| **Transcribe** | Whisper-base | Dock (local) | 2x audio | $0 | OpenAI Whisper API |
| **Generate Ideas** | Mistral-7B | Dock (local) | 3–5s | $0 | Claude 3 Haiku |
| **Write Captions** | Phi-3-3.8B | Dock (local) | 2–3s | $0 | GPT-4o mini |
| **Route Lead** | Claude 3 | Cloud (required) | ~1s | ~$0.01–0.05 | none |
| **Embed Text** | all-MiniLM | Dock (local) | 0.1s | $0 | none |
| **Polish Draft** | Phi-3-3.8B | Dock (local) | 2–3s | $0 | GPT-4o mini |

---

## Decision Logic

```
IF task == "transcribe":
    USE Whisper-base (Dock)

ELIF task == "write_captions" OR task == "polish_draft":
    IF dock_online:
        USE Phi-3-3.8B (Dock)
    ELIF api_key_exists(OPENAI_API_KEY):
        USE gpt-4o-mini (API)
    ELSE:
        QUEUE for when dock is online

ELIF task == "generate_ideas":
    IF dock_online:
        USE Mistral-7B (Dock)
    ELIF api_key_exists(ANTHROPIC_API_KEY):
        USE claude-3-haiku (API)
    ELSE:
        QUEUE

ELIF task == "route_lead":
    REQUIRE cloud API (Claude 3 or GPT-4)
    REASON: complex reasoning, not suitable for 3.8B models

ELIF task == "embed":
    ALWAYS use all-MiniLM local (no fallback needed — fast enough)
```

---

## Why This Routing?

- **Speed > quality for daily content** — Phi-3 at 2–3s beats waiting 10s for GPT-4
- **Lead routing requires cloud** — Small models hallucinate on structured CRM logic
- **Local = free** — Zero API cost for 90% of tasks
- **Dock offline fallback** — Always have an API key saved so you're never blocked

---

## Performance Notes

| Model | Best For | Watch Out For |
|-------|----------|---------------|
| Phi-3-3.8B | Short-form captions, editing | Can go generic; needs strong brand voice context |
| Mistral-7B | Creative ideation, longer drafts | Slower than Phi-3; worth it for quality |
| Whisper-base | Clean recordings | Struggles with heavy background noise |
| Claude 3 | Complex reasoning, lead routing | API cost adds up; reserve for high-value tasks |

---

*Last updated: YYYY-MM-DD*
