@echo off
title TRAM KIEM THU MO HINH AML - SOOTI ART
color 0b
cd /d "%~dp0."

echo ==============================================================================
echo    TRAM KIEM THU SUY GIAM MO HINH AML - SOOTI ART UI
echo    Dang mo trinh duyet tai: http://localhost:3000
echo ==============================================================================
echo.

if not exist node_modules goto :INSTALL
goto :START

:INSTALL
echo [1/2] Thu vien chua co, dang cai dat npm install...
call npm install --legacy-peer-deps

:START
echo [2/2] Dang mo trinh duyet va khoi dong Vite...
start "" "http://localhost:3000"
call npm run dev

pause
