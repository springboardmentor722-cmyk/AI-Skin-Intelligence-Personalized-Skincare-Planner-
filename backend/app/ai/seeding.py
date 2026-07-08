import hashlib
import random


def seeded_random(*parts: str) -> random.Random:
    """Deterministic RNG for M1 AI stubs (ADR-007: 'deterministic, hash(user_id)-seeded
    placeholder results'). Python's builtin hash() is randomized per-process
    (PYTHONHASHSEED) and would give different placeholder results on every restart —
    this stays stable across processes and machines."""
    digest = hashlib.sha256("|".join(parts).encode()).digest()
    seed = int.from_bytes(digest[:8], "big")
    return random.Random(seed)
