@echo off
REM Desliga o sistema da Biblioteca Camugere (o que roda escondido, aberto por iniciar-camugere.vbs).
title Parar - Biblioteca Camugere
powershell -NoProfile -Command "$p=Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue; if($p){$p | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }; 'Sistema desligado.'} else {'O sistema ja estava desligado.'}"
timeout /t 3 >nul
