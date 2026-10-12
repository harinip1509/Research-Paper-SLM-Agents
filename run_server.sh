#!/bin/bash
# Helper script to launch ScholarForge backend daemon

PORT=8000
echo "[ScholarForge] Checking if port $PORT is currently occupied..."
PID=$(lsof -ti :$PORT)
if [ -n "$PID" ]; then
  echo "[ScholarForge] Stopping existing process on port $PORT (PID: $PID)..."
  kill -9 "$PID" 2>/dev/null
  sleep 1
fi

echo "[ScholarForge] Starting ScholarForge server on http://0.0.0.0:$PORT..."
.venv/bin/python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT
