# 🚀 출시 전 체크리스트

ArtYard 출시를 축하합니다! 🎉

---

## ✅ 출시 전 데이터 정리

### 1단계: 백업 (필수!)

```bash
# Supabase Dashboard에서
1. Database > Backups
2. "Create Backup" 클릭
3. 백업 완료 확인
```

또는:

```bash
# 로컬 백업
pg_dump [DB_URL] > backup_before_launch.sql
```

---

### 2단계: 데이터 정리 실행

**파일:** `PRE-LAUNCH-CLEANUP.sql`

**실행 방법:**

```bash
Supabase Dashboard > SQL Editor
→ PRE-LAUNCH-CLEANUP.sql 내용 복사
→ 붙여넣기
→ Run
```

**예상 결과:**

```
📊 현재 데이터:
   Artworks: 45개 → 1개 (Market scene)
   Challenges: 12개 → 0개
   
💾 백업 생성...
✅ 44개 작품 백업됨

🗑️ 삭제 중...
✅ 44개 작품 삭제
✅ 12개 챌린지 삭제
✅ 고아 레코드 정리

✨ 완료!
   남은 작품: Market scene
```

---

### 3단계: 확인

```sql
-- Market scene 확인
SELECT * FROM artworks WHERE title = 'Market scene';

-- 챌린지 확인 (0이어야 함)
SELECT COUNT(*) FROM challenges;

-- 전체 통계
SELECT 
    (SELECT COUNT(*) FROM artworks) as artworks,
    (SELECT COUNT(*) FROM challenges) as challenges,
    (SELECT COUNT(*) FROM profiles) as users;
```

---

## 🔧 출시 전 설정 확인

### 환경 변수

```bash
# .env.production
SUPABASE_URL=https://[your-project].supabase.co
SUPABASE_ANON_KEY=eyJ... (프로덕션 키)
STRIPE_PUBLIC_KEY=pk_live_... (라이브 키!)
```

⚠️ **중요:** 테스트 키 → 라이브 키로 변경!

---

### RLS 보안 (선택)

출시 전 중요 테이블만 RLS 활성화:

```sql
-- 개인정보 보호
ALTER TABLE shipping_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;

-- 간단한 정책
CREATE POLICY "Users see own data" ON shipping_addresses
  FOR ALL USING (user_id = auth.uid());
  
CREATE POLICY "Users see own reviews" ON transaction_reviews
  FOR ALL USING (reviewer_id = auth.uid() OR reviewee_id = auth.uid());
  
CREATE POLICY "Artists see own payouts" ON payouts
  FOR ALL USING (seller_id = auth.uid());
```

---

### 데이터베이스 최적화

```sql
-- 인덱스 확인
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- 통계 업데이트
ANALYZE;
```

---

## 📱 앱 설정 확인

### 1. 버전 정보

```json
// app.json
{
  "version": "1.0.0",
  "ios": {
    "buildNumber": "1"
  },
  "android": {
    "versionCode": 1
  }
}
```

### 2. 앱 스토어 정보

```yaml
□ 앱 아이콘 등록
□ 스크린샷 준비 (최소 3장)
□ 앱 설명 작성
□ 개인정보 처리방침 URL
□ 이용약관 URL
```

### 3. 푸시 알림

```bash
□ FCM 설정 확인 (Android)
□ APNs 인증서 확인 (iOS)
□ 테스트 알림 발송
```

---

## 🧪 최종 테스트

### 기능 테스트

```yaml
□ 회원가입/로그인
□ 작품 업로드
□ 작품 검색
□ 좋아요/북마크
□ 댓글
□ 팔로우
□ 메시지
□ 정산 (Admin)
```

### 성능 테스트

```yaml
□ 피드 로딩 속도
□ 이미지 로딩 속도
□ 검색 속도
□ 데이터베이스 응답 시간
```

### 보안 테스트

```yaml
□ SQL Injection 방어
□ XSS 방어
□ 개인정보 접근 제어
□ 파일 업로드 제한
```

---

## 📊 모니터링 설정

### Supabase Dashboard

```yaml
□ Database > Usage 확인
□ API > Usage 확인
□ 알림 설정 (용량 80% 도달 시)
```

### 에러 트래킹

```javascript
// Sentry 설정 (권장)
import * as Sentry from "@sentry/react-native";

Sentry.init({
  dsn: "your-sentry-dsn",
  environment: "production",
});
```

---

## 🎯 출시 후 할 일

### Day 1

```yaml
□ 사용자 가입 모니터링
□ 에러 로그 확인
□ 서버 상태 확인
□ 첫 피드백 수집
```

### Week 1

```yaml
□ 사용자 행동 분석
□ 가장 많이 본 작품 확인
□ 성능 병목 지점 파악
□ 버그 리포트 처리
```

### Month 1

```yaml
□ 사용자 리텐션 분석
□ 기능 사용률 분석
□ 정산 시스템 점검
□ 업데이트 계획 수립
```

---

## 🆘 긴급 연락처

### 서비스 장애 시

```yaml
1. Supabase Status 확인
   https://status.supabase.com

2. Rollback 준비
   - 이전 버전 APK/IPA 보관
   - 데이터베이스 백업 확인

3. 사용자 공지
   - 앱 내 공지
   - 소셜 미디어
```

---

## 📝 정리 후 삭제할 파일

출시 후 다음 파일들은 삭제하거나 private repo로 이동:

```
database/
  - CLEANUP-DEV-DATA.sql
  - AGGRESSIVE-CLEANUP.sql
  - PRE-LAUNCH-CLEANUP.sql
  - REMOVE-ALL-RLS.sql
  - NUCLEAR-OPTION-*
  - *-EMERGENCY-*
  - *backup* (백업 테이블들)
```

---

## 🎊 출시 축하!

```
    🎉 ArtYard 출시를 축하합니다! 🎉
    
    작가들이 작품을 공유하고
    팬들이 작품을 발견하는
    멋진 플랫폼이 되길 바랍니다!
    
    - The ArtYard Team
```

---

**마지막 체크:**

```yaml
□ 이 체크리스트 완료
□ 백업 3곳 이상 저장
□ 팀원에게 출시 공지
□ 축하 파티 준비! 🎉
```

**출시일:** ___________  
**버전:** 1.0.0  
**담당자:** ___________

---

**Good Luck! 🚀**

