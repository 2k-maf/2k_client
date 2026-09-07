#Requires -Version 7
<#
    Порівнює claim "sub", який GitHub кладе в OIDC-токен воркфлову, з умовою
    "sub" у політиці довіри ролі AWS. Розбіжність означає, що крок
    "Креденшели AWS" у деплої впаде з повідомленням
    "Not authorized to perform sts:AssumeRoleWithWebIdentity".

    Потрібні: gh з авторизацією та aws з правом iam:GetRole.
#>
[CmdletBinding()]
param(
    [string]$Repo     = '2k-maf/2k_client',
    [string]$RoleName = '2k-prod-gha-deploy-client',
    [string]$Ref      = 'refs/heads/main'
)

$ErrorActionPreference = 'Stop'

# GitHub віддає префікс "sub" разом з незмінними ID власника й репозиторію.
# Репозиторії, створені після 2026-07-15, віддають лише цю форму.
$subApi = gh api "repos/$Repo/actions/oidc/customization/sub"
if ($LASTEXITCODE -ne 0) { throw "gh api не віддав налаштування OIDC для $Repo" }

$prefix = ($subApi | ConvertFrom-Json).sub_claim_prefix
if (-not $prefix) { throw "GitHub не повернув sub_claim_prefix для $Repo" }
$expected = "${prefix}:ref:$Ref"

$policyJson = aws iam get-role --role-name $RoleName --query 'Role.AssumeRolePolicyDocument' --output json
if ($LASTEXITCODE -ne 0) { throw "aws iam get-role не віддав політику довіри ролі $RoleName" }

$claim  = 'token.actions.githubusercontent.com:sub'
$actual = @(($policyJson | ConvertFrom-Json).Statement.Condition.StringEquals.$claim)

Write-Host "Токен GitHub несе sub : $expected"
Write-Host "Роль приймає sub      : $($actual -join ', ')"

if ($actual -contains $expected) {
    Write-Host 'OK: політика довіри приймає токен цього репозиторію.'
    exit 0
}

Write-Host "ПОМИЛКА: політика довіри ролі $RoleName не містить sub = $expected"
exit 1
