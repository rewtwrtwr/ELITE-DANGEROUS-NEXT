@echo off
REM Elite Dangerous NEXT - Layout Manager Launcher
REM This script starts both the Node.js server and opens the browser

echo Starting Elite Dangerous NEXT - Layout Manager...
echo.

REM Start the server
start "" "elite-dangerous-next.exe"

REM Wait a moment for server to start
timeout /t 3 /nobreak > nul

REM Open browser
start "" "http://localhost:3000"

echo.
echo Layout Manager started!
echo Press Ctrl+C to stop the server.
echo.
