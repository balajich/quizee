#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$PROJECT_ROOT"

echo "==> Starting query-service (and postgres if not running)..."
docker compose up -d query-service
echo "==> Query service running."
echo "    API:  http://localhost:8002"
echo "    Docs: http://localhost:8002/docs"
