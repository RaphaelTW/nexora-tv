$ErrorActionPreference = "Stop"
$env:EXPO_TV = "1"
Write-Host "==> Gerando projeto nativo Android TV" -ForegroundColor Green
npx expo prebuild --clean
npx expo run:android
