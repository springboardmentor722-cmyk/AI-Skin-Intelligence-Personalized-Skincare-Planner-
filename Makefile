# Skinlytics — shared task vocabulary (docs/CONVENTIONS.md).
# Targets that depend on backend/ or web/ guard themselves with a clear message
# until those scaffolds exist (tracked in PROGRESS.md) instead of failing silently.

.PHONY: dev up down migrate seed test lint typecheck eval graph openapi

up:
	docker compose up -d

down:
	docker compose down

dev: up
	@if [ -d web ]; then (cd web && npm run dev) & fi
	@if [ -d backend ]; then (cd backend && uv run uvicorn app.main:app --reload) & fi
	@if [ ! -d web ] && [ ! -d backend ]; then \
		echo "web/ and backend/ are not scaffolded yet — data stores are up via 'make up'."; \
	fi
	@wait

migrate:
	@if [ -d backend ]; then \
		cd backend && uv run alembic upgrade head; \
	else \
		echo "backend/ does not exist yet — nothing to migrate."; \
	fi

seed:
	@if [ -d backend ]; then \
		cd backend && uv run python -m app.db.seed; \
	else \
		echo "backend/ does not exist yet — nothing to seed."; \
	fi

test:
	@if [ -d backend ]; then (cd backend && uv run pytest) || exit 1; fi
	@if [ -d web ]; then (cd web && npm test) || exit 1; fi
	@if [ ! -d backend ] && [ ! -d web ]; then echo "No test suites yet."; fi

lint:
	@if [ -d backend ]; then (cd backend && uv run ruff check .); fi
	@if [ -d web ]; then (cd web && npm run lint); fi
	@if [ ! -d backend ] && [ ! -d web ]; then echo "Nothing to lint yet."; fi

typecheck:
	@if [ -d backend ]; then (cd backend && uv run mypy app); fi
	@if [ -d web ]; then (cd web && npm run typecheck); fi
	@if [ ! -d backend ] && [ ! -d web ]; then echo "Nothing to typecheck yet."; fi

eval:
	@if [ -d ml ]; then (cd ml && uv run python -m eval.run); else echo "ml/ does not exist yet (M2+)."; fi

graph:
	@echo "Graphify setup deferred — see docs/GRAPHIFY_SETUP.md and ADR-006 (docs/DECISIONS.md)."

openapi:
	@if [ -d backend ] && [ -d web ]; then \
		uv run --project backend python -c "import json,app.main; json.dump(app.main.app.openapi(), open('openapi.json','w'))" && \
		cd web && npx openapi-typescript ../openapi.json -o lib/api-types.ts; \
	else \
		echo "backend/ and web/ must both exist before generating the typed client."; \
	fi
