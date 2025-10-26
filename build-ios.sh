#!/bin/bash

# iOS 프로덕션 빌드 및 TestFlight 업로드 스크립트

echo "🍎 ArtYard iOS 빌드 시작..."
echo ""

# 1. Git 상태 확인
echo "📋 Git 상태 확인 중..."
if [[ -n $(git status -s) ]]; then
    echo "⚠️  커밋되지 않은 변경사항이 있습니다."
    echo ""
    git status -s
    echo ""
    read -p "계속하시겠습니까? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ 빌드 취소됨"
        exit 1
    fi
fi

# 2. 빌드 번호 표시
echo ""
echo "📊 현재 app.json 버전 정보:"
grep -A 2 '"version"' app.json
echo ""

# 3. EAS 로그인 확인
echo "🔐 EAS 로그인 확인 중..."
npx eas whoami

# 4. 프로덕션 빌드 시작
echo ""
echo "🚀 프로덕션 빌드 시작..."
echo ""
npx eas build --platform ios --profile production

# 5. 완료 메시지
echo ""
echo "✅ 빌드 명령이 실행되었습니다!"
echo ""
echo "📱 다음 단계:"
echo "   1. 빌드 완료 대기 (15-20분)"
echo "   2. App Store Connect에서 빌드 확인"
echo "   3. TestFlight에서 테스트"
echo ""
echo "🔗 빌드 상태 확인:"
echo "   https://expo.dev/accounts/lavlna280/projects/artyard/builds"
echo ""

