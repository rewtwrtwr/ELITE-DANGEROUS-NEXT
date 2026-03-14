@echo off
REM Elite Dangerous NEXT - Layout Manager
REM Full launcher with Python check and auto-start

echo ========================================
echo Elite Dangerous NEXT - Layout Manager
echo ========================================
echo.

REM Check Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed!
    echo Please install Python 3.8+ from https://www.python.org/downloads/
    echo.
    pause
    exit /b 1
)

echo [OK] Python found
python --version
echo.

REM Change to script directory
cd /d "%~dp0"

REM Start Node.js server
echo [INFO] Starting Layout Manager server...
start "" cmd /c "node dist/index.js"

REM Wait for server to start
echo [INFO] Waiting for server to start...
timeout /t 3 /nobreak > nul

REM Check if server is running
curl -s http://localhost:3000/health >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Server failed to start!
    echo Check dist/index.js for errors.
    pause
    exit /b 1
)

echo [OK] Server started successfully!
echo.
echo [INFO] Opening browser...
start "" "http://localhost:3000"

echo.
echo ========================================
echo Layout Manager is running!
echo.
echo - Close this window to stop the server
echo - Access UI at: http://localhost:3000
echo ========================================
echo.

REM Keep window open
pause
