# Script para subir archivos modificados al VPS
# Ejecutar desde PowerShell: .\subir-al-vps.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "📤 SUBIR ARCHIVOS AL VPS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$VPS_HOST = "173.249.26.38"
$VPS_USER = "root"
$VPS_PATH = "/root"

# Verificar que los archivos existen
$archivos = @(
    "enhanced-scheduler.js",
    "enhanced-server.js"
)

Write-Host "🔍 Verificando archivos locales..." -ForegroundColor Yellow
foreach ($archivo in $archivos) {
    if (Test-Path $archivo) {
        Write-Host "  ✅ $archivo encontrado" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $archivo NO encontrado" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "⚠️  IMPORTANTE: Este script hará lo siguiente:" -ForegroundColor Yellow
Write-Host "  1. Crear backup de archivos originales en el VPS" -ForegroundColor White
Write-Host "  2. Subir los archivos modificados" -ForegroundColor White
Write-Host "  3. Reiniciar el servidor con PM2" -ForegroundColor White
Write-Host ""

$confirmacion = Read-Host "¿Deseas continuar? (S/N)"
if ($confirmacion -ne "S" -and $confirmacion -ne "s") {
    Write-Host "❌ Operación cancelada" -ForegroundColor Red
    exit 0
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "📋 PASO 1: Crear Backup en VPS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Crear backup
$backupCommands = @"
cd $VPS_PATH
echo '📦 Creando backup...'
cp enhanced-scheduler.js enhanced-scheduler.js.backup_$(date +%Y%m%d_%H%M%S)
cp enhanced-server.js enhanced-server.js.backup_$(date +%Y%m%d_%H%M%S)
echo '✅ Backup creado'
ls -lh *.backup_* | tail -2
"@

Write-Host "Ejecutando en VPS..." -ForegroundColor Yellow
ssh "${VPS_USER}@${VPS_HOST}" $backupCommands

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error creando backup" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "📤 PASO 2: Subir Archivos" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

foreach ($archivo in $archivos) {
    Write-Host "Subiendo $archivo..." -ForegroundColor Yellow
    scp $archivo "${VPS_USER}@${VPS_HOST}:${VPS_PATH}/$archivo"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ $archivo subido correctamente" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Error subiendo $archivo" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🔄 PASO 3: Reiniciar Servidor" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$restartCommands = @"
cd $VPS_PATH
echo '🔄 Reiniciando servidor...'
pm2 restart enhanced-server
sleep 2
echo ''
echo '📊 Estado del servidor:'
pm2 list | grep enhanced-server
echo ''
echo '📋 Últimos logs:'
pm2 logs enhanced-server --lines 10 --nostream
"@

Write-Host "Reiniciando servidor en VPS..." -ForegroundColor Yellow
ssh "${VPS_USER}@${VPS_HOST}" $restartCommands

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ PROCESO COMPLETADO" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "🎯 Próximos pasos:" -ForegroundColor Yellow
Write-Host "  1. Verifica los logs: ssh ${VPS_USER}@${VPS_HOST} 'pm2 logs enhanced-server'" -ForegroundColor White
Write-Host "  2. Prueba los endpoints: Invoke-RestMethod -Uri 'http://${VPS_HOST}:3000' -Method GET" -ForegroundColor White
Write-Host "  3. Crea un monitoreo desde el dashboard" -ForegroundColor White
Write-Host "  4. Prueba los botones Pausar/Reanudar/Detener" -ForegroundColor White
Write-Host ""
Write-Host "✨ ¡Listo para usar!" -ForegroundColor Green
