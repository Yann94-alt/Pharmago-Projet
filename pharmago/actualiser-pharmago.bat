@echo off

cd /d C:\wamp64\www\pharmago

echo ========================================
echo       PHARMAGO - ACTUALISATION
echo ========================================

echo.
echo Verification du planning...
C:\wamp64\bin\php\php8.5.1\php.exe artisan pharmacies:scrape-garde

echo.
echo Actualisation terminee.

exit