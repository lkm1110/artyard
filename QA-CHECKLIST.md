# 🧪 ArtYard QA 체크리스트

**마지막 업데이트**: 2025-11-23  
**테스트 환경**: Expo Go (Android/iOS)  
**주의**: 결제 기능은 아직 비활성화 상태 (2Checkout 미연동)

---

## 📊 **1. 데이터베이스 최적화 효과 확인** (High Priority)

### 1.1 성능 체크
```sql
-- Supabase Dashboard > SQL Editor에서 실행
SELECT * FROM get_database_stats();
```

**확인 사항**:
- [ ] 쿼리가 정상 실행됨
- [ ] 테이블 크기 Top 10 표시됨
- [ ] 인덱스 사용률 표시됨

### 1.2 Materialized Views 확인
```sql
-- 일일 통계
SELECT * FROM daily_stats ORDER BY date DESC LIMIT 7;

-- 아티스트 통계
SELECT * FROM artist_stats ORDER BY total_revenue DESC LIMIT 10;

-- 뷰 갱신
SELECT refresh_materialized_views();
```

**확인 사항**:
- [ ] daily_stats에 데이터 존재
- [ ] artist_stats에 데이터 존재
- [ ] refresh 함수 정상 작동

### 1.3 정합성 체크
```sql
-- 데이터 정합성 확인
SELECT * FROM check_data_integrity();

-- 문제 발견 시 수정
SELECT fix_data_integrity();
```

**확인 사항**:
- [ ] likes_count 정합성 OK
- [ ] comments_count 정합성 OK
- [ ] votes_count 정합성 OK

### 1.4 settlements 통합 확인
```sql
-- seller_payouts 테이블 존재 여부 (없어야 정상)
SELECT * FROM information_schema.tables 
WHERE table_name = 'seller_payouts';

-- settlements 뷰 확인
SELECT * FROM pending_settlements;
SELECT * FROM approved_settlements;
```

**확인 사항**:
- [ ] seller_payouts 테이블 존재하지 않음 ✅
- [ ] pending_settlements 뷰 정상 작동
- [ ] approved_settlements 뷰 정상 작동

---

## 🎨 **2. 작품 (Artworks) 기능**

### 2.1 작품 업로드
- [ ] **Upload 버튼** 클릭
- [ ] **이미지 선택** (1-5장)
- [ ] **제목/설명** 입력
- [ ] **카테고리** 선택 (Illustration, Photography, etc.)
- [ ] **사이즈 입력** (소수점 가능: 12.7cm 등)
- [ ] **가격 입력** (USD)
  - 💡 Helper text 표시: "Please include international shipping costs"
- [ ] **위치 추가** (선택)
- [ ] **업로드 완료** → 메인 피드에 표시

### 2.2 작품 조회 (성능 확인 ⚡)
- [ ] **메인 피드** 스크롤
  - 예상: 빠르게 로딩 (이전보다 4배 빠름)
- [ ] **작품 상세** 클릭
- [ ] **작가 프로필 사진** 표시됨
- [ ] **좋아요/댓글** 카운트 정확함

### 2.3 작품 수정/삭제
- [ ] **자신의 작품** 상세 페이지
- [ ] **... 버튼** → 드롭다운 메뉴
  - [ ] Edit (편집)
  - [ ] Mark as Sold Out (판매완료)
  - [ ] Delete (삭제)
- [ ] **편집 아이콘** 색 없음 (colorless) ✅
- [ ] **삭제 아이콘** 색 없음 (colorless) ✅

### 2.4 작품 신고
- [ ] **다른 사용자 작품** 상세 페이지
- [ ] **느낌표 아이콘(!)** 클릭 (동그라미 없음) ✅
- [ ] **신고 사유** 선택
- [ ] **신고 완료**

### 2.5 Sold Out 기능
- [ ] **자신의 작품** 상세 페이지
- [ ] **... → Mark as Sold Out**
- [ ] **확인**
- [ ] 작품이 `sold` 상태로 변경됨
- [ ] 메인 피드에서 sold 표시

---

## 🏆 **3. 챌린지 (Challenges) 기능**

### 3.1 챌린지 목록
- [ ] **Challenges 탭** 이동
- [ ] **Active 챌린지** 표시
  - [ ] Entries 수 표시 ✅
  - [ ] Votes 수 표시 ✅ (participants 아님)
  - [ ] 남은 시간 **초 단위** 카운트다운 ✅
  - [ ] 한 줄로 표시: `Ends in: 5d 12h 34m 56s` ✅
- [ ] **Ended 챌린지** 표시
  - [ ] "Ended" 표시 (카운트다운 없음) ✅

