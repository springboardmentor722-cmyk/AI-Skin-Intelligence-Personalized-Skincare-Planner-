#!/usr/bin/env bash
# Skinlytics — one-time local bootstrap.
# Safe to re-run. Does not overwrite an existing .env.

set -euo pipefail

command -v docker >/dev/null 2>&1 || { echo "docker is required: https://docs.docker.com/get-docker/"; exit 1; }
docker compose version >/dev/null 2>&1 || { echo "docker compose (v2) is required."; exit 1; }

if [ ! -f .env ]; then
	cp .env.development .env
	echo "Created .env from .env.development — fill in the blank secret values before running services that need them."
else
	echo ".env already exists — leaving it as is."
fi

echo "Starting local data stores (postgres, mongo, redis, elasticsearch)..."
docker compose up -d

echo
echo "Data stores are up. Next steps depend on what's scaffolded so far — see PROGRESS.md."
echo "  - backend/ (FastAPI):     not yet scaffolded"
echo "  - web/ (Next.js):         not yet scaffolded (design assets only, in web/designs/)"
