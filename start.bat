@echo off
echo ========================================
echo Elite Dangerous NEXT - Starting
echo ========================================
echo.
echo [1/2] Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo Error installing dependencies!
    pause
    exit /b 1
)
echo.
echo [2/2] Starting server...
echo.
call npm run dev
pause
