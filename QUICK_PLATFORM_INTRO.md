# ArtYard - 5분 이해하기 (GPT용)

## 🎨 한 줄 요약
**대학생 아티스트와 구매자를 연결하는 모바일 아트 마켓플레이스 (인스타그램 + Etsy)**

---

## 🏗️ 기술 스택

```
Frontend: React Native (Expo) + TypeScript
Backend: Supabase (PostgreSQL + Real-time + Storage)
Payment: 2Checkout (→ Toss Payments 예정)
Push: Expo Push Notifications
Auth: Google/Apple/Facebook/Naver/Kakao SSO
```

---

## 💰 비즈니스 모델

```
작품 판매 시:
- 판매자: 90% 수령
- 플랫폼: 10% 수수료
- 구매자 ↔ 판매자 직접 소통 (배송 조율)
```

---

## 📱 핵심 기능 (우선순위 순)

### 1. Feed (메인)
- 무한 스크롤 작품 피드
- 좋아요/북마크 (즉시 반영)
- 필터링 (가격/크기/재료)

### 2. Upload (작품 등록)
- 다중 이미지 업로드
- 제목/설명/가격 입력
- Original/Limited/Copy 에디션

### 3. Purchase (구매)
- 2Checkout 결제
- Webhook으로 판매 완료 처리
- 판매된 작품 블러 + "SOLD" 표시

### 4. Chat (실시간)
- 구매자 ↔ 판매자 1:1 채팅
- 타이핑 표시 (2초)
- 메시지 수정/삭제

### 5. Dashboard (통계)
- 좋아요/판매/수익/팔로워
- Top 5 작품
- 일별 추이

---

## 🗄️ 핵심 DB 테이블

```sql
profiles         -- 유저 정보
artworks         -- 작품 (sale_status: available/sold)
transactions     -- 거래 (status: pending/paid/confirmed)
seller_payouts   -- 정산 (90% 판매자, 10% 플랫폼)
chat_rooms       -- 채팅방
chat_messages    -- 메시지
comments, likes, bookmarks, follows  -- 소셜
```

---

## 🔐 보안 핵심

```
✅ SSO만 사용 (비밀번호 없음)
✅ Client에 Public Key만 노출
✅ Secret Key는 Supabase Secrets 저장
✅ RLS로 데이터 접근 제어
✅ 2Checkout이 카드정보 처리 (우리는 저장 안함)
```

---

## 🎯 현재 상태

### ✅ 완성
- 작품 CRUD
- 결제 연동
- 실시간 채팅
- 푸시 알림
- 다크모드
- iOS/Android 빌드

### 🚧 진행중
- 앱스토어 심사 (iOS/Android)
- 2Checkout Demo → Active
- 문서화

---

## 📁 주요 파일 위치

```
src/
  screens/
    HomeScreen.tsx           -- 메인 피드
    ArtworkDetailScreen.tsx  -- 작품 상세
    ArtworkUploadScreen.tsx  -- 작품 등록
    CheckoutScreen.tsx       -- 결제
    ChatScreen.tsx           -- 채팅
  services/
    artworkService.ts        -- 작품 API
    paymentService.ts        -- 2Checkout 연동
    chatService.ts           -- 채팅 API
  components/
    ArtworkCard.tsx          -- 작품 카드 (SOLD 표시 포함)
    CustomAlert.tsx          -- 커스텀 팝업

database/
  FINAL-INSTALL.sql          -- 전체 DB 스키마
  remove-duplicate-transactions.sql  -- 중복 제거

supabase/functions/
  twocheckout-webhook/       -- 결제 완료 처리
  send-push-notification/    -- 푸시 알림 전송
```

---

## 💡 GPT에게 요청할 때 팁

### ❌ 나쁜 예:
> "작품 업로드 기능 문서화해줘"

### ✅ 좋은 예:
> "ArtYard의 작품 업로드 기능(`src/screens/ArtworkUploadScreen.tsx`)을 사용자 가이드로 문서화해줘.
> 
> 포함할 내용:
> - 스크린샷 설명 (어떤 화면이 나와야 하는지)
> - 각 필드 설명 (Title, Price, Material 등)
> - Edition 선택 가이드 (Original vs Limited vs Copy)
> - 사진 업로드 팁
> - 가격 설정 가이드 ($10-$100k)
> - 위치 정보 선택 여부
> 
> 대상: 대학생 아티스트 (친절하고 격려하는 톤)"

---

## 🎬 GPT 첫 질문 예시

### 기술 문서:
> "PLATFORM_BRIEF_FOR_GPT.md를 읽고, `artworkService.ts`의 모든 함수를 API 문서 형식으로 정리해줘. TypeScript 타입 포함."

### 사용자 가이드:
> "대학생 아티스트를 위한 '첫 작품 판매하기' 튜토리얼을 작성해줘. 회원가입부터 첫 판매까지 단계별로."

### 아키텍처 설명:
> "React Query를 사용한 이유와 장점을 ADR (Architecture Decision Record) 형식으로 문서화해줘."

### 트러블슈팅:
> "My Orders 화면에서 중복 데이터가 나타나는 문제의 원인과 해결 방법을 디버깅 가이드로 작성해줘."

---

## 🔗 필수 링크

- Supabase Dashboard: https://supabase.com/dashboard/project/bkvycanciimgyftdtqpx
- Privacy Policy: https://lkm1110.github.io/artyard/privacy-policy.html
- Contact: lavlna280@gmail.com

---

## ⚡ 빠른 시작 (GPT용)

```
1. PLATFORM_BRIEF_FOR_GPT.md 전체 읽기 (상세)
2. QUICK_PLATFORM_INTRO.md 읽기 (요약) ← 지금 여기
3. 주요 파일 스캔:
   - src/services/artworkService.ts
   - src/screens/ArtworkDetailScreen.tsx
   - database/FINAL-INSTALL.sql
4. 구체적인 문서화 작업 요청!
```

---

**Last Updated**: 2025-01-11  
**Ver**: 1.0.0 (Pre-launch)

