@echo off
echo ========================================
echo POS System - Network Information
echo ========================================
echo.

echo Finding your local IP address...
echo.

for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do (
    echo Your IP Address: %%a
)

echo.
echo ========================================
echo Access your POS system from other devices:
echo.
echo 1. Start the backend: cd server ^&^& npm run start:dev
echo 2. Start the frontend: npm run dev
echo 3. Open on other device: http://[YOUR-IP]:8080
echo ========================================
echo.

pause
