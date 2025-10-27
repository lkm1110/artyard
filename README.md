# ArtYard - 대학생 아트 커뮤니티

대학생 창작자를 위한 아트 커뮤니티 + 직거래 플랫폼 MVP

## 🚀 기능

### 핵심 기능
- ✅ **소셜 로그인**: Google, Naver, Kakao 지원
- ✅ **작품 업로드**: 이미지 1~5개, 재료/사이즈/연도/에디션/가격구간 필수 입력
- ✅ **피드 시스템**: 좋아요, 북마크, 댓글 기능
- ✅ **직거래 채팅**: 1:1 DM, 약속 설정, 수령확인 버튼
- ✅ **커뮤니티**: 주간 챌린지, 상호 피드백 규칙
- ✅ **신고 시스템**: 무단도용/사기 의심 신고
- ✅ **광고 슬롯**: 홈 상단, 상세 하단 배치

### 기술 스택
- **Frontend**: React Native + Expo + TypeScript
- **Backend**: Supabase (Auth/DB/Storage/Realtime)
- **상태관리**: React Query + Zustand
- **네비게이션**: React Navigation v7
- **디자인**: 자체 디자인 시스템 (Fuchsia + Cyan)

## 📱 설치 및 실행

### 1. 사전 요구사항
```bash
# Node.js 18+ 설치
# Expo CLI 설치
npm install -g expo-cli

# 의존성 설치
npm install
```

### 2. 환경 변수 설정
프로젝트 루트에 `.env` 파일을 생성하고 다음 내용을 추가:

```env
# Supabase 설정
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# OAuth 리다이렉트 설정
EXPO_PUBLIC_REDIRECT_SCHEME=artyard
EXPO_PUBLIC_OAUTH_REDIRECT_URI=artyard://auth

# Google OAuth
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-google-client-id

# Naver OAuth
EXPO_PUBLIC_NAVER_CLIENT_ID=your-naver-client-id
EXPO_PUBLIC_NAVER_CLIENT_SECRET=your-naver-client-secret
EXPO_PUBLIC_NAVER_AUTH_URL=https://nid.naver.com/oauth2.0/authorize
EXPO_PUBLIC_NAVER_TOKEN_URL=https://nid.naver.com/oauth2.0/token

# Kakao OAuth
EXPO_PUBLIC_KAKAO_CLIENT_ID=your-kakao-client-id
EXPO_PUBLIC_KAKAO_AUTH_URL=https://kauth.kakao.com/oauth/authorize
EXPO_PUBLIC_KAKAO_TOKEN_URL=https://kauth.kakao.com/oauth/token
```

### 3. Supabase 데이터베이스 스키마

다음 테이블들을 Supabase에서 생성해주세요:

```sql
-- 프로필
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  handle TEXT UNIQUE NOT NULL,
  school TEXT,
  department TEXT,
  bio TEXT,
  avatar_url TEXT,
  is_verified_school BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 작품
CREATE TABLE artworks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID REFERENCES profiles(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  material TEXT NOT NULL,
  size TEXT NOT NULL,
  year INTEGER NOT NULL,
  edition TEXT NOT NULL,
  price_band TEXT NOT NULL,
  images TEXT[] NOT NULL,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  is_hidden BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 좋아요
CREATE TABLE likes (
  user_id UUID REFERENCES profiles(id),
  artwork_id UUID REFERENCES artworks(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, artwork_id)
);

-- 댓글
CREATE TABLE comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  artwork_id UUID REFERENCES artworks(id) NOT NULL,
  author_id UUID REFERENCES profiles(id) NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 북마크
CREATE TABLE bookmarks (
  user_id UUID REFERENCES profiles(id),
  artwork_id UUID REFERENCES artworks(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, artwork_id)
);

-- 채팅방
CREATE TABLE chats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  a UUID REFERENCES profiles(id) NOT NULL,
  b UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(a, b)
);

-- 메시지
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id UUID REFERENCES chats(id) NOT NULL,
  sender_id UUID REFERENCES profiles(id) NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 챌린지
CREATE TABLE challenges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  topic TEXT NOT NULL,
  deadline TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 챌린지 참여
CREATE TABLE challenge_entries (
  challenge_id UUID REFERENCES challenges(id),
  artwork_id UUID REFERENCES artworks(id),
  author_id UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (challenge_id, artwork_id)
);

-- 신고
CREATE TABLE reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  target_type TEXT NOT NULL CHECK (target_type IN ('artwork', 'comment', 'user')),
  target_id UUID NOT NULL,
  reporter_id UUID REFERENCES profiles(id) NOT NULL,
  reason TEXT NOT NULL,
  handled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 광고 슬롯
CREATE TABLE ad_slots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  position TEXT NOT NULL CHECK (position IN ('home_top', 'detail_bottom')),
  image_url TEXT NOT NULL,
  link_url TEXT NOT NULL,
  active BOOLEAN DEFAULT TRUE
);
```

### 4. OAuth 설정

#### Google OAuth
1. [Google Cloud Console](https://console.cloud.google.com/)에서 프로젝트 생성
2. OAuth 2.0 클라이언트 ID 생성
3. 리다이렉트 URI에 `artyard://auth` 추가

#### Naver OAuth
1. [네이버 개발자 센터](https://developers.naver.com/)에서 앱 등록
2. 서비스 URL 설정
3. 리다이렉트 URI에 `artyard://auth` 추가

#### Kakao OAuth
1. [카카오 개발자](https://developers.kakao.com/)에서 앱 생성
2. 플랫폼 설정에서 리다이렉트 URI 추가: `artyard://auth`

### 5. 앱 실행

```bash
# 개발 서버 시작
npm start

# iOS에서 실행 (macOS만 가능)
npm run ios

# Android에서 실행
npm run android

# 웹에서 실행
npm run web
```

## 🎨 디자인 시스템

### 컬러 팔레트
- **Primary**: Fuchsia (#EC4899)
- **Primary 600**: #DB2777
- **Accent**: Cyan (#06B6D4)
- **Success**: #10B981
- **Warning**: #F59E0B
- **Danger**: #EF4444

### 다크모드
- **Background**: #0B1220
- **Card**: #111827
- **Text**: #E5E7EB

## 📝 개발 진행 상황

### 완료
- ✅ 프로젝트 초기 설정
- ✅ 디자인 시스템 구축
- ✅ 네비게이션 구조
- ✅ 인증 상태 관리
- ✅ 기본 화면들 (로그인, 홈, 프로필)

### 진행 중
- 🔄 소셜 로그인 완전 구현
- 🔄 작품 업로드 기능
- 🔄 피드 시스템

### 예정
- 📋 댓글 시스템
- 📋 1:1 채팅
- 📋 커뮤니티 챌린지
- 📋 신고 시스템

## 🤝 기여하기

1. 프로젝트를 fork 합니다
2. 새로운 브랜치를 생성합니다 (`git checkout -b feature/amazing-feature`)
3. 변경사항을 커밋합니다 (`git commit -m 'Add some amazing feature'`)
4. 브랜치에 push 합니다 (`git push origin feature/amazing-feature`)
5. Pull Request를 생성합니다

## 📄 라이센스

Copyright (c) 2025 ArtYard Team. All rights reserved.

이 프로젝트는 ArtYard의 소유이며, 무단 복제, 배포, 수정을 금지합니다.

## 📞 문의

프로젝트에 대한 문의사항이 있으시면 이슈를 생성해주세요.

