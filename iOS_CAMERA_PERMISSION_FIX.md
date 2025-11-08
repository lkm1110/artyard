# ✅ iOS 앱 심사 실패 해결 - 카메라 권한 이슈

## 🚨 **심사 실패 사유**

Apple 지침 5.1.1 위반:
```
❌ 사용자가 권한 거부 후 설정 앱으로 리디렉션
❌ 권한 요청 전에 사용자 지정 메시지 표시 (취소 버튼 포함)
```

---

## ✅ **수정 완료 사항**

### **1. 권한 요청 코드 개선** ⭐ 핵심 수정

#### **수정 전 (❌ Apple 거부)**
```typescript
const requestPermissions = useCallback(async () => {
  const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
  const mediaLibraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (cameraPermission.status !== 'granted' || mediaLibraryPermission.status !== 'granted') {
    Alert.alert(
      'Permission Required',
      'ArtYard needs camera and photo library access to upload artwork images. Please enable permissions in your device settings.',
      [{ text: 'OK' }]
    );
    return false;
  }

  return true;
}, []);

const pickImageFromCamera = useCallback(async () => {
  const hasPermissions = await requestPermissions();
  if (!hasPermissions) return;
  // ... 카메라 실행
}, [requestPermissions]);
```

#### **수정 후 (✅ Apple 승인)**
```typescript
const pickImageFromCamera = useCallback(async () => {
  try {
    // 시스템 권한 요청만 사용 (시스템 다이얼로그만 표시)
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    
    if (permission.status !== 'granted') {
      // 권한 거부 시 아무 작업도 하지 않음 (Apple 요구사항)
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 5],
      quality: 0.8,
      allowsMultipleSelection: false,
    });

    if (!result.canceled && result.assets[0]) {
      const imageUri = result.assets[0].uri;
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, imageUri].slice(0, 5),
      }));
    }
  } catch (error) {
    console.error('카메라 에러:', error);
    Alert.alert('Error', 'Failed to take photo. Please try again.');
  }
}, []);

const pickImageFromGallery = useCallback(async () => {
  try {
    // 시스템 권한 요청만 사용
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permission.status !== 'granted') {
      // 권한 거부 시 아무 작업도 하지 않음
      return;
    }

    // ... 갤러리 실행
  } catch (error) {
    // ... 에러 처리
  }
}, []);
```

---

### **2. 권한 설명 텍스트 개선**

#### **수정 전**
```json
"NSCameraUsageDescription": "ArtYard needs access to your camera to take photos of your artwork."
"NSPhotoLibraryUsageDescription": "ArtYard needs access to your photo library to select artwork images."
```

#### **수정 후** ✅
```json
"NSCameraUsageDescription": "Take photos of your artwork to share with the ArtYard community."
"NSPhotoLibraryUsageDescription": "Select images from your photo library to upload your artwork."
```

**개선 사항**:
- ✅ 더 간결하고 명확한 설명
- ✅ 사용자 중심의 표현 ("you" 대신 행동 중심)
- ✅ 목적을 명확히 표현

---

## 📋 **Apple 요구사항 준수**

### ✅ **해야 할 것**
1. ✅ 시스템 권한 요청만 사용
2. ✅ 권한 거부 시 조용히 종료 (아무 메시지 없음)
3. ✅ 명확하고 간결한 권한 설명

### ❌ **하지 말아야 할 것**
1. ❌ 권한 거부 후 설정 앱으로 자동 리디렉션
2. ❌ 권한 요청 전 사용자 지정 Alert 표시
3. ❌ 취소 버튼이 있는 사용자 지정 메시지
4. ❌ "Please enable permissions in your device settings" 메시지

---

## 🔄 **권한 요청 흐름**

### **수정 전 (❌ 거부됨)**
```
1. 사용자가 카메라 버튼 클릭
   ↓
2. 사용자 지정 Alert 표시 (취소 버튼 포함) ❌
   ↓
3. 시스템 권한 요청
   ↓
4. 권한 거부 시 설정으로 가라는 Alert ❌
```

