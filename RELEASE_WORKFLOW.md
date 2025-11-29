# 🚀 릴리즈 워크플로우

새 버전을 출시할 때 따라야 할 단계들입니다.

---

## 📋 릴리즈 체크리스트

### 1️⃣ 버전/빌드 넘버 결정

**규칙**:
- **Patch** (1.0.1 → 1.0.2): 버그 수정
- **Minor** (1.0.2 → 1.1.0): 새 기능 추가
- **Major** (1.1.0 → 2.0.0): 대규모 변경

**빌드 넘버**:
- iOS: 항상 증가 (31 → 32 → 33...)
- Android: 항상 증가 (21 → 22 → 23...)

---

### 2️⃣ `app.json` 수정

```json
{
  "expo": {
    "version": "1.0.2",  // ← 버전 업데이트
    "ios": {
      "buildNumber": "32"  // ← iOS 빌드 넘버 증가
    },
    "android": {
      "versionCode": 22  // ← Android 빌드 넘버 증가
    }
  }
}
```

---

### 3️⃣ 빌드

**iOS**:
```bash
eas build --platform ios --profile production
```

**Android**:
```bash
eas build --platform android --profile production
```

**둘 다**:
```bash
eas build --platform all --profile production
```

---

### 4️⃣ Supabase 버전 정보 업데이트

#### 방법 A: 자동 (스크립트 사용) ⭐ 추천

```bash
# .env 파일에 SUPABASE_SERVICE_KEY 추가 필요
# SUPABASE_SERVICE_KEY=your-service-role-key

# iOS 버전 동기화
node scripts/sync-version.js ios

# Android 버전 동기화
node scripts/sync-version.js android
```

#### 방법 B: 수동 (SQL)

Supabase SQL Editor에서:

```sql
-- 기존 버전 비활성화
UPDATE app_versions SET is_active = false WHERE platform = 'ios';

-- 새 iOS 버전 추가
INSERT INTO app_versions (
  platform,
  version,
  build_number,
  min_supported_version,
  min_supported_build,
  force_update,
  recommended_update,
  release_notes,
  release_notes_ko,
  download_url
) VALUES (
  'ios',
  '1.0.2',
  32,
  '1.0.0',
  1,
  false,
  true,
  'Bug fixes and performance improvements',
  '버그 수정 및 성능 개선',
  'https://apps.apple.com/app/artyard'
);

-- Android도 동일하게 반복
UPDATE app_versions SET is_active = false WHERE platform = 'android';
INSERT INTO app_versions (...) VALUES ('android', '1.0.2', 22, ...);
```

---

### 5️⃣ 스토어 제출

#### iOS (App Store Connect)
1. https://appstoreconnect.apple.com 로그인
2. TestFlight에서 빌드 확인
3. 심사 제출

#### Android (Google Play Console)
1. https://play.google.com/console 로그인
2. 내부 테스트 → 프로덕션 트랙으로 승격
3. 검토 제출

---

## 🔢 빌드 넘버 관리 원칙

### ❌ 잘못된 이해
> "빌드하면 `app.json`과 `app_versions` 테이블이 자동으로 동기화된다"

**→ 아니요! 둘 다 수동으로 업데이트해야 합니다.**

---

### ✅ 올바른 이해

**`app.json`의 빌드 넘버**:
- 앱에 실제로 내장되는 번호
- 빌드 **전에** 수동으로 증가
- `Constants.expoConfig.ios.buildNumber`로 읽음

**`app_versions` 테이블**:
- 버전 체크용 서버 데이터
- 빌드 **후에** 수동으로 INSERT
- 앱 시작 시 현재 빌드와 비교

---

## 📊 버전 체크 로직

```
앱 시작
  ↓
현재 빌드: 31 (app.json에서 읽음)
  ↓
서버에서 최신 버전 조회 (app_versions)
  ↓
서버 빌드: 35
  ↓
31 < 35 → 업데이트 필요!
```

---

