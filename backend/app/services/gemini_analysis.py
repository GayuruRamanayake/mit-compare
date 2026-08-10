# import os
# import json
# from dotenv import load_dotenv
# from google import genai

# load_dotenv()
# client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])

# MODEL_NAME = "gemini-3.1-flash-lite"


# MODIFIED_PROMPT_TEMPLATE = """You are reviewing a change made to one clause of a legal contract (a Statement of Work).

# ORIGINAL: {original}
# REVISED: {revised}
# TEXT SIMILARITY SCORE: {similarity}% (lower means the wording changed more)

# Respond ONLY with valid JSON, no markdown formatting, in this exact shape:
# {{
#   "summary": "one sentence, plain English, explaining what actually changed and why it matters",
#   "risk_level": "high" | "medium" | "low" | "cosmetic"
# }}

# Guidance for risk_level:
# - "cosmetic": wording/rephrasing only, no change in meaning, obligations, dates, or amounts
# - "low": minor clarification, no real change in party obligations
# - "medium": a real change in terms (dates, minor amounts, process) that should be reviewed but isn't alarming
# - "high": a significant change in liability, payment amounts, termination rights, or obligations that needs careful legal review
# """


# NEW_REMOVED_PROMPT_TEMPLATE = """This clause was {action} in a revised version of a legal contract (a Statement of Work).

# CLAUSE TEXT: {text}

# Respond ONLY with valid JSON, no markdown formatting, in this exact shape:
# {{
#   "summary": "one sentence explaining what this clause does and why its {action} matters",
#   "risk_level": "high" | "medium" | "low" | "cosmetic"
# }}

# Guidance for risk_level:
# - "cosmetic": boilerplate or administrative text with no real legal/financial impact
# - "low": minor procedural clause, unlikely to affect either party materially
# - "medium": a real clause affecting obligations, process, or minor terms
# - "high": a clause affecting liability, payment, termination rights, or other significant obligations
# """


# def _call_gemini(prompt: str) -> dict:
#     """
#     Shared call + parse + fallback logic for both prompt types.
#     Never raises — always returns a usable dict, even if Gemini fails,
#     so a single bad response can't break the whole comparison.
#     """
#     try:
#         response = client.models.generate_content(
#             model=MODEL_NAME,
#             contents=prompt,
#         )
#         text = response.text.strip()

#         # strip markdown code fences if Gemini adds them despite instructions
#         if text.startswith("```"):
#             text = text.split("\n", 1)[1].rsplit("```", 1)[0]

#         result = json.loads(text)
#         return {
#             "summary": result.get("summary", ""),
#             "risk_level": result.get("risk_level", "medium"),
#         }
#     except Exception as e:
#         return {
#             "summary": f"Could not generate summary ({type(e).__name__})",
#             "risk_level": "medium",
#         }


# def analyze_clause_change(original: str, revised: str, similarity: float) -> dict:
#     """Used for clauses matched between both documents but with different wording."""
#     prompt = MODIFIED_PROMPT_TEMPLATE.format(
#         original=original, revised=revised, similarity=similarity
#     )
#     return _call_gemini(prompt)


# def analyze_new_or_removed_clause(text: str, action: str) -> dict:
#     """
#     Used for clauses with no counterpart in the other document.
#     action should be "added" or "deleted".
#     """
#     prompt = NEW_REMOVED_PROMPT_TEMPLATE.format(text=text, action=action)
#     return _call_gemini(prompt)








import os
import json
import asyncio
from dotenv import load_dotenv
from google import genai

load_dotenv()
client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])

MODEL_NAME = "gemini-3.1-flash-lite"

# Free tier is ~15 requests/minute — stay well under it to leave room for
# retries and normal latency variance.
GEMINI_CONCURRENCY_LIMIT = 3
_semaphore = asyncio.Semaphore(GEMINI_CONCURRENCY_LIMIT)


BATCH_PROMPT_TEMPLATE = """You are reviewing changes in a legal contract (a Statement of Work).
Below is a numbered list of clause changes. For EACH numbered item, provide a summary and risk level.

{items}

Respond ONLY with a JSON array (no markdown formatting), with exactly {count} objects in the SAME order as the list above:
[{{"summary": "...", "risk_level": "high"|"medium"|"low"|"cosmetic"}}, ...]

Guidance for risk_level:
- "cosmetic": wording/rephrasing only, no change in meaning, obligations, dates, or amounts
- "low": minor clarification, no real change in party obligations
- "medium": a real change in terms (dates, minor amounts, process) that should be reviewed but isn't alarming
- "high": a significant change in liability, payment amounts, termination rights, or obligations that needs careful legal review
"""


def chunk_list(items: list, size: int):
    for i in range(0, len(items), size):
        yield items[i:i + size]


def analyze_batch(clauses: list[dict]) -> list[dict]:
    """
    clauses: list of dicts, each either
      {"type": "modified", "original": ..., "revised": ..., "similarity": ...}
      {"type": "added", "text": ...} or {"type": "deleted", "text": ...}
    Returns a list of {"summary", "risk_level"} in the same order.
    Never raises — falls back to a generic per-clause result on any failure.
    """
    items_text = ""
    for i, c in enumerate(clauses, 1):
        if c["type"] == "modified":
            items_text += f"\n{i}. ORIGINAL: {c['original']}\n   REVISED: {c['revised']}\n   SIMILARITY: {c['similarity']}%\n"
        else:
            items_text += f"\n{i}. {c['type'].upper()} CLAUSE: {c['text']}\n"

    prompt = BATCH_PROMPT_TEMPLATE.format(items=items_text, count=len(clauses))

    try:
        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=prompt,
            config={"temperature": 0.1, "response_mime_type": "application/json"},
        )
        text = response.text.strip()
        if text.startswith("```"):
            text = text.split("\n", 1)[1].rsplit("```", 1)[0]

        results = json.loads(text)

        if not isinstance(results, list) or len(results) != len(clauses):
            raise ValueError(f"Expected {len(clauses)} results, got {len(results) if isinstance(results, list) else 'non-list'}")

        return [
            {"summary": r.get("summary", ""), "risk_level": r.get("risk_level", "medium")}
            for r in results
        ]
    except Exception:
        # fall back per-clause rather than losing the whole batch silently
        return [{"summary": "Could not generate summary (batch error)", "risk_level": "medium"} for _ in clauses]


async def analyze_batch_throttled(batch: list[dict]) -> list[dict]:
    """Runs analyze_batch on a background thread, capped by the concurrency semaphore."""
    async with _semaphore:
        return await asyncio.to_thread(analyze_batch, batch)