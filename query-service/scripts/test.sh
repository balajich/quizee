#!/usr/bin/env bash
set -euo pipefail

SERVICE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TESTS_DIR="$SERVICE_DIR/tests"

cd "$TESTS_DIR"

if [ ! -d ".venv" ]; then
    echo "==> Creating virtual environment..."
    python3 -m venv .venv
fi

# Activate venv (Git Bash on Windows uses Scripts/, Unix uses bin/)
if [ -f ".venv/Scripts/activate" ]; then
    source .venv/Scripts/activate
else
    source .venv/bin/activate
fi

echo "==> Installing test dependencies..."
pip install -q -r requirements.txt

REPORT="$TESTS_DIR/report.html"

echo "==> Running BDD tests for query-service..."
echo "    Command target: ${COMMAND_URL:-http://localhost:8001}"
echo "    Query target:   ${QUERY_URL:-http://localhost:8002}"
echo ""
pytest -v --tb=short --html="$REPORT" --self-contained-html "$@"

echo ""
echo "==> HTML report: $REPORT"

deactivate 2>/dev/null || true
