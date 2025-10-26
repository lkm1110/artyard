# PowerShell 스크립트 - iOS 프로덕션 빌드 및 TestFlight 업로드

Write-Host "🍎 ArtYard iOS 빌드 시작..." -ForegroundColor Cyan
Write-Host ""

# 1. Git 상태 확인
Write-Host "📋 Git 상태 확인 중..." -ForegroundColor Yellow
$gitStatus = git status -s
if ($gitStatus) {
    Write-Host "⚠️  커밋되지 않은 변경사항이 있습니다." -ForegroundColor Yellow
    Write-Host ""
    git status -s
    Write-Host ""
    $response = Read-Host "계속하시겠습니까? (y/n)"
    if ($response -ne 'y' -and $response -ne 'Y') {
        Write-Host "❌ 빌드 취소됨" -ForegroundColor Red
        exit 1
    }
}

# 2. 빌드 번호 표시
Write-Host ""
Write-Host "📊 현재 app.json 버전 정보:" -ForegroundColor Yellow
Get-Content app.json | Select-String -Pattern '"version"' -Context 0,2
Write-Host ""

# 3. EAS 로그인 확인
Write-Host "🔐 EAS 로그인 확인 중..." -ForegroundColor Yellow
npx eas whoami

# 4. 프로덕션 빌드 시작
Write-Host ""
Write-Host "🚀 프로덕션 빌드 시작..." -ForegroundColor Green
Write-Host ""
npx eas build --platform ios --profile production

# 5. 완료 메시지
Write-Host ""
Write-Host "✅ 빌드 명령이 실행되었습니다!" -ForegroundColor Green
Write-Host ""
Write-Host "📱 다음 단계:" -ForegroundColor Cyan
Write-Host "   1. 빌드 완료 대기 (15-20분)"
Write-Host "   2. App Store Connect에서 빌드 확인"
Write-Host "   3. TestFlight에서 테스트"
Write-Host ""
Write-Host "🔗 빌드 상태 확인:" -ForegroundColor Cyan
Write-Host "   https://expo.dev/accounts/lavlna280/projects/artyard/builds"
Write-Host ""

