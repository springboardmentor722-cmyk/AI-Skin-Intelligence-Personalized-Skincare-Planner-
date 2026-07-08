#!/usr/bin/env python3
"""Start the Skinlytics FastAPI backend (uvicorn --reload, :8000). stdlib only, no extra
install needed to run this file itself (it shells out to `uv`, which manages the
backend's own dependencies).

Run `docker_run.py` first — this assumes the data stores and root `.env` are already up.

Usage:
    python3 backend_run.py
    ./backend_run.py            # after chmod +x
"""

from __future__ import annotations

import shutil
import subprocess
import sys
from pathlib import Path
from typing import NoReturn

ROOT = Path(__file__).resolve().parent
BACKEND = ROOT / "backend"


def fail(message: str) -> NoReturn:
    sys.exit(f"error: {message}")


def require_on_path(*commands: str) -> None:
    missing = [c for c in commands if shutil.which(c) is None]
    if missing:
        fail(f"required command(s) not found on PATH: {', '.join(missing)}")


def main() -> None:
    require_on_path("uv")
    print("→ Starting backend (uvicorn --reload, :8000). Ctrl+C to stop.\n")

    # Popen (not subprocess.run) so Ctrl+C is guaranteed to stop `uv`'s uvicorn child
    # too, explicitly — not just whichever process happens to share this terminal's
    # process group (true interactively, not guaranteed under every process manager).
    proc = subprocess.Popen(
        ["uv", "run", "uvicorn", "app.main:app", "--reload", "--port", "8000"],
        cwd=BACKEND,
    )
    try:
        sys.exit(proc.wait())
    except KeyboardInterrupt:
        print("\n→ Stopping backend...")
        proc.terminate()
        try:
            proc.wait(timeout=10)
        except subprocess.TimeoutExpired:
            proc.kill()
        sys.exit(0)


if __name__ == "__main__":
    main()
