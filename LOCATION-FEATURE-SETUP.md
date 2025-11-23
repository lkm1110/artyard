# 📍 Location Feature Setup Guide

작품의 판매 위치 정보를 저장하고 표시하는 기능 설정 가이드입니다.

---

## 🎯 **왜 Location이 필요한가요?**

### 구매자 관점:
- ✅ **배송 거리 파악** - 국내 배송인지 국제 배송인지 확인
- ✅ **배송비 예상** - 거리에 따른 배송비 예측
- ✅ **현지 직거래** - 같은 도시에 있으면 직접 거래 가능
- ✅ **신뢰도 향상** - 작품의 출처 확인

### 판매자 관점:
- ✅ **현지 구매자 유치** - 같은 지역 구매자에게 노출
- ✅ **배송 편의성** - 가까운 구매자와 거래 시 배송 간편
- ✅ **작품 정보** - 작품이 만들어진 장소 기록

---

## 📦 **저장되는 Location 정보**

### 최소한의 정보만 저장 (Privacy 고려):

| 컬럼 | 설명 | 예시 |
|------|------|------|
| `location_country` | 국가 | `South Korea`, `United States` |
| `location_city` | 도시 | `Seoul`, `New York` |
| `location_full` | 전체 주소 (텍스트) | `Seoul, South Korea` |

**저장하지 않는 정보** (Privacy 보호):
- ❌ 위도/경도 좌표
- ❌ 상세 주소 (구, 동, 거리)
- ❌ 건물명, 우편번호

---

## 🔧 **설정 방법**

### 1️⃣ **Supabase SQL Editor에서 실행**

```sql
-- database/ADD-LOCATION-COLUMNS.sql 파일 내용 복사
-- Supabase Dashboard → SQL Editor → New Query → 붙여넣기 → Run
```

또는 직접 실행:

```sql
-- Location 컬럼 추가
ALTER TABLE artworks 
ADD COLUMN IF NOT EXISTS location_country TEXT,
ADD COLUMN IF NOT EXISTS location_city TEXT,
ADD COLUMN IF NOT EXISTS location_full TEXT;

-- 인덱스 생성 (검색 성능 향상)
CREATE INDEX IF NOT EXISTS idx_artworks_location_country 
ON artworks(location_country) 
WHERE location_country IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_artworks_location_city 
ON artworks(location_city) 
WHERE location_city IS NOT NULL;
```

### 2️⃣ **확인**

SQL 실행 후 다음 메시지가 나타나면 성공:

```
✅ Location 컬럼이 성공적으로 추가되었습니다!
   - location_country: 국가
   - location_city: 도시
   - location_full: 전체 주소 텍스트
📊 인덱스도 생성되어 검색 성능이 향상되었습니다!
```

### 3️⃣ **앱 테스트**

1. 앱에서 작품 업로드 시도
2. "Add Location" 스위치 ON
3. 위치 권한 허용
4. 업로드 완료 후 작품 상세 페이지에서 위치 확인

---

## 🎨 **사용자 경험**

### 업로드 시:
```
📍 Add Location (선택 사항)
   [스위치 OFF/ON]
   
   ✅ ON: 현재 위치 수집 → 국가/도시만 저장
   ❌ OFF: 위치 정보 없이 업로드
```

### 작품 상세 페이지:
```
🎨 Title
👤 Artist
📍 Seoul, South Korea  ← 위치 표시
💰 Price
```

---

## 🔐 **Privacy & Security**

### iOS Just-In-Time 권한:
- 사용자가 "Add Location" 스위치를 ON할 때만 권한 요청
- 거부해도 업로드 가능 (선택 사항)

### 저장되는 정보:
- ✅ 국가, 도시만 저장 (대략적인 위치)
- ❌ 정확한 좌표 저장 안함
- ❌ 상세 주소 저장 안함

---

## 🚀 **향후 활용**

### 검색 필터:
```typescript
// 국가별 필터
filter.country = 'South Korea';

// 도시별 필터
filter.city = 'Seoul';
```

### 배송비 계산:
```typescript
// 같은 도시: 무료/저렴한 배송
if (buyer.city === artwork.location_city) {
  shippingFee = 'Free (Local pickup available)';
}

// 같은 국가: 국내 배송
else if (buyer.country === artwork.location_country) {
  shippingFee = 'Domestic shipping';
}

// 다른 국가: 국제 배송
else {
  shippingFee = 'International shipping';
}
```

---

## 📝 **Rollback (필요시)**

Location 기능을 다시 비활성화하려면:

```sql
-- 컬럼 삭제
ALTER TABLE artworks 
DROP COLUMN IF EXISTS location_country,
DROP COLUMN IF EXISTS location_city,
DROP COLUMN IF EXISTS location_full;

-- 인덱스 삭제
DROP INDEX IF EXISTS idx_artworks_location_country;
DROP INDEX IF EXISTS idx_artworks_location_city;
```

---

## ✅ **체크리스트**

- [ ] `database/ADD-LOCATION-COLUMNS.sql` 실행
- [ ] Location 컬럼 추가 확인
- [ ] 앱 재시작
- [ ] 작품 업로드 테스트
- [ ] 위치 정보 표시 확인

---

**문제가 있으면 Supabase Dashboard → Database → Tables → artworks에서 컬럼을 직접 확인하세요!** 📊

