# Script para iniciar el servidor de desarrollo
Write-Host "Iniciando servidor de desarrollo..." -ForegroundColor Green
Write-Host "Directorio actual: $(Get-Location)" -ForegroundColor Yellow
Write-Host ""

# Verificar que estamos en el directorio correcto
if (-not (Test-Path "package.json")) {
    Write-Host "ERROR: package.json no encontrado. Asegúrate de estar en el directorio del proyecto." -ForegroundColor Red
    exit 1
}

# Verificar variables de entorno
if (-not (Test-Path ".env.local")) {
    Write-Host "ADVERTENCIA: .env.local no encontrado" -ForegroundColor Yellow
}

Write-Host "Ejecutando: npm run dev" -ForegroundColor Cyan
Write-Host ""
npm run dev

