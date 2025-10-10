# 🗄️ ArtYard Database Migration Guide

## 📚 Overview

ArtYard 데이터베이스는 3개의 SQL 파일로 깔끔하게 구성되어 있습니다:

| 파일 | 목적 | 내용 |
|------|------|------|
| `01-ddl-schema.sql` | **DDL** (Data Definition Language) | 테이블, 함수, 인덱스 생성 |
| `02-dml-data.sql` | **DML** (Data Manipulation Language) | 초기 데이터 삽입 |
| `03-dcl-security.sql` | **DCL** (Data Control Language) | 권한, RLS 정책 |

---

## 🚀 Quick Start (새 환경)

### **1단계: 스키마 생성**
```sql
-- Supabase SQL Editor에서 실행
-- 01-ddl-schema.sql 파일 내용 복사하여 실행
```

### **2단계: 초기 데이터 (선택사항)**
```sql 
-- 개발 환경에서만 필요시
-- 02-dml-data.sql 파일 내용 실행
```

### **3단계: 보안 정책**
```sql
-- 필수 실행
-- 03-dcl-security.sql 파일 내용 실행
```

---

## 🔄 Migration Steps (기존 환경)

### **🧹 Clean Migration (추천)**

1. **백업 생성**
   ```bash
   # Supabase CLI 사용
   supabase db dump -f backup_$(date +%Y%m%d).sql
   ```

2. **데이터베이스 초기화** (⚠️ 주의: 모든 데이터 삭제)
   ```sql
   -- Supabase Dashboard → Settings → Database → Reset Database
   ```

3. **순차적 실행**
   ```sql
   -- 1. DDL 실행 (스키마)
   -- 2. DML 실행 (초기 데이터)  
   -- 3. DCL 실행 (보안)
   ```

### **📊 Incremental Migration (점진적)**

1. **현재 상태 확인**
   ```sql
   SELECT * FROM check_rls_status();
   SELECT * FROM get_app_stats();
   ```

2. **스키마 업데이트만**
   ```sql
   -- 01-ddl-schema.sql 에서 필요한 부분만 실행
   -- 예: ALTER TABLE, CREATE FUNCTION 등
   ```

3. **정책 업데이트**
   ```sql
   -- 03-dcl-security.sql 전체 실행 (안전한 재생성)
   ```

---

## 📋 Pre-Migration Checklist

- [ ] **데이터 백업 완료**
- [ ] **Supabase 프로젝트 URL/키 확인**
- [ ] **로컬 환경 변수 설정**
- [ ] **스토리지 버킷 설정 확인**

---

## 🎯 Post-Migration Verification

### **1. 스키마 확인**
```sql
-- 테이블 목록 확인
SELECT tablename FROM pg_tables WHERE schemaname = 'public';

-- RLS 상태 확인
SELECT * FROM check_rls_status();
```

### **2. Storage 확인**
```sql
-- Storage 정책 확인  
SELECT * FROM check_storage_policies();

-- 버킷 확인
SELECT * FROM storage.buckets;
```

### **3. 기능 테스트**
- [ ] 소셜 로그인 → 프로필 자동 생성
- [ ] 작품 업로드 → 이미지 Storage + DB 저장
- [ ] 댓글 작성 → DB 저장 + 카운터 업데이트
- [ ] 채팅 전송 → 실시간 메시지 저장
- [ ] 좋아요/북마크 → 즉시 반영

---

## 🚨 Troubleshooting

### **권한 오류**
```sql
-- RLS 정책 재적용
-- 03-dcl-security.sql 다시 실행
```

### **Storage 오류**  
```sql
-- artworks 버킷 존재 확인
SELECT * FROM storage.buckets WHERE id = 'artworks';

-- 없으면 생성
INSERT INTO storage.buckets (id, name, public) VALUES ('artworks', 'artworks', true);
```

### **함수 오류**
```sql
-- 함수 목록 확인
SELECT proname FROM pg_proc WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- 함수 재생성
-- 01-ddl-schema.sql의 함수 부분만 실행
```

---

## 🔧 Development Utilities

### **데이터 초기화 (개발용)**
```sql
-- 개발 데이터만 삭제 (프로필 유지)
SELECT reset_dev_data();
```

### **통계 확인**
```sql
-- 앱 사용 통계
SELECT * FROM get_app_stats();
```

### **성능 모니터링**
```sql  
-- 느린 쿼리 확인
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;
```

---

## 📞 Support

문제가 발생하면:

1. **로그 확인**: Supabase Dashboard → Logs
2. **스키마 비교**: 현재 스키마 vs DDL 파일
3. **RLS 정책**: `check_rls_status()` 함수 실행
4. **Storage**: `check_storage_policies()` 함수 실행

---

## 🎉 Success Criteria

Migration 성공 확인:

- [ ] ✅ 모든 테이블 생성됨
- [ ] ✅ RLS 정책 활성화됨  
- [ ] ✅ Storage 정책 적용됨
- [ ] ✅ 앱에서 업로드 성공
- [ ] ✅ 실시간 댓글/채팅 동작
- [ ] ✅ 좋아요/북마크 즉시 반영

**🚀 이제 깔끔하고 체계적인 데이터베이스 마이그레이션이 가능합니다!**
