@echo off
title TechAvenue Launcher
echo ====================================================
echo           TECH AVENUE - STARTUP LAUNCHER
echo ====================================================
echo.

:: 1. Check & start MySQL (port 3306)
netstat -ano | findstr /R ":3306.*LISTENING" >nul
if %errorlevel% neq 0 (
    echo [1/3] Starting MySQL Database...
    if exist "C:\xampp\mysql\bin\mysqld.exe" (
        start "MySQL Daemon" /min "C:\xampp\mysql\bin\mysqld.exe" --defaults-file="C:\xampp\mysql\bin\my.ini" --standalone
        timeout /t 2 /nobreak >nul
    ) else (
        echo [WARNING] MySQL not running on port 3306. Please start MySQL via XAMPP/WAMP.
    )
) else (
    echo [1/3] MySQL is already running on port 3306.
)

:: 2. Start Backend Flask Server (port 5000)
echo [2/3] Starting Backend Server (Python / Flask on :5000)...
start "TechAvenue - Backend API" cmd /k "cd /d %~dp0backend && python app.py"

:: 3. Start Frontend Vite Server (port 5173)
echo [3/3] Starting Frontend Dev Server (React / Vite on :5173)...
start "TechAvenue - Frontend Client" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ====================================================
echo  Services started successfully!
echo  Frontend: http://localhost:5173
echo  Backend:  http://127.0.0.1:5000
echo ====================================================
pause

