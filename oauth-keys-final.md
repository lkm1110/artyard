# OAuth 키값 최종 정리

## 🔑 확인된 키값들

### Facebook
- **App ID**: 822804507070963
- **App Secret**: c41a0c7b898b7de587db31ea76517853

### Apple
- **Team ID**: 9T69A85KY2
- **Key ID**: 482NBGZKV9
- **App ID (Client ID)**: com.artyard.app
- **Private Key**: 
```
-----BEGIN PRIVATE KEY-----
MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQgEd/TPoB4MPQ3Z2pW
msdh37ibz7+NJ9UDSgyTw0sPs/6gCgYIKoZIzj0DAQehRANCAARlqehQ07VTxrAh
zJx7BHbFRDF72OujpwdpInWDHr2jKImaZ51UIHgDO3hgoNiTmUggk4GMD05MS1zm
hFDU2sbq
-----END PRIVATE KEY-----
```

### Supabase
- **Project ID**: bkvycanciimgyftdtqpx
- **Callback URL**: https://bkvycanciimgyftdtqpx.supabase.co/auth/v1/callback

## 📱 Supabase 설정

### Apple OAuth
```
Enable: ON
Client IDs: com.artyard.app
Secret Key: [위의 Private Key 전체]
```

### Facebook OAuth
```
Enable: ON
App ID: 822804507070963
App Secret: c41a0c7b898b7de587db31ea76517853
```

## 🔧 Apple Developer Console 설정

### Service ID Configure
```
Domains: bkvycanciimgyftdtqpx.supabase.co
Return URLs: https://bkvycanciimgyftdtqpx.supabase.co/auth/v1/callback
```

## 🚀 테스트 방법

1. Supabase 설정 완료
2. Apple Service ID 재설정
3. 웹에서 Apple/Facebook 로그인 테스트
4. 모바일에서 테스트

## ⚠️ 주의사항

- Apple Secret Key는 6개월마다 갱신 필요
- Private Key는 -----BEGIN/END----- 포함해서 전체 입력
- Client ID는 App ID (com.artyard.app) 사용
