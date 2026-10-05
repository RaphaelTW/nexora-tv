param(
  [Parameter(Mandatory = $true)][string]$Version,
  [Parameter(Mandatory = $true)][string]$MobileApk,
  [Parameter(Mandatory = $true)][string]$TvApk
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$validator = Join-Path $root 'scripts\validate-release.mjs'
$signingConfigPath = Join-Path $root 'scripts\release-signing.json'
node $validator $Version --resume
if ($LASTEXITCODE -ne 0) { throw 'Validação de versão falhou. A publicação foi interrompida.' }
if (-not (Test-Path -LiteralPath $signingConfigPath)) { throw 'Configuração de assinatura não encontrada.' }
$signing = Get-Content -LiteralPath $signingConfigPath -Raw | ConvertFrom-Json
$appConfig = Get-Content -LiteralPath (Join-Path $root 'app.config.ts') -Raw
$expectedVersionCode = [int]([regex]::Match($appConfig, 'versionCode:\s*(\d+)').Groups[1].Value)
if ($expectedVersionCode -lt 1) { throw 'Não foi possível identificar android.versionCode em app.config.ts.' }
$headCommit = (& git rev-parse HEAD).Trim()
$remoteMain = ((& git ls-remote origin refs/heads/main) -split '\s+')[0]
if (-not $remoteMain -or $remoteMain -ne $headCommit) { throw 'O commit atual ainda não está em origin/main. Faça merge da PR antes de publicar uma release.' }

function Find-AndroidTool {
  param([string]$Name)
  $command = Get-Command $Name -ErrorAction SilentlyContinue
  if ($command) { return $command.Source }
  $sdkRoots = @($env:ANDROID_HOME, $env:ANDROID_SDK_ROOT, (Join-Path $env:LOCALAPPDATA 'Android\Sdk')) | Where-Object { $_ -and (Test-Path $_) }
  foreach ($sdkRoot in $sdkRoots) {
    $buildTools = Join-Path $sdkRoot 'build-tools'
    if (-not (Test-Path $buildTools)) { continue }
    $found = Get-ChildItem -LiteralPath $buildTools -Directory | Sort-Object Name -Descending | ForEach-Object {
      $candidate = Join-Path $_.FullName $Name
      if (Test-Path -LiteralPath $candidate) { $candidate; break }
    }
    if ($found) { return $found }
  }
  throw "Ferramenta Android não encontrada: $Name. Instale Android SDK Build-Tools para validar os APKs."
}

function Invoke-AndroidTool {
  param([string]$Tool, [string[]]$Arguments)
  $output = & $Tool @Arguments 2>&1 | Out-String
  if ($LASTEXITCODE -ne 0) { throw "Falha ao inspecionar APK: $output" }
  return $output
}

function Assert-Apk {
  param([string]$Apk, $Expected, [bool]$IsTv)
  $badging = Invoke-AndroidTool $script:aapt @('dump', 'badging', $Apk)
  $packageMatch = [regex]::Match($badging, "package: name='([^']+)' versionCode='(\d+)' versionName='([^']+)'")
  if (-not $packageMatch.Success) { throw "Não foi possível ler o manifesto de $Apk." }
  if ($packageMatch.Groups[1].Value -ne $Expected.package) { throw "APK incorreto: esperado pacote $($Expected.package), encontrado $($packageMatch.Groups[1].Value)." }
  if ($packageMatch.Groups[2].Value -ne "$expectedVersionCode" -or $packageMatch.Groups[3].Value -ne $Version) { throw "APK com versão incorreta: esperado $Version ($expectedVersionCode), encontrado $($packageMatch.Groups[3].Value) ($($packageMatch.Groups[2].Value))." }
  if ($IsTv -and ($badging -notmatch 'leanback-launchable-activity' -or $badging -notmatch 'android\.software\.leanback')) { throw 'O APK de TV não declara recursos Leanback de Android TV.' }

  $signature = Invoke-AndroidTool $script:apkSigner @('verify', '--verbose', '--print-certs', $Apk)
  if ($signature -notmatch '(?m)^Verifies\s*$') { throw "A assinatura do APK não foi validada: $Apk" }
  $certificate = [regex]::Match($signature, 'certificate SHA-256 digest:\s*([a-f0-9]{64})', [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
  if (-not $certificate.Success -or $certificate.Groups[1].Value.ToLowerInvariant() -ne $Expected.certificateSha256) { throw "APK assinado com certificado inesperado: $Apk" }
}

$script:aapt = Find-AndroidTool 'aapt.exe'
$script:apkSigner = Find-AndroidTool 'apksigner.bat'

function Invoke-Git {
  param([Parameter(ValueFromRemainingArguments = $true)][string[]]$Arguments)
  & git @Arguments
  if ($LASTEXITCODE -ne 0) { throw "Falha ao executar git $($Arguments -join ' ')" }
}

function Invoke-Gh {
  param([Parameter(ValueFromRemainingArguments = $true)][string[]]$Arguments)
  & gh @Arguments
  if ($LASTEXITCODE -ne 0) { throw "Falha ao executar gh $($Arguments -join ' ')" }
}

function Get-Release {
  param([string]$Tag)
  $json = & gh release view $Tag --json isDraft,assets,url 2>$null
  if ($LASTEXITCODE -ne 0) { return $null }
  return $json | ConvertFrom-Json
}

function Test-ReleaseAssets {
  param($Release, [string]$MobileName, [string]$MobileDigest, [string]$TvName, [string]$TvDigest)
  if ($null -eq $Release) { return $false }
  $mobile = @($Release.assets | Where-Object { $_.name -eq $MobileName })
  $tv = @($Release.assets | Where-Object { $_.name -eq $TvName })
  return $mobile.Count -eq 1 -and $tv.Count -eq 1 -and $mobile[0].digest -eq $MobileDigest -and $tv[0].digest -eq $TvDigest
}

$tag = "v$Version"
$output = Join-Path $root "release-artifacts\$tag"
$mobileOutput = Join-Path $output "nexora-tv-v$Version-android.apk"
$tvOutput = Join-Path $output "nexora-tv-v$Version-android-tv.apk"

if (-not (Test-Path -LiteralPath $MobileApk) -or -not (Test-Path -LiteralPath $TvApk)) {
  throw 'Informe os caminhos dos dois APKs gerados pelo EAS.'
}
Assert-Apk $MobileApk $signing.mobile $false
Assert-Apk $TvApk $signing.tv $true
New-Item -ItemType Directory -Force -Path $output | Out-Null
Copy-Item -LiteralPath $MobileApk -Destination $mobileOutput -Force
Copy-Item -LiteralPath $TvApk -Destination $tvOutput -Force

$mobileHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $mobileOutput).Hash.ToLowerInvariant()
$tvHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $tvOutput).Hash.ToLowerInvariant()
$notes = @"
## APKs verificados

- ``nexora-tv-v$Version-android.apk`` — SHA-256: $mobileHash
- ``nexora-tv-v$Version-android-tv.apk`` — SHA-256: $tvHash
"@

$mobileName = Split-Path -Leaf $mobileOutput
$tvName = Split-Path -Leaf $tvOutput
$mobileDigest = "sha256:$mobileHash"
$tvDigest = "sha256:$tvHash"
$release = Get-Release $tag

if ($release -and -not $release.isDraft) {
  if (Test-ReleaseAssets $release $mobileName $mobileDigest $tvName $tvDigest) {
    Write-Host "Release já publicada e validada: $($release.url)"
    exit 0
  }
  throw "A release pública $tag já existe, mas os APKs ou hashes não coincidem. Nenhum arquivo foi alterado."
}

$localTag = (& git tag -l $tag).Trim()
if ($localTag) {
  $tagCommit = (& git rev-list -n 1 $tag).Trim()
  $headCommit = (& git rev-parse HEAD).Trim()
  if ($tagCommit -ne $headCommit) { throw "A tag local $tag não aponta para o commit atual. Nenhum arquivo foi publicado." }
} else {
  Invoke-Git tag -a $tag -m "Nexora TV $tag"
}

Invoke-Git push origin $tag

if (-not $release) {
  Invoke-Gh release create $tag --draft --verify-tag --title "Nexora TV $tag" --notes $notes --target HEAD
  $release = Get-Release $tag
}
if (-not $release -or -not $release.isDraft) { throw "Não foi possível criar ou recuperar o rascunho da release $tag." }

Invoke-Gh release upload $tag $mobileOutput $tvOutput --clobber
$release = Get-Release $tag
if (-not (Test-ReleaseAssets $release $mobileName $mobileDigest $tvName $tvDigest)) {
  throw "Os APKs ou SHA-256 da release $tag não passaram na conferência. O rascunho foi mantido para retomar a publicação."
}

Invoke-Gh release edit $tag --draft=false
$release = Get-Release $tag
if (-not $release -or $release.isDraft) { throw "A release $tag permaneceu em rascunho. Revise-a e execute o comando novamente." }
Write-Host "Release publicada e validada: $($release.url)"