### 3.2 챌린지 제출
- [ ] **Active 챌린지** 클릭
- [ ] **Submit Entry** 버튼
- [ ] **작품 선택** 또는 **새로 업로드**
- [ ] **설명 입력** (선택)
- [ ] **제출 완료**
- [ ] 제출한 작품이 **Challenge Entries**에만 표시 ✅
- [ ] 제출한 작품이 **메인 피드에는 표시 안 됨** ✅

### 3.3 투표
- [ ] **Active 챌린지** 클릭
- [ ] **작품 선택** → **Vote** 버튼
- [ ] **투표 완료** → 버튼이 "Voted"로 변경
- [ ] **다른 작품 Vote** 클릭 시:
  - [ ] **확인 모달** 표시 ✅
  - [ ] "Change Vote?" 메시지
  - [ ] "Change Vote" 또는 "Cancel" 선택
- [ ] 투표 변경 시 기존 투표 취소되고 새 투표 적용

### 3.4 챌린지 상세 (실시간 카운트다운)
- [ ] **챌린지 상세** 페이지
- [ ] **Entries/Votes** 표시 (한 줄) ✅
- [ ] **Time Left** 초 단위 카운트다운 ✅
  - [ ] 텍스트 잘리지 않음 (`11d 16h 19m 53s` 전체 표시)
- [ ] **작품 목록** 표시
- [ ] **투표 수** 실시간 업데이트

### 3.5 종료된 챌린지
- [ ] **Ended 챌린지** 클릭
- [ ] **카운트다운 없음** ✅
- [ ] **순위별 정렬** (1등 → 2등 → 3등 순)
- [ ] **금/은/동 테두리** 표시 ✅
  - [ ] 1등: 금색 테두리
  - [ ] 2등: 은색 테두리
  - [ ] 3등: 동색 테두리

---

## 👤 **4. 프로필 (Profile) 기능**

### 4.1 프로필 조회
- [ ] **Profile 탭** 이동
- [ ] **프로필 사진** 표시 (있으면 이미지, 없으면 이니셜)
- [ ] **닉네임** 표시
- [ ] **학교/전공** 표시 (있으면)
- [ ] **Bio** 표시 (있으면)
- [ ] **Settings 버튼** 맨 위에 위치 ✅

### 4.2 프로필 수정
- [ ] **Settings** 클릭
- [ ] **Edit Profile** 클릭
- [ ] **프로필 사진 변경**
  - [ ] 사진 아이콘 클릭
  - [ ] 이미지 선택
  - [ ] 업로드 완료
- [ ] **닉네임/학교/Bio** 수정
- [ ] **저장**
- [ ] **프로필 화면**으로 돌아가서 **프로필 사진 업데이트** 확인 ✅

### 4.3 프로필 사진 반영 확인
- [ ] **새 작품 업로드** 후 메인 피드에서 **프로필 사진** 표시 ✅
- [ ] **댓글 작성** 후 **프로필 사진** 표시
- [ ] **채팅** 화면에서 **프로필 사진** 표시

### 4.4 My Artworks
- [ ] **Profile → My Artworks**
- [ ] **업로드한 모든 작품** 표시 (챌린지 제출 작품 포함) ✅
- [ ] **작품 클릭** → 상세 페이지

### 4.5 My Likes
- [ ] **Profile → My Likes**
- [ ] **좋아요한 작품 목록** 표시
- [ ] **작품 클릭** → 상세 페이지

### 4.6 Settings
- [ ] **Settings** → **Notification Settings**
  - [ ] 알림 종류별 on/off 토글
  - [ ] 저장
- [ ] **Settings** → **Privacy Policy**
  - [ ] GitHub Pages 정책 문서 표시
- [ ] **Settings** → **Terms of Service**
  - [ ] 약관 문서 표시
- [ ] **Settings** → **Contact Support**
  - [ ] 이메일 앱 열림 (artyard2025@gmail.com)
- [ ] **Settings** → **Delete Account**
  - [ ] 확인 모달
  - [ ] 계정 삭제 완료

---

## 🎨 **5. Artist Dashboard**

### 5.1 통계 조회
- [ ] **Profile → Artist Dashboard**
- [ ] **Artworks** 수치 표시 ✅
- [ ] **Likes** 수치 표시 ✅
- [ ] **Views** 표시 (0으로 표시됨, 추후 구현 예정) ✅
- [ ] **Followers** 수치 표시 ✅

### 5.2 Followers 클릭
- [ ] **Followers 카드** 클릭
- [ ] **팔로워 목록** 표시 ✅
- [ ] 팔로워 프로필 클릭 → 해당 사용자 프로필로 이동

