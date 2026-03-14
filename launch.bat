@echo off
REM Elite Dangerous NEXT - Layout Manager
REM Full launcher with Python check and error display

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

REM Check if dist/index.js exists
if not exist "dist\index.js" (
    echo [ERROR] dist/index.js not found!
    echo Please run: npm install ^&^& npm run build
    echo.
    pause
    exit /b 1
)

REM Start Node.js server and capture output
echo [INFO] Starting Layout Manager server...
echo.

REM Create temp log file
set LOGFILE=%TEMP%\layout-manager-server.log

REM Start server in background and log output
start "Layout Manager Server" cmd /c "node dist/index.js > %LOGFILE% 2>&1"

REM Wait for server to start
echo [INFO] Waiting for server to start (5 seconds)...
timeout /t 5 /nobreak > nul

REM Check if server is running by checking health endpoint
curl -s http://localhost:3000/health >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Server failed to start!
    echo.
    echo Server log:
    type %LOGFILE%
    echo.
    echo Press any key to exit...
    pause >nul
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
echo - Server window is running in background
echo - Access UI at: http://localhost:3000
echo - Close the server window to stop
echo ========================================
echo.

REM Keep window open
pause
