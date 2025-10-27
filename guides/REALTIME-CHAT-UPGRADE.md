# 💬 실시간 채팅 업그레이드 가이드

현재 기본 채팅을 **실시간 채팅**으로 업그레이드하는 가이드입니다.

---

## 📊 **현재 vs 실시간**

### **Before (현재)**
```typescript
// React Query로 주기적 폴링
const { data: messages } = useChatMessages(chatId);
// 문제: 상대방 메시지가 바로 안 보임
```

### **After (실시간)**
```typescript
// Supabase Realtime으로 즉시 업데이트
supabase.channel('chat:123')
  .on('INSERT', (payload) => {
    // 새 메시지 바로 화면에 표시!
  })
// 장점: 카카오톡처럼 즉시 업데이트
```

---

## 🚀 **구현 방법**

### **Step 1: ChatScreen에 Realtime 추가**

```typescript
// src/screens/ChatScreen.tsx

import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export const ChatScreen: React.FC = () => {
  const { chatId } = route.params;
  const [messages, setMessages] = useState<Message[]>([]);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  
  // 초기 메시지 로드
  useEffect(() => {
    loadInitialMessages();
  }, [chatId]);
  
  const loadInitialMessages = async () => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });
    
    if (data) setMessages(data);
  };
  
  // 🔥 실시간 구독 설정
  useEffect(() => {
    if (!chatId) return;
    
    console.log('🔴 Starting realtime subscription for chat:', chatId);
    
    // 1. 채널 생성
    const chatChannel = supabase
      .channel(`chat:${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          console.log('🆕 New message received:', payload.new);
          
          // 새 메시지 추가
          setMessages((prev) => [...prev, payload.new as Message]);
          
          // 자동 스크롤
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 100);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          console.log('✏️ Message updated:', payload.new);
          
          // 메시지 업데이트
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === payload.new.id ? (payload.new as Message) : msg
            )
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          console.log('🗑️ Message deleted:', payload.old);
          
          // 메시지 삭제
          setMessages((prev) =>
            prev.filter((msg) => msg.id !== payload.old.id)
          );
        }
      )
      .subscribe((status) => {
        console.log('📡 Subscription status:', status);
        
        if (status === 'SUBSCRIBED') {
          console.log('✅ Successfully subscribed to realtime updates');
        }
      });
    
    setChannel(chatChannel);
    
    // 2. 정리 (cleanup)
    return () => {
      console.log('🔴 Unsubscribing from chat:', chatId);
      chatChannel.unsubscribe();
    };
  }, [chatId]);
  
  // ... rest of component
};
```

---

### **Step 2: Supabase Realtime 활성화**

```sql
-- Supabase Dashboard > Database > Replication
-- messages 테이블의 Realtime 활성화

ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- 또는 SQL로:
ALTER PUBLICATION supabase_realtime 
ADD TABLE public.messages;
```

---

### **Step 3: 타이핑 인디케이터 (선택)**

```typescript
// 실시간 타이핑 상태 표시

const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);

// 타이핑 시작
const handleTypingStart = () => {
  supabase.channel(`chat:${chatId}`)
    .send({
      type: 'broadcast',
      event: 'typing',
      payload: { userId: user?.id, isTyping: true },
    });
};

// 타이핑 중지
const handleTypingStop = () => {
  supabase.channel(`chat:${chatId}`)
    .send({
      type: 'broadcast',
      event: 'typing',
      payload: { userId: user?.id, isTyping: false },
    });
};

// 타이핑 상태 수신
useEffect(() => {
  const channel = supabase.channel(`chat:${chatId}`)
    .on('broadcast', { event: 'typing' }, ({ payload }) => {
      if (payload.userId !== user?.id) {
        setIsOtherUserTyping(payload.isTyping);
        
        // 3초 후 자동 해제
        if (payload.isTyping) {
          setTimeout(() => {
            setIsOtherUserTyping(false);
          }, 3000);
        }
      }
    })
    .subscribe();
  
  return () => {
    channel.unsubscribe();
  };
}, [chatId]);

// UI에 표시
{isOtherUserTyping && (
  <View style={styles.typingIndicator}>
    <Text>{otherUser.handle} is typing...</Text>
  </View>
)}
```

---

### **Step 4: 온라인 상태 표시 (선택)**

```typescript
// 사용자 온라인 상태

