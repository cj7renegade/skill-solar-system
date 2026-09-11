@echo off
setlocal
cd /d "%~dp0"
if not exist dist\app.js (
  echo Please run Setup-Windows.cmd first.
  pause
  exit /b 1
)
call npm start
if errorlevel 1 pause
