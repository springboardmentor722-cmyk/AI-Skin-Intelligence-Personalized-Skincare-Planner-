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

import shutil
import subprocess
import sys
from pathlib import Path
from typing import NoReturn

ROOT = Path(__file__).resolve().parent
WEB = ROOT / "web"


def fail(message: str) -> NoReturn:
    sys.exit(f"error: {message}")


def require_on_path(*commands: str) -> None:
    missing = [c for c in commands if shutil.which(c) is None]
    if missing:
        fail(f"required command(s) not found on PATH: {', '.join(missing)}")


def main() -> None:
    require_on_path("npm")
    print("→ Starting frontend (next dev, :3000). Ctrl+C to stop.\n")
    try:
        subprocess.run(["npm", "run", "dev"], cwd=WEB, check=True)
    except KeyboardInterrupt:
        print("\n→ Frontend stopped.")
    except subprocess.CalledProcessError as exc:
        sys.exit(exc.returncode)


if __name__ == "__main__":
    main()
