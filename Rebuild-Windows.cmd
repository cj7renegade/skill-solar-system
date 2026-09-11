@echo off
setlocal
cd /d "%~dp0"
if not exist node_modules\three\package.json (
  echo Existing dependencies were not found. Run Setup-Windows.cmd first.
  pause
  exit /b 1
)
call npm run build
if errorlevel 1 (
  echo Build failed. Keep this window open and share the error above.
  pause
  exit /b 1
)
echo Update built successfully. Run Launch-Windows.cmd.
pause