## 🎯 실전 예시

### 시나리오: 버그 수정 릴리즈

**현재**:
- Version: 1.0.1
- iOS Build: 31
- Android Build: 21

**목표**:
- Version: 1.0.2 (Patch)
- iOS Build: 32
- Android Build: 22

**단계**:

1. **코드 수정** (버그 수정)

2. **`app.json` 수정**:
```bash
# iOS 빌드 넘버: 31 → 32
# Android 빌드 넘버: 21 → 22
# Version: 1.0.1 → 1.0.2
```

3. **빌드**:
```bash
eas build --platform all --profile production
```

4. **버전 동기화** (빌드 완료 후):
```bash
node scripts/sync-version.js ios
node scripts/sync-version.js android
```

5. **확인**:
```sql
SELECT * FROM app_versions WHERE is_active = true;
```

6. **스토어 제출**

7. **완료!** 🎉

---

## 🚨 강제 업데이트 시나리오

### 언제 사용?
- 치명적 보안 버그 수정
- API 호환성 깨짐
- 데이터베이스 스키마 변경

### 방법:

**Step 1: 새 버전 출시** (위 워크플로우대로)

**Step 2: 강제 업데이트 설정**:
```sql
UPDATE app_versions 
SET force_update = true
WHERE version = '1.0.2' AND is_active = true;
```

**또는 최소 지원 버전 상향**:
```sql
UPDATE app_versions 
SET min_supported_build = 32  -- iOS
WHERE platform = 'ios' AND is_active = true;

UPDATE app_versions 
SET min_supported_build = 22  -- Android
WHERE platform = 'android' AND is_active = true;
```

**결과**: 구 버전 사용자는 앱 시작 시 "업데이트 필요" 얼럿 (취소 불가)

---

## 📱 점진적 배포 (Gradual Rollout)

일부 사용자에게만 먼저 배포:

```sql
-- 10% 사용자에게만 업데이트 표시
UPDATE app_versions 
SET rollout_percentage = 10
WHERE version = '1.0.2';

-- 문제 없으면 50%로 증가
UPDATE app_versions 
SET rollout_percentage = 50
WHERE version = '1.0.2';

-- 최종 100%
UPDATE app_versions 
SET rollout_percentage = 100
WHERE version = '1.0.2';
```

---

## 🔧 자동화 스크립트 설정

### 1. Supabase Service Key 발급

1. Supabase Dashboard → Settings → API
2. **service_role** key 복사 (절대 공개하지 말 것!)

### 2. `.env` 파일에 추가

```bash
# .env
SUPABASE_SERVICE_KEY=your-service-role-key-here
```

### 3. `.gitignore` 확인

```
.env
.env.local
```

### 4. 스크립트 사용

```bash
# 빌드 후
node scripts/sync-version.js ios
node scripts/sync-version.js android
```

---

## ✅ 정리

| 작업 | 타이밍 | 방법 |
|------|--------|------|
| `app.json` 빌드 넘버 증가 | 빌드 **전** | 수동 편집 |
| EAS Build | - | `eas build` |
| `app_versions` 등록 | 빌드 **후** | 스크립트 or SQL |
| 스토어 제출 | 빌드 완료 후 | 수동 |

**→ 자동 동기화 안 됨, 각 단계마다 수동 작업 필요!**

---

## 🎯 다음 빌드 시 체크리스트

- [ ] `app.json` 버전 업데이트
- [ ] `app.json` iOS buildNumber 증가
- [ ] `app.json` Android versionCode 증가
- [ ] `eas build` 실행
- [ ] 빌드 성공 확인
- [ ] `sync-version.js` 실행 (또는 SQL로 수동 등록)
- [ ] Supabase에서 버전 확인
- [ ] 스토어 제출

---

**빌드 넘버는 절대 뒤로 갈 수 없습니다!**  
한 번 증가시킨 번호는 다시 낮출 수 없으니 신중하게 관리하세요. ⚠️

