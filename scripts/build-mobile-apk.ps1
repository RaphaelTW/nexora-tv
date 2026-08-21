$ErrorActionPreference = "Stop"
$env:EXPO_TV = "0"
Write-Host "==> Nexora TV / APK Android Mobile" -ForegroundColor Cyan
npx eas build --platform android --profile preview-mobile
