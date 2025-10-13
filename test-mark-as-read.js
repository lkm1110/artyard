// 🔧 읽음 처리 테스트 스크립트
// debug-unread-count.js 실행 후 사용하세요

const testMarkAsRead = async () => {
  console.log('\n🧪 읽음 처리 테스트 시작');
  
  // 사용자 정보 가져오기
  const userResponse = await fetch('https://bkvycanciimgyftdtqpx.supabase.co/auth/v1/user', {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`,
      'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrdnljYW5jaWltZ3lmdGR0cXB4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxODQ5MDksImV4cCI6MjA3NDc2MDkwOX0.nYAt_sr_wTLy1PexlWV7G9fCXMSz2wsV2Ql5vNbY5zY'
    }
  });
  const user = await userResponse.json();
  
  // 채팅방 가져오기
  const chatsResponse = await fetch(`https://bkvycanciimgyftdtqpx.supabase.co/rest/v1/chats?or=(a.eq.${user.id},b.eq.${user.id})&select=id`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`,
      'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrdnljYW5jaWltZ3lmdGR0cXB4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxODQ5MDksImV4cCI6MjA3NDc2MDkwOX0.nYAt_sr_wTLy1PexlWV7G9fCXMSz2wsV2Ql5vNbY5zY'
    }
  });
  const chats = await chatsResponse.json();
  
  // 첫 번째 채팅방으로 테스트
  if (chats.length > 0) {
    const chatId = chats[0].id;
    console.log(`📖 채팅방 ${chatId} 읽음 처리 테스트`);
    
    // 읽음 처리 API 호출
    const updateResponse = await fetch('https://bkvycanciimgyftdtqpx.supabase.co/rest/v1/messages', {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`,
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrdnljYW5jaWltZ3lmdGR0cXB4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxODQ5MDksImV4cCI6MjA3NDc2MDkwOX0.nYAt_sr_wTLy1PexlWV7G9fCXMSz2wsV2Ql5vNbY5zY',
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ is_read: true }),
    });
    
    // URL에 쿼리 파라미터 추가
    const url = new URL(updateResponse.url);
    url.searchParams.set('chat_id', `eq.${chatId}`);
    url.searchParams.set('sender_id', `neq.${user.id}`);
    url.searchParams.set('is_read', 'neq.true');
    url.searchParams.set('select', 'id,is_read');
    
    console.log('🔗 업데이트 URL:', url.toString());
    
    const finalResponse = await fetch(url.toString(), {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`,
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrdnljYW5jaWltZ3lmdGR0cXB4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxODQ5MDksImV4cCI6MjA3NDc2MDkwOX0.nYAt_sr_wTLy1PexlWV7G9fCXMSz2wsV2Ql5vNbY5zY',
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ is_read: true })
    });
    
    const result = await finalResponse.json();
    console.log('✅ 읽음 처리 결과:', {
      status: finalResponse.status,
      data: result,
      updatedCount: Array.isArray(result) ? result.length : 0
    });
  }
};

// 실행
testMarkAsRead();
