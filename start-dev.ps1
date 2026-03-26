# SnapSend 本地开发启动脚本 (Windows PowerShell)

Write-Host "Starting SnapSend development servers..." -ForegroundColor Cyan

# Start backend
$backend = Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", `
  "Set-Location '$PSScriptRoot\backend'; `$env:CONFIG_PATH = '..\config.yaml'; uvicorn app.main:app --reload --port 8080" `
  -PassThru -WindowStyle Normal
Write-Host "Backend started (PID $($backend.Id)) at http://localhost:8080" -ForegroundColor Green
Write-Host "API docs: http://localhost:8080/api/docs" -ForegroundColor Gray

Start-Sleep -Seconds 2

# Detect Node.js >= 18
$nodeVersion = ""
try { $nodeVersion = (node --version 2>$null) } catch {}
if ($nodeVersion -match "^v(1[0-7]|[0-9])\.") {
  Write-Host "WARNING: Node.js >= 18 required. Using nvm to switch..." -ForegroundColor Yellow
  nvm use 20 2>$null
}

# Start frontend
$frontend = Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", `
  "Set-Location '$PSScriptRoot\frontend'; `$env:NEXT_PUBLIC_API_URL = 'http://localhost:8080'; npm run dev" `
  -PassThru -WindowStyle Normal
Write-Host "Frontend started (PID $($frontend.Id)) at http://localhost:3000" -ForegroundColor Green

Write-Host ""
Write-Host "Press any key to stop all servers..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

Stop-Process -Id $backend.Id -Force -ErrorAction SilentlyContinue
Stop-Process -Id $frontend.Id -Force -ErrorAction SilentlyContinue
Write-Host "Servers stopped." -ForegroundColor Red
