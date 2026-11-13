@echo off
setlocal
title DS Distributor Tally Bridge Setup Wizard

echo ================================================================
echo   DS DISTRIBUTOR - TALLY ERP 9 WINDOWS BRIDGE INSTALLER
echo ================================================================
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is required but was not found in PATH.
    echo Please download and install Node.js (LTS version) from https://nodejs.org/
    echo and re-run this setup script.
    echo.
    pause
    exit /b 1
)

cd /d "%~dp0"

echo [INFO] Compiling / preparing bridge scripts...
if exist "dist\pair.js" (
    node dist\pair.js
) else (
    where npx >nul 2>nul
    if %errorlevel% equ 0 (
        npx --yes tsx src\pair.ts
    ) else (
        echo [ERROR] Neither precompiled dist\pair.js nor npx tsx found.
        echo Running npm install && npm run build...
        call npm install
        call npm run build
        node dist\pair.js
    )
)

echo.
pause

