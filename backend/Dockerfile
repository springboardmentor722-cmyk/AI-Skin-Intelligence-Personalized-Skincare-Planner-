# Skinlytics backend image — shared by the `worker` service (M3-A) and, at M4, the
# `api` service (ADR-005: monolith until then). Default CMD runs the arq worker;
# docker-compose.yml's `worker` entry doesn't need to override it, but a future `api`
# entry would (uvicorn instead).
FROM python:3.12-slim

WORKDIR /app

RUN pip install --no-cache-dir uv

COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project

COPY . .
RUN uv sync --frozen --no-dev

CMD ["uv", "run", "--frozen", "--no-dev", "arq", "app.worker.main.WorkerSettings"]
