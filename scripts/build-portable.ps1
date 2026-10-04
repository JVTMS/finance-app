# FINANCE — gera a pasta portátil com um comando.
# Saída: D:\PROJETOS\SKILL\Z.AI\finance-app-dist (FORA da árvore do repositório,
# pois contém bundles minificados que poluem a varredura de segurança e o git).
# Uso: powershell -ExecutionPolicy Bypass -File scripts\build-portable.ps1
# Requisitos locais: Node/npm, .NET SDK 10, PostgreSQL 18 instalado (fonte dos binários).

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$dist = Join-Path (Split-Path -Parent $root) "finance-app-dist"
Set-Location $root

$pgSource = "C:\Program Files\PostgreSQL\18"
if (-not (Test-Path "$pgSource\bin\pg_ctl.exe")) { throw "PostgreSQL 18 não encontrado em $pgSource" }

Write-Host "==> 1/7 build do frontend (Vite)"
npm run build | Select-Object -Last 1

Write-Host "==> 2/7 publish self-contained do shell desktop (API embutida)"
if (Test-Path $dist) { Remove-Item $dist -Recurse -Force }
dotnet publish app -c Release -r win-x64 --self-contained true -o $dist | Select-Object -Last 1

Write-Host "==> 3/7 SPA para o wwwroot"
Copy-Item -Recurse -Force dist $dist/wwwroot

Write-Host "==> 4/7 removendo entry point duplicado da API (a janela é o único executável)"
foreach ($f in @("Finance.Api.exe", "Finance.Api.pdb", "Finance.Api.runtimeconfig.json")) {
    $p = Join-Path $dist $f
    if (Test-Path $p) { Remove-Item $p -Force }
}

Write-Host "==> 5/7 binários do PostgreSQL embutidos"
New-Item -ItemType Directory -Force $dist/postgres | Out-Null
Copy-Item -Recurse -Force "$pgSource/bin"   $dist/postgres/bin
Copy-Item -Recurse -Force "$pgSource/lib"   $dist/postgres/lib
Copy-Item -Recurse -Force "$pgSource/share" $dist/postgres/share

Write-Host "==> 6/7 vcredist de reserva (máquinas sem o runtime do Postgres)"
New-Item -ItemType Directory -Force $dist/installers | Out-Null
if (Test-Path "$pgSource/installer/vcredist_x64.exe") {
    Copy-Item "$pgSource/installer/vcredist_x64.exe" $dist/installers/
}

Write-Host "==> 7/7 launcher, ícone e vcredist ao lado do executável"
Copy-Item scripts/FINANCE.bat $dist/FINANCE.bat -Force
Copy-Item scripts/FINANCE.vbs $dist/FINANCE.vbs -Force
Copy-Item scripts/finance.ico $dist/finance.ico -Force

$size = [math]::Round((Get-ChildItem $dist -Recurse | Measure-Object Length -Sum).Sum / 1MB)
Write-Host ""
Write-Host "Pasta portátil pronta: $dist ($size MB)"
Write-Host "Distribua a pasta inteira; execute FINANCE.vbs (atalho FINANCE no Desktop)."
