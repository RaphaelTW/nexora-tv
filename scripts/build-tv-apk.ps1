$ErrorActionPreference = "Stop"
$env:EXPO_TV = "1"
Write-Host "==> Nexora TV / APK Android TV" -ForegroundColor Green
npx eas build --platform android --profile preview-tv
