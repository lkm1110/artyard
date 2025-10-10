/**
 * Apple JWT 토큰 생성기
 * npm install jsonwebtoken 필요
 */

const jwt = require('jsonwebtoken');

// Apple 정보
const teamId = '9T69A85KY2';
const keyId = '482NBGZKV9';
const clientId = 'com.artyard.app';

// P8 Private Key
const privateKey = `-----BEGIN PRIVATE KEY-----
MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQgEd/TPoB4MPQ3Z2pW
msdh37ibz7+NJ9UDSgyTw0sPs/6gCgYIKoZIzj0DAQehRANCAARlqehQ07VTxrAh
zJx7BHbFRDF72OujpwdpInWDHr2jKImaZ51UIHgDO3hgoNiTmUggk4GMD05MS1zm
hFDU2sbq
-----END PRIVATE KEY-----`;

// JWT 페이로드
const payload = {
  iss: teamId,
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + (6 * 30 * 24 * 60 * 60), // 6개월
  aud: 'https://appleid.apple.com',
  sub: clientId
};

// JWT 헤더
const header = {
  alg: 'ES256',
  kid: keyId
};

try {
  // JWT 토큰 생성
  const token = jwt.sign(payload, privateKey, { 
    algorithm: 'ES256',
    header: header
  });
  
  console.log('🍎 Apple JWT 토큰:');
  console.log(token);
  console.log('\n✅ 이 토큰을 Supabase Secret Key에 입력하세요!');
  
} catch (error) {
  console.error('❌ JWT 생성 오류:', error);
}
