# Apple 로그인 모바일 전용 설정

## 🎯 전략 변경 이유

Apple의 최신 정책으로 인해 개발 환경에서 Service ID 생성이 거의 불가능해짐.
→ **모바일 우선 전략**으로 변경

## 📱 현재 설정 상태

### ✅ 완료된 것들
- **App ID**: `com.artyard.app` (생성 완료)
- **Team ID**: `9T69A85KY2` (확인 완료)
- **Key ID**: `482NBGZKV9` (생성 완료)
- **Private Key**: 확보 완료

### ❌ 불필요한 것
- **Service ID**: 웹용이지만 생성 불가 → 제거

## 🔧 새로운 설정 방법

### 1. Apple Developer Console
```
✅ App ID만 유지: com.artyard.app
❌ Service ID 삭제: 생성 포기
✅ Key 유지: Apple 로그인용
```

### 2. 앱 동작 방식
```
📱 iOS 네이티브: 실제 Apple 로그인 (App ID 사용)
🌐 웹 브라우저: Apple 로그인 버튼 숨김
🤖 Android: Apple 로그인 버튼 숨김
```

### 3. 사용자 경험
```
iOS 사용자: Google, Apple, Facebook, Naver, Kakao (5개)
기타 사용자: Google, Facebook, Naver, Kakao (4개)
```

## 💡 장점

1. **개발 복잡성 제거**: Service ID 설정 불필요
2. **실제 사용자 중심**: iOS 사용자가 Apple 로그인 주로 사용
3. **빠른 개발**: 웹 Apple 로그인 디버깅 시간 절약
4. **안정성**: 검증된 네이티브 Apple 로그인만 사용

## 🚀 즉시 적용

### LoginScreen 수정 완료
```typescript
// Apple 버튼이 iOS에서만 표시됨
{isAppleAvailable && Platform.OS === 'ios' && (
  <Button title="🍎 Continue with Apple" />
)}
```

### Supabase 설정
```
Apple OAuth: 비활성화 (또는 App ID만 설정)
다른 OAuth들: 정상 유지
```

## 📊 사용자 분포 예상

```
iOS 사용자 (40%): Apple 로그인 가능 ✅
Android 사용자 (50%): Google, Facebook 등 사용
웹 사용자 (10%): Google, Facebook 등 사용
```

## 🎯 결론

**Apple Service ID 포기하고 모바일 중심으로 진행**
- 개발 시간 단축
- 실제 사용자 경험 개선
- 기술적 복잡성 제거
