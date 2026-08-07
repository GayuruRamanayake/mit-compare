from typing import Optional
from sqlmodel import Session, select
from app.database import engine
from app.models import Comparison, Clause

import os

UPLOADS_DIR = os.path.join(os.path.dirname(os.environ.get("DB_PATH", "./comparisons.db")), "uploads")
os.makedirs(UPLOADS_DIR, exist_ok=True)


def save_file(comparison_id: str, side: str, filename: str, file_bytes: bytes) -> str:
    """side is 'original' or 'revised'. Returns the saved file's path."""
    ext = filename.rsplit(".", 1)[-1].lower()
    path = os.path.join(UPLOADS_DIR, f"{comparison_id}_{side}.{ext}")
    with open(path, "wb") as f:
        f.write(file_bytes)
    return path


def get_file_path(comparison_id: str, side: str, filename: str) -> str | None:
    ext = filename.rsplit(".", 1)[-1].lower()
    path = os.path.join(UPLOADS_DIR, f"{comparison_id}_{side}.{ext}")
    return path if os.path.exists(path) else None


def save_comparison(comparison_id: str, record: dict) -> None:
    with Session(engine) as session:
        comparison = Comparison(
            id=comparison_id,
            original_filename=record["original_filename"],
            revised_filename=record["revised_filename"],
            status=record["status"],
            original_paragraphs=record["original_paragraphs"],
            revised_paragraphs=record["revised_paragraphs"],
        )
        session.add(comparison)
        session.commit()


def get_comparison(comparison_id: str) -> Optional[dict]:
    with Session(engine) as session:
        comparison = session.get(Comparison, comparison_id)
        if comparison is None:
            return None
        return {
            "original_filename": comparison.original_filename,
            "revised_filename": comparison.revised_filename,
            "status": comparison.status,
            "original_paragraphs": comparison.original_paragraphs,
            "revised_paragraphs": comparison.revised_paragraphs,
        }


def save_clauses(comparison_id: str, clauses: list[dict]) -> None:
    """Cache computed clause analysis so it doesn't need to be recomputed."""
    with Session(engine) as session:
        # clear any previously cached clauses for this comparison first
        existing = session.exec(select(Clause).where(Clause.comparison_id == comparison_id)).all()
        for row in existing:
            session.delete(row)

        for c in clauses:
            session.add(Clause(
                comparison_id=comparison_id,
                clause_id=c["clause_id"],
                status=c["status"],
                original_text=c.get("original_text"),
                revised_text=c.get("revised_text"),
                original_index=c.get("original_index"),
                revised_index=c.get("revised_index"),
                similarity=c.get("similarity", 0.0),
                match_method=c.get("match_method"),
                ai_summary=c.get("ai_summary"),
                risk_level=c.get("risk_level"),
            ))
        session.commit()


def get_clauses(comparison_id: str) -> Optional[list[dict]]:
    """Returns cached clauses if they exist, else None (caller should compute)."""
    with Session(engine) as session:
        rows = session.exec(select(Clause).where(Clause.comparison_id == comparison_id)).all()
        if not rows:
            return None
        return [
            {
                "clause_id": r.clause_id,
                "status": r.status,
                "original_text": r.original_text,
                "revised_text": r.revised_text,
                "original_index": r.original_index,
                "revised_index": r.revised_index,
                "similarity": r.similarity,
                "match_method": r.match_method,
                "ai_summary": r.ai_summary,
                "risk_level": r.risk_level,
                "reviewed": r.reviewed,
                "flagged": r.flagged,
            }
            for r in rows
        ]

def update_clause_review(comparison_id: str, clause_id: str, reviewed: Optional[bool] = None, flagged: Optional[bool] = None) -> Optional[dict]:
    with Session(engine) as session:
        row = session.exec(
            select(Clause).where(Clause.comparison_id == comparison_id, Clause.clause_id == clause_id)
        ).first()
        if row is None:
            return None

        if reviewed is not None:
            row.reviewed = reviewed
        if flagged is not None:
            row.flagged = flagged

        session.add(row)
        session.commit()
        session.refresh(row)

        return {
            "clause_id": row.clause_id,
            "reviewed": row.reviewed,
            "flagged": row.flagged,
        }