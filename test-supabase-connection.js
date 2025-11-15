/**
 * Supabase 연결 테스트
 * 터미널에서 실행: node test-supabase-connection.js
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://bkvycanciimgyftdtqpx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrdnljYW5jaWltZ3lmdGR0cXB4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxODQ5MDksImV4cCI6MjA3NDc2MDkwOX0.nYAt_sr_wTLy1PexlWV7G9fCXMSz2wsV2Ql5vNbY5zY';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  console.log('🔍 Supabase 연결 테스트 시작...');
  console.log('📍 URL:', supabaseUrl);
  
  const startTime = Date.now();
  
  try {
    // 프로필 조회 테스트
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', '8f0b4fa9-fd7f-4e93-8595-4fae8d5970dd')
      .single();
    
    const duration = Date.now() - startTime;
    
    if (error) {
      console.error('❌ 에러:', error);
    } else {
      console.log('✅ 성공! 소요 시간:', duration, 'ms');
      console.log('📊 데이터:', data);
    }
  } catch (err) {
    const duration = Date.now() - startTime;
    console.error('❌ 예외 발생 (', duration, 'ms):', err.message);
  }
}

testConnection();

