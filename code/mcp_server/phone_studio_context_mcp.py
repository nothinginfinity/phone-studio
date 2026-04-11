"""
phone_studio_context_mcp.py
===========================
MCP server that bridges Perplexity Computer / Phone Studio Dock → GitHub context.

WHAT IT DOES:
  - get_context(task_type)  → pulls relevant files from your GitHub repo
  - save_conversation()     → commits a new conversation to context/conversations/
  - list_approved()         → returns approved content for tone consistency

HOW TO RUN (local, for testing):
  pip install -r requirements.txt
  cp ../../.env.example ../../.env  # fill in your values
  uvicorn phone_studio_context_mcp:app --reload --port 8000

HOW TO DEPLOY:
  Push to Render or Railway using the Dockerfile (see code/workflows/)

FILLS IN:
  - Set GITHUB_TOKEN and GITHUB_REPO in .env
  - Optionally set PORT (default 8000)
"""

import os
import json
from datetime import datetime
from typing import Optional

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from github import Github, GithubException
from dotenv import load_dotenv

load_dotenv("../../.env")  # Load from repo root when running locally

# ── Config ──────────────────────────────────────────────────────────────────
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
GITHUB_REPO  = os.getenv("GITHUB_REPO")   # e.g. "yourusername/phone-studio"

if not GITHUB_TOKEN or not GITHUB_REPO:
    raise EnvironmentError(
        "Missing GITHUB_TOKEN or GITHUB_REPO. "
        "Copy .env.example to .env and fill in your values."
    )

gh   = Github(GITHUB_TOKEN)
repo = gh.get_repo(GITHUB_REPO)
app  = FastAPI(title="Phone Studio Context MCP", version="1.0.0")


# ── Helpers ──────────────────────────────────────────────────────────────────

def _read_file(path: str) -> str:
    """Read a file from GitHub. Returns empty string if not found."""
    try:
        return repo.get_contents(path).decoded_content.decode("utf-8")
    except GithubException:
        return f"<!-- File not found: {path} — fill it in to activate this context -->"


def _get_recent_conversations(limit: int = 5) -> list[dict]:
    """Return the most recent N conversation files as a list."""
    try:
        files = repo.get_contents("context/conversations")
        md_files = [f for f in files if f.name.endswith(".md") and f.name != "INDEX.md"]
        md_files.sort(key=lambda x: x.name, reverse=True)
        results = []
        for f in md_files[:limit]:
            results.append({
                "filename": f.name,
                "content": f.decoded_content.decode("utf-8")[:800],  # First 800 chars
            })
        return results
    except GithubException:
        return []


# ── MCP Tools ────────────────────────────────────────────────────────────────

class GetContextRequest(BaseModel):
    task_type: str  # write_captions | generate_ideas | route_lead | transcribe | general
    limit: int = 5


@app.post("/mcp/tools/get_context")
def get_context(req: GetContextRequest):
    """
    Fetch relevant context from GitHub based on task type.
    Used by: Perplexity Computer, Phone Studio Dock LLM inference.

    task_type options:
      write_captions   — returns brand voice + audience + approved examples
      generate_ideas   — returns calendar + recent conversations
      route_lead       — returns product features + CRM context
      general          — returns brand voice + audience only
    """
    context = {
        "brand_voice":   _read_file("docs/BRAND_VOICE.md"),
        "audience":      _read_file("knowledge/audience.md"),
        "llm_routing":   _read_file("docs/LLM_ROUTING.md"),
        "fetched_at":    datetime.utcnow().isoformat(),
        "task_type":     req.task_type,
    }

    if req.task_type == "write_captions":
        context["approved_instagram"] = _read_file("context/approvals/instagram_posts.md")
        context["approved_captions"]  = _read_file("context/approvals/captions.md")

    elif req.task_type == "generate_ideas":
        context["recent_conversations"] = _get_recent_conversations(req.limit)
        context["content_calendar"]     = _read_file("knowledge/content_calendar.json")
        context["content_strategy"]     = _read_file("knowledge/content_strategy.md")

    elif req.task_type == "route_lead":
        context["product_features"] = _read_file("knowledge/product_features.md")

    return context


class SaveConversationRequest(BaseModel):
    title: str           # short slug, e.g. "podcast-script-ep05"
    content: str         # full conversation text
    platform: str = "perplexity"
    status: str = "saved"


@app.post("/mcp/tools/save_conversation")
def save_conversation(req: SaveConversationRequest):
    """
    Commit a new conversation file to context/conversations/.
    Called by Perplexity Computer or manually via the GitHub Action.
    """
    date     = datetime.utcnow().strftime("%Y-%m-%d")
    slug     = req.title.lower().replace(" ", "-")
    filename = f"context/conversations/{date}-{slug}.md"

    file_content = f"""---
date: {date}
title: "{req.title}"
platform: {req.platform}
status: {req.status}
saved_at: {datetime.utcnow().isoformat()}
---

# {req.title}

{req.content}
"""

    try:
        # Check if file exists (update) or create new
        try:
            existing = repo.get_contents(filename)
            repo.update_file(
                filename,
                f"update: {req.title}",
                file_content,
                existing.sha,
            )
            action = "updated"
        except GithubException:
            repo.create_file(filename, f"save: {req.title}", file_content)
            action = "created"

        return {"status": "ok", "action": action, "file": filename}

    except GithubException as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/mcp/tools/list_approved")
def list_approved(platform: Optional[str] = None):
    """
    Return approved content files for consistency checking.
    Optionally filter by platform (instagram, linkedin, etc.)
    """
    files = {
        "instagram": _read_file("context/approvals/instagram_posts.md"),
        "all":       _read_file("context/approvals/captions.md"),
    }
    if platform:
        return {platform: files.get(platform, "Not found")}
    return files


@app.get("/health")
def health():
    return {"status": "ok", "repo": GITHUB_REPO, "time": datetime.utcnow().isoformat()}
