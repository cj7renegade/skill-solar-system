@echo off
setlocal
cd /d "%~dp0"
echo Backing up your maps, answers and review sessions. Close the Skill Solar System app first.
powershell -NoProfile -ExecutionPolicy Bypass -File "scripts\backup-user-data.ps1"
if errorlevel 1 (
  echo The backup did not complete. Keep this window open and read the message above.
  pause
  exit /b 1
)
pause
