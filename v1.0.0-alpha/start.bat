@echo off
chcp 65001 >nul
echo ========================================
echo Elite Dangerous NEXT - Запуск
echo ========================================
echo.
echo [1/2] Установка зависимостей...
call npm install
if %errorlevel% neq 0 (
    echo Ошибка при установке зависимостей!
    pause
    exit /b 1
)
echo.
echo [2/2] Запуск сервера...
echo.
call npm run dev
pause
