# 🔍 ArtYard 기능 검증 체크리스트

구현 일자: 2025-11-07
총 구현 항목: 15개

---

## ✅ **완료된 기능 목록**

### 📱 **1. 업로드 후 메인 페이지 갱신**
**구현 내용:**
- `src/hooks/useArtworks.ts`: `useUploadArtwork` 훅에서 `artworks-infinite` 쿼리 무효화 추가
- 작품 업로드 성공 시 메인 피드 자동 갱신

**검증 방법:**
```
✅ 작품 업로드 화면 이동
✅ 새 작품 업로드 (이미지 + 정보 입력)
✅ "Upload" 버튼 클릭
✅ 성공 메시지 확인
✅ 메인 페이지로 자동 이동
✅ 새 작품이 피드 최상단에 표시되는지 확인
```

**예상 결과:**
- ✅ 새 작품이 즉시 메인 피드에 나타남
- ✅ 새로고침(pull-to-refresh) 없이도 자동 갱신

---

### 💬 **2. 채팅 타이핑 표시 개선**
**구현 내용:**
- `src/screens/ChatScreen.tsx`: 타이핑 타이머 관리 추가
- `typingTimeoutRef`로 2초 타이머 관리
- 계속 타이핑 시 타이머 리셋

**검증 방법:**
```
✅ 두 개의 테스트 계정 준비
✅ 계정 A에서 계정 B와 채팅
✅ 계정 B에서 메시지 입력 시작
✅ 계정 A 화면에서 "typing..." 표시 확인
✅ 계정 B가 계속 타이핑 → "typing..." 유지 확인
✅ 계정 B가 타이핑 멈춤 → 2초 후 "typing..." 사라짐 확인
```

**예상 결과:**
- ✅ 깜빡임 없이 "typing..." 표시 유지
- ✅ 타이핑 멈춘 후 2초 후 자동 사라짐

---

### 🔍 **3. 검색 최소 글자 수 (2글자)**
**구현 내용:**
- `src/components/SearchModal.tsx`: 검색 조건 수정
- `searchQuery.length >= 2`로 변경

**검증 방법:**
```
✅ 홈 화면에서 검색 아이콘 클릭
✅ 검색창에 "a" 입력 → 검색 안 됨 확인
✅ "ab" 입력 → 검색 시작 확인
✅ 결과 표시 확인
```

**예상 결과:**
- ✅ 1글자: 검색 실행 안 됨
- ✅ 2글자 이상: 검색 실행됨

---

### 📝 **4. 작품 제목 최소 글자 수 (2글자)**
**구현 내용:**
- `src/screens/ArtworkUploadScreen.tsx`: 제목 validation 추가
- 최소 2글자 체크 로직 추가

**검증 방법:**
```
✅ 작품 업로드 화면 이동
✅ 제목에 "a" 입력
✅ Upload 버튼 클릭
✅ "Title must be at least 2 characters" 에러 확인
✅ 제목을 "ab"로 수정
✅ 업로드 성공 확인
```

**예상 결과:**
- ✅ 1글자 제목: 에러 메시지 표시
- ✅ 2글자 이상: 업로드 가능

---

### 👤 **5. 채팅 옵션 - 프로필 보기**
**구현 내용:**
- `src/screens/ChatScreen.tsx`: navigation 경로 수정
- `Profile` → `UserArtworks`로 변경

**검증 방법:**
```
✅ 채팅방 진입
✅ 우측 상단 ⋯ 버튼 클릭
✅ "View Profile" 선택
✅ 상대방 작품 목록 화면으로 이동 확인
✅ 작품 목록 정상 표시 확인
```

**예상 결과:**
- ✅ 상대방의 작품 목록 화면으로 이동
- ✅ 작품들이 정상적으로 표시됨

---

### 🚨 **6. 채팅 옵션 - 신고하기**
**구현 내용:**
- `src/screens/ChatScreen.tsx`: 실제 DB 저장 로직 추가
- `reports` 테이블에 신고 내역 저장
- 3가지 신고 사유: Spam, Inappropriate Content, Other

