# 📊 Analytics 설치 가이드 (Amplitude)

## 왜 Amplitude?

✅ **무료 플랜**: 10M events/month  
✅ **Supabase 친화적**: REST API 제공  
✅ **강력한 분석**: 사용자 행동 분석, 리텐션, 코호트  
✅ **설정 간단**: 5분이면 끝  

대안: Mixpanel (복잡), Firebase (Google 종속)

---

## 📦 설치

```bash
npm install @amplitude/analytics-react-native
```

---

## 🔧 설정

### 1. Amplitude 프로젝트 생성

1. https://amplitude.com 가입 (무료)
2. New Project 생성
3. API Key 복사

### 2. 환경변수 추가

```bash
# .env
AMPLITUDE_API_KEY=your_api_key_here
```

```bash
# .env.example
AMPLITUDE_API_KEY=
```

### 3. App.tsx 초기화

```typescript
// App.tsx
import { init } from '@amplitude/analytics-react-native';
import Constants from 'expo-constants';

// Amplitude 초기화
init(
  process.env.AMPLITUDE_API_KEY || '', 
  undefined, // userId는 로그인 후 설정
  {
    // 디버그 모드 (개발 환경에서만)
    logLevel: __DEV__ ? 'Debug' : 'Warn',
    
    // 오프라인 큐잉
    offline: true,
    
    // 자동 추적
    trackingOptions: {
      platform: true,
      osVersion: true,
      deviceModel: true,
      carrier: true,
    },
  }
);
```

### 4. analyticsService.ts 업데이트

```typescript
// src/services/analyticsService.ts
import { track, identify, setUserId } from '@amplitude/analytics-react-native';

private async sendToAmplitude(eventName: string, params?: Record<string, any>) {
  try {
    if (!__DEV__) {
      track(eventName, params);
    }
  } catch (error) {
    console.warn('Analytics failed:', error);
  }
}

// 사용자 설정
trackUserSignup(method: 'google' | 'naver' | 'kakao' | 'apple') {
  this.trackEvent('user_signup', { method });
  
  // Amplitude 사용자 식별
  identify({
    user_properties: {
      signup_method: method,
      signup_date: new Date().toISOString(),
    },
  });
}

// 로그인 시 사용자 ID 설정
trackUserLogin(userId: string, method: string) {
  setUserId(userId);
  this.trackEvent('user_login', { method });
}
```

---

## 🎯 사용 예시

```typescript
// 화면 조회
import { trackScreenView } from '../services/analyticsService';

useEffect(() => {
  trackScreenView('Home');
}, []);

// 작품 업로드
trackArtworkUpload(artwork.id, artwork.material, artwork.price);

// 구매 완료
trackPurchaseCompleted(transactionId, artworkId, amount);
```

---

## 📊 Amplitude에서 볼 수 있는 것

### 실시간 대시보드
- 현재 활성 사용자
- 실시간 이벤트 스트림

### 사용자 행동 분석
- 어떤 작품이 가장 많이 조회되는지
- 어떤 유형의 작품이 좋아요를 많이 받는지
- 구매 전환율

### 리텐션 분석
- Day 1, Day 7, Day 30 리텐션
- 어떤 기능이 리텐션에 영향을 주는지

### 퍼널 분석
```
작품 조회 → 좋아요 → 작가 팔로우 → 구매
100명 → 30명 → 10명 → 3명
```

---

## 💰 무료 플랜 제한

- **10M events/month** (월 1천만 이벤트)
- **Unlimited users**
- **90일 데이터 보관**

→ 출시 초기 충분!

사용자 10만명 × 100 events/user = 1000만 events → OK!

---

## 🔒 프라이버시

```typescript
// 민감 정보 제외
trackEvent('user_signup', {
  method: 'google',
  // ❌ email: user.email, // 제외!
  // ❌ name: user.name,   // 제외!
});

// 사용자 식별은 ID만
setUserId(user.id); // UUID (익명)
```

---

## 🚀 빠른 시작

1. Amplitude 가입 (1분)
2. npm install (1분)
3. App.tsx 설정 (2분)
4. 완료! 🎉

**총 5분이면 Analytics 준비 완료!**

