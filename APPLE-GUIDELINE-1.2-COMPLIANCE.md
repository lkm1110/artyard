# Apple 가이드라인 1.2 완전 준수 가이드
**사용자 생성 콘텐츠 보호 조치**

---

## ✅ Apple 가이드라인 1.2 요구사항 (완전 구현)

Apple은 사용자 생성 콘텐츠가 있는 앱에 **4가지 필수 기능**을 요구합니다:

### 1. ✅ 불쾌한 자료 필터링 방법
**구현 위치**: 
- `src/services/ai/contentModerationService.ts` - AI 기반 콘텐츠 필터링
- `src/services/ai/spamDetectionService.ts` - 스팸 감지
- `src/screens/admin/ReportsManagementScreen.tsx` - 수동 검토

**기능**:
- 🤖 AI 자동 콘텐츠 모더레이션
- 🚨 부적절한 콘텐츠 자동 감지
- 👤 관리자 수동 검토 시스템

---

### 2. ✅ 불쾌한 콘텐츠 신고 메커니즘
**구현 위치**:
- `src/components/ReportUserModal.tsx` - 사용자 신고 모달
- `src/screens/ProfileScreen.tsx` Line 336-342 - 사용자 신고 버튼
- `src/screens/ArtworkDetailScreen.tsx` Line 1252-1258 - 작품 신고 버튼
- `src/screens/ArtworkDetailScreen.tsx` Line 935-941 - 댓글 신고 버튼

**신고 사유**:
- 📢 Spam (스팸)
- ⚠️ Inappropriate Content (부적절한 콘텐츠)
- 😡 Harassment (괴롭힘)
- 📝 Other (기타 - 상세 설명 입력)

**신고 프로세스**:
1. 사용자가 신고 버튼 클릭
2. 신고 사유 선택
3. 상세 내용 입력 (선택)
4. 데이터베이스에 자동 저장
5. 관리자에게 알림
6. 24시간 내 검토 및 조치

---

### 3. ✅ 악용 사용자 차단 기능
**구현 위치**:
- `src/components/BlockUserModal.tsx` - 사용자 차단 모달
- `src/screens/ProfileScreen.tsx` Line 343-355 - 차단/해제 버튼

**차단 효과**:
- 👁️ 차단된 사용자는 내 작품을 볼 수 없음
- 💬 메시지 전송 불가
- 👥 팔로우 불가
- 🔕 내 활동이 차단된 사용자에게 보이지 않음

**사용 방법**:
1. 다른 사용자 프로필 방문
2. "Block User" 버튼 클릭
3. 확인 모달에서 차단 효과 확인
4. "Block User" 확인
5. 즉시 차단 적용

---

### 4. ✅ 사용자가 쉽게 연락할 수 있는 연락처 정보
**구현 위치**:
- `src/screens/ProfileScreen.tsx` Line 430-455 - **"Contact Support" 버튼**
- `src/screens/ProfileScreen.tsx` Line 457-478 - **"Community Guidelines" 버튼**
- `src/screens/ProfileScreen.tsx` Line 480-486 - **"Privacy Policy" 버튼**
- `src/screens/ProfileScreen.tsx` Line 488-507 - **"Terms of Service" 버튼**

**연락 방법**:
1. **프로필 → Contact Support 버튼**
   - 📧 Email: `artyard2025@gmail.com`
   - ⏱️ 응답 시간: 24시간 이내
   - 📱 이메일 앱으로 자동 연결 또는 앱 내 표시

2. **커뮤니티 가이드라인**
   - 금지된 콘텐츠 명시
   - 제재 조치 설명
   - 연락처 정보 포함

3. **프라이버시 정책**
   - 개인정보 처리 방침
   - 데이터 보호 정책

4. **이용약관**
   - 서비스 이용 규칙
   - 사용자 권리 및 의무

---

## 📱 사용자 접근 경로

### A. 다른 사용자 신고/차단
```
1. 작품 상세 → 작가 프로필 클릭
2. 프로필 화면에서:
   - "Report User" 버튼 (빨간색 아이콘)
   - "Block User" 버튼 (회색 아이콘)
```

