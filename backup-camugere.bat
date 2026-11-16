@echo off
REM Faz uma copia de seguranca da Biblioteca Camugere (banco de dados + capas).
REM Os backups ficam na pasta "backups", ao lado deste arquivo. Guarde uma copia fora deste computador.
title Backup - Biblioteca Camugere
cd /d "%~dp0api"
node src\cli\backup.js
echo.
pause
