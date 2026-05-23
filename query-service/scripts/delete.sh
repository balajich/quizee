#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$PROJECT_ROOT"

echo "==> Stopping and removing query-service..."
docker compose stop query-service
docker compose rm -f query-service
echo "==> query-service removed."
