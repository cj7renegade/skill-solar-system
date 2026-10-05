@echo off
setlocal
cd /d "%~dp0"
echo Creating a Skill Solar System shortcut on your desktop.
powershell -NoProfile -ExecutionPolicy Bypass -File "scripts\create-desktop-shortcut.ps1"
if errorlevel 1 (
  echo The shortcut was not created. Keep this window open and read the message above.
  pause
  exit /b 1
)
pause
