# Skinlytics — shared task vocabulary (docs/CONVENTIONS.md).
# Targets that depend on backend/ or web/ guard themselves with a clear message
# until those scaffolds exist (tracked in PROGRESS.md) instead of failing silently.

.PHONY: dev up down migrate seed ingest-knowledge ingest-products test lint typecheck eval graph openapi worker rebuild-derived

up:
	docker compose up -d
	@echo "waiting for minio, then provisioning the dev bucket..."
	@for i in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15; do \
		docker compose exec -T minio mc alias set local http://localhost:9000 skinlytics skinlytics_dev_only >/dev/null 2>&1 && break; \
		sleep 2; \
	done
	@docker compose exec -T minio mc mb --ignore-existing local/skinlytics-storage >/dev/null 2>&1 || true

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

ingest-knowledge:
	@if [ -d backend ]; then \
		cd backend && uv run python -m app.db.ingest_knowledge; \
	else \
		echo "backend/ does not exist yet — nothing to ingest."; \
	fi

ingest-products:
	@if [ -d backend ]; then \
		cd backend && uv run python -m app.services.admin.ingest.products; \
	else \
		echo "backend/ does not exist yet — nothing to ingest."; \
	fi

worker:
	@if [ -d backend ]; then \
		cd backend && uv run arq app.worker.main.WorkerSettings; \
	else \
		echo "backend/ does not exist yet — nothing to run."; \
	fi

rebuild-derived:
	@if [ -d backend ]; then \
		cd backend && uv run python -m app.worker.rebuild; \
	else \
		echo "backend/ does not exist yet — nothing to rebuild."; \
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
		cd backend && uv run python -c "import json,app.main; json.dump(app.main.app.openapi(), open('../openapi.json','w'))" && \
		cd ../web && npx openapi-typescript ../openapi.json -o lib/api-types.ts; \
	else \
		echo "backend/ and web/ must both exist before generating the typed client."; \
	fi
