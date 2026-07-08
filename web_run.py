#!/usr/bin/env python3
"""Start the Skinlytics Next.js frontend (`npm run dev`, :3000). stdlib only, no extra
install needed to run this file itself (it shells out to `npm`, which manages the
frontend's own dependencies).

Run `docker_run.py` first — this assumes the root `.env` (and the `web/.env` symlink
`docker_run.py` creates) are already in place.

Usage:
    python3 web_run.py
    ./web_run.py            # after chmod +x
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
WEB = ROOT / "web"

# Python fully-buffers stdout when it isn't a TTY (e.g. piped, redirected, or captured
# by tooling) — without this, this script's own prints (including the datastore
# warning below) can sit invisible indefinitely while `npm run dev`'s output (which
# bypasses Python's buffering) appears fine, making the warning look like it never fired.
if isinstance(sys.stdout, io.TextIOWrapper):
    sys.stdout.reconfigure(line_buffering=True)


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


def warn_if_postgres_unreachable() -> None:
    # Better Auth (web/lib/auth.ts) talks to Postgres directly for every sign-in/
    # sign-up/session call — when it's down this surfaces as a confusing 500 deep in
    # Better Auth's own error handler (raw ECONNREFUSED stack trace), not a clear message
    # pointing at the actual cause. Splitting run.py into one script per concern
    # (docker_run.py / backend_run.py / web_run.py) removed the previous guarantee that
    # Postgres was already up before this script started — this check restores an
    # equivalent, explicit warning instead of a silent bug report waiting to happen.
    database_url = read_env_var(
        "DATABASE_URL", "postgresql://skinlytics:skinlytics@localhost:5432/skinlytics"
    )
    parsed = urlparse(database_url)
    host, port = parsed.hostname or "localhost", parsed.port or 5432
    if not is_port_open(host, port):
        print(
            f"⚠ Postgres ({host}:{port}) isn't reachable — sign-in/sign-up will fail "
            "with a confusing 500 until it's up.\n"
            "  Run `python3 docker_run.py` first (in another terminal), then retry.\n"
        )


def main() -> None:
    require_on_path("npm")
    warn_if_postgres_unreachable()
    print("→ Starting frontend (next dev, :3000). Ctrl+C to stop.\n")
    try:
        subprocess.run(["npm", "run", "dev"], cwd=WEB, check=True)
    except KeyboardInterrupt:
        print("\n→ Frontend stopped.")
    except subprocess.CalledProcessError as exc:
        sys.exit(exc.returncode)


if __name__ == "__main__":
    main()
