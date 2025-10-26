#!/bin/bash

echo "🔄 앱을 재시작합니다..."
echo ""
echo "1️⃣ 기존 Metro bundler 종료 중..."
pkill -f "expo start" || true
pkill -f "react-native start" || true

echo ""
echo "2️⃣ 캐시 클리어 중..."
npx expo start --clear

echo ""
echo "✅ 앱이 재시작되었습니다!"
echo ""
echo "📱 다음 단계:"
echo "   1. iOS 시뮬레이터 또는 실제 기기에서 앱 열기"
echo "   2. 로그인 버튼 클릭"
echo "   3. Safari에서 로그인 완료"
echo "   4. 자동으로 앱으로 돌아오는지 확인"

