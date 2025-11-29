# 🔴 Sentry 설치 가이드 (Supabase 환경)

## 📦 설치

```bash
npm install @sentry/react-native
```

## 🔧 설정

### 1. App.tsx 수정

```typescript
// App.tsx
import * as Sentry from '@sentry/react-native';

// Sentry 초기화 (앱 최상단)
Sentry.init({
  dsn: 'YOUR_SENTRY_DSN', // Sentry 프로젝트에서 받은 DSN
  environment: __DEV__ ? 'development' : 'production',
  
  // 성능 추적 (선택)
  tracesSampleRate: 0.2, // 20%만 추적 (비용 절감)
  
  // 민감 정보 필터링
  beforeSend(event, hint) {
    // 이메일 제거
    if (event.user?.email) {
      delete event.user.email;
    }
    
    // 개발 환경에서는 전송하지 않음
    if (__DEV__) {
      return null;
    }
    
    return event;
  },
  
  // 무시할 에러 (선택)
  ignoreErrors: [
    'Network request failed',
    'timeout',
  ],
});

// 나머지 코드...
export default Sentry.wrap(App);
```

### 2. errorTrackingService.ts 업데이트

```typescript
// src/services/errorTrackingService.ts
import * as Sentry from '@sentry/react-native';

captureError(error, context, additionalData) {
  if (!__DEV__) {
    Sentry.captureException(error instanceof Error ? error : new Error(error), {
      contexts: {
        custom: {
          context,
          ...additionalData,
        },
      },
    });
  }
}

setUser(userId: string, email?: string) {
  Sentry.setUser({ id: userId, email });
}

addBreadcrumb(message: string, category: string, data?: any) {
  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level: 'info',
  });
}
```

### 3. 전역 에러 핸들러 설정

```typescript
// App.tsx
import { ErrorBoundary } from '@sentry/react-native';

function App() {
  return (
    <ErrorBoundary fallback={<ErrorFallbackScreen />}>
      <QueryClientProvider client={queryClient}>
        <RootNavigator />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
```

## 🎯 사용 예시

```typescript
// 로그인 에러
import { captureError, setErrorUser } from '../services/errorTrackingService';

try {
  const user = await login(email, password);
  setErrorUser(user.id, user.email);
} catch (error) {
  captureError(error, 'Login Failed', {
    email_domain: email.split('@')[1],
  });
}

// 작품 업로드 에러
try {
  await uploadArtwork(data);
} catch (error) {
  captureError(error, 'Artwork Upload Failed', {
    artwork_type: data.type,
    image_count: data.images.length,
  });
}
```

## 💰 Sentry 무료 플랜

- **5,000 errors/month** (무료)
- **1명 개발자**
- **30일 데이터 보관**

→ 출시 초기에는 충분!

## 🔗 Sentry 프로젝트 생성

1. https://sentry.io 가입
2. New Project → React Native 선택
3. DSN 복사
4. App.tsx에 붙여넣기

완료!

