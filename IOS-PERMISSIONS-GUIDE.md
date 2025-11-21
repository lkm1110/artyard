# iOS 권한 요청 가이드

## 권한이 언제 요청되나요?

### 📸 사진 권한 (Photo Library)
**요청 시점**: 처음으로 이미지를 선택하려고 할 때
- ✅ 작품 업로드 시 (Upload 버튼 → 이미지 선택)
- ✅ 프로필 사진 변경 시 (Edit Profile → 카메라 아이콘 클릭)
- ✅ 챌린지 제출 시 (Challenge → Submit)

**권한 요청 문구**:
```
ArtYard needs photo library access to let you select artwork images to upload. 
This permission is only used when you choose to upload artwork.
```

### 📍 위치 권한 (Location)
**요청 시점**: 작품 업로드 시 위치 추가를 선택할 때
- ✅ 작품 업로드 화면에서 "Add Location" 버튼 클릭 시

**권한 요청 문구**:
```
ArtYard needs location access to tag where your artwork was created. 
This is completely optional and only used when you choose to add location to your artwork.
```

### 🔔 Notification 권한
**요청 시점**: 앱 첫 실행 후 로그인 완료 시 (자동)
- PushNotificationHandler 컴포넌트가 자동으로 요청

**권한 요청 문구**: iOS 기본 메시지 사용

## 왜 권한 요청이 안 나타나나요?

### 1. 아직 해당 기능을 사용하지 않았을 때
iOS는 **실제로 권한이 필요한 시점**에만 권한을 요청합니다.

예시:
- 사진 권한: 아직 작품을 업로드하지 않았거나 프로필 사진을 변경하지 않았을 때
- 위치 권한: 작품 업로드 시 "Add Location"을 선택하지 않았을 때

### 2. 이미 권한을 부여했을 때
이전에 권한을 허용했다면 다시 묻지 않습니다.

### 3. 이미 권한을 거부했을 때
한 번 거부한 권한은 다시 자동으로 묻지 않습니다.
Settings → ArtYard에서 수동으로 활성화해야 합니다.

## 권한 테스트 방법

### 사진 권한 테스트
1. 앱 실행
2. 하단 탭의 **Upload** (+) 버튼 클릭
3. "Select Images" 버튼 클릭
4. ✅ 이 시점에 사진 권한 요청 나타남

### 위치 권한 테스트
1. 앱 실행
2. 하단 탭의 **Upload** (+) 버튼 클릭
3. "Select Images"로 이미지 선택
4. "Add Location" 스위치 ON
5. ✅ 이 시점에 위치 권한 요청 나타남

### Notification 권한 테스트
1. 앱 삭제 후 재설치
2. 로그인 완료
3. ✅ 로그인 직후 자동으로 notification 권한 요청

## 권한 재설정 방법 (테스트용)

### 방법 1: 앱 삭제 후 재설치
```bash
# 앱 완전 삭제
1. 홈 화면에서 ArtYard 앱 길게 누르기
2. "Remove App" → "Delete App" 선택
3. 다시 설치
```

### 방법 2: 시뮬레이터 권한 리셋
```bash
# iOS 시뮬레이터에서
xcrun simctl privacy booted reset all com.artyard.app
```

### 방법 3: 설정에서 수동 변경
```
Settings → ArtYard → Photos → None
Settings → ArtYard → Location → Never
Settings → ArtYard → Notifications → Off
```

## 권한 요청 순서

### 정상적인 사용 시나리오

1. **첫 실행**
   - Notification 권한 요청 ✅

2. **첫 작품 업로드**
   - 사진 권한 요청 ✅
   - (선택 시) 위치 권한 요청 ✅

3. **프로필 사진 변경**
   - 사진 권한 이미 허용되어 있으면 바로 선택 가능
   - 거부했었다면 설정 안내 메시지 표시

## 권한 거부 시 처리

### 사진 권한 거부 시
```
Permission Required

Please allow access to your photos to upload artwork.

You can enable this in:
Settings → ArtYard → Photos → "Read and Write"

[Go to Settings] [Cancel]
```

### 위치 권한 거부 시
```
Location Permission Required

To add location to your artwork, please enable location access.

You can enable this in:
Settings → ArtYard → Location → "While Using the App"

[Go to Settings] [Cancel]
```

## Notification 아이콘 제거

### 변경 사항
```json
// Before
"notification": {
  "icon": "./assets/icon.png",  // ❌ 제거됨
  "color": "#E91E63"
}

// After
"notification": {
  "color": "#E91E63"  // ✅ 색상만 유지
}
```

**이유**: 
- Notification 아이콘은 Android에서만 필요
- iOS는 앱 아이콘을 자동으로 사용
- 별도 아이콘 지정 불필요

## 빌드 후 테스트

### 새 빌드 생성
```bash
# iOS 빌드
eas build --platform ios --profile preview

# 또는 로컬 개발
npm start
```

### 확인 사항
1. ✅ Notification 권한 요청이 간결하게 나타남
2. ✅ 사진 권한은 이미지 선택 시 요청됨
3. ✅ 위치 권한은 "Add Location" 선택 시 요청됨
4. ✅ 각 권한 요청 문구가 명확하게 표시됨

## 문제 해결

### 사진 권한이 여전히 안 나타나요?
1. 앱을 완전히 삭제하고 재설치
2. Upload 버튼 → Select Images 클릭
3. 여전히 안 나타나면 Settings → Privacy → Photos에서 ArtYard 확인

### 위치 권한이 안 나타나요?
1. 작품 업로드 화면에서 "Add Location" 스위치를 ON
2. 여전히 안 나타나면 Settings → Privacy → Location Services 활성화 확인

### Notification이 안 오나요?
1. Settings → ArtYard → Notifications 확인
2. "Allow Notifications" 활성화
3. Lock Screen, Notification Center, Banners 모두 활성화

## 정리

### iOS 권한 요청은 Just-In-Time
- ✅ 실제 필요한 시점에만 요청
- ✅ 사용자 경험 개선
- ✅ 불필요한 권한 요청 최소화

### Notification 아이콘 제거
- ✅ Android만 별도 아이콘 지정
- ✅ iOS는 앱 아이콘 자동 사용
- ✅ 코드 및 설정 단순화

### 권한 요청 문구 개선
- ✅ 더 명확하고 자세한 설명
- ✅ 권한 사용 목적 명시
- ✅ "Only used when you choose" 강조

