Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "   Olivelas QR Code Studio - TypeScript 2.0        " -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host ""

$hasNpm = Get-Command npm -ErrorAction SilentlyContinue
$hasPython = Get-Command python -ErrorAction SilentlyContinue

if ($hasNpm) {
    Write-Host "[OK] Node/npm detectado. Iniciando servidor Vite..." -ForegroundColor Green
    Start-Process "http://localhost:3000"
    npm run dev
} elseif ($hasPython) {
    Write-Host "[OK] Python detectado. Iniciando servidor local na pasta dist..." -ForegroundColor Green
    Start-Process "http://localhost:8000"
    Set-Location "dist"
    python -m http.server 8000
} else {
    Write-Host "[INFO] Abrindo dist/index.html diretamente no navegador..." -ForegroundColor Yellow
    Start-Process "dist\index.html"
}
