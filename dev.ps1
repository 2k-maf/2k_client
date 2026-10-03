<#
.SYNOPSIS
    Керує локальним запуском обох половин Dva Kol'ory (2K): API і фронтенду.

.DESCRIPTION
    Розраховує, що репозиторії лежать поруч і названі так само, як на GitHub:

        2k\
        ├── 2k_api\
        └── 2k_client\

    Скрипт однаковий в обох репозиторіях — запускайте той, що під рукою.
    Половину з того репозиторію, звідки запущено скрипт, він бере з цього ж
    checkout (зокрема з git worktree), а другу — з головного checkout сусіда.

    Команди:
      up      (типово) запускає обидва в цьому вікні; Ctrl+C зупиняє обидва.
      start   запускає обидва у фоні й повертає керування, коли порти слухають.
      stop    зупиняє обидва, хоч би як їх запустили.
      status  показує, хто слухає порти API і фронтенду, і з якого checkout.
      logs    друкує останні рядки логів фонового запуску.

.EXAMPLE
    pwsh -File .\dev.ps1
.EXAMPLE
    pwsh -File .\dev.ps1 start
.EXAMPLE
    pwsh -File .\dev.ps1 logs -Lines 100
#>

[CmdletBinding()]
param(
    [ValidateSet('up', 'start', 'stop', 'status', 'logs')]
    [string]$Command = 'up',
    # Скільки останніх рядків кожного логу друкує `logs`.
    [int]$Lines = 40
)

$ErrorActionPreference = 'Stop'

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# У git worktree скрипт лежить у <repo>\.claude\worktrees\<name>, тож сусідній
# репозиторій шукаємо поруч із головним checkout, а не поруч зі скриптом.
$MainDir = $ScriptDir
try {
    $commonDir = & git -C $ScriptDir rev-parse --path-format=absolute --git-common-dir 2>$null
    if ($LASTEXITCODE -eq 0 -and $commonDir) { $MainDir = Split-Path -Parent $commonDir.Trim() }
} catch { }
$Root = Split-Path -Parent $MainDir

$IsApiRepo = Test-Path (Join-Path $ScriptDir 'local.server.js')
$ApiDir    = if ($IsApiRepo) { $ScriptDir } else { Join-Path $Root '2k_api' }
$ClientDir = if ($IsApiRepo) { Join-Path $Root '2k_client' } else { $ScriptDir }
$LogDir    = Join-Path $ScriptDir '.dev-logs'
$StateFile = Join-Path $LogDir 'state.json'

$Logs = @{
    ApiOut    = Join-Path $LogDir 'api.log'
    ApiErr    = Join-Path $LogDir 'api.err.log'
    ClientOut = Join-Path $LogDir 'client.log'
    ClientErr = Join-Path $LogDir 'client.err.log'
}

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

