@echo off
echo ===================================================
echo Starting SignBridge Universal Frontend (React Vite)...
echo ===================================================
cd /d %~dp0frontend
npm run dev -- --host
pause

