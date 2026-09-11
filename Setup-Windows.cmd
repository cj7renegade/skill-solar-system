@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Install Node.js LTS from https://nodejs.org and then run this file again.
  pause
  exit /b 1
)
echo Installing build dependencies. This one-time step needs internet access.
call npm install
if errorlevel 1 goto failed
call npm run build
if errorlevel 1 goto failed
echo Setup complete. Use Launch-Windows.cmd to open the program offline.
pause
exit /b 0
:failed
echo Setup failed. Keep this window open to read the error above.
pause
exit /b 1