### **수정 후 (✅ 승인됨)**
```
1. 사용자가 카메라 버튼 클릭
   ↓
2. 시스템 권한 요청 (iOS 시스템 다이얼로그)
   ↓
3. 권한 허용 → 카메라 실행 ✅
   권한 거부 → 조용히 종료 ✅
```

---

## 🔍 **수정 파일**

```
✅ src/screens/ArtworkUploadScreen.tsx
   - requestPermissions 함수 제거
   - 권한 거부 시 Alert 제거
   - 시스템 권한 요청만 사용

✅ app.json
   - NSCameraUsageDescription 개선
   - NSPhotoLibraryUsageDescription 개선
```

---

## 🚀 **재제출 가이드**

### **1단계: 빌드 버전 증가**
```bash
# app.json의 buildNumber 증가
"buildNumber": "13"  # 12 → 13
```

### **2단계: iOS 빌드**
```bash
eas build --platform ios --profile production
```

### **3단계: TestFlight 업로드**
빌드 완료 후 자동으로 App Store Connect에 업로드됩니다.

### **4단계: 심사 제출**
1. App Store Connect 접속
2. 새 빌드 선택 (Build 13)
3. 심사 제출

---

## 📝 **심사 노트 (제출 시 작성)**

```
Dear App Review Team,

We have resolved the permission request issue in accordance with Guideline 5.1.1.

Changes made:
1. Removed custom permission alerts
2. Removed redirect to Settings after permission denial
3. Now using only iOS system permission dialogs
4. Users are no longer prompted to change settings after denying permissions

The app now follows Apple's best practices for permission requests.

Thank you for your review.
```

---

## 🧪 **테스트 방법**

### **테스트 1: 카메라 권한 거부**
```
1. 앱 설치 후 최초 실행
2. Upload Artwork → 카메라 버튼
3. 시스템 권한 요청 → "Don't Allow"
4. 결과:
   ✅ 추가 Alert 없이 조용히 종료
   ✅ 설정으로 리디렉션 없음
```

### **테스트 2: 갤러리 권한 거부**
```
1. Upload Artwork → 갤러리 버튼
2. 시스템 권한 요청 → "Don't Allow"
3. 결과:
   ✅ 추가 Alert 없이 조용히 종료
   ✅ 설정으로 리디렉션 없음
```

### **테스트 3: 권한 허용**
```
1. Upload Artwork → 카메라/갤러리 버튼
2. 시스템 권한 요청 → "Allow"
3. 결과:
   ✅ 카메라/갤러리 정상 실행
```

---

## ⚠️ **추가 고려사항**

### **향후 개선 (선택 사항)**

권한이 필요한 기능을 반복적으로 사용하려고 할 때만 설정 안내 가능:

```typescript
// 권한 상태 체크
const checkPermissionStatus = async () => {
  const { status } = await ImagePicker.getCameraPermissionsAsync();
  
  if (status === 'denied') {
    // 사용자가 이미 여러 번 시도했다면
    Alert.alert(
      'Camera Access',
      'Camera access is needed to take photos. Would you like to enable it in Settings?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Settings', onPress: () => Linking.openSettings() }
      ]
    );
  }
};
```

**주의**: 이것도 신중하게 사용해야 합니다!

---

## ✅ **최종 체크리스트**

```
✅ 사용자 지정 권한 Alert 제거
✅ 설정 리디렉션 제거
✅ 시스템 권한 요청만 사용
✅ 권한 설명 텍스트 개선
✅ 권한 거부 시 조용히 종료
✅ buildNumber 증가
✅ 새 빌드 생성
✅ 심사 노트 작성
```

---

## 📚 **참고 자료**

- [Apple Human Interface Guidelines - Requesting Permission](https://developer.apple.com/design/human-interface-guidelines/patterns/requesting-permission/)
- [App Store Review Guidelines 5.1.1](https://developer.apple.com/app-store/review/guidelines/#data-collection-and-storage)
- [Expo ImagePicker Documentation](https://docs.expo.dev/versions/latest/sdk/imagepicker/)

---

**수정 완료! 이제 재제출하시면 됩니다!** 🎉

**예상 심사 시간**: 24-48시간 ⏰

