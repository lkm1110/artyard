# 🔧 최신 수정 가이드 (2025-11-08 오후)

## ✅ **즉시 적용된 수정 (2개)**

### **1. ✅ Reports 테이블 admin_notes 컬럼 추가**

**에러**:
```
ERROR 신고 처리 실패: Could not find the 'admin_notes' column of 'reports'
```

**수정 파일**: `database/fix-reports-table.sql`

**SQL 실행 필요**:
```sql
-- Supabase SQL Editor에서 실행
-- database/fix-reports-table.sql 전체 내용 복사해서 실행

-- 또는 간단하게:
ALTER TABLE reports ADD COLUMN IF NOT EXISTS admin_notes TEXT;
```

**테스트**: Admin Dashboard → Report 처리 → 에러 없음 확인

---

### **2. ✅ 채팅 자판 위 디자인 짤림**

**문제**: 입력창이 키보드에 가려짐

**수정 파일**: `src/screens/ChatScreen.tsx`

**수정 내용**:
```typescript
<KeyboardAvoidingView 
  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
  style={styles.keyboardView}
  keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20} // ✅ 추가
>
```

**테스트**: 
- 채팅 화면 → 메시지 입력 시작
- 입력창이 키보드 위로 올라가는지 확인
- 짤리지 않는지 확인

**추가 조정 필요 시**:
```typescript
// Android에서 더 띄우고 싶다면:
keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 40}

// iOS에서 띄우고 싶다면:
keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 20}
```

---

## ⚠️ **확인 필요 (2개)**

### **3. ⚠️ 게시글 위치 표시 안됨 (jojo 게시글)**

**상황**: jojo가 올린 게시글에 위치 정보가 안 나옴

**가능한 원인 (4가지)**:

#### **A. jojo가 위치 동의를 안 했을 가능성**
```
로그:
✅ 위치 권한: granted (artist89 계정)
❓ jojo 계정 → 위치 권한 상태 확인 필요
```

**확인 방법**:
1. jojo 계정으로 로그인
2. Artwork Upload 화면 진입
3. 콘솔에서 "✅ 위치 권한: granted" 또는 "⚠️ 위치 권한: denied" 확인

#### **B. 게시글 업로드 시 위치 정보가 DB에 저장 안 됐을 가능성**
```sql
-- Supabase SQL Editor에서 확인
SELECT 
  id,
  title,
  author_id,
  location_country,
  location_city,
  location_full,
  created_at
FROM artworks
WHERE author_id = (SELECT id FROM profiles WHERE handle = 'jojo')
ORDER BY created_at DESC
LIMIT 5;
```

**결과 해석**:
- `location_*` 컬럼이 모두 NULL → 위치 동의 안 함 또는 저장 실패
- `location_*` 컬럼에 값 있음 → UI 표시 문제

#### **C. UI에서 위치 정보를 표시하지 않는 문제**
```typescript
// src/components/ArtworkCard.tsx 확인
// location_full이 있는데 표시 안 되는지 확인

{artwork.location_full && (
  <Text style={styles.locationText}>
    📍 {translateLocationToEnglish(artwork.location_full)}
  </Text>
)}
```

#### **D. 게시글이 위치 수집 기능 추가 전에 업로드됨**
- 위치 기능은 최근에 추가됨
- 이전에 업로드된 게시글은 위치 정보 없음
- **해결책**: jojo가 새로운 게시글 올리기 → 위치 표시 확인

---

**권장 테스트 순서**:

1. **jojo 계정 위치 권한 확인**
   ```
   jojo 계정 로그인 → Settings에서 위치 권한 확인
   ```

2. **새 게시글 업로드 테스트**
   ```
   jojo 계정 → Upload Artwork
   → 위치 동의 팝업 → "Allow"
   → 업로드 완료
   → 메인 피드에서 위치 표시 확인
   ```

3. **DB 데이터 확인**
   ```sql
   -- 위의 SQL 쿼리 실행
   ```

---

### **4. ⚠️ 공유 딥링크 앱 전환 안됨**

**현재 공유 메시지**:
```
Open in app: artyard://artwork/7053c5f6-...
🎨 Download ArtYard: https://artyard.app/artwork/...
```

**문제**: `artyard://` 링크가 앱으로 전환 안됨

---

#### **딥링크 작동 원리**

**현재 상태**:
- ✅ `app.json`에 `scheme: "artyard"` 설정됨
- ✅ 코드에서 `artyard://artwork/xxx` 생성됨
- ❌ **앱이 딥링크를 인식 못함**

**딥링크가 작동하려면**:

1. **앱이 설치되어 있어야 함** ⚠️
   - Expo Go ≠ 실제 앱
   - Expo Go에서는 딥링크 작동 안 함!
   - **EAS Build로 빌드된 APK/IPA 필요**

2. **Android: Intent Filter 설정 필요**
   ```json
   // app.json
   "android": {
     "intentFilters": [
       {
         "action": "VIEW",
         "data": [
           {
             "scheme": "artyard",
             "host": "*"
           }
         ],
         "category": [
           "BROWSABLE",
           "DEFAULT"
         ]
       }
     ]
   }
   ```

