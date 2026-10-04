# FINANCE — gera a pasta portátil publish-app/ com um comando.
# Uso: powershell -ExecutionPolicy Bypass -File scripts\build-portable.ps1
# Requisitos locais: Node/npm, .NET SDK 10, PostgreSQL 18 instalado (fonte dos binários).

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$pgSource = "C:\Program Files\PostgreSQL\18"
if (-not (Test-Path "$pgSource\bin\pg_ctl.exe")) { throw "PostgreSQL 18 não encontrado em $pgSource" }

Write-Host "==> 1/7 build do frontend (Vite)"
npm run build | Select-Object -Last 1

Write-Host "==> 2/7 publish self-contained do shell desktop (API embutida)"
if (Test-Path publish-app) { Remove-Item publish-app -Recurse -Force }
dotnet publish app -c Release -r win-x64 --self-contained true -o publish-app | Select-Object -Last 1

Write-Host "==> 3/7 SPA para o wwwroot"
Copy-Item -Recurse -Force dist publish-app/wwwroot

Write-Host "==> 4/7 removendo entry point duplicado da API (a janela é o único executável)"
foreach ($f in @("Finance.Api.exe", "Finance.Api.pdb", "Finance.Api.runtimeconfig.json")) {
    $p = Join-Path "publish-app" $f
    if (Test-Path $p) { Remove-Item $p -Force }
}

Write-Host "==> 5/7 binários do PostgreSQL embutidos"
New-Item -ItemType Directory -Force publish-app/postgres | Out-Null
Copy-Item -Recurse -Force "$pgSource/bin"   publish-app/postgres/bin
Copy-Item -Recurse -Force "$pgSource/lib"   publish-app/postgres/lib
Copy-Item -Recurse -Force "$pgSource/share" publish-app/postgres/share

Write-Host "==> 6/7 vcredist de reserva (máquinas sem o runtime do Postgres)"
New-Item -ItemType Directory -Force publish-app/installers | Out-Null
if (Test-Path "$pgSource/installer/vcredist_x64.exe") {
    Copy-Item "$pgSource/installer/vcredist_x64.exe" publish-app/installers/
}

Write-Host "==> 7/7 launcher, ícone e vcredist ao lado do executável"
Copy-Item scripts/FINANCE.bat publish-app/FINANCE.bat -Force
Copy-Item scripts/FINANCE.vbs publish-app/FINANCE.vbs -Force
Copy-Item scripts/finance.ico publish-app/finance.ico -Force

$size = [math]::Round((Get-ChildItem publish-app -Recurse | Measure-Object Length -Sum).Sum / 1MB)
Write-Host ""
Write-Host "Pasta portátil pronta: $root\publish-app ($size MB)"
Write-Host "Distribua a pasta inteira; execute FINANCE.vbs (atalho FINANCE no Desktop)."
