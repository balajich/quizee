#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

usage() {
  echo "Usage: $0 {build|up|down|reset|logs [service]}"
  echo ""
  echo "  build          Build all service images"
  echo "  up             Build (if needed) and start all services"
  echo "  down           Stop and remove all containers and networks"
  echo "  reset          Destroy the database volume and restart with a fresh schema"
  echo "  logs [service] Tail logs (all services, or one: postgres|command-service|query-service)"
  exit 1
}

COMMAND="${1:-}"

case "$COMMAND" in
  build)
    echo "==> Building all images..."
    docker compose build
    echo "==> All images built."
    ;;
  up)
    echo "==> Starting full stack..."
    docker compose up -d --build
    echo "==> All services running."
    echo "    Command API: http://localhost:8001/docs"
    echo "    Query API:   http://localhost:8002/docs"
    ;;
  down)
    echo "==> Stopping and removing all containers..."
    docker compose down
    echo "==> Stack stopped."
    ;;
  reset)
    echo "==> Tearing down containers and removing database volume..."
    docker compose down -v
    echo "==> Rebuilding images and starting with a fresh schema..."
    docker compose up -d --build
    echo "==> Stack reset complete."
    echo "    Command API: http://localhost:8001/docs"
    echo "    Query API:   http://localhost:8002/docs"
    ;;
  logs)
    SERVICE="${2:-}"
    docker compose logs -f $SERVICE
    ;;
  *)
    usage
    ;;
esac
