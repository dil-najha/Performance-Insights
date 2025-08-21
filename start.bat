@echo off
echo 🚀 Starting Performance Insights Dashboard...
echo.

echo 📦 Installing dependencies...
call npm run install:all

echo.
echo 🔧 Starting backend and frontend servers...
echo Backend: http://localhost:3001
echo Frontend: http://localhost:5173
echo.

start /B npm run start:dev

echo ✅ Both servers are starting...
echo 📱 Frontend will be available at: http://localhost:5173
echo 🔌 Backend API at: http://localhost:3001
echo.
echo Press any key to stop servers...
pause >nul

echo 🛑 Stopping servers...
taskkill /f /im node.exe >nul 2>&1
echo ✅ Servers stopped.