**검증 방법:**
```
✅ 채팅방 진입
✅ 우측 상단 ⋯ 버튼 클릭
✅ "Report User" 선택
✅ 신고 사유 선택 (예: Spam)
✅ "Report Submitted" 메시지 확인
✅ Supabase에서 reports 테이블 확인
```

**예상 결과:**
- ✅ 신고 성공 메시지 표시
- ✅ DB에 신고 내역 저장됨
- ✅ reporter_id, reported_id, reason 정확히 저장됨

---

### 🚪 **7. 채팅방 나가기**
**구현 내용:**
- `src/screens/ChatScreen.tsx`: "Leave Chat" 옵션 추가
- 확인 팝업 후 채팅 목록으로 복귀

**검증 방법:**
```
✅ 채팅방 진입
✅ 우측 상단 ⋯ 버튼 클릭
✅ "Leave Chat" 선택
✅ 확인 팝업 표시 확인
✅ "Leave" 버튼 클릭
✅ 채팅 목록 화면으로 복귀 확인
```

**예상 결과:**
- ✅ 확인 팝업 표시
- ✅ 취소 시 채팅방 유지
- ✅ Leave 시 채팅 목록으로 복귀

---

### ✏️ **8. 채팅 메시지 수정/삭제 후 갱신**
**구현 내용:**
- `src/screens/ChatScreen.tsx`: 쿼리 무효화 추가
- 수정/삭제 후 `chatMessages`, `chats` 쿼리 무효화

**검증 방법:**
```
✅ 내가 보낸 메시지 길게 누르기
✅ "Edit" 선택
✅ 메시지 수정 후 전송
✅ 수정된 내용 즉시 반영 확인
✅ "• Edited" 표시 확인
✅ 메시지 길게 누르기
✅ "Delete" 선택
✅ 삭제 즉시 반영 확인
```

**예상 결과:**
- ✅ 수정 즉시 화면에 반영
- ✅ 삭제 즉시 화면에서 제거
- ✅ 새로고침 없이 자동 갱신

---

### 🌍 **9. 채팅 메시지 옵션 영어 변환**
**구현 내용:**
- `src/screens/ChatScreen.tsx`: 모든 UI 텍스트 영어로 변환
- "메시지 옵션" → "Message Options"
- "취소" → "Cancel"
- "수정" → "Edit"
- "삭제" → "Delete"
- "✏️ 메시지 수정 중" → "✏️ Editing Message"
- "• 수정됨" → "• Edited"

**검증 방법:**
```
✅ 내 메시지 길게 누르기
✅ 팝업 제목이 "Message Options"인지 확인
✅ 버튼이 "Cancel", "Edit", "Delete"인지 확인
✅ "Edit" 선택 후 상단 헤더 확인
✅ "✏️ Editing Message" 표시 확인
✅ 수정 후 "• Edited" 표시 확인
```

**예상 결과:**
- ✅ 모든 텍스트가 영어로 표시됨
- ✅ 일관된 영어 UI

---

### 👤 **10. 프로필 수정 후 갱신**
**구현 내용:**
- `src/screens/ProfileEditScreen.tsx`: 쿼리 무효화 확장
- 닉네임 변경 여부와 관계없이 항상 갱신
- `artworks-infinite` 쿼리 추가

**검증 방법:**
```
✅ 프로필 편집 화면 이동
✅ 닉네임 또는 프로필 정보 수정
✅ "Save" 버튼 클릭
✅ 성공 메시지 확인
✅ 프로필 화면 복귀
✅ 변경사항 즉시 반영 확인
✅ 메인 피드에서 내 작품 확인
✅ 변경된 닉네임 표시 확인
```

**예상 결과:**
- ✅ 프로필 정보 즉시 갱신
- ✅ 모든 화면에서 변경사항 반영
- ✅ 작품 카드에 새 닉네임 표시

---

### 📊 **11. Artist Dashboard 실제 데이터 로드**
**구현 내용:**
- `src/services/analyticsService.ts`: `getDashboardSummary` 완전 재작성
- Supabase에서 실제 데이터 가져오기
- 작품 조회수, 판매 수, 매출 계산
- Top 5 작품, 일별 통계 생성

