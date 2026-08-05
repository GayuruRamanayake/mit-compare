from typing import TypedDict


class ComparisonRecord(TypedDict):
    original_filename: str
    original_bytes: bytes
    revised_filename: str
    revised_bytes: bytes
    status: str  # "uploaded" | "parsed" | "failed"


# simple in-memory store — resets on server restart, single-process only
# fine for local dev, will be replaced with a real DB later
_comparisons: dict[str, ComparisonRecord] = {}


def save_comparison(comparison_id: str, record: ComparisonRecord) -> None:
    _comparisons[comparison_id] = record


def get_comparison(comparison_id: str) -> ComparisonRecord | None:
    return _comparisons.get(comparison_id)