# iOS 반려 수정 가이드 - 가이드라인 2.3 메타데이터

## 🚨 반려 사유

```
가이드라인 2.3 - 성능 - 정확한 메타데이터

귀하의 앱 메타데이터에는 다음 정보가 포함되어 있으나, 
이는 앱 내용과 기능과는 관련이 없습니다:

• 아티스트로부터 직접 원본 작품을 구매하기 다음 단계
```

## 🔍 문제 분석

### 문제점:
- **"다음 단계"라는 표현**이 문제
- Apple이 "앱 외부에서 추가 단계가 필요한가?" 오해
- 메타데이터가 앱의 실제 기능을 명확히 반영하지 못함

### 원인:
App Store Connect의 다음 항목 중 하나에 문제 있음:
1. Subtitle (자막)
2. Description (설명)
3. Promotional Text
4. Screenshots 텍스트 오버레이

## ✅ 수정 방법

### 1단계: App Store Connect 로그인

```
https://appstoreconnect.apple.com
→ 앱 선택 (Artyard)
→ 버전 편집 (현재 "Metadata Rejected" 상태)
```

### 2단계: 메타데이터 전체 교체

#### 📱 App Name (변경 불필요)
```
Artyard
```

#### 📱 Subtitle (자막) - 30자 제한
```
❌ 삭제할 표현:
"아티스트로부터 직접 작품 구매 - 다음 단계"
"Buy Art Directly - Next Steps"

✅ 새로운 자막:
영어: Global Art Marketplace
한글: 글로벌 아트 마켓플레이스
```

#### 📱 Promotional Text (홍보 문구) - 170자
```
✓ 직거래 0% 수수료
✓ 에스크로 10% 안전 결제
✓ 앱 내 결제 및 채팅
✓ 200개국 아티스트 연결
지금 다운로드하고 독특한 작품을 만나보세요!
```

#### 📱 Description (설명) - 4000자
```
Artyard - 신진 작가 아트 마켓플레이스

신진 작가와 아트 컬렉터를 연결하는 글로벌 플랫폼입니다.
모든 거래와 소통이 앱 내에서 안전하게 이루어집니다.

━━━━━━━━━━━━━━━━━
▶ 구매자를 위한 기능
━━━━━━━━━━━━━━━━━

✓ 작품 탐색 및 검색
✓ 작가 프로필 및 포트폴리오 확인
✓ 앱 내 직접 결제 (직거래 또는 에스크로)
✓ 작가와 1:1 채팅
✓ 챌린지 투표 참여
✓ 경매 입찰
✓ 구매 내역 및 배송 추적
✓ 리뷰 및 평점 작성

━━━━━━━━━━━━━━━━━
▶ 작가를 위한 기능
━━━━━━━━━━━━━━━━━

✓ 작품 업로드 및 판매
✓ 직거래 모드 (수수료 0%)
✓ 에스크로 결제 (수수료 10%)
✓ 챌린지 참여
✓ 경매 출품
✓ 판매 통계 확인
✓ 구매자와 채팅

━━━━━━━━━━━━━━━━━
▶ 핵심 특징
━━━━━━━━━━━━━━━━━

• 직거래: 0% 수수료로 작가가 100% 수익
• 에스크로: 10% 수수료로 안전한 거래 보장
• 챌린지: 격주 테마 챌린지
• 경매: 수상작 분기별 경매
• 글로벌: 87개 통화 지원

━━━━━━━━━━━━━━━━━
▶ 결제 및 배송
━━━━━━━━━━━━━━━━━

모든 결제는 앱 내에서 완료됩니다.
에스크로 결제 시 플랫폼이 배송과 분쟁을 처리합니다.
직거래 선택 시 작가와 구매자가 직접 협의합니다.

지금 다운로드하고 전 세계 신진 작가들의 작품을 만나보세요!
```

#### 📱 Keywords (키워드) - 100자
```
art,artwork,artist,painting,marketplace,gallery,직거래,작품,작가,갤러리,미술,그림
```

### 3단계: 스크린샷 확인

**삭제해야 할 텍스트:**
- ❌ "다음 단계"
- ❌ "Next step"
- ❌ "Step 1, Step 2"
- ❌ "웹사이트 방문"
- ❌ "외부 링크"

**사용 가능한 텍스트:**
- ✅ "앱 내 직접 결제"
- ✅ "작가와 직접 채팅"
- ✅ "안전한 거래"
- ✅ "즉시 구매"

### 4단계: App Review Information (심사 정보)

**Notes to Reviewer에 추가:**
```
Dear Reviewer,

We have updated our app metadata to better reflect the actual functionality of our app.

Key Changes Made:
1. Removed ambiguous phrases like "next step" from our description
2. Clarified that all transactions occur within the app
3. Updated subtitle to clearly describe app purpose

App Functionality:
- Users can browse artworks
- Users can purchase directly within the app using in-app payment
- Users can chat with artists in-app
- All core features are contained within the app

Thank you for your review.

Best regards,
Artyard Team
```

## 📝 체크리스트

### 수정 전 확인:
- [ ] App Store Connect 로그인 완료
- [ ] 현재 메타데이터 확인 (특히 Subtitle과 Description)
- [ ] 스크린샷에 "다음 단계" 텍스트 유무 확인

### 수정 항목:
- [ ] Subtitle 수정: "Global Art Marketplace"
- [ ] Promotional Text 수정
- [ ] Description 전체 교체
- [ ] Keywords 확인 및 수정
- [ ] 스크린샷 텍스트 확인 (문제 있으면 재업로드)
- [ ] Notes to Reviewer 작성

### 재제출:
- [ ] 모든 메타데이터 저장
- [ ] "Submit for Review" 클릭
- [ ] 확인 이메일 수신

## ⚠️ 주의사항

### 절대 사용하지 말 것:
```
❌ "다음 단계"
❌ "Next step"
❌ "Step 1, 2, 3..."
❌ "웹사이트에서..."
❌ "외부 링크로..."
❌ "추가 설치 필요"
```

### 강조해야 할 것:
```
✅ "앱 내에서"
✅ "in-app"
✅ "directly within the app"
✅ "앱에서 바로"
✅ "즉시 구매"
✅ "complete within app"
```

## 🎯 예상 결과

**수정 후 예상 심사 기간:**
- 24-48시간

**승인 가능성:**
- 메타데이터만 수정하면 매우 높음 (95%+)
- 앱 자체는 문제 없음 (이전에 다른 사유로 승인받았음)

## 📞 추가 도움

혹시 App Store Connect에서 어떤 부분에 정확히 뭐라고 적혀있는지 모르겠으면:

1. App Store Connect → 앱 선택
2. "App Information" 탭 → Subtitle 확인
3. "Version Information" → Promotional Text, Description 확인
4. 스크린샷 확인

현재 내용을 복사해서 보내주시면 정확히 어디가 문제인지 짚어드릴게요!

