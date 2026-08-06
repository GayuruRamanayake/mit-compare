from typing import Optional
from datetime import datetime
from sqlmodel import SQLModel, Field, Column, JSON


class Comparison(SQLModel, table=True):
    id: str = Field(primary_key=True)  # the comparison_id UUID
    original_filename: str
    revised_filename: str
    status: str = "uploaded"
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # stored as JSON columns — each is just a list[str] of parsed paragraphs
    original_paragraphs: list[str] = Field(sa_column=Column(JSON))
    revised_paragraphs: list[str] = Field(sa_column=Column(JSON))


class Clause(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    comparison_id: str = Field(foreign_key="comparison.id", index=True)

    clause_id: str
    status: str
    original_text: Optional[str] = None
    revised_text: Optional[str] = None
    original_index: Optional[int] = None
    revised_index: Optional[int] = None
    similarity: float = 0.0
    match_method: Optional[str] = None
    ai_summary: Optional[str] = None
    risk_level: Optional[str] = None

    # review state — must be present here
    reviewed: bool = False
    flagged: bool = False