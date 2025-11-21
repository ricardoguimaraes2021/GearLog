# Script para atualizar credenciais Pusher nos ficheiros .env

Write-Host "Atualizando credenciais Pusher..." -ForegroundColor Green

# Backend .env
$backendEnv = "backend\.env"
if (Test-Path $backendEnv) {
    Write-Host "Atualizando backend\.env..." -ForegroundColor Yellow
    $content = Get-Content $backendEnv -Raw
    
    # Atualizar ou adicionar variáveis
    $content = $content -replace '(?m)^BROADCAST_DRIVER=.*', 'BROADCAST_DRIVER=pusher'
    $content = $content -replace '(?m)^PUSHER_APP_ID=.*', 'PUSHER_APP_ID=2080798'
    $content = $content -replace '(?m)^PUSHER_APP_KEY=.*', 'PUSHER_APP_KEY=92291529cd124f3bceca'
    $content = $content -replace '(?m)^PUSHER_APP_SECRET=.*', 'PUSHER_APP_SECRET=df1ba206081a8d636c47'
    $content = $content -replace '(?m)^PUSHER_APP_CLUSTER=.*', 'PUSHER_APP_CLUSTER=eu'
    
    # Se não existirem, adicionar
    if ($content -notmatch 'BROADCAST_DRIVER') {
        $content += "`nBROADCAST_DRIVER=pusher`n"
    }
    if ($content -notmatch 'PUSHER_APP_ID') {
        $content += "PUSHER_APP_ID=2080798`n"
    }
    if ($content -notmatch 'PUSHER_APP_KEY') {
        $content += "PUSHER_APP_KEY=92291529cd124f3bceca`n"
    }
    if ($content -notmatch 'PUSHER_APP_SECRET') {
        $content += "PUSHER_APP_SECRET=df1ba206081a8d636c47`n"
    }
    if ($content -notmatch 'PUSHER_APP_CLUSTER') {
        $content += "PUSHER_APP_CLUSTER=eu`n"
    }
    
    Set-Content -Path $backendEnv -Value $content -NoNewline
    Write-Host "✓ Backend .env atualizado!" -ForegroundColor Green
} else {
    Write-Host "⚠ Backend .env não encontrado em $backendEnv" -ForegroundColor Yellow
}

# Frontend .env.local
$frontendEnv = "frontend\.env.local"
if (-not (Test-Path $frontendEnv)) {
    # Criar ficheiro se não existir
    New-Item -Path $frontendEnv -ItemType File -Force | Out-Null
    Write-Host "Criado frontend\.env.local..." -ForegroundColor Yellow
}

Write-Host "Atualizando frontend\.env.local..." -ForegroundColor Yellow
$content = Get-Content $frontendEnv -Raw -ErrorAction SilentlyContinue
if ($null -eq $content) {
    $content = ""
}

# Atualizar ou adicionar variáveis
if ($content -match 'VITE_PUSHER_APP_KEY') {
    $content = $content -replace '(?m)^VITE_PUSHER_APP_KEY=.*', 'VITE_PUSHER_APP_KEY=92291529cd124f3bceca'
} else {
    if ($content -ne "" -and $content -notmatch '`n$') {
        $content += "`n"
    }
    $content += "VITE_PUSHER_APP_KEY=92291529cd124f3bceca`n"
}

if ($content -match 'VITE_PUSHER_APP_CLUSTER') {
    $content = $content -replace '(?m)^VITE_PUSHER_APP_CLUSTER=.*', 'VITE_PUSHER_APP_CLUSTER=eu'
} else {
    if ($content -ne "" -and $content -notmatch '`n$') {
        $content += "`n"
    }
    $content += "VITE_PUSHER_APP_CLUSTER=eu`n"
}

Set-Content -Path $frontendEnv -Value $content.TrimEnd() -NoNewline
Write-Host "✓ Frontend .env.local atualizado!" -ForegroundColor Green

Write-Host "`nResumo das configurações:" -ForegroundColor Cyan
Write-Host "Backend:" -ForegroundColor Yellow
Get-Content $backendEnv | Select-String -Pattern '^BROADCAST_DRIVER=|^PUSHER_' | ForEach-Object { Write-Host "  $_" }

Write-Host "`nFrontend:" -ForegroundColor Yellow
Get-Content $frontendEnv | Select-String -Pattern '^VITE_PUSHER_' | ForEach-Object { Write-Host "  $_" }

Write-Host "`n✓ Configuração concluída! Reinicie os servidores para aplicar as alterações." -ForegroundColor Green

