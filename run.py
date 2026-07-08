#!/usr/bin/env python3
"""One-command local dev bootstrap: data stores (Docker) + backend (FastAPI) + frontend
(Next.js) together, in one terminal. Equivalent to `make dev`, as a single entry point —
stdlib only, no extra install needed to run this file itself.

Usage:
    python3 run.py
    ./run.py            # after chmod +x (already set)

Ctrl+C stops the backend and frontend; Docker containers are left running (same as
`make dev` — data you don't want to re-seed every time stays up).
"""

from __future__ import annotations

import shutil
import signal
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent
BACKEND = ROOT / "backend"
WEB = ROOT / "web"


def fail(message: str) -> None:
    sys.exit(f"error: {message}")


def require_on_path(*commands: str) -> None:
    missing = [c for c in commands if shutil.which(c) is None]
    if missing:
        fail(f"required command(s) not found on PATH: {', '.join(missing)}")


def ensure_root_env() -> None:
    env_file = ROOT / ".env"
    if env_file.exists():
        return
    template = ROOT / ".env.development"
    if not template.exists():
        fail(".env.development is missing — can't bootstrap .env. See docs/CONVENTIONS.md.")
    env_file.write_text(template.read_text())
    print(f"→ Created {env_file} from .env.development — fill in blank secrets before "
          f"features that need them (see .env.example for what each one is).")


def ensure_web_env_symlink() -> None:
    # Next.js only auto-loads .env from web/'s own cwd, not a parent directory — the
    # symlink is what makes the shared root .env visible to it (PROGRESS.md).
    web_env = WEB / ".env"
    if web_env.is_symlink() or web_env.exists():
        return
    web_env.symlink_to(Path("..") / ".env")
    print(f"→ Created {web_env} -> ../.env")


def start_docker_compose() -> None:
    print("→ Starting data stores (postgres, mongo, redis, elasticsearch)...")
    subprocess.run(["docker", "compose", "up", "-d"], cwd=ROOT, check=True)


def wait_for_postgres(timeout_seconds: int = 60) -> None:
    print("→ Waiting for Postgres to report healthy...")
    deadline = time.time() + timeout_seconds
    while time.time() < deadline:
        result = subprocess.run(
            ["docker", "compose", "exec", "-T", "postgres", "pg_isready", "-U", "skinlytics"],
            cwd=ROOT,
            capture_output=True,
        )
        if result.returncode == 0:
            print("  Postgres is ready.")
            return
        time.sleep(1)
    print("  Warning: Postgres didn't report healthy within "
          f"{timeout_seconds}s — continuing anyway, but the backend may fail to connect.")


def main() -> None:
    require_on_path("docker", "uv", "npm")
    ensure_root_env()
    ensure_web_env_symlink()

    start_docker_compose()
    wait_for_postgres()

    print("→ Starting backend (uvicorn --reload, :8000) and frontend (next dev, :3000)...")
    print("   Ctrl+C to stop both (data stores keep running).\n")

    backend = subprocess.Popen(
        ["uv", "run", "uvicorn", "app.main:app", "--reload", "--port", "8000"], cwd=BACKEND
    )
    frontend = subprocess.Popen(["npm", "run", "dev"], cwd=WEB)
    processes = [backend, frontend]

    def shutdown(_signum: int, _frame: object) -> None:
        print("\n→ Stopping backend and frontend (data stores are still running — "
              "`docker compose down` to stop those too)...")
        for p in processes:
            p.terminate()
        for p in processes:
            try:
                p.wait(timeout=10)
            except subprocess.TimeoutExpired:
                p.kill()
        sys.exit(0)

    signal.signal(signal.SIGINT, shutdown)
    signal.signal(signal.SIGTERM, shutdown)

    # Exit (and take the other process down with it) if either process dies on its own,
    # e.g. a startup crash — otherwise a broken backend would leave the frontend running
    # against nothing, silently.
    while True:
        for p in processes:
            code = p.poll()
            if code is not None:
                other = frontend if p is backend else backend
                name = "backend" if p is backend else "frontend"
                print(f"\n→ {name} exited (code {code}) — stopping the other process too.")
                other.terminate()
                other.wait(timeout=10)
                sys.exit(code or 1)
        time.sleep(0.5)


if __name__ == "__main__":
    main()
