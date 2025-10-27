# 🔔 Push Notification 구현 가이드

ArtYard 앱에 푸시 알림을 추가하는 완벽 가이드입니다.

---

## 📋 **필요한 알림 종류**

```yaml
1. 소셜 알림:
   - ❤️ 좋아요 (새 좋아요 받았을 때)
   - 💬 댓글 (내 작품에 댓글)
   - 🔖 북마크
   - 👥 팔로우

2. 거래 알림:
   - 💰 결제 완료
   - 📦 주문 접수
   - 🚚 배송 시작
   - ✅ 배송 완료
   - ⭐ 리뷰 요청

3. 챌린지 알림:
   - 🏆 챌린지 당첨
   - 📢 새 챌린지 시작
   - ⏰ 챌린지 마감 임박

4. 시스템 알림:
   - 📱 앱 업데이트
   - 🔧 점검 공지
   - ⚠️ 보안 알림
```

---

## 🚀 **구현 방법 (Expo 사용)**

### **Step 1: Expo Notifications 설정**

#### **1-1. 패키지 설치**
```bash
# 이미 설치되어 있음
expo install expo-notifications
```

#### **1-2. app.json 설정**
```json
{
  "expo": {
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#E91E63",
          "sounds": ["./assets/notification.wav"]
        }
      ]
    ],
    "notification": {
      "icon": "./assets/notification-icon.png",
      "color": "#E91E63",
      "androidMode": "default",
      "androidCollapsedTitle": "New notification from ArtYard"
    }
  }
}
```

---

### **Step 2: Push Token 생성 및 저장**

#### **2-1. 푸시 토큰 서비스 생성**

**`src/services/pushNotificationService.ts`**
```typescript
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from './supabase';

// 알림 핸들러 설정
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Push Token 등록
 */
export const registerForPushNotifications = async (userId: string): Promise<string | null> => {
  try {
    // 1. 실제 디바이스 체크
    if (!Device.isDevice) {
      console.warn('⚠️ Push notifications only work on physical devices');
      return null;
    }

    // 2. 권한 요청
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.warn('⚠️ Push notification permission not granted');
      return null;
    }

    // 3. Push Token 발급
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: 'YOUR_EXPO_PROJECT_ID', // EAS 프로젝트 ID
    });
    
    const pushToken = tokenData.data;
    console.log('✅ Push Token:', pushToken);

    // 4. Supabase에 저장
    const { error } = await supabase
      .from('push_tokens')
      .upsert({
        user_id: userId,
        push_token: pushToken,
        platform: Platform.OS,
        device_name: Device.deviceName || 'Unknown',
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,push_token'
      });

    if (error) {
      console.error('❌ Failed to save push token:', error);
      return null;
    }

    // 5. Android 채널 설정
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#E91E63',
      });
    }

    return pushToken;
  } catch (error) {
    console.error('❌ Push notification setup failed:', error);
    return null;
  }
};

/**
 * Push Token 제거 (로그아웃 시)
 */
export const unregisterPushToken = async (userId: string) => {
  try {
    const { error } = await supabase
      .from('push_tokens')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;
    console.log('✅ Push token removed');
  } catch (error) {
    console.error('❌ Failed to remove push token:', error);
  }
};

/**
 * 알림 수신 리스너 설정
 */
export const setupNotificationListeners = (
  onNotification: (notification: Notifications.Notification) => void,
  onNotificationResponse: (response: Notifications.NotificationResponse) => void
) => {
  // 앱이 foreground일 때 알림 수신
  const notificationListener = Notifications.addNotificationReceivedListener(onNotification);

  // 알림 클릭 시
  const responseListener = Notifications.addNotificationResponseReceivedListener(onNotificationResponse);

  return () => {
    Notifications.removeNotificationSubscription(notificationListener);
    Notifications.removeNotificationSubscription(responseListener);
  };
};

/**
 * 로컬 알림 (테스트용)
 */
export const scheduleLocalNotification = async (title: string, body: string, data?: any) => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: true,
    },
    trigger: { seconds: 1 },
  });
};
```

---

### **Step 3: Supabase 테이블 생성**

**`database/push-notifications-schema.sql`**
```sql
-- Push Tokens 테이블
CREATE TABLE IF NOT EXISTS push_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  push_token TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
  device_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, push_token)
);

-- 인덱스
CREATE INDEX idx_push_tokens_user_id ON push_tokens(user_id);
CREATE INDEX idx_push_tokens_push_token ON push_tokens(push_token);

-- RLS 정책
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own push tokens"
  ON push_tokens
  FOR ALL
  USING (auth.uid() = user_id);

-- Notification Queue 테이블 (백그라운드 전송용)
CREATE TABLE IF NOT EXISTS notification_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sent_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_notification_queue_status ON notification_queue(status);
CREATE INDEX idx_notification_queue_user_id ON notification_queue(user_id);
```