# Звільняє порт. Зупиняє лише node: порт стека може зайняти чужа програма, і
# вбивати її мовчки не можна.
function Stop-Port {
    param([int]$Port)
    $procId = Get-PortPid -Port $Port
    if (-not $procId) { return }
    $proc = Get-Process -Id $procId -ErrorAction SilentlyContinue
    if ($proc -and $proc.ProcessName -ne 'node') {
        Write-Warn "Порт $Port тримає $($proc.ProcessName) (PID $procId), а не node. Не зупиняю його."
        return
    }
    Stop-Tree -ProcessId $procId
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

# Порти з .env; без .env лишаються типові 3000 і 3005.
function Read-Ports {
    $apiPortRaw = Get-EnvValue -File (Join-Path $ApiDir '.env') -Key 'PORT'
    if ($apiPortRaw) { $script:ApiPort = [int]$apiPortRaw }
    $clientPortRaw = Get-EnvValue -File (Join-Path $ClientDir '.env') -Key 'PORT'
    if ($clientPortRaw) { $script:ClientPort = [int]$clientPortRaw }
}

# Ключі файлу env. З $NonEmptyOnly — лише ключі з непорожнім значенням.
function Get-EnvKeys {
    param([string]$File, [switch]$NonEmptyOnly)
    $pattern = if ($NonEmptyOnly) { '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*\S' } else { '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=' }
    Get-Content $File | ForEach-Object { if ($_ -match $pattern) { $Matches[1] } }
}

function Confirm-EnvFile {
    param([string]$Dir)
    $envFile = Join-Path $Dir '.env'
    # 2k_api тримає зразок як .env.example, 2k_client — як env.example.
    $example = @('.env.example', 'env.example') |
        ForEach-Object { Join-Path $Dir $_ } |
        Where-Object { Test-Path $_ } |
        Select-Object -First 1

    if (-not (Test-Path $envFile)) {
        if (-not $example) {
            Stop-WithError "Немає ні .env, ні зразка (.env.example / env.example) у $Dir"
        }
        Copy-Item $example $envFile
        Write-Warn "Створив $(Split-Path -Leaf $Dir)\.env з $(Split-Path -Leaf $example)"
        return
    }

    # Ключ, що з'явився у зразку після створення .env, інакше тихо вимикає функцію
    # (так зник вхід через Google). Порожні у зразку ключі — це секрети на ваш
    # вибір, про них не попереджаємо. .env не дописуємо: це ваш файл.
    if (-not $example) { return }
    $have = @(Get-EnvKeys -File $envFile)
    $missing = @(Get-EnvKeys -File $example -NonEmptyOnly | Where-Object { $_ -notin $have })
    if ($missing.Count -gt 0) {
        Write-Warn "$(Split-Path -Leaf $Dir)\.env не має ключів зі зразка $(Split-Path -Leaf $example): $($missing -join ', '). Скопіюйте потрібні рядки зі зразка."
    }
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

# Checkout, з якого запущено node: шлях до його node_modules у командному рядку.
# API стартує як `node local.server.js` без шляху, тож для нього це `$null`.
function Get-ProcessCheckout {
    param($ProcessId)
    $p = Get-CimInstance Win32_Process -Filter "ProcessId=$ProcessId" -ErrorAction SilentlyContinue
    if ($p -and $p.CommandLine -match '([A-Za-z]:\\[^"]*?)\\node_modules\\') { return $Matches[1] }
    return $null
}

# Перевірки, .env, залежності й порожні логи — спільна підготовка для up і start.
function Initialize-Stack {
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
    Read-Ports

    foreach ($item in @(
        @{ Name = 'API';       Port = $script:ApiPort },
        @{ Name = 'фронтенду'; Port = $script:ClientPort }
    )) {
        $busy = Get-PortPid -Port $item.Port
        if ($busy) { Stop-WithError "Порт $($item.Port) ($($item.Name)) вже зайнятий процесом $busy. Зупиніть його (dev.ps1 stop) й повторіть." }
    }

    if (-not (Test-Path (Join-Path $ApiDir 'node_modules'))) {
        Write-Info 'Ставлю залежності API...'
        Push-Location $ApiDir
        & npm.cmd install
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

    New-Item -ItemType Directory -Force -Path $LogDir | Out-Null
    foreach ($f in $Logs.Values) { Set-Content -Path $f -Value '' -NoNewline }

    Write-Info "API      -> http://localhost:$($script:ApiPort)  ($ApiDir)"
    Write-Info "Фронтенд -> http://localhost:$($script:ClientPort)  ($ClientDir)"
}

# Логи йдуть у файли: react-scripts інакше чистить екран і затирає вивід API.
function Start-Stack {
    param([switch]$Hidden)
    $common = @{ PassThru = $true }
    if ($Hidden) { $common.WindowStyle = 'Hidden' } else { $common.NoNewWindow = $true }
    $script:ApiProc = Start-Process @common -FilePath 'npm.cmd' -ArgumentList 'run', 'start:local' `
        -WorkingDirectory $ApiDir -RedirectStandardOutput $Logs.ApiOut -RedirectStandardError $Logs.ApiErr
    $script:ClientProc = Start-Process @common -FilePath 'pnpm.cmd' -ArgumentList 'start' `
        -WorkingDirectory $ClientDir -RedirectStandardOutput $Logs.ClientOut -RedirectStandardError $Logs.ClientErr
}

# Зупиняє стек: спершу записані PID фонового запуску, потім усе, що лишилося
# на портах. Порти покривають і запуск через `up`, і ручний `pnpm start`.
function Invoke-Cleanup {
    if ($script:Stopping) { return }
    $script:Stopping = $true
    Write-Info 'Зупиняю...'
    if ($script:ClientProc) { Stop-Tree -ProcessId $script:ClientProc.Id }
    if ($script:ApiProc)    { Stop-Tree -ProcessId $script:ApiProc.Id }
    if (Test-Path $StateFile) {
        $state = Get-Content $StateFile -Raw | ConvertFrom-Json
        Stop-Tree -ProcessId $state.clientPid
        Stop-Tree -ProcessId $state.apiPid
        Remove-Item $StateFile -Force
    }
    # Підстраховка: react-scripts і mongodb-memory-server іноді переживають смерть
    # батька, а живий процес тримає .mongo-local і наступний запуск падає.
    Start-Sleep -Milliseconds 800
    Stop-Port -Port $script:ClientPort
    Stop-Port -Port $script:ApiPort
    Write-Info 'Зупинено.'
}

function Show-LogTail {
    foreach ($item in @(
        @{ Path = $Logs.ApiOut;    Tag = '[api]' },
        @{ Path = $Logs.ApiErr;    Tag = '[api:err]' },
        @{ Path = $Logs.ClientOut; Tag = '[web]' },
        @{ Path = $Logs.ClientErr; Tag = '[web:err]' }
    )) {
        if (-not (Test-Path $item.Path)) { continue }
        $tail = Get-Content $item.Path -Tail $Lines -ErrorAction SilentlyContinue | Where-Object { $_ -ne '' }
        if (-not $tail) { continue }
        Write-Host "--- $($item.Tag) $($item.Path)" -ForegroundColor Cyan
        $tail | ForEach-Object { Write-Host $_ }
    }
}

# --- Команди ---------------------------------------------------------------

function Invoke-Up {
    Initialize-Stack
    Write-Info 'Ctrl+C зупиняє обидва.'
    Write-Host ''
    try {
        Start-Stack
        $readers = @(
            @{ Path = $Logs.ApiOut;    Tag = '[api]'; Color = 'Cyan';    Pos = [long]0 }
            @{ Path = $Logs.ApiErr;    Tag = '[api]'; Color = 'Cyan';    Pos = [long]0 }
            @{ Path = $Logs.ClientOut; Tag = '[web]'; Color = 'Magenta'; Pos = [long]0 }
            @{ Path = $Logs.ClientErr; Tag = '[web]'; Color = 'Magenta'; Pos = [long]0 }
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
        Write-Host ''
        Invoke-Cleanup
    }
}

function Invoke-Start {
    Initialize-Stack
    Start-Stack -Hidden
    @{ apiPid = $script:ApiProc.Id; clientPid = $script:ClientProc.Id } |
        ConvertTo-Json | Set-Content -Path $StateFile

    # Порт відкривається раніше за першу компіляцію CRA, тож чекати недовго.
    $deadline = (Get-Date).AddSeconds(180)
    while ($true) {
        $apiUp    = [bool](Get-PortPid -Port $script:ApiPort)
        $clientUp = [bool](Get-PortPid -Port $script:ClientPort)
        if ($apiUp -and $clientUp) { break }

        $failed = if ($script:ApiProc.HasExited) { 'API' } elseif ($script:ClientProc.HasExited) { 'Фронтенд' }
        if ($failed -or (Get-Date) -gt $deadline) {
            $reason = if ($failed) { "$failed завершився сам" } else { 'Порти не відкрилися за 180 с' }
            Write-Warn "$reason. Останні рядки логів:"
            Show-LogTail
            Invoke-Cleanup
            exit 1
        }
        Start-Sleep -Milliseconds 500
    }
    Write-Info "Працює у фоні. Логи: $LogDir"
    Write-Info 'Зупинка: dev.ps1 stop. Стан: dev.ps1 status.'
}

function Invoke-Status {
    Read-Ports
    foreach ($item in @(
        @{ Name = 'API';      Port = $script:ApiPort },
        @{ Name = 'Фронтенд'; Port = $script:ClientPort }
    )) {
        $procId = Get-PortPid -Port $item.Port
        if (-not $procId) {
            Write-Host ("{0,-9} :{1}  не запущено" -f $item.Name, $item.Port)
            continue
        }
        $name = (Get-Process -Id $procId -ErrorAction SilentlyContinue).ProcessName
        $from = Get-ProcessCheckout -ProcessId $procId
        $where = if ($from) { "  з $from" } else { '' }
        Write-Host ("{0,-9} :{1}  працює  PID {2} ({3}){4}" -f $item.Name, $item.Port, $procId, $name, $where) -ForegroundColor Green
    }
    if (Get-PortPid -Port $script:ApiPort) {
        try {
            $null = Invoke-WebRequest "http://localhost:$($script:ApiPort)/hello" -TimeoutSec 3 -UseBasicParsing
            Write-Host 'API /hello відповідає.' -ForegroundColor Green
        } catch {
            Write-Warn "API слухає порт, але /hello не відповідає: $($_.Exception.Message)"
        }
    }
}

switch ($Command) {
    'up'     { Invoke-Up }
    'start'  { Invoke-Start }
    'stop'   { Read-Ports; Invoke-Cleanup }
    'status' { Invoke-Status }
    'logs'   { Show-LogTail }
}
