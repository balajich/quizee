#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$PROJECT_ROOT"

echo "==> Stopping and removing command-service..."
docker compose stop command-service
docker compose rm -f command-service
echo "==> command-service removed."