### 5.3 Popular Artworks
- [ ] **인기 작품** 목록 표시
- [ ] **좋아요 순** 정렬
- [ ] 작품 클릭 → 상세 페이지

---

## 💬 **6. 채팅 (Messages) 기능**

### 6.1 채팅 목록
- [ ] **Messages 탭** 이동
- [ ] **채팅 목록** 표시
- [ ] **Pull-to-refresh** 작동 ✅

### 6.2 채팅
- [ ] **채팅방** 클릭
- [ ] **메시지 입력** 및 전송
- [ ] **스크롤 가능** ✅
- [ ] **새 메시지** 수신 시 자동 스크롤
- [ ] **이전 메시지** 로드 (위로 스크롤)

---

## 🔔 **7. 알림 (Notifications) 기능**

### 7.1 알림 목록 (성능 확인 ⚡)
- [ ] **Notifications 탭** 이동
  - 예상: 빠르게 로딩 (이전보다 6배 빠름)
- [ ] **읽지 않은 알림** 표시
- [ ] **알림 클릭** → 관련 화면 이동

### 7.2 Push 알림
- [ ] **앱 종료 상태**에서 **새 알림** 수신
- [ ] **알림 클릭** → 앱 실행 및 관련 화면 이동

### 7.3 알림 설정
- [ ] **Settings → Notification Settings**
- [ ] **알림 종류별 on/off** 토글
- [ ] **저장** 후 설정 반영 확인

---

## 👑 **8. Admin 기능** (관리자 계정만)

### 8.1 Admin Dashboard
- [ ] **Profile → Admin** 버튼 표시 (관리자만)
- [ ] **Admin Dashboard** 진입
- [ ] **통일된 헤더** 표시 ✅
- [ ] **Pull-to-refresh** 작동 ✅

### 8.2 Dashboard 카드들
- [ ] **Total Users** - 수량만 표시 (클릭 불가) ✅
- [ ] **Total Artworks** - 수량만 표시 (클릭 불가) ✅
- [ ] **Active Users** - 클릭 → User Management (Active 탭) ✅
- [ ] **Total Revenue** - 클릭 → Revenue Detail ✅
- [ ] **Reports Management** - 클릭 → Reports 화면 ✅
- [ ] **Order Management** - 클릭 → Orders 화면 ✅

### 8.3 Bottom Navigation (5개만) ✅
- [ ] **User Management**
- [ ] **Artwork Management**
- [ ] **Platform Analytics**
- [ ] **Settlement Management**
- [ ] **Promote to Admin**

**제거된 것들** (Quick Actions 중복):
- ❌ Promote to Admin (중복)
- ❌ Delete Artwork (중복)
- ❌ Ban User (중복)
- ❌ Approve Settlement (중복)

### 8.4 User Management
- [ ] **User Management** 클릭
- [ ] **Active Users / Older Users** 탭 전환
- [ ] **검색** (닉네임으로 검색) ✅
- [ ] **사용자 클릭** → **Ban User** 버튼
  - [ ] **정지 기간 선택** 모달 표시 ✅
    - [ ] 24 Hours
    - [ ] 7 Days
    - [ ] 30 Days
    - [ ] Permanent
  - [ ] **사유 입력** 프롬프트 ✅
  - [ ] **Ban** 확인
  - [ ] **사용자에게 알림 전송** 확인 ✅

### 8.5 Artwork Management
- [ ] **Artwork Management** 클릭
- [ ] **작품 목록** 정상 로딩 (400 에러 없음) ✅
- [ ] **검색** 기능
- [ ] **작품 클릭** → **Delete** 버튼
  - [ ] **삭제 사유 입력** 프롬프트 ✅
  - [ ] **Delete** 확인
  - [ ] **작가에게 알림 전송** 확인 ✅

### 8.6 Challenge Management
- [ ] **Challenge Management** 클릭
- [ ] **챌린지 목록** 표시
- [ ] **Entries / Votes** 표시 (participants 아님) ✅
- [ ] **End Challenge** 버튼
  - [ ] 챌린지 상태 → 'ended'
  - [ ] **end_date** → 현재 시간으로 업데이트 ✅

### 8.7 Auction Management
- [ ] **Auction Management** 클릭
- [ ] **모든 종료된 챌린지** 표시 ✅
- [ ] **챌린지 선택** (복수 선택 가능) ✅
- [ ] **우승 작품 표시**
  - [ ] 1등: 금색 테두리 ✅
  - [ ] 2등: 은색 테두리 ✅
  - [ ] 3등: 동색 테두리 ✅
