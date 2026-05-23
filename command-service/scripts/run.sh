#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$PROJECT_ROOT"

echo "==> Starting command-service (and postgres if not running)..."
docker compose up -d command-service
echo "==> Command service running."
echo "    API:  http://localhost:8001"
echo "    Docs: http://localhost:8001/docs"
