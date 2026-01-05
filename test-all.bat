@echo off
echo ========================================
echo DEMARRAGE DU SERVEUR ET TEST
echo ========================================
echo.

cd /d "%~dp0"

echo Demarrage du serveur backend...
start /B node server.js
echo Serveur demarre en arriere-plan
echo.

echo Attente de 5 secondes...
timeout /t 5 /nobreak >nul
echo.

echo Test de creation d'utilisateurs...
node test-create-users.js

echo.
echo ========================================
echo Appuyez sur une touche pour arreter le serveur...
pause >nul

taskkill /F /IM node.exe >nul 2>&1
echo Serveur arrete.
