@echo off
echo ===================================================
echo    SpotLag.AI Test Application Launcher
echo    🚨 WARNING: Contains Intentional Performance Issues
echo ===================================================
echo.

echo Starting test application with performance issues...
echo.

echo [1/4] Installing backend dependencies...
cd backend
if not exist node_modules (
    echo Installing backend packages...
    npm install
    if errorlevel 1 (
        echo ❌ Backend installation failed!
        pause
        exit /b 1
    )
    echo ✅ Backend dependencies installed
) else (
    echo ✅ Backend dependencies already installed
)

echo.
echo [2/4] Installing frontend dependencies...
cd ..\frontend
if not exist node_modules (
    echo Installing frontend packages...
    npm install
    if errorlevel 1 (
        echo ❌ Frontend installation failed!
        pause
        exit /b 1
    )
    echo ✅ Frontend dependencies installed
) else (
    echo ✅ Frontend dependencies already installed
)

echo.
echo [3/4] Starting backend server...
cd ..\backend
echo Starting backend on http://localhost:3001
start "Test App Backend" cmd /k "npm start"

echo.
echo [4/4] Starting frontend development server...
cd ..\frontend
echo Starting frontend on http://localhost:3000
timeout /t 3 >nul
start "Test App Frontend" cmd /k "npm run dev"

echo.
echo ===================================================
echo ✅ Test Application Started Successfully!
echo.
echo 🌐 Frontend: http://localhost:3000
echo 🔌 Backend:  http://localhost:3001
echo.
echo 📝 Demo Credentials:
echo    Username: user1
echo    Password: password123
echo.
echo 🚨 Performance Issues Included:
echo    - N+1 Database Queries
echo    - Memory Leaks
echo    - Heavy Render Computations
echo    - Blocking Operations
echo    - No Caching Strategy
echo    - Inefficient State Management
echo.
echo 📊 Use this application to test SpotLag.AI's
echo    code-level performance analysis capabilities!
echo ===================================================
echo.

pause
