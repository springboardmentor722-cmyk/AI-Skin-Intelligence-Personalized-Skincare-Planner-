"""AI interface contracts (docs/AI_ML.md 'Model interfaces'). M1 implements only the
stub side (ADR-007); real models land M2+ behind these same shapes."""

from pydantic import BaseModel


class Reason(BaseModel):
    label: str
    detail: str


class RecoItem(BaseModel):
    product_id: int
    match_score: float  # 0-100, drives the Match ring (docs/AI_ML.md)
    reasons: list[Reason]
