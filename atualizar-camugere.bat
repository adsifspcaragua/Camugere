@echo off
REM Atualiza a Biblioteca Camugere: para o sistema, faz backup, baixa as novidades, prepara e inicia de novo.
title Atualizar - Biblioteca Camugere
cd /d "%~dp0"

echo [1/5] Parando o sistema, se estiver aberto...
powershell -NoProfile -Command "$p=Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue; if($p){$p | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }; 'Sistema desligado.'} else {'O sistema ja estava desligado.'}"

echo.
echo [2/5] Fazendo backup antes de atualizar...
pushd "%~dp0api"
call node src\cli\backup.js
set "ERR=%errorlevel%"
popd
if not "%ERR%"=="0" (
  echo.
  echo Erro ao fazer backup. A atualizacao foi cancelada para proteger os dados.
  pause
  exit /b 1
)

echo.
echo [3/5] Baixando atualizacoes (git pull)...
git pull --ff-only
if errorlevel 1 (
  echo.
  echo Erro ao baixar as atualizacoes. Verifique a internet ou se ha alteracoes locais no computador.
  pause
  exit /b 1
)

echo.
echo [4/5] Instalando dependencias, atualizando banco e gerando o site...
call npm run preparar
if errorlevel 1 (
  echo.
  echo Erro ao preparar o sistema. Confira a mensagem acima.
  pause
  exit /b 1
)

echo.
echo [5/5] Iniciando o sistema novamente...
start "" "%~dp0iniciar-camugere.vbs"

echo.
echo Atualizacao concluida! O navegador abrira em instantes.
pause
