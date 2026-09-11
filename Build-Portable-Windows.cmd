@echo off
setlocal
cd /d "%~dp0"
echo Packaging may download build tools. The resulting program runs offline.
call npm run dist:win
if errorlevel 1 (
  pause
  exit /b 1
)
echo Your portable executable is in the release folder.
pause
