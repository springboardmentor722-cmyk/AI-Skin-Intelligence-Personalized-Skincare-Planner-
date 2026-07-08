#!/usr/bin/env python3
"""Start Skinlytics' local data stores (Docker): postgres, mongo, redis, elasticsearch.
Also bootstraps the root `.env` (and the `web/.env` symlink) on first run. Run this
first — `backend_run.py` and `web_run.py` each assume the data stores and `.env` are
already in place. stdlib only, no extra install needed to run this file itself.

Usage:
    python3 docker_run.py
    ./docker_run.py            # after chmod +x

Leaves the Docker containers running on exit (same as `make up` — data you don't want
to re-seed every time stays up); `docker compose down` to stop them.
"""

from __future__ import annotations

import io
import shutil
import subprocess
import sys
import time
from pathlib import Path
from typing import NoReturn

ROOT = Path(__file__).resolve().parent
WEB = ROOT / "web"

# Python fully-buffers stdout when it isn't a TTY (e.g. piped, redirected, or captured
# by tooling) — without this, these prints can sit invisible for minutes while
# subprocess output (which bypasses Python's buffering) appears fine, making the script
# look stuck or silent when it isn't.
if isinstance(sys.stdout, io.TextIOWrapper):
    sys.stdout.reconfigure(line_buffering=True)


def fail(message: str) -> NoReturn:
    sys.exit(f"error: {message}")


# Docker Desktop on macOS runs its daemon without always symlinking the `docker` CLI
# into /usr/local/bin — the binary is there, just not on PATH. That's a common, working
# install, not a broken one, so fall back to the known location instead of failing.
MAC_DOCKER_DESKTOP_CLI = Path("/Applications/Docker.app/Contents/Resources/bin/docker")


def find_docker() -> str | None:
    found = shutil.which("docker")
    if found:
        return found
    if sys.platform == "darwin" and MAC_DOCKER_DESKTOP_CLI.exists():
        return str(MAC_DOCKER_DESKTOP_CLI)
    return None


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


def start_docker_compose(docker: str) -> None:
    print("→ Starting data stores (postgres, mongo, redis, elasticsearch)...")
    subprocess.run([docker, "compose", "up", "-d"], cwd=ROOT, check=True)


def wait_for_postgres(docker: str, timeout_seconds: int = 60) -> None:
    print("→ Waiting for Postgres to report healthy...")
    deadline = time.time() + timeout_seconds
    while time.time() < deadline:
        result = subprocess.run(
            [docker, "compose", "exec", "-T", "postgres", "pg_isready", "-U", "skinlytics"],
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
    docker = find_docker()
    if docker is None:
        fail(
            "docker not found on PATH, and no Docker Desktop install found at "
            f"{MAC_DOCKER_DESKTOP_CLI}. Install Docker Desktop, then re-run."
        )
    if docker != "docker":
        print(f"→ `docker` isn't on PATH — using Docker Desktop's CLI directly at {docker}")
        print(f'   (fix for good with: ln -s "{docker}" /usr/local/bin/docker)\n')

    ensure_root_env()
    ensure_web_env_symlink()

    start_docker_compose(docker)
    wait_for_postgres(docker)

    print("\n→ Data stores are up. Next, in separate terminals:")
    print("   python3 backend_run.py")
    print("   python3 web_run.py")


if __name__ == "__main__":
    main()