**검증 방법:**
```
✅ Artist Dashboard 화면 이동
✅ 로딩 후 데이터 표시 확인
✅ Views, Sales, Revenue 숫자 확인
✅ Top 5 Artworks 목록 확인
✅ 일별 차트 확인
✅ Weekly/Monthly 탭 전환
✅ 데이터 변경 확인
```

**예상 결과:**
- ✅ 0이 아닌 실제 데이터 표시 (데이터가 있는 경우)
- ✅ 작품이 없으면 모두 0 표시 (정상)
- ✅ 기간 변경 시 데이터 업데이트

---

### 🎨 **12. Artist Dashboard UI 개선**
**구현 내용:**
- `src/screens/ArtistDashboardScreen.tsx`: 스타일 대폭 개선
- 카드 그림자, 둥근 모서리 추가
- 타이포그래피 개선 (폰트 크기, 웨이트)
- 색상 팔레트 현대화
- 차트 디자인 개선

**검증 방법:**
```
✅ Artist Dashboard 화면 이동
✅ 메트릭 카드 디자인 확인
✅ 그림자 효과 확인
✅ 텍스트 가독성 확인
✅ 차트 바 디자인 확인
✅ Top Artworks 리스트 디자인 확인
```

**예상 결과:**
- ✅ 더 현대적이고 세련된 디자인
- ✅ 명확한 시각적 계층 구조
- ✅ 향상된 가독성

---

### 🎁 **13. 커스텀 Alert 컴포넌트**
**구현 내용:**
- `src/components/CustomAlert.tsx`: 새 컴포넌트 생성
- 현대적인 디자인
- 다크 모드 지원
- 3가지 버튼 스타일

**검증 방법:**
```
✅ (아직 기존 Alert 대체 안 됨 - 컴포넌트만 생성됨)
✅ 추후 기존 Alert.alert() 호출을 CustomAlert로 교체 필요
```

**예상 결과:**
- ✅ 컴포넌트 파일 존재 확인
- ⏳ 실제 사용은 추후 통합 필요

---

### 📋 **14. Display Name 수집 명시 (Google Play)**
**구현 내용:**
- `privacy-policy.html`: 소셜 로그인 이름 수집 명시
- `docs/GOOGLE_PLAY_DATA_SAFETY_GUIDE.md`: 완전한 설정 가이드 생성

**검증 방법:**
```
✅ privacy-policy.html 파일 확인
✅ "name from social login providers" 문구 확인
✅ GOOGLE_PLAY_DATA_SAFETY_GUIDE.md 파일 확인
✅ Name 데이터 유형 설정 가이드 확인
```

**예상 결과:**
- ✅ Privacy Policy 업데이트됨
- ✅ Google Play 제출 준비 완료

---

### 🍞 **15. 신규 메시지 Toast 알림**
**구현 내용:**
- `src/components/Toast.tsx`: Toast 컴포넌트 생성
- `src/screens/MessagesScreen.tsx`: Toast 통합
- 앱이 active일 때 Toast 표시
- 앱이 background일 때 푸시 알림

**검증 방법:**
```
✅ MessagesScreen (채팅 목록) 화면에서 대기
✅ 다른 계정에서 메시지 전송
✅ 화면 상단에 Toast 나타남 확인
✅ 발신자 이름 + 메시지 미리보기 확인
✅ Toast 클릭
✅ 해당 채팅방으로 이동 확인
✅ 3초 후 Toast 자동 사라짐 확인

✅ 앱을 백그라운드로 보냄
✅ 다른 계정에서 메시지 전송
✅ 푸시 알림 표시 확인
```

**예상 결과:**
- ✅ Active: Toast 표시
- ✅ Background: 푸시 알림
- ✅ Toast 클릭 시 채팅방 이동
- ✅ 자동 숨김 (3초)

---

## 🛠️ **추가 수정 사항**