---

### **Step 4: App.tsx에 통합**

```typescript
// App.tsx
import { registerForPushNotifications, setupNotificationListeners } from './src/services/pushNotificationService';
import * as Notifications from 'expo-notifications';

export default function App() {
  const { user } = useAuthStore();

  useEffect(() => {
    if (user) {
      // Push Token 등록
      registerForPushNotifications(user.id);
    }
  }, [user]);

  useEffect(() => {
    // 알림 리스너 설정
    const cleanup = setupNotificationListeners(
      // 알림 수신
      (notification) => {
        console.log('🔔 Notification received:', notification);
      },
      // 알림 클릭
      (response) => {
        console.log('👆 Notification clicked:', response);
        const data = response.notification.request.content.data;
        
        // 알림 타입에 따라 화면 이동
        if (data.type === 'like') {
          navigation.navigate('ArtworkDetail', { artworkId: data.artworkId });
        } else if (data.type === 'comment') {
          navigation.navigate('ArtworkDetail', { artworkId: data.artworkId });
        } else if (data.type === 'order') {
          navigation.navigate('Orders');
        }
      }
    );

    return cleanup;
  }, []);

  // ... rest of app
}
```

---

### **Step 5: Supabase Edge Function으로 알림 전송**

**`supabase/functions/send-push-notification/index.ts`**
```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

serve(async (req) => {
  try {
    const { userId, title, body, data } = await req.json();

    // 1. Supabase 클라이언트 생성
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 2. 사용자의 Push Token 조회
    const { data: tokens, error: tokenError } = await supabase
      .from('push_tokens')
      .select('push_token')
      .eq('user_id', userId);

    if (tokenError || !tokens || tokens.length === 0) {
      return new Response(JSON.stringify({ error: 'No push tokens found' }), {
        status: 404,
      });
    }

    // 3. Expo Push Notification 전송
    const messages = tokens.map(({ push_token }) => ({
      to: push_token,
      sound: 'default',
      title,
      body,
      data,
      priority: 'high',
    }));

    const response = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });

    const result = await response.json();
    console.log('Push notification sent:', result);

    return new Response(JSON.stringify({ success: true, result }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
});
```

---

### **Step 6: Database Trigger로 자동 알림**

```sql
-- 좋아요 알림
CREATE OR REPLACE FUNCTION notify_artwork_like()
RETURNS TRIGGER AS $$
BEGIN
  -- Edge Function 호출
  PERFORM net.http_post(
    url := 'YOUR_SUPABASE_URL/functions/v1/send-push-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer YOUR_ANON_KEY'
    ),
    body := jsonb_build_object(
      'userId', (SELECT author_id FROM artworks WHERE id = NEW.artwork_id),
      'title', '❤️ New Like!',
      'body', 'Someone liked your artwork!',
      'data', jsonb_build_object(
        'type', 'like',
        'artworkId', NEW.artwork_id
      )
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_like
AFTER INSERT ON likes
FOR EACH ROW
EXECUTE FUNCTION notify_artwork_like();
```

---

## ✅ **테스트 방법**

### **1. 로컬 알림 테스트**
```typescript
import { scheduleLocalNotification } from './src/services/pushNotificationService';

// 버튼 클릭 시
await scheduleLocalNotification(
  'Test Notification',
  'This is a test!',
  { type: 'test' }
);
```

### **2. Expo Go에서 테스트**
- Expo Go 앱에서는 자동으로 작동
- 실제 디바이스 필요

### **3. 프로덕션 빌드**
```bash
# iOS
eas build --platform ios --profile production

# Android
eas build --platform android --profile production
```

---

## 🎯 **추가 기능**

### **배지 카운트**
```typescript
import * as Notifications from 'expo-notifications';

// 배지 설정
await Notifications.setBadgeCountAsync(5);

// 배지 클리어
await Notifications.setBadgeCountAsync(0);
```

### **알림 그룹화 (Android)**
```typescript
await Notifications.scheduleNotificationAsync({
  content: {
    title: 'New Message',
    body: 'You have new messages',
    data: { type: 'message' },
  },
  trigger: null,
  identifier: 'messages-group', // 같은 그룹으로
});
```

---

## 📝 **체크리스트**

```yaml
□ expo-notifications 설치
□ app.json 설정
□ pushNotificationService.ts 생성
□ push_tokens 테이블 생성
□ App.tsx에 통합
□ Edge Function 배포
□ Database Trigger 설정
□ 실제 디바이스에서 테스트
□ iOS: Apple Developer에서 Push Notification 인증서 설정
□ Android: Firebase Cloud Messaging (FCM) 설정 (선택)
```

---

**완료 예상 시간: 4-6시간** ⏰

