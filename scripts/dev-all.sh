#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_CMD=(npm start --prefix "$ROOT_DIR/backend")
ADMIN_CMD=(npm run dev --prefix "$ROOT_DIR/admin")
FRONTEND_CMD=(npm start --prefix "$ROOT_DIR/frontend")

pids=()

cleanup() {
  echo "\nStopping dev servers..."
  for pid in "${pids[@]}"; do
    if kill -0 "$pid" 2>/dev/null; then
      kill "$pid" 2>/dev/null || true
      wait "$pid" 2>/dev/null || true
    fi
  done
}

trap cleanup EXIT
trap cleanup INT
trap cleanup TERM

echo "Starting backend..."
"${BACKEND_CMD[@]}" &
pids+=($!)
sleep 1

echo "Starting admin dashboard..."
"${ADMIN_CMD[@]}" &
pids+=($!)
sleep 1

echo "Starting storefront..."
"${FRONTEND_CMD[@]}" &
pids+=($!)

echo "All services launched. Press Ctrl+C to stop.\n"

wait -n || true
wait