### 📁 **16. Reports 테이블 수정**
**구현 내용:**
- `database/fix-reports-table.sql`: 테이블 재생성 스크립트
- 컬럼명 수정: `reported_user_id` → `reported_id`

**검증 방법:**
```
✅ Supabase SQL Editor 열기
✅ fix-reports-table.sql 내용 복사
✅ 실행
✅ "Success" 메시지 확인
✅ Table Editor에서 reports 테이블 확인
✅ reported_id 컬럼 존재 확인
```

**예상 결과:**
- ✅ 테이블 재생성 성공
- ✅ 올바른 컬럼명 적용

---

## 🚀 **검증 우선순위**

### **HIGH (필수 검증)**
1. ✅ 업로드 후 메인 페이지 갱신
2. ✅ 프로필 수정 후 갱신
3. ✅ 채팅 메시지 수정/삭제 후 갱신
4. ✅ 신규 메시지 Toast 알림
5. ✅ Artist Dashboard 실제 데이터

### **MEDIUM (중요 검증)**
6. ✅ 채팅 타이핑 표시 개선
7. ✅ 채팅 옵션 (프로필 보기, 신고, 나가기)
8. ✅ 채팅 메시지 옵션 영어 변환
9. ✅ 검색 최소 2글자
10. ✅ 제목 최소 2글자

### **LOW (선택 검증)**
11. ✅ Dashboard UI 개선
12. ✅ Display Name 수집 명시
13. ✅ Reports 테이블 수정

---

## 📝 **검증 시나리오**

### **시나리오 1: 작품 업로드 플로우**
```
1. 로그인
2. 작품 업로드 (제목 2글자 이상)
3. 메인 페이지 자동 이동 확인
4. 새 작품 즉시 표시 확인
5. 프로필 편집으로 닉네임 변경
6. 메인 페이지에서 변경된 닉네임 확인
```

### **시나리오 2: 채팅 플로우**
```
1. 두 개의 테스트 계정 준비
2. 계정 A에서 계정 B와 채팅
3. 타이핑 표시 확인
4. 메시지 전송
5. 계정 A에서 Toast 알림 확인 (active)
6. 메시지 수정/삭제 테스트
7. 채팅 옵션 테스트 (프로필, 신고, 나가기)
```

### **시나리오 3: 대시보드 확인**
```
1. Artist Dashboard 이동
2. 실제 데이터 표시 확인
3. Weekly/Monthly 탭 전환
4. Top Artworks 확인
5. 일별 차트 확인
```

---

## ⚠️ **알려진 이슈**

1. **CustomAlert 미사용**: 컴포넌트는 생성했지만 아직 기존 Alert 대체 안 됨
2. **Followers 테이블**: 없을 경우 followers count 0으로 표시 (정상)
3. **Reports 테이블**: SQL 실행 필요 (database/fix-reports-table.sql)

---

## ✅ **체크리스트 요약**

**총 15개 기능 구현 완료**

- [x] 업로드 후 메인 페이지 갱신
- [x] 채팅 타이핑 표시 개선
- [x] 검색 최소 2글자
- [x] 제목 최소 2글자
- [x] 채팅 옵션 - 프로필 보기
- [x] 채팅 옵션 - 신고하기
- [x] 채팅 옵션 - 나가기
- [x] 채팅 메시지 수정/삭제 후 갱신
- [x] 채팅 메시지 옵션 영어 변환
- [x] 프로필 수정 후 갱신
- [x] Artist Dashboard 실제 데이터
- [x] Artist Dashboard UI 개선
- [x] 커스텀 Alert 컴포넌트
- [x] Display Name 수집 명시
- [x] 신규 메시지 Toast 알림

**추가 작업 필요:**
- [ ] Reports 테이블 SQL 실행
- [ ] 모든 기능 통합 테스트
- [ ] Google Play Console 설정 업데이트

---

**검증 완료 후 체크 항목:**
- [ ] 모든 HIGH 우선순위 기능 테스트 완료
- [ ] 버그 없이 정상 작동 확인
- [ ] 성능 이슈 없음 확인
- [ ] UI/UX 개선 확인

