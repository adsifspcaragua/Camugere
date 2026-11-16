@echo off
REM Cria na Area de Trabalho os atalhos "Biblioteca Camugere", "Backup Camugere" e "Parar Camugere", com icone proprio.
REM Rode uma vez (dois cliques). Se mover a pasta do sistema, rode de novo.
title Criar atalhos - Biblioteca Camugere
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$r='%~dp0'.TrimEnd('\'); $d=[Environment]::GetFolderPath('Desktop'); $w=New-Object -ComObject WScript.Shell;" ^
  "foreach($a in @(@('Biblioteca Camugere','iniciar-camugere.vbs','camugere.ico'),@('Backup Camugere','backup-camugere.bat','backup.ico'),@('Parar Camugere','parar-camugere.bat','parar.ico'))){" ^
  "$s=$w.CreateShortcut(\"$d\$($a[0]).lnk\"); $s.TargetPath=\"$r\$($a[1])\"; $s.WorkingDirectory=$r; $s.IconLocation=\"$r\assets\$($a[2]),0\"; $s.Save()}"
echo.
echo Atalhos criados na Area de Trabalho.
pause
