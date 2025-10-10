/**
 * Supabase 연결 테스트 스크립트
 * 터미널에서 'node test-supabase.js' 실행
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 환경변수가 설정되지 않았습니다.');
  console.log('📝 .env 파일에 다음을 추가하세요:');
  console.log('EXPO_PUBLIC_SUPABASE_URL=your-project-url');
  console.log('EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    console.log('🔍 Supabase 연결 테스트 중...');
    
    // 데이터베이스 연결 테스트
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ 데이터베이스 연결 실패:', error.message);
    } else {
      console.log('✅ Supabase 연결 성공!');
      console.log('📊 프로필 테이블 확인:', data.length, '개 레코드');
    }

    // 인증 상태 확인
    const { data: { session } } = await supabase.auth.getSession();
    console.log('🔐 현재 인증 상태:', session ? '로그인됨' : '로그아웃됨');

  } catch (err) {
    console.error('❌ 연결 테스트 실패:', err.message);
  }
}

testConnection();
