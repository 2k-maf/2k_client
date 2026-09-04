<#
.SYNOPSIS
    Піднімає локально обидві половини Dva Kol'ory (2K) — API і фронтенд — і зупиняє
    обидві при Ctrl+C або будь-якому виході зі скрипта.

.DESCRIPTION
    Розраховує, що репозиторії лежать поруч і названі так само, як на GitHub:

        2k\
        ├── 2k_api\
        └── 2k_client\

    Скрипт однаковий в обох репозиторіях — запускайте той, що під рукою.

.EXAMPLE
    pwsh -File .\dev.ps1
#>

[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$Root      = Split-Path -Parent $ScriptDir
$ApiDir    = Join-Path $Root '2k_api'
$ClientDir = Join-Path $Root '2k_client'
$LogDir    = Join-Path $ScriptDir '.dev-logs'

$script:ApiProc    = $null
$script:ClientProc = $null
$script:Stopping   = $false
$script:ApiPort    = 3000
$script:ClientPort = 3005

function Write-Info { param($m) Write-Host "> $m" -ForegroundColor Green }
function Write-Warn { param($m) Write-Host "! $m" -ForegroundColor Yellow }
function Stop-WithError { param($m) Write-Host "x $m" -ForegroundColor Red; exit 1 }

# PID процесу, що слухає порт, або $null.
function Get-PortPid {
    param([int]$Port)
    $conn = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue |
            Select-Object -First 1
    if ($conn) { return $conn.OwningProcess }
    return $null
}

# Зупиняє процес разом з деревом нащадків: npm/pnpm породжують node, і без /T
# дочірній процес переживає батька та тримає порт.
function Stop-Tree {
    param($ProcessId)
    if (-not $ProcessId) { return }
    if (-not (Get-Process -Id $ProcessId -ErrorAction SilentlyContinue)) { return }
    & taskkill.exe /PID $ProcessId /T /F *>$null
}

function Stop-Port {
    param([int]$Port)
    $procId = Get-PortPid -Port $Port
    if ($procId) { Stop-Tree -ProcessId $procId }
}

function Invoke-Cleanup {
    if ($script:Stopping) { return }
    $script:Stopping = $true
    Write-Host ''
    Write-Info 'Зупиняю...'
    if ($script:ClientProc) { Stop-Tree -ProcessId $script:ClientProc.Id }
    if ($script:ApiProc)    { Stop-Tree -ProcessId $script:ApiProc.Id }
    # Підстраховка: react-scripts і mongodb-memory-server іноді переживають смерть
    # батька, а живий процес тримає .mongo-local і наступний запуск падає.
    Start-Sleep -Milliseconds 800
    Stop-Port -Port $script:ClientPort
    Stop-Port -Port $script:ApiPort
    Write-Info 'Зупинено.'
}

# Значення змінної з .env.
function Get-EnvValue {
    param([string]$File, [string]$Key)
    if (-not (Test-Path $File)) { return $null }
    $line = Get-Content $File | Where-Object { $_ -match "^\s*$Key\s*=" } | Select-Object -Last 1
    if (-not $line) { return $null }
    $value = ($line -replace "^\s*$Key\s*=", '').Trim()
    return $value.Trim('"').Trim("'")
}

function Confirm-EnvFile {
    param([string]$Dir)
    $envFile = Join-Path $Dir '.env'
    if (Test-Path $envFile) { return }
    # 2k_api тримає зразок як .env.example, 2k_client — як env.example.
    $example = @('.env.example', 'env.example') |
        ForEach-Object { Join-Path $Dir $_ } |
        Where-Object { Test-Path $_ } |
        Select-Object -First 1
    if (-not $example) {
        Stop-WithError "Немає ні .env, ні зразка (.env.example / env.example) у $Dir"
    }
    Copy-Item $example $envFile
    Write-Warn "Створив $(Split-Path -Leaf $Dir)\.env з $(Split-Path -Leaf $example)"
}

# Друкує рядки, що з'явилися у файлі з минулої ітерації.
function Show-NewLines {
    param($Reader)
    $fs = $null
    try {
        $fs = [System.IO.File]::Open($Reader.Path, 'Open', 'Read', 'ReadWrite')
        if ($fs.Length -le $Reader.Pos) { return }
        $fs.Seek($Reader.Pos, 'Begin') | Out-Null
        $sr = New-Object System.IO.StreamReader($fs)
        $chunk = $sr.ReadToEnd()
        $Reader.Pos = $fs.Length
        foreach ($line in ($chunk -split "`r?`n")) {
            if ($line -ne '') {
                Write-Host "$($Reader.Tag) " -ForegroundColor $Reader.Color -NoNewline
                Write-Host $line
            }
        }
    } catch { } finally { if ($fs) { $fs.Dispose() } }
}

# --- Перевірки ------------------------------------------------------------
if (-not (Test-Path $ApiDir))    { Stop-WithError "Не знайшов $ApiDir. Репозиторії мають лежати поруч: 2k_api та 2k_client." }
if (-not (Test-Path $ClientDir)) { Stop-WithError "Не знайшов $ClientDir. Репозиторії мають лежати поруч: 2k_api та 2k_client." }

foreach ($tool in @('node', 'npm', 'pnpm')) {
    if (-not (Get-Command $tool -ErrorAction SilentlyContinue)) {
        $hint = if ($tool -eq 'pnpm') { ' Встановіть: npm i -g pnpm' } else { ' Потрібен Node.js 22+.' }
        Stop-WithError "Немає $tool.$hint"
    }
}

Confirm-EnvFile -Dir $ApiDir
Confirm-EnvFile -Dir $ClientDir

$apiPortRaw = Get-EnvValue -File (Join-Path $ApiDir '.env') -Key 'PORT'
if ($apiPortRaw) { $script:ApiPort = [int]$apiPortRaw }
$clientPortRaw = Get-EnvValue -File (Join-Path $ClientDir '.env') -Key 'PORT'
if ($clientPortRaw) { $script:ClientPort = [int]$clientPortRaw }

foreach ($item in @(
    @{ Name = 'API';       Port = $script:ApiPort },
    @{ Name = 'фронтенду'; Port = $script:ClientPort }
)) {
    $busy = Get-PortPid -Port $item.Port
    if ($busy) { Stop-WithError "Порт $($item.Port) ($($item.Name)) вже зайнятий процесом $busy. Зупиніть його й повторіть." }
}

if (-not (Test-Path (Join-Path $ApiDir 'node_modules'))) {
    Write-Info 'Ставлю залежності API...'
    Push-Location $ApiDir
    & npm.cmd install --legacy-peer-deps
    $code = $LASTEXITCODE
    Pop-Location
    if ($code -ne 0) { Stop-WithError 'npm install впав' }
}
if (-not (Test-Path (Join-Path $ClientDir 'node_modules'))) {
    Write-Info 'Ставлю залежності фронтенду...'
    Push-Location $ClientDir
    & pnpm.cmd install
    $code = $LASTEXITCODE
    Pop-Location
    if ($code -ne 0) { Stop-WithError 'pnpm install впав' }
}

# --- Запуск ---------------------------------------------------------------
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null
$apiLog       = Join-Path $LogDir 'api.log'
$apiErrLog    = Join-Path $LogDir 'api.err.log'
$clientLog    = Join-Path $LogDir 'client.log'
$clientErrLog = Join-Path $LogDir 'client.err.log'
foreach ($f in @($apiLog, $apiErrLog, $clientLog, $clientErrLog)) {
    Set-Content -Path $f -Value '' -NoNewline
}

Write-Info "API      -> http://localhost:$($script:ApiPort)"
Write-Info "Фронтенд -> http://localhost:$($script:ClientPort)"
Write-Info 'Ctrl+C зупиняє обидва.'
Write-Host ''

try {
    # Логи йдуть у файли, а в консоль — з префіксами: react-scripts інакше чистить
    # екран і затирає вивід API.
    $script:ApiProc = Start-Process -FilePath 'npm.cmd' -ArgumentList 'run', 'start:local' `
        -WorkingDirectory $ApiDir -NoNewWindow -PassThru `
        -RedirectStandardOutput $apiLog -RedirectStandardError $apiErrLog
    $script:ClientProc = Start-Process -FilePath 'pnpm.cmd' -ArgumentList 'start' `
        -WorkingDirectory $ClientDir -NoNewWindow -PassThru `
        -RedirectStandardOutput $clientLog -RedirectStandardError $clientErrLog

    $readers = @(
        @{ Path = $apiLog;       Tag = '[api]'; Color = 'Cyan';    Pos = [long]0 }
        @{ Path = $apiErrLog;    Tag = '[api]'; Color = 'Cyan';    Pos = [long]0 }
        @{ Path = $clientLog;    Tag = '[web]'; Color = 'Magenta'; Pos = [long]0 }
        @{ Path = $clientErrLog; Tag = '[web]'; Color = 'Magenta'; Pos = [long]0 }
    )

    # Ctrl+C читаємо самі — так cleanup відпрацьовує гарантовано, а не як пощастить.
    $canReadKeys = $false
    try { [Console]::TreatControlCAsInput = $true; $canReadKeys = $true } catch { }

    while ($true) {
        foreach ($r in $readers) { Show-NewLines -Reader $r }

        if ($canReadKeys) {
            # У неінтерактивному запуску (перенаправлений stdin) KeyAvailable кидає —
            # тоді просто далі чекаємо на завершення процесів.
            try {
                if ([Console]::KeyAvailable) {
                    $key = [Console]::ReadKey($true)
                    if (($key.Modifiers -band [ConsoleModifiers]::Control) -and $key.Key -eq 'C') { break }
                }
            } catch { $canReadKeys = $false }
        }

        if ($script:ApiProc.HasExited) {
            foreach ($r in $readers) { Show-NewLines -Reader $r }
            Write-Warn 'API завершився сам — дивіться .dev-logs\api.log'
            break
        }
        if ($script:ClientProc.HasExited) {
            foreach ($r in $readers) { Show-NewLines -Reader $r }
            Write-Warn 'Фронтенд завершився сам — дивіться .dev-logs\client.log'
            break
        }

        Start-Sleep -Milliseconds 250
    }
}
finally {
    try { [Console]::TreatControlCAsInput = $false } catch { }
    Invoke-Cleanup
}
