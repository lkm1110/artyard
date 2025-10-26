# PowerShell 스크립트 - 앱 재시작

Write-Host "🔄 앱을 재시작합니다..." -ForegroundColor Cyan
Write-Host ""

Write-Host "1️⃣ 기존 Metro bundler 종료 중..." -ForegroundColor Yellow
Get-Process | Where-Object {$_.ProcessName -like "*node*" -and $_.CommandLine -like "*expo*"} | Stop-Process -Force -ErrorAction SilentlyContinue
Get-Process | Where-Object {$_.ProcessName -like "*node*" -and $_.CommandLine -like "*react-native*"} | Stop-Process -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "2️⃣ 캐시 클리어 및 앱 시작 중..." -ForegroundColor Yellow
npx expo start --clear

Write-Host ""
Write-Host "✅ 앱이 재시작되었습니다!" -ForegroundColor Green
Write-Host ""
Write-Host "📱 다음 단계:" -ForegroundColor Cyan
Write-Host "   1. iOS 시뮬레이터 또는 실제 기기에서 앱 열기"
Write-Host "   2. 로그인 버튼 클릭"
Write-Host "   3. Safari에서 로그인 완료"
Write-Host "   4. 자동으로 앱으로 돌아오는지 확인"

