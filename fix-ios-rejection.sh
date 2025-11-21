#!/bin/bash
# iOS App Store 심사 거부 해결 스크립트 (macOS/Linux)
# 이 스크립트는 아이콘을 생성하고 빌드 준비를 합니다

echo "================================="
echo "iOS App Store 심사 거부 해결"
echo "================================="
echo ""

# 1. 아이콘 생성
echo "1/5: iOS 아이콘 생성 중..."
npm run icons:install
if [ $? -ne 0 ]; then
    echo "❌ 아이콘 생성 실패!"
    exit 1
fi
echo "✅ 아이콘 생성 완료!"
echo ""

# 2. 생성된 아이콘 확인
echo "2/5: 생성된 아이콘 확인 중..."
if [ -f "assets/ios/Icon-1024.png" ]; then
    echo "✅ App Store 아이콘 (1024x1024) 생성 완료!"
else
    echo "⚠️  App Store 아이콘이 없습니다!"
fi

if [ -f "assets/icon.png" ]; then
    echo "✅ 기본 앱 아이콘 생성 완료!"
else
    echo "⚠️  기본 앱 아이콘이 없습니다!"
fi
echo ""

# 3. app.json 빌드 번호 확인
echo "3/5: app.json 확인 중..."
CURRENT_BUILD=$(grep -o '"buildNumber": "[^"]*' app.json | grep -o '[^"]*$')
NEW_BUILD=$((CURRENT_BUILD + 1))
echo "현재 빌드 번호: $CURRENT_BUILD"
echo "다음 빌드 번호: $NEW_BUILD"
echo ""
echo "⚠️  빌드 전에 app.json의 buildNumber를 $NEW_BUILD 로 변경하세요!"
echo ""

# 4. 신고/차단 기능 확인
echo "4/5: 신고/차단 기능 확인 중..."
if [ -f "src/components/ReportUserModal.tsx" ]; then
    echo "✅ 신고(Report) 모달 있음"
else
    echo "❌ 신고(Report) 모달 없음!"
fi

if [ -f "src/components/BlockUserModal.tsx" ]; then
    echo "✅ 차단(Block) 모달 있음"
else
    echo "❌ 차단(Block) 모달 없음!"
fi

if [ -f "src/screens/admin/ReportsManagementScreen.tsx" ]; then
    echo "✅ 신고 관리 화면 있음"
else
    echo "❌ 신고 관리 화면 없음!"
fi
echo ""

# 5. 다음 단계 안내
echo "5/5: 다음 단계"
echo "================================="
echo ""
echo "✅ 아이콘 생성 완료!"
echo "✅ 신고/차단 기능 확인 완료!"
echo ""
echo "📝 다음 작업을 수행하세요:"
echo ""
echo "1. app.json 열기"
echo "   - ios.buildNumber를 '$NEW_BUILD'로 변경"
echo ""
echo "2. Prebuild 실행 (선택사항)"
echo "   npx expo prebuild --clean --platform ios"
echo ""
echo "3. EAS 빌드 실행"
echo "   eas build --platform ios --profile production"
echo ""
echo "4. App Store Connect 답변 작성"
echo "   - APP-STORE-REJECTION-FIX.md 파일 참고"
echo ""
echo "================================="
echo ""
echo "자세한 내용은 APP-STORE-REJECTION-FIX.md를 확인하세요!"

