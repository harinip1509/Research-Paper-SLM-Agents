@echo off
REM Portable launcher for ScholarForge (Windows)
cd /d "%~dp0"
set PORT=8000

echo [ScholarForge] Checking Python virtual environment...
if not exist ".venv\Scripts\python.exe" (
    echo [ScholarForge] Creating virtual environment ^(.venv^)...
    python -m venv .venv
    .venv\Scripts\pip install --upgrade pip
    .venv\Scripts\pip install -r requirements.txt
)

echo [ScholarForge] Starting ScholarForge server on http://localhost:%PORT% ...
.venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port %PORT%
