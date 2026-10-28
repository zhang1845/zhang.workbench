@echo off
setlocal DisableDelayedExpansion
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is required. Install Node.js 22.19+ or 24+, then try again.
  pause
  exit /b 1
)
node "%~dp0scripts\start-workbench-windows.mjs" %*
set "workbench_exit=%errorlevel%"
if not "%workbench_exit%"=="0" pause
exit /b %workbench_exit%
