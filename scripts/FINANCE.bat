@echo off
rem ============================================================
rem  FINANCE — inicializador (PostgreSQL do app + API + navegador)
rem ============================================================
setlocal
set "PGBIN=C:\Program Files\PostgreSQL\18\bin"
set "PGDATA=%~dp0..\pgdata"
set "APPURL=http://localhost:5280"

rem 1) PostgreSQL (cluster próprio do app, porta 5433)
"%PGBIN%\pg_isready.exe" -h 127.0.0.1 -p 5433 -q >nul 2>&1
if errorlevel 1 (
  echo Iniciando banco de dados...
  "%PGBIN%\pg_ctl.exe" -D "%PGDATA%" -l "%PGDATA%\logfile.log" -o "-p 5433" start -w >nul 2>&1
)

rem 2) Banco "finance" (primeira execucao)
"%PGBIN%\psql.exe" -h 127.0.0.1 -p 5433 -U finance -d finance -q -c "select 1;" >nul 2>&1
if errorlevel 1 "%PGBIN%\createdb.exe" -h 127.0.0.1 -p 5433 -U finance finance >nul 2>&1

rem 3) API + SPA (porta 5280) — ja rodando?
curl -sf -o nul "%APPURL%/health" >nul 2>&1
if errorlevel 1 (
  echo Iniciando FINANCE...
  start "FINANCE API" /min "%~dp0..\publish\Finance.Api.exe"
)

rem 4) Aguarda o app responder e abre o navegador
set /a tries=0
:wait
timeout /t 1 /nobreak >nul
curl -sf -o nul "%APPURL%/health" >nul 2>&1
if errorlevel 1 (
  set /a tries+=1
  if %tries% lss 25 goto wait
  echo Nao foi possivel conectar ao FINANCE. Verifique a janela da API.
  pause
  exit /b 1
)
start "" "%APPURL%/"
endlocal
