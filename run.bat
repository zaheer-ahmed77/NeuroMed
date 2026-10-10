@echo off
echo ========================================================
echo Neuromed FYP - One-Click Start
echo ========================================================
echo.

echo Starting Backend Server (Port 8000)...
start "Backend Server" cmd /k "cd backend && call ..\.venv\Scripts\activate && uvicorn main:app --reload"

echo Starting Frontend Server (Port 5175)...
start "Frontend Server" cmd /k "npm run dev"

echo.
echo ========================================================
echo Servers are running in background windows!
echo Frontend is available at: http://localhost:5175
echo Backend API is available at: http://localhost:8000
echo ========================================================
pause
