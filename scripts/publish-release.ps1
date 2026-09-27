param(
  [Parameter(Mandatory = $true)][string]$Version,
  [Parameter(Mandatory = $true)][string]$MobileApk,
  [Parameter(Mandatory = $true)][string]$TvApk
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$tag = "v$Version"
$output = Join-Path $root "release-artifacts\$tag"
$mobileOutput = Join-Path $output "nexora-tv-v$Version-android.apk"
$tvOutput = Join-Path $output "nexora-tv-v$Version-android-tv.apk"

if (-not (Test-Path -LiteralPath $MobileApk) -or -not (Test-Path -LiteralPath $TvApk)) {
  throw 'Informe os caminhos dos dois APKs gerados pelo EAS.'
}
if (Test-Path -LiteralPath $output) { throw "A pasta de release já existe: $output" }

New-Item -ItemType Directory -Path $output | Out-Null
Copy-Item -LiteralPath $MobileApk -Destination $mobileOutput
Copy-Item -LiteralPath $TvApk -Destination $tvOutput

$mobileHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $mobileOutput).Hash.ToLowerInvariant()
$tvHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $tvOutput).Hash.ToLowerInvariant()
$notes = @"
## APKs verificados

- ``nexora-tv-v$Version-android.apk`` — SHA-256: $mobileHash
- ``nexora-tv-v$Version-android-tv.apk`` — SHA-256: $tvHash
"@

git tag -a $tag -m "Nexora TV $tag"
git push origin main $tag
gh release create $tag $mobileOutput $tvOutput --title "Nexora TV $tag" --notes $notes --generate-notes
Write-Host "Release publicada: $tag"
