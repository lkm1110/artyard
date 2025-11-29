# 📋 데이터베이스 정리 가이드

개발 데이터를 안전하게 정리하는 방법입니다.

---

## 🎯 사용할 스크립트 선택

### 1. **CLEANUP-DEV-DATA.sql** (권장) ⭐

**언제 사용:**
- 프로덕션 준비 전 정리
- 안전하게 불필요한 데이터만 삭제
- 백업을 자동으로 생성

**무엇을 삭제:**
- ✅ 7일 이상 지난 종료된 챌린지
- ✅ 30일 이상 지난 종료된 경매
- ✅ 고아 레코드 (orphaned records)
- ⚠️ 테스트 작품 (수동 활성화 필요)

**안전도:** 🟢 높음

---

### 2. **AGGRESSIVE-CLEANUP.sql** (주의) ⚠️

**언제 사용:**
- 개발 환경 초기화
- 대량의 테스트 데이터 제거
- 완전히 새로 시작할 때

**무엇을 삭제:**
- ❌ 모든 종료된 챌린지
- ❌ 모든 테스트 작품
- ❌ 30일 이상 + 반응 없는 작품
- ❌ 모든 중복 데이터
- ❌ 모든 고아 레코드

**안전도:** 🔴 낮음 (개발 전용!)

---

## 📝 실행 방법

### Supabase Dashboard에서 실행

```bash
1. Supabase Dashboard 접속
2. SQL Editor 선택
3. 스크립트 내용 복사 & 붙여넣기
4. Run 클릭
```

### psql에서 실행

```bash
# 로컬 데이터베이스
psql -U postgres -d artyard -f database/CLEANUP-DEV-DATA.sql

# Supabase (원격)
psql "postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres" \
  -f database/CLEANUP-DEV-DATA.sql
```

---

## ⚠️ 실행 전 체크리스트

```yaml
□ 백업 완료 (또는 스크립트가 자동 백업)
□ 현재 환경 확인 (개발? 프로덕션?)
□ 삭제될 데이터 확인
□ 팀원에게 공지 (공유 DB인 경우)
□ 실행 시간대 확인 (사용자 적을 때)
```

---

## 📊 단계별 실행 (CLEANUP-DEV-DATA.sql)

### STEP 1: 현재 상태 확인

스크립트가 자동으로 표시:
```
📊 Artworks: 1,234개
🏆 Challenges: 45개 (종료: 23개)
```

### STEP 2: 자동 백업

```sql
-- 백업 테이블 생성
challenges_backup
challenge_entries_backup
```

### STEP 3-6: 데이터 삭제

- 종료된 챌린지
- 종료된 경매
- 테스트 작품 (선택)
- 고아 레코드

### STEP 7: 최적화

```sql
VACUUM ANALYZE -- 디스크 공간 회수
```

### STEP 8: 결과 확인

최종 통계 표시

---

## 🔧 커스터마이징

### 테스트 작품 삭제 활성화

`CLEANUP-DEV-DATA.sql` 파일에서:

```sql
-- STEP 5: 테스트 작품 삭제 (선택적)

-- 이 주석을 제거하세요 ↓
/*
DELETE FROM artworks
WHERE (
    title ILIKE '%test%' OR title ILIKE '%테스트%'
    OR is_hidden = true
)
AND sale_status != 'sold'
AND created_at < NOW() - INTERVAL '7 days';
*/
```

주석 `/* */`을 제거하면 활성화됩니다.

### 삭제 기간 조정

```sql
-- 기본: 7일
WHERE end_date < NOW() - INTERVAL '7 days'

-- 변경: 30일
WHERE end_date < NOW() - INTERVAL '30 days'

-- 변경: 1일
WHERE end_date < NOW() - INTERVAL '1 day'
```

### 특정 조건만 삭제

```sql
-- 특정 사용자의 작품만
DELETE FROM artworks
WHERE author_id = 'user-uuid-here'
AND created_at < NOW() - INTERVAL '7 days';

-- 특정 가격 이하
DELETE FROM artworks
WHERE CAST(price AS NUMERIC) < 10000
AND sale_status = 'available';

-- 특정 상태만
DELETE FROM challenges
WHERE status = 'archived'
AND created_at < NOW() - INTERVAL '90 days';
```

---

## 💾 백업 복원

백업에서 복원하려면:

```sql
-- 챌린지 복원
INSERT INTO challenges
SELECT * FROM challenges_backup;

-- 챌린지 엔트리 복원
INSERT INTO challenge_entries
SELECT * FROM challenge_entries_backup;
```

백업 테이블 삭제:

```sql
DROP TABLE challenges_backup;
DROP TABLE challenge_entries_backup;
```

---

## 🆘 문제 해결

### "테이블이 존재하지 않습니다"

```sql
-- 테이블 존재 확인
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public';
```

스크립트는 존재하지 않는 테이블을 자동으로 건너뜁니다.

### "권한이 없습니다"

Supabase Dashboard의 SQL Editor는 자동으로 권한이 있습니다.
로컬에서 실행 시:

```sql
-- postgres 또는 service_role로 실행
SET ROLE postgres;
```

### "삭제가 너무 느립니다"

```sql
-- 작은 배치로 나눠서 삭제
DELETE FROM artworks
WHERE id IN (
    SELECT id FROM artworks
    WHERE is_hidden = true
    LIMIT 100
);
```

여러 번 실행하세요.

---

## 📈 성능 모니터링

### 삭제 진행 상황 확인

```sql
-- 현재 실행 중인 쿼리
SELECT 
    pid, 
    state, 
    query, 
    now() - query_start as duration
FROM pg_stat_activity
WHERE state != 'idle'
ORDER BY duration DESC;
```

### 디스크 사용량 확인

```sql
-- 전체 데이터베이스 크기
SELECT pg_size_pretty(pg_database_size(current_database()));

-- 테이블별 크기
SELECT 
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - 
                   pg_relation_size(schemaname||'.'||tablename)) as indexes_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

## 🎯 권장 정리 주기

### 개발 환경
- **매주 금요일**: CLEANUP-DEV-DATA.sql 실행
- **매월 말**: AGGRESSIVE-CLEANUP.sql 실행 (선택)

### 스테이징 환경
- **배포 전**: CLEANUP-DEV-DATA.sql 실행
- **프로덕션 복사 후**: 개인정보 삭제

### 프로덕션 환경
- **절대 AGGRESSIVE-CLEANUP 사용 금지!**
- 백업 후 신중하게 CLEANUP-DEV-DATA 수정해서 사용

---

## 📞 도움이 필요하신가요?

1. 스크립트 실행 전 팀원과 상의
2. 중요한 데이터는 수동 백업
3. 의심스러우면 먼저 테스트 환경에서 실행

---

**마지막 업데이트:** 2025-01-XX  
**버전:** 1.0.0

