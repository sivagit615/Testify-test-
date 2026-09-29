"""
Ingestion Service
─────────────────
Handles multi-format PRD input parsing, normalisation, and semantic chunking.
Supports: plain text, user stories, Jira-style tickets, API spec fragments.
"""
from __future__ import annotations
import re
from dataclasses import dataclass


@dataclass
class IngestionResult:
    raw_text: str
    format_detected: str          # "user_stories" | "prd" | "api_spec" | "jira" | "plain"
    chunks: list[str]
    word_count: int
    actors_hint: list[str]        # Quick surface-level actor scan


# ── Format detection ──────────────────────────────────────────────────────────

_PATTERNS = {
    "jira": re.compile(r"\b(story|epic|task|bug|sprint|acceptance criteria)\b", re.I),
    "api_spec": re.compile(r"\b(endpoint|GET|POST|PUT|DELETE|request|response|payload|status\s*code)\b", re.I),
    "user_stories": re.compile(r"\bAs (a|an)\b.*(I want|so that)", re.I),
    "prd": re.compile(r"\b(product requirement|PRD|functional requirement|business rule|feature spec)\b", re.I),
}

_ACTOR_PATTERN = re.compile(
    r"(?:As (?:a|an) ([\w\s]+?)(?:,| I)|(?:actor|role|user|admin|customer|guest)[:\s]+([\w\s]+?)(?:\.|,|\n))",
    re.I,
)


def detect_format(text: str) -> str:
    scores = {fmt: len(pat.findall(text)) for fmt, pat in _PATTERNS.items()}
    best = max(scores, key=scores.get)
    return best if scores[best] > 0 else "plain"


def extract_actors_hint(text: str) -> list[str]:
    actors: set[str] = set()
    for m in _ACTOR_PATTERN.finditer(text):
        raw = (m.group(1) or m.group(2) or "").strip().lower()
        if raw and len(raw) < 40:
            actors.add(raw.strip().title())
    return sorted(actors)


# ── Chunking ──────────────────────────────────────────────────────────────────

def _chunk_by_sections(text: str, max_chunk: int = 1_500) -> list[str]:
    """
    Split on section headings or blank lines. Falls back to
    sliding-window character split if no natural boundaries found.
    """
    # Try heading splits first
    heading_re = re.compile(r"\n#{1,3} .+|\n[A-Z][A-Z\s]{4,}:\s*\n", re.M)
    positions = [m.start() for m in heading_re.finditer(text)]

    if len(positions) >= 2:
        boundaries = positions + [len(text)]
        chunks = []
        for i in range(len(positions)):
            chunk = text[boundaries[i]: boundaries[i + 1]].strip()
            if chunk:
                chunks.append(chunk)
        return chunks or [text]

    # Paragraph split
    paragraphs = [p.strip() for p in re.split(r"\n{2,}", text) if p.strip()]
    if len(paragraphs) > 1:
        # Merge small paragraphs
        chunks, buf = [], ""
        for p in paragraphs:
            if len(buf) + len(p) < max_chunk:
                buf = f"{buf}\n\n{p}".strip()
            else:
                if buf:
                    chunks.append(buf)
                buf = p
        if buf:
            chunks.append(buf)
        return chunks

    # Sliding window fallback
    return [text[i: i + max_chunk] for i in range(0, len(text), max_chunk)]


# ── Public API ────────────────────────────────────────────────────────────────

def ingest(raw_text: str) -> IngestionResult:
    """Parse, normalise, and chunk the input text."""
    # Normalise whitespace
    text = re.sub(r"\r\n?", "\n", raw_text)
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{4,}", "\n\n\n", text).strip()

    fmt = detect_format(text)
    chunks = _chunk_by_sections(text)
    actors = extract_actors_hint(text)
    words = len(text.split())

    return IngestionResult(
        raw_text=text,
        format_detected=fmt,
        chunks=chunks,
        word_count=words,
        actors_hint=actors,
    )
