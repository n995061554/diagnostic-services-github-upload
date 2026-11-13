@echo off
setlocal
title DS Distributor Tally Bridge Agent (Interactive Console)

cd /d "%~dp0"

if not exist "config.json" (
    echo [ERROR] config.json was not found!
    echo Please run setup-bridge.bat first to pair this computer with your DS Distributor backend.
    echo.
    pause
    exit /b 1
)

echo ================================================================
echo   STARTING DS DISTRIBUTOR TALLY ERP 9 BRIDGE AGENT
echo   Outbound Tunnel: Office PC -> Render Cloud Backend
echo ================================================================
echo.

if exist "dist\bridgeAgent.js" (
    node dist\bridgeAgent.js
) else (
    where npx >nul 2>nul
    if %errorlevel% equ 0 (
        npx --yes tsx src\bridgeAgent.ts
    ) else (
        call npm run build
        node dist\bridgeAgent.js
    )
)

echo.
pause

