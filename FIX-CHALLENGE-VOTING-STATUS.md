# Challenge 'voting' Status 에러 해결

## 🚨 문제

챌린지 종료 시 에러:
```
"new row for relation \"challenges\" violates check constraint \"valid_challenge_status\""
```

**원인**: 데이터베이스는 'voting' 상태를 허용하지 않음

---

## ✅ 해결 방법

### 1️⃣ Supabase SQL 실행 (30초 해결 ⭐)

#### Supabase Dashboard → SQL Editor

```sql
-- 1. 기존 제약 조건 삭제
ALTER TABLE challenges 
DROP CONSTRAINT IF EXISTS valid_challenge_status;

-- 2. 'voting' 포함한 새 제약 조건 추가
ALTER TABLE challenges 
ADD CONSTRAINT valid_challenge_status 
CHECK (status IN ('upcoming', 'active', 'voting', 'ended', 'archived'));
```

#### 확인

```sql
-- 제약 조건 확인
SELECT constraint_name, check_clause 
FROM information_schema.check_constraints 
WHERE constraint_name = 'valid_challenge_status';

-- 결과:
-- valid_challenge_status | (status IN ('upcoming', 'active', 'voting', 'ended', 'archived'))
```

---

### 2️⃣ 앱 재시작

```bash
# 서버 재시작
npm start
```

---

## 🧪 테스트

1. Admin Dashboard
2. Challenge Management
3. 활성 챌린지 선택
4. **"End Challenge"** 클릭
5. ✅ 성공! 'voting' 상태로 변경됨

---

## 📋 상태 흐름

```
upcoming → active → voting → ended → archived
   ⬇️        ⬇️       ⬇️       ⬇️        ⬇️
 준비중    진행중    투표중   종료됨   보관됨
```

---

## 🔒 보안

제약 조건이 다음 상태만 허용:
- ✅ `upcoming` - 예정
- ✅ `active` - 진행 중
- ✅ `voting` - 투표 중 ⭐ 추가됨
- ✅ `ended` - 종료
- ✅ `archived` - 보관

---

## 📝 변경 사항

**변경 전**:
```sql
CHECK (status IN ('upcoming', 'active', 'ended', 'archived'))
```

**변경 후**:
```sql
CHECK (status IN ('upcoming', 'active', 'voting', 'ended', 'archived'))
```

---

**작성**: 2024년 11월 18일  
**파일**: `database/FIX-CHALLENGE-STATUS.sql`  
**상태**: ✅ 해결 방법 준비 완료

