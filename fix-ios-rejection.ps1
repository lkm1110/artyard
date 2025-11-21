# iOS App Store 심사 거부 해결 스크립트 (Windows PowerShell)
# 이 스크립트는 아이콘을 생성하고 빌드 준비를 합니다

Write-Host "=================================" -ForegroundColor Cyan
Write-Host "iOS App Store 심사 거부 해결" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# 1. 아이콘 생성
Write-Host "1/5: iOS 아이콘 생성 중..." -ForegroundColor Yellow
npm run icons:install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 아이콘 생성 실패!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ 아이콘 생성 완료!" -ForegroundColor Green
Write-Host ""

# 2. 생성된 아이콘 확인
Write-Host "2/5: 생성된 아이콘 확인 중..." -ForegroundColor Yellow
if (Test-Path "assets/ios/Icon-1024.png") {
    Write-Host "✅ App Store 아이콘 (1024x1024) 생성 완료!" -ForegroundColor Green
} else {
    Write-Host "⚠️  App Store 아이콘이 없습니다!" -ForegroundColor Red
}

if (Test-Path "assets/icon.png") {
    Write-Host "✅ 기본 앱 아이콘 생성 완료!" -ForegroundColor Green
} else {
    Write-Host "⚠️  기본 앱 아이콘이 없습니다!" -ForegroundColor Red
}
Write-Host ""

# 3. app.json 빌드 번호 확인
Write-Host "3/5: app.json 확인 중..." -ForegroundColor Yellow
$appJson = Get-Content "app.json" -Raw | ConvertFrom-Json
$currentBuildNumber = $appJson.expo.ios.buildNumber
Write-Host "현재 빌드 번호: $currentBuildNumber" -ForegroundColor Cyan

$newBuildNumber = [int]$currentBuildNumber + 1
Write-Host "다음 빌드 번호: $newBuildNumber" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  빌드 전에 app.json의 buildNumber를 $newBuildNumber 로 변경하세요!" -ForegroundColor Yellow
Write-Host ""

# 4. 신고/차단 기능 확인
Write-Host "4/5: 신고/차단 기능 확인 중..." -ForegroundColor Yellow
if (Test-Path "src/components/ReportUserModal.tsx") {
    Write-Host "✅ 신고(Report) 모달 있음" -ForegroundColor Green
} else {
    Write-Host "❌ 신고(Report) 모달 없음!" -ForegroundColor Red
}

if (Test-Path "src/components/BlockUserModal.tsx") {
    Write-Host "✅ 차단(Block) 모달 있음" -ForegroundColor Green
} else {
    Write-Host "❌ 차단(Block) 모달 없음!" -ForegroundColor Red
}

if (Test-Path "src/screens/admin/ReportsManagementScreen.tsx") {
    Write-Host "✅ 신고 관리 화면 있음" -ForegroundColor Green
} else {
    Write-Host "❌ 신고 관리 화면 없음!" -ForegroundColor Red
}
Write-Host ""

# 5. 다음 단계 안내
Write-Host "5/5: 다음 단계" -ForegroundColor Yellow
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ 아이콘 생성 완료!" -ForegroundColor Green
Write-Host "✅ 신고/차단 기능 확인 완료!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 다음 작업을 수행하세요:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. app.json 열기" -ForegroundColor White
Write-Host "   - ios.buildNumber를 '$newBuildNumber'로 변경" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Prebuild 실행 (선택사항)" -ForegroundColor White
Write-Host "   npx expo prebuild --clean --platform ios" -ForegroundColor Gray
Write-Host ""
Write-Host "3. EAS 빌드 실행" -ForegroundColor White
Write-Host "   eas build --platform ios --profile production" -ForegroundColor Gray
Write-Host ""
Write-Host "4. App Store Connect 답변 작성" -ForegroundColor White
Write-Host "   - APP-STORE-REJECTION-FIX.md 파일 참고" -ForegroundColor Gray
Write-Host ""
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "자세한 내용은 APP-STORE-REJECTION-FIX.md를 확인하세요!" -ForegroundColor Yellow

