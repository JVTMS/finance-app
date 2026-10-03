@echo off
rem ============================================================
rem  FINANCE — inicializador do aplicativo de desktop
rem  (PostgreSQL embutido + janela nativa; nada é instalado)
rem ============================================================
setlocal
set "PGDATA=%~dp0data\pgdata"

rem 1) binários do PostgreSQL: embutidos ao lado do app, ou instalação local
set "PGBIN=%~dp0postgres\bin"
if not exist "%PGBIN%\pg_ctl.exe" set "PGBIN=C:\Program Files\PostgreSQL\18\bin"
if not exist "%PGBIN%\pg_ctl.exe" set "PGBIN=C:\Program Files\PostgreSQL\17\bin"
if not exist "%PGBIN%\pg_ctl.exe" (
  echo PostgreSQL nao encontrado. A pasta "postgres" deve estar ao lado deste atalho.
  pause
  exit /b 1
)

rem 2) PostgreSQL do app na porta 5433 — inicia somente se nao estiver de pe
"%PGBIN%\pg_isready.exe" -h 127.0.0.1 -p 5433 -q >nul 2>&1
if errorlevel 1 (
  if not exist "%PGDATA%\PG_VERSION" (
    echo Primeira execucao: criando banco de dados local...
    "%PGBIN%\initdb.exe" -D "%PGDATA%" -U finance --auth=trust -E UTF8 --locale=C >nul
    "%PGBIN%\pg_ctl.exe" -D "%PGDATA%" -l "%PGDATA%\logfile.log" -o "-p 5433" -w start >nul 2>&1
    "%PGBIN%\createdb.exe" -h 127.0.0.1 -p 5433 -U finance finance >nul 2>&1
  ) else (
    echo Iniciando banco de dados...
    "%PGBIN%\pg_ctl.exe" -D "%PGDATA%" -l "%PGDATA%\logfile.log" -o "-p 5433" -w start >nul 2>&1
  )
)

rem 3) abre a janela do FINANCE e aguarda o usuario fechar
start "" /wait "%~dp0Finance.App.exe"

rem 4) se fomos nos que iniciaram o banco, encerramos na saida
"%PGBIN%\pg_isready.exe" -h 127.0.0.1 -p 5433 -q >nul 2>&1
if not errorlevel 1 "%PGBIN%\pg_ctl.exe" -D "%PGDATA%" -m fast stop >nul 2>&1
endlocal
