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

import io
import shutil
import socket
import subprocess
import sys
from pathlib import Path
from typing import NoReturn
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent
BACKEND = ROOT / "backend"

# Python fully-buffers stdout when it isn't a TTY (e.g. piped, redirected, or captured
# by tooling) — without this, this script's own prints (including the datastore
# warning below) can sit invisible indefinitely while uvicorn's output (which bypasses
# Python's buffering) appears fine, making the warning look like it never fired.
if isinstance(sys.stdout, io.TextIOWrapper):
    # On Windows, a redirected/non-TTY stdout falls back to the system codepage
    # (cp1252) rather than UTF-8, which can't encode the "→"/"⚠" characters this
    # script prints — force UTF-8 explicitly rather than relying on the console's
    # default.
    sys.stdout.reconfigure(line_buffering=True, encoding="utf-8")


def fail(message: str) -> NoReturn:
    sys.exit(f"error: {message}")


def require_on_path(*commands: str) -> None:
    missing = [c for c in commands if shutil.which(c) is None]
    if missing:
        fail(f"required command(s) not found on PATH: {', '.join(missing)}")


def read_env_var(key: str, default: str) -> str:
    env_file = ROOT / ".env"
    if not env_file.exists():
        return default
    for line in env_file.read_text().splitlines():
        if line.strip().startswith(f"{key}="):
            return line.split("=", 1)[1].strip() or default
    return default


def is_port_open(host: str, port: int, timeout: float = 1.5) -> bool:
    try:
        with socket.create_connection((host, port), timeout=timeout):
            return True
    except OSError:
        return False


def warn_if_datastores_unreachable() -> None:
    # The backend talks to Postgres/Mongo/Redis directly (app/db/*.py) — when one is
    # down, the failure shows up as a stack trace from deep inside a request handler
    # (or the catch-all 500 handler), not a clear message pointing at the actual cause.
    # Splitting run.py into one script per concern (docker_run.py / backend_run.py /
    # web_run.py) removed the previous guarantee that the data stores were already up
    # before this script started — this check restores an equivalent, explicit warning.
    checks = [
        ("Postgres", read_env_var(
            "DATABASE_URL", "postgresql://skinlytics:skinlytics@localhost:5432/skinlytics"
        ), 5432),
        ("MongoDB", read_env_var("MONGO_URI", "mongodb://localhost:27017/skinlytics"), 27017),
        ("Redis", read_env_var("REDIS_URL", "redis://localhost:6379/0"), 6379),
    ]
    down: list[str] = []
    for label, url, default_port in checks:
        parsed = urlparse(url)
        host, port = parsed.hostname or "localhost", parsed.port or default_port
        if not is_port_open(host, port):
            down.append(f"{label} ({host}:{port})")

    if down:
        print(
            "⚠ Not reachable: " + ", ".join(down) + " — endpoints that need "
            "them will fail with a confusing 500 until they're up.\n"
            "  Run `python3 docker_run.py` first (in another terminal), then retry.\n"
        )


def main() -> None:
    require_on_path("uv")
    warn_if_datastores_unreachable()
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
