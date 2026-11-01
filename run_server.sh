#!/bin/bash
# Portable launcher for ScholarForge (macOS / Linux)
set -e

cd "$(dirname "$0")"
PORT=8000

echo "[ScholarForge] Checking Python virtual environment..."
if [ ! -x ".venv/bin/python" ] || ! .venv/bin/python -c "import fastapi, uvicorn" >/dev/null 2>&1; then
  echo "[ScholarForge] Setting up local virtual environment (.venv) for this machine..."
  rm -rf .venv
  python3 -m venv .venv
  .venv/bin/pip install --upgrade pip
  .venv/bin/pip install -r requirements.txt
fi

echo "[ScholarForge] Checking if port $PORT is currently occupied..."
PID=$(lsof -ti :$PORT || true)
if [ -n "$PID" ]; then
  echo "[ScholarForge] Stopping existing process on port $PORT (PID: $PID)..."
  kill -9 $PID 2>/dev/null || true
  sleep 1
fi

echo "[ScholarForge] Starting ScholarForge server on http://localhost:$PORT ..."
.venv/bin/python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT
