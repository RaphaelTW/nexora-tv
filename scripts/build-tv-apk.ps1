$ErrorActionPreference = "Stop"
$env:EXPO_TV = "1"
Write-Host "==> Nexora TV / APK Android TV" -ForegroundColor Green
npx --yes eas-cli@latest build --platform android --profile preview-tv
