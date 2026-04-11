# API Reference — Phone Studio Context MCP

Base URL (local): `http://localhost:8000`  
Base URL (deployed): `https://your-render-url.onrender.com` ← FILL IN after deploying

---

## Endpoints

### GET /health

Check if the MCP server is running.

**Response**:
```json
{
  "status": "ok",
  "repo": "yourusername/phone-studio",
  "time": "2026-04-11T17:00:00"
}
```

---

### POST /mcp/tools/get_context

Fetch context from GitHub for LLM inference.

**Request body**:
```json
{
  "task_type": "write_captions",
  "limit": 5
}
```

**task_type values**:
| Value | Returns |
|-------|---------|
| `write_captions` | brand_voice, audience, approved_instagram, approved_captions |
| `generate_ideas` | brand_voice, audience, recent_conversations, content_calendar, strategy |
| `route_lead` | brand_voice, audience, product_features |
| `general` | brand_voice, audience, llm_routing |

**Response**:
```json
{
  "brand_voice": "...",
  "audience": "...",
  "approved_instagram": "...",
  "fetched_at": "2026-04-11T17:00:00",
  "task_type": "write_captions"
}
```

---

### POST /mcp/tools/save_conversation

Commit a new conversation to `context/conversations/`.

**Request body**:
```json
{
  "title": "podcast-script-ep05",
  "content": "Full conversation text here...",
  "platform": "perplexity",
  "status": "saved"
}
```

**Response**:
```json
{
  "status": "ok",
  "action": "created",
  "file": "context/conversations/2026-04-11-podcast-script-ep05.md"
}
```

---

### GET /mcp/tools/list_approved

Return approved content for tone consistency checking.

**Query params**: `?platform=instagram`

**Response**:
```json
{
  "instagram": "# Approved Instagram Posts\n...",
  "all": "# Approved Captions — All Platforms\n..."
}
```

---

## Authentication

The MCP server reads `GITHUB_TOKEN` from `.env`.  
For Perplexity Computer integration, no additional auth is needed if running locally.  
For cloud deployment, set `GITHUB_TOKEN` as an environment variable in Render/Railway.

---

## Setup

```bash
cd code/mcp_server
pip install -r requirements.txt
cp ../../.env.example ../../.env  # Fill in GITHUB_TOKEN and GITHUB_REPO
uvicorn phone_studio_context_mcp:app --reload --port 8000
```

---

*Source code: [code/mcp_server/phone_studio_context_mcp.py](../code/mcp_server/phone_studio_context_mcp.py)*
