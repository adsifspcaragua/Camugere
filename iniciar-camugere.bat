@echo off
REM Inicia o sistema da Biblioteca Comunitaria e abre o navegador.
REM Deixe esta janela aberta enquanto usar o sistema. Para encerrar, feche a janela.
title Biblioteca Comunitaria
cd /d "%~dp0api"
start "" cmd /c "timeout /t 4 /nobreak >nul & start http://localhost:3000"
node src\server.js
if errorlevel 1 (
  echo.
  echo O sistema parou com erro. Confira a mensagem acima.
  pause
)
