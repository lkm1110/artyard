# iOS 심사 거부 해결 - 빠른 시작 🚀

## ⚡ 3분 해결

### Windows
```powershell
.\fix-ios-rejection.ps1
```

### macOS/Linux
```bash
chmod +x fix-ios-rejection.sh
./fix-ios-rejection.sh
```

---

## 📝 수동 실행 (스크립트 오류 시)

### 1️⃣ 아이콘 생성
```bash
npm run icons:install
```

### 2️⃣ app.json 수정
```json
{
  "expo": {
    "ios": {
      "buildNumber": "16"  ← 15에서 16으로 증가
    }
  }
}
```

### 3️⃣ 빌드
```bash
eas build --platform ios --profile production
```

---

## 📋 App Store Connect 답변

### 복사해서 붙여넣기:

```
안녕하세요, Apple 리뷰팀님

피드백 감사합니다. 지적하신 문제들을 다음과 같이 해결했습니다:

[가이드라인 2.3.8 - 앱 아이콘]
✅ 모든 앱 아이콘을 전문 디자이너가 제작한 Artyard 브랜드 로고로 교체했습니다.
✅ iOS에서 요구하는 모든 크기의 아이콘을 생성했습니다.
✅ App Store용 1024x1024 아이콘이 포함되어 있으며, 브랜드 일관성을 유지합니다.

[가이드라인 1.2 - 사용자 생성 콘텐츠]
다음 보호 조치를 구현했습니다:

1. ✅ 신고(Report) 기능 - 작품, 프로필, 댓글에 신고 버튼 추가
2. ✅ 차단(Block) 기능 - 사용자가 다른 사용자를 차단 가능
3. ✅ 관리자 도구 - 신고된 콘텐츠 검토 및 악용 사용자 차단
4. ✅ 이용약관 및 커뮤니티 가이드라인 명시

모든 기능이 정상 작동하며, Apple의 가이드라인을 준수합니다.

재검토 부탁드립니다.

감사합니다.
임강민
Co-Founder & CEO, Artyard
Email: lavlna280@gmail.com
Phone: 010-3352-3001
```

---

## ✅ 체크리스트

빌드 전 확인:
- [ ] `npm run icons:install` 실행 완료
- [ ] `assets/ios/Icon-1024.png` 파일 존재
- [ ] `app.json` buildNumber 증가
- [ ] 신고/차단 버튼이 앱에 보임

제출 전 확인:
- [ ] EAS 빌드 성공
- [ ] App Store Connect에 빌드 업로드
- [ ] Resolution Center에 답변 작성
- [ ] "Submit for Review" 클릭

---

## 🆘 문제 해결

### 아이콘이 생성 안 됨
```bash
npm cache clean --force
npm install --save-dev sharp
npm run icons:generate
```

### 빌드 오류
```bash
npx expo prebuild --clean --platform ios
eas build --platform ios
```

---

## 📖 상세 가이드

전체 내용: **APP-STORE-REJECTION-FIX.md**

---

**예상 승인 시간**: 1-2일 🎉