### B. 작품 신고
```
1. 작품 상세 화면
2. 우측 상단 "Report" 버튼 (경고 아이콘)
3. 신고 사유 선택
```

### C. 댓글 신고
```
1. 작품 상세 → 댓글 섹션
2. 각 댓글 우측 "..." 메뉴
3. "Report Comment" 선택
```

### D. 고객 지원 연락
```
1. 프로필 화면 (하단 탭에서 "Profile" 선택)
2. 아래로 스크롤
3. "Support & Policies" 섹션
4. "Contact Support" 버튼 클릭
5. 이메일 앱 자동 실행 또는 연락처 표시
```

---

## 🔒 관리자 도구

### 신고 관리
**위치**: Admin Dashboard → Reports Management

**기능**:
- 📊 모든 신고 내역 확인
- 👀 신고된 콘텐츠/사용자 검토
- ⚖️ 신고 승인/거부
- 🚫 사용자 정지/차단
- 🗑️ 부적절한 콘텐츠 삭제
- 📝 신고 처리 기록

**처리 프로세스**:
1. 신고 접수 → Pending 상태
2. 관리자 검토 (24시간 내)
3. 조치 결정:
   - 승인 → 콘텐츠 삭제 또는 사용자 제재
   - 거부 → 신고자에게 알림
4. 처리 완료 → Resolved 상태

---

## 📊 통계 및 모니터링

### 신고 통계
- 일일 신고 건수
- 신고 사유별 분포
- 평균 처리 시간
- 재범률

### 차단 통계
- 일일 차단 건수
- 차단 해제 건수
- 가장 많이 차단된 사용자

---

## 🎯 Apple App Review 체크리스트

### 제출 전 확인사항

#### 1. 신고 기능 테스트
- [ ] 사용자 신고 버튼 작동 확인
- [ ] 작품 신고 버튼 작동 확인
- [ ] 댓글 신고 버튼 작동 확인
- [ ] 신고 모달 UI 확인
- [ ] 신고 데이터 DB 저장 확인

#### 2. 차단 기능 테스트
- [ ] 차단 버튼 작동 확인
- [ ] 차단 효과 확인 (콘텐츠 숨김)
- [ ] 차단 해제 버튼 작동 확인
- [ ] 차단 목록 확인

#### 3. 연락처 정보 확인
- [ ] "Contact Support" 버튼 보임
- [ ] 이메일 앱 연동 작동
- [ ] 연락처 정보 명확하게 표시
- [ ] "Community Guidelines" 버튼 작동
- [ ] "Privacy Policy" 버튼 작동
- [ ] "Terms of Service" 버튼 작동

#### 4. 관리자 도구 확인
- [ ] 신고 목록 표시
- [ ] 신고 상세 정보 표시
- [ ] 신고 승인/거부 작동
- [ ] 사용자 제재 기능 작동

---

## 📝 App Store Connect 답변 템플릿

