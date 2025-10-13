// 🔍 읽지 않은 메시지 카운트 디버깅 스크립트
// F12 → Console 탭에 붙여넣기

console.log('🚨 읽지 않은 메시지 디버깅 시작');

// 1. 현재 사용자 확인
const checkUser = async () => {
  const response = await fetch('https://bkvycanciimgyftdtqpx.supabase.co/auth/v1/user', {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token') || 'none'}`,
      'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrdnljYW5jaWltZ3lmdGR0cXB4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxODQ5MDksImV4cCI6MjA3NDc2MDkwOX0.nYAt_sr_wTLy1PexlWV7G9fCXMSz2wsV2Ql5vNbY5zY'
    }
  });
  const user = await response.json();
  console.log('👤 현재 사용자:', user);
  return user;
};

// 2. 채팅방 목록 확인
const checkChats = async () => {
  const user = await checkUser();
  if (!user.id) return;
  
  const response = await fetch(`https://bkvycanciimgyftdtqpx.supabase.co/rest/v1/chats?or=(a.eq.${user.id},b.eq.${user.id})&select=id,a,b`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`,
      'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrdnljYW5jaWltZ3lmdGR0cXB4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxODQ5MDksImV4cCI6MjA3NDc2MDkwOX0.nYAt_sr_wTLy1PexlWV7G9fCXMSz2wsV2Ql5vNbY5zY'
    }
  });
  const chats = await response.json();
  console.log('💬 사용자 채팅방들:', chats);
  return { user, chats };
};

// 3. 각 채팅방의 메시지 상태 확인
const checkMessages = async () => {
  const { user, chats } = await checkChats();
  
  for (const chat of chats) {
    console.log(`\n🔍 채팅방 ${chat.id} 분석:`);
    
    // 전체 메시지 수
    const allResponse = await fetch(`https://bkvycanciimgyftdtqpx.supabase.co/rest/v1/messages?chat_id=eq.${chat.id}&select=id,sender_id,is_read`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`,
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrdnljYW5jaWltZ3lmdGR0cXB4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxODQ5MDksImV4cCI6MjA3NDc2MDkwOX0.nYAt_sr_wTLy1PexlWV7G9fCXMSz2wsV2Ql5vNbY5zY'
      }
    });
    const allMessages = await allResponse.json();
    console.log('📋 전체 메시지:', allMessages);
    
    // 내가 보낸 메시지와 받은 메시지 분류
    const myMessages = allMessages.filter(m => m.sender_id === user.id);
    const otherMessages = allMessages.filter(m => m.sender_id !== user.id);
    
    console.log('📤 내가 보낸 메시지:', myMessages.length, '개');
    console.log('📥 받은 메시지:', otherMessages.length, '개');
    console.log('📥 받은 메시지 상세:', otherMessages.map(m => ({ 
      id: m.id, 
      is_read: m.is_read,
      sender_id: m.sender_id.substring(0,8) + '...'
    })));
    
    // 읽지 않은 받은 메시지 수
    const unreadReceived = otherMessages.filter(m => m.is_read !== true);
    console.log('🔴 읽지 않은 받은 메시지:', unreadReceived.length, '개');
  }
};

// 실행
checkMessages();
