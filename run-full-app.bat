@echo off
setlocal
cd /d "%~dp0"

echo [0/5] Checking free disk space...
for /f %%G in ('powershell -NoProfile -Command "[math]::Floor((Get-PSDrive -Name C).Free/1GB)"') do set "FREE_GB=%%G"
if not defined FREE_GB set "FREE_GB=0"
if %FREE_GB% LSS 2 (
  echo ERROR: Low disk space on C: drive ^(%FREE_GB% GB free^).
  echo Please free at least 2 GB and run this script again.
  pause
  exit /b 1
)

echo [1/5] Checking environment...
if not exist ".env.local" (
  echo DATABASE_URL=postgresql://postgres:ram%%401212@localhost:5432/management_app> .env.local
  echo Created .env.local with your PostgreSQL credentials.
)

REM Ensure ENCRYPTION_KEY_BASE64 exists (32 bytes base64) for DB at-rest encryption
findstr /I "ENCRYPTION_KEY_BASE64=" .env.local >nul 2>&1
if errorlevel 1 (
  for /f %%K in ('node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"') do (
    echo ENCRYPTION_KEY_BASE64=%%K>> .env.local
  )
  echo Added ENCRYPTION_KEY_BASE64 to .env.local
)

echo [2/5] Ensuring PostgreSQL service is running...
set "PG_SERVICE="
for /f "tokens=2 delims=:" %%S in ('sc query state^= all ^| findstr /I "SERVICE_NAME: postgresql"') do (
  set "PG_SERVICE=%%S"
  goto :found_service
)
:found_service
if defined PG_SERVICE (
  set "PG_SERVICE=%PG_SERVICE:~1%"
  net start "%PG_SERVICE%" >nul 2>&1
) else (
  echo Could not auto-detect PostgreSQL Windows service. Continuing...
)

echo [3/5] Installing dependencies if needed...
if not exist "node_modules" (
  call npm install
  if errorlevel 1 (
    echo npm install failed.
    pause
    exit /b 1
  )
)

echo [4/5] Initializing database (create DB + tables + default admin)...
call npm run db:setup
if errorlevel 1 (
  echo Database setup failed. Check PostgreSQL user/password/service or free disk space.
  pause
  exit /b 1
)

echo [5/5] Starting application...
for /f %%A in ('netstat -ano ^| findstr ":3000" ^| findstr "LISTENING"') do set "PORT_BUSY=1"
if defined PORT_BUSY (
  echo App already running at: http://localhost:3000
  echo Try LAN URL too: http://192.168.35.6:3000
  start "" "http://localhost:3000"
  goto :eof
)

echo.
echo =========================================
echo Application URL: http://localhost:3000
echo LAN URL: http://192.168.35.6:3000
echo =========================================
echo.
start "" "http://localhost:3000"
call npm run dev