3. **iOS: URL Scheme 설정 (이미 됨)**
   ```json
   "ios": {
     "bundleIdentifier": "com.yourcompany.artyard",
     "infoPlist": {
       "CFBundleURLTypes": [
         {
           "CFBundleURLSchemes": ["artyard"]
         }
       ]
     }
   }
   ```

---

#### **현재 상황별 해결책**

##### **A. Expo Go에서 테스트 중이라면** ⚠️
**딥링크 작동 안 함!**

Expo Go는 실제 앱이 아니므로 `artyard://` 스킴을 인식 못함.

**해결책**:
1. **개발 빌드 생성**:
   ```bash
   eas build --profile development --platform android
   ```

2. **APK 설치 후 테스트**

##### **B. 프로덕션 앱 배포 전이라면**
**임시 해결책**: Universal Link 사용

```typescript
// src/components/ArtworkFeed.tsx
const webUrl = `https://artyard.app/artwork/${artwork.id}`;

const shareMessage = `Check out this amazing artwork on ArtYard!

"${artwork.title}" by @${artwork.author?.handle || 'artist'}

${artwork.description ? artwork.description + '\n\n' : ''}View here: ${webUrl}

🎨 Download ArtYard: https://artyard.app`;
```

##### **C. 앱이 스토어에 배포된 후라면**
**Universal Links 설정** (iOS) / **App Links 설정** (Android)

1. **도메인에 파일 업로드**:
   - `https://artyard.app/.well-known/apple-app-site-association`
   - `https://artyard.app/.well-known/assetlinks.json`

2. **app.json 업데이트**:
   ```json
   "ios": {
     "associatedDomains": ["applinks:artyard.app"]
   },
   "android": {
     "intentFilters": [
       {
         "action": "VIEW",
         "autoVerify": true,
         "data": [
           {
             "scheme": "https",
             "host": "artyard.app",
             "pathPrefix": "/artwork"
           }
         ],
         "category": ["BROWSABLE", "DEFAULT"]
       }
     ]
   }
   ```

3. **앱에서 딥링크 처리**:
   ```typescript
   // App.tsx 또는 RootNavigator.tsx
   import * as Linking from 'expo-linking';

   useEffect(() => {
     const handleDeepLink = (event: { url: string }) => {
       const { path, queryParams } = Linking.parse(event.url);
       
       // artyard://artwork/123 또는 https://artyard.app/artwork/123
       if (path?.includes('artwork')) {
         const artworkId = path.split('/').pop();
         navigation.navigate('ArtworkDetail', { artworkId });
       }
     };

     // 앱이 열려있을 때
     Linking.addEventListener('url', handleDeepLink);

     // 앱이 닫혀있을 때 링크로 열림
     Linking.getInitialURL().then((url) => {
       if (url) {
         handleDeepLink({ url });
       }
     });
   }, []);
   ```

---

#### **빠른 테스트 방법**

**지금 당장 테스트하려면**:

1. **웹 링크만 사용**:
   ```typescript
   const shareMessage = `Check out "${artwork.title}" on ArtYard!
   
   ${webUrl}`;
   ```

2. **앱 스킴 제거**:
   ```typescript
   // artyard:// 링크 제거
   // https:// 링크만 공유
   ```

3. **카카오톡/메신저에서 웹 링크 클릭**:
   - 웹 브라우저로 열림
   - "Open in App" 버튼 구현 필요

---

## 📊 **수정 현황**

```
✅ admin_notes 컬럼 추가 (SQL 실행 필요)
✅ 채팅 키보드 조정 (코드 수정 완료)
⚠️ 위치 표시 안됨 (확인 필요 - jojo 권한/DB 확인)
⚠️ 딥링크 안됨 (Expo Go 한계 - 프로덕션 빌드 필요)
```

---

## 🎯 **즉시 테스트 가능**

### **1단계 (1분)**: SQL 실행
```sql
-- Supabase SQL Editor
ALTER TABLE reports ADD COLUMN IF NOT EXISTS admin_notes TEXT;
```

### **2단계 (2분)**: 앱 새로고침
```
Expo Go → r 키 (reload)
```

### **3단계 (3분)**: 테스트
```
1. ✅ Admin → Report 처리 → 에러 없음
2. ✅ 채팅 → 메시지 입력 → 입력창 안 짤림
3. ⚠️ jojo 게시글 위치 → 확인 (권한/DB)
4. ⚠️ 공유 딥링크 → Expo Go에서는 작동 안 함 (정상)
```

---

## 💡 **추천 조치**

### **위치 문제**:
1. jojo 계정으로 새 게시글 업로드 테스트
2. 위치 동의 팝업에서 "Allow" 선택
3. 메인 피드에서 위치 확인

### **딥링크 문제**:
**단기**: 웹 링크만 사용
```typescript
// artyard:// 제거, https:// 만 사용
```

**중기**: 개발 빌드 생성
```bash
eas build --profile development --platform android
```

**장기**: Universal Links 설정 (스토어 배포 후)

---

## 📋 **다음 단계**

1. **즉시**: SQL 실행 (admin_notes)
2. **테스트**: 채팅 키보드 확인
3. **조사**: jojo 위치 권한/DB 확인
4. **결정**: 딥링크 우선순위 (개발 빌드 vs 웹 링크)

---

**현재 2개 수정 완료, 2개 확인 필요!** 🚀

