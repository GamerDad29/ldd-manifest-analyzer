@echo off
REM Start Chrome with remote debugging enabled for the B-Stock crawler.
REM This lets the crawler connect to your already-logged-in Chrome session.
REM Run this ONCE, then use "npm run crawl" to scrape B-Stock.

taskkill /F /IM chrome.exe 2>nul
timeout /t 2 /nobreak >nul

start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" ^
  --remote-debugging-port=9222 ^
  --user-data-dir="%LOCALAPPDATA%\Google\Chrome\User Data" ^
  --profile-directory="Default" ^
  https://bstock.com

echo.
echo Chrome started with remote debugging on port 9222.
echo Log into B-Stock if needed, then run: npm run crawl
echo.
pause