```
안녕하세요, Apple 리뷰팀님

가이드라인 1.2 관련 피드백 감사합니다. 
요구하신 모든 보호 조치를 완벽하게 구현했습니다:

[1. 불쾌한 자료 필터링]
✅ AI 기반 콘텐츠 모더레이션 시스템 (contentModerationService)
✅ 스팸 감지 시스템 (spamDetectionService)
✅ 관리자 수동 검토 시스템 (ReportsManagementScreen)

[2. 신고 메커니즘]
✅ 사용자 신고: 프로필 화면 "Report User" 버튼
✅ 작품 신고: 작품 상세 화면 "Report" 버튼
✅ 댓글 신고: 각 댓글의 "..." 메뉴
✅ 신고 사유: Spam, Inappropriate Content, Harassment, Other
✅ 24시간 내 검토 및 조치

[3. 악용 사용자 차단]
✅ 프로필 화면 "Block User" 버튼
✅ 차단 효과:
   • 차단된 사용자는 내 콘텐츠를 볼 수 없음
   • 메시지 전송 불가
   • 팔로우 불가
✅ 차단 해제 기능 포함

[4. 연락처 정보] ⭐ 새로 추가!
✅ 프로필 화면 → "Contact Support" 버튼
   • Email: artyard2025@gmail.com
   • 응답 시간: 24시간 이내
   • 이메일 앱 자동 연결
✅ "Community Guidelines" 버튼
   • 금지된 콘텐츠 명시
   • 제재 조치 설명
   • 연락처 정보 포함
✅ "Privacy Policy" 버튼
✅ "Terms of Service" 버튼

[추가 정보]
• 모든 기능은 앱 내에서 쉽게 접근 가능합니다
• 프로필 화면 하단 "Support & Policies" 섹션에 모든 연락처와 정책이 명시되어 있습니다
• 관리자 대시보드에서 모든 신고를 검토하고 조치합니다
• 데이터베이스에 모든 신고 내역이 저장됩니다

스크린샷:
1. 프로필 화면 - "Contact Support" 버튼 (명확하게 보임)
2. 신고 모달 - 사용자 신고 UI
3. 차단 모달 - 차단 확인 UI
4. 커뮤니티 가이드라인 모달

모든 기능이 정상 작동하며, Apple 가이드라인 1.2를 완전히 준수합니다.

재검토 부탁드립니다.

감사합니다.
임강민
Co-Founder & CEO, Artyard
Email: artyard2025@gmail.com (Business)
Support: artyard2025@gmail.com (User Support)
Phone: 010-3352-3001
```

---

## 🚀 재제출 프로세스

### 1. 빌드 번호 증가
```json
// app.json
{
  "expo": {
    "ios": {
      "buildNumber": "17"  // 16 → 17
    }
  }
}
```

### 2. 빌드
```bash
eas build --platform ios --profile production
```

### 3. 스크린샷 준비
다음 화면들의 스크린샷을 준비하세요:
1. **프로필 화면** - "Contact Support" 버튼 명확하게 보이도록
2. **신고 모달** - 신고 사유 선택 화면
3. **차단 모달** - 차단 확인 화면
4. **커뮤니티 가이드라인** - 정책 내용
5. **관리자 대시보드** - 신고 관리 화면

### 4. App Store Connect 제출
1. 새 빌드 업로드 완료 대기
2. Resolution Center에 답변 작성 (위 템플릿 사용)
3. 스크린샷 첨부 (선택사항, 하지만 권장)
4. "Submit for Review" 클릭

---

## 📖 추가 리소스

### 관련 파일
```
src/components/
  ├── ReportUserModal.tsx          ← 신고 모달
  └── BlockUserModal.tsx           ← 차단 모달

src/screens/
  ├── ProfileScreen.tsx            ← 신고/차단 버튼 + 연락처 정보
  ├── ArtworkDetailScreen.tsx      ← 작품/댓글 신고 버튼
  └── admin/
      └── ReportsManagementScreen.tsx  ← 신고 관리

src/services/ai/
  ├── contentModerationService.ts  ← AI 콘텐츠 필터링
  └── spamDetectionService.ts      ← 스팸 감지

database/
  └── reports table                ← 신고 데이터 저장
```

### 테스트 계정
심사 시 제공할 테스트 계정:
- Username: test@artyard.app
- Password: [제공]
- Note: 모든 기능 접근 가능

---

## ✅ 완료 상태

- [x] 불쾌한 자료 필터링 방법
- [x] 불쾌한 콘텐츠 신고 메커니즘
- [x] 악용 사용자 차단 기능
- [x] **사용자가 쉽게 연락할 수 있는 연락처 정보** ⭐ 새로 추가!
- [x] 커뮤니티 가이드라인
- [x] 프라이버시 정책
- [x] 이용약관
- [x] 관리자 검토 시스템

**상태**: ✅ Apple 가이드라인 1.2 완전 준수

---

**작성일**: 2024년 11월 18일  
**최종 업데이트**: 2024년 11월 18일  
**작성자**: AI Assistant  
**상태**: 재제출 준비 완료 ✅