const [isOnline, setIsOnline] = useState(false);

useEffect(() => {
  // Presence 채널로 온라인 상태 추적
  const channel = supabase.channel('online-users')
    .on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const isUserOnline = Object.values(state).some(
        (presences: any) =>
          presences.some((p: any) => p.user_id === otherUser.id)
      );
      setIsOnline(isUserOnline);
    })
    .on('presence', { event: 'join' }, ({ key, newPresences }) => {
      console.log('User joined:', newPresences);
    })
    .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
      console.log('User left:', leftPresences);
    })
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          user_id: user?.id,
          online_at: new Date().toISOString(),
        });
      }
    });
  
  return () => {
    channel.unsubscribe();
  };
}, [otherUser.id]);

// UI에 표시
<View style={styles.userStatus}>
  <View style={[
    styles.statusDot,
    { backgroundColor: isOnline ? '#00FF00' : '#CCCCCC' }
  ]} />
  <Text>{isOnline ? 'Online' : 'Offline'}</Text>
</View>
```

---

### **Step 5: MessagesScreen에도 Realtime 추가**

```typescript
// src/screens/MessagesScreen.tsx
// 채팅 목록 화면도 실시간으로

useEffect(() => {
  const channel = supabase
    .channel('all-chats')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'messages',
      },
      (payload) => {
        console.log('Message updated in any chat:', payload);
        // 채팅 목록 새로고침
        queryClient.invalidateQueries({ queryKey: ['chats'] });
      }
    )
    .subscribe();
  
  return () => {
    channel.unsubscribe();
  };
}, []);
```

---

## 🎯 **추가 기능들**

### **1. 읽음 표시 실시간**
```typescript
// 상대방이 메시지 읽으면 즉시 ✓✓ 표시
channel.on('postgres_changes', {
  event: 'UPDATE',
  schema: 'public',
  table: 'messages',
  filter: `is_read=eq.true`,
}, (payload) => {
  // 읽음 상태 업데이트
});
```

### **2. 메시지 전송 중 표시**
```typescript
const [sendingMessageId, setSendingMessageId] = useState<string | null>(null);

// 메시지 전송
const tempId = uuid.v4();
setSendingMessageId(tempId);

// 화면에 임시 메시지 표시
const optimisticMessage = {
  id: tempId,
  content: messageText,
  sender_id: user.id,
  status: 'sending', // 전송 중
};

setMessages(prev => [...prev, optimisticMessage]);

// 실제 전송
await sendMessage(messageText);
setSendingMessageId(null);
```

### **3. 이미지/파일 전송**
```typescript
const handleImageSend = async (imageUri: string) => {
  // 1. Supabase Storage에 업로드
  const fileName = `chat/${chatId}/${Date.now()}.jpg`;
  const { data: uploadData } = await supabase.storage
    .from('chat-images')
    .upload(fileName, {
      uri: imageUri,
      type: 'image/jpeg',
      name: fileName,
    });
  
  // 2. 메시지 전송
  await sendMessage({
    content: '',
    image_url: uploadData.path,
    type: 'image',
  });
};
```

---

## 📝 **체크리스트**

```yaml
□ Supabase Realtime 활성화 (messages 테이블)
□ ChatScreen에 Realtime 구독 추가
□ MessagesScreen에 Realtime 추가
□ 타이핑 인디케이터 (선택)
□ 온라인 상태 표시 (선택)
□ 읽음 표시 실시간 업데이트
□ 메시지 전송 중 표시
□ 이미지 전송 기능 (선택)
□ 실제 디바이스에서 테스트
```

---

## 🐛 **트러블슈팅**

### **실시간 업데이트 안될 때**
```typescript
// 1. Supabase Dashboard 확인
Settings > API > Realtime 활성화 확인

// 2. 테이블 Replication 확인
Database > Replication > messages 체크

// 3. RLS 정책 확인
messages 테이블에 SELECT 정책 있어야 함

// 4. 콘솔 로그 확인
console.log('Subscription status:', status);
```

### **너무 많은 연결**
```typescript
// useEffect cleanup 잊지 말기!
return () => {
  channel.unsubscribe(); // ⭐ 필수!
};
```

---

**완료 예상 시간: 2-3시간** ⏰

**실시간 채팅으로 업그레이드하면 사용자 경험이 10배 좋아집니다!** 🚀

