# ArtYard 데모 설정 가이드

## 🚀 빠른 시작

### 1. 환경 변수 설정 (필수)

`.env` 파일을 프로젝트 루트에 생성하고 다음 내용을 추가하세요:

```env
# Supabase 설정 (실제 값으로 교체 필요)
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# OAuth 리다이렉트 설정
EXPO_PUBLIC_REDIRECT_SCHEME=artyard
EXPO_PUBLIC_OAUTH_REDIRECT_URI=artyard://auth

# Google OAuth (선택사항)
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-google-client-id

# Naver OAuth (선택사항)
EXPO_PUBLIC_NAVER_CLIENT_ID=your-naver-client-id
EXPO_PUBLIC_NAVER_CLIENT_SECRET=your-naver-client-secret

# Kakao OAuth (선택사항)
EXPO_PUBLIC_KAKAO_CLIENT_ID=your-kakao-client-id
```

### 2. Supabase 프로젝트 설정

1. [Supabase](https://supabase.com)에서 새 프로젝트 생성
2. `supabase-functions.sql` 파일의 내용을 Supabase SQL Editor에서 실행
3. 환경변수의 URL과 anon key를 실제 값으로 교체

### 3. 앱 실행

```bash
# 패키지 설치
npm install

# 웹에서 실행 (가장 간단)
npm run web

# iOS 시뮬레이터에서 실행 (macOS만 가능)
npm run ios

# Android 에뮬레이터에서 실행
npm run android
```

## 📱 현재 구현된 기능

### ✅ 완료된 기능

1. **프로젝트 기본 구조**
   - React Native + Expo + TypeScript
   - 디자인 시스템 (Fuchsia + Cyan)
   - 다크모드 지원
   - 네비게이션 구조 (탭 + 스택)

2. **인증 시스템**
   - Supabase Auth 통합
   - Google 소셜 로그인 (준비완료)
   - Naver/Kakao 로그인 (PKCE 방식)
   - 자동 프로필 생성

3. **작품 피드**
   - 작품 목록 조회 (React Query)
   - 작품 카드 컴포넌트
   - 좋아요/북마크 기능
   - 무한 스크롤 준비

4. **UI 컴포넌트**
   - 재사용 가능한 Button, Screen, LoadingSpinner
   - EmptyState, ArtworkCard
   - 접근성 고려 (최소 터치 영역 44dp)

### 🔄 부분 구현

1. **작품 업로드**: 서비스 로직 완료, UI 미완성
2. **프로필 관리**: 기본 화면 완료, 편집 기능 필요
3. **소셜 로그인**: OAuth 준비 완료, Supabase 연동 필요

### 📋 미구현 기능

1. **댓글 시스템**
2. **1:1 채팅**
3. **커뮤니티 챌린지**
4. **신고 시스템**
5. **실제 이미지 업로드**
6. **푸시 알림**

## 🧪 테스트 방법

### 데모 데이터 없이 테스트
1. 앱 실행 후 로그인 화면 확인
2. 소셜 로그인 버튼 동작 확인 (OAuth 설정 필요)
3. 빈 피드 상태 확인
4. 다크모드 토글 테스트

### Supabase 연결 후 테스트
1. 실제 로그인 플로우
2. 프로필 정보 표시
3. 작품 업로드 (구현 완료시)
4. 좋아요/북마크 기능

## 🚨 알려진 이슈

1. **OAuth 리다이렉트**: 실제 앱에서만 동작 (웹 테스트 제한)
2. **이미지 업로드**: UI 미완성
3. **에러 처리**: 토스트 알림 미구현
4. **오프라인 지원**: 미구현

## 🔧 개발자 설정

### ESLint & Prettier (선택사항)
```bash
npm install --save-dev eslint prettier @typescript-eslint/parser @typescript-eslint/eslint-plugin
```

### React Query DevTools
개발 중 디버깅을 위해 이미 설치되어 있습니다. 웹에서 실행시 하단에 표시됩니다.

## 📞 지원

이슈가 있으시면:
1. 콘솔 로그 확인
2. 네트워크 연결 상태 확인  
3. 환경변수 설정 재확인
4. GitHub Issues에 문의

---

**주의**: 이것은 MVP 버전입니다. 프로덕션 사용 전 보안 검토와 테스트가 필요합니다.