- [ ] **Create Auction** 버튼

### 8.8 Reports Management
- [ ] **Reports Management** 클릭
- [ ] **대기 중인 신고** 목록
- [ ] **신고 클릭** → **Approve / Reject**
- [ ] **처리 완료** (resolved_at 에러 없음) ✅

### 8.9 Promote to Admin
- [ ] **Promote to Admin** 클릭
- [ ] **닉네임으로 검색** ✅
- [ ] **사용자 클릭** → **Add Admin**
- [ ] **관리자 권한 부여** 확인
- [ ] **Alert.alert** 사용 ✅

### 8.10 Revenue Detail
- [ ] **Total Revenue 카드** 클릭
- [ ] **Revenue Detail** 화면 표시
- [ ] **Today / Weekly / Monthly / Total** 탭
- [ ] **통계 표시**

### 8.11 Platform Analytics
- [ ] **Platform Analytics** 클릭
- [ ] **플랫폼 통계** 표시
- [ ] **Pull-to-refresh** 작동

---

## ⚡ **9. 성능 테스트** (최적화 효과 확인)

### 9.1 메인 피드 로딩 속도
- [ ] **앱 실행** → **Home 탭**
- [ ] **작품 목록 로딩 시간** 측정
  - **예상**: ~200ms (이전 ~800ms의 1/4)
- [ ] **스크롤** → 추가 로딩 원활

### 9.2 챌린지 투표 조회 속도
- [ ] **Challenges 탭** → **챌린지 클릭**
- [ ] **투표 목록 로딩 시간** 측정
  - **예상**: ~180ms (이전 ~500ms의 1/3)

### 9.3 알림 목록 로딩 속도
- [ ] **Notifications 탭**
- [ ] **알림 목록 로딩 시간** 측정
  - **예상**: ~100ms (이전 ~600ms의 1/6)

### 9.4 Admin 통계 조회 속도
- [ ] **Admin Dashboard**
- [ ] **통계 로딩 시간** 측정
  - **예상**: ~80ms (이전 ~1200ms의 1/15)

---

## 🌐 **10. 다국어 및 텍스트 확인**

### 10.1 영문 텍스트 확인
- [ ] **Challenges → 챌린지 목록**
  - [ ] "Ends in: 5d 12h 34m 56s" ✅ (종료까지: 아님)
  - [ ] "Ended" ✅ (경매 종료 아님)

### 10.2 Helper Text 확인
- [ ] **Upload → Price 입력 필드**
  - [ ] "💡 Please include international shipping costs" 표시 ✅

---

## 🐛 **11. 알려진 이슈 및 제한사항**

### 11.1 제외된 기능
- ❌ **결제 기능** (2Checkout 미연동)
- ❌ **Auction 입찰** (결제 연동 필요)
- ❌ **Order 생성** (결제 연동 필요)
- ❌ **Settlement 정산** (수동 처리 예정)

### 11.2 알려진 버그 (해결됨)
- ✅ ~~작품 목록 로드 실패 (400 에러)~~ → 해결
- ✅ ~~user_bans UNIQUE 제약 에러~~ → 해결
- ✅ ~~챌린지 종료까지 한글 표시~~ → 영문으로 변경
- ✅ ~~프로필 사진 업데이트 안 됨~~ → 해결

### 11.3 Google MFA 이슈
- ⚠️ **Google 로그인** 시 MFA(Multi-Factor Authentication) 설정된 계정은 로그인 불가
- **해결**: MFA 비활성화 또는 다른 로그인 방법 사용

---

## ✅ **QA 통과 기준**

### Critical (반드시 통과):
- [ ] 작품 업로드/조회 정상 작동
- [ ] 챌린지 제출/투표 정상 작동
- [ ] 프로필 수정 및 반영 정상 작동
- [ ] Admin 기능 모두 정상 작동
- [ ] 데이터베이스 최적화 효과 확인

### High Priority (중요):
- [ ] 성능 개선 체감 (4-15배 향상)
- [ ] 알림 정상 작동
- [ ] 채팅 정상 작동

### Medium Priority (선택):
- [ ] UI/UX 개선 사항 반영
- [ ] 텍스트 영문 변경 확인

---

## 📝 **QA 보고서 작성**

테스트 완료 후 다음 형식으로 보고:

```
✅ 통과: X개
⚠️ 경고: X개 (사소한 이슈)
❌ 실패: X개 (치명적 버그)

[실패 항목 상세]
1. 기능명: 문제 설명
2. ...
```

---

**QA 담당자**: _____________  
**테스트 일시**: _____________  
**앱 버전**: _____________  
**DB 최적화**: ✅ 완료

