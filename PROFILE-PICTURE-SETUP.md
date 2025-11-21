# 프로필 사진 기능 - 설정 가이드

## 기능 개요

사용자가 프로필 사진을 업로드하고 변경할 수 있는 기능입니다.

## 구현 내용

### 1. 기능
- ✅ 프로필 사진 업로드 (이미지 선택)
- ✅ 이미지 크롭 (1:1 비율)
- ✅ 자동 압축 (최대 800KB)
- ✅ 실시간 미리보기
- ✅ 업로드 중 로딩 표시
- ✅ 즉시 반영 (DB 업데이트)

### 2. 사용 위치
- **Settings → Edit Profile** 
- 프로필 사진 영역의 카메라 아이콘 클릭

### 3. 저장 위치
- **Supabase Storage**: `artworks` 버킷
- **경로**: `{user_id}/avatar_{timestamp}_{random}.jpg`
- **Database**: `profiles.avatar_url` 컬럼

## 데이터베이스 설정

### Supabase SQL Editor에서 실행

1. [Supabase Dashboard](https://supabase.com/dashboard) 접속
2. 프로젝트 선택 (`bkvycanciimgyftdtqpx`)
3. 왼쪽 메뉴에서 **SQL Editor** 클릭
4. **New Query** 버튼 클릭
5. 아래 SQL 복사 & 붙여넣기 & **Run** 버튼 클릭

```sql
-- Add avatar_url column to profiles table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'avatar_url'
    ) THEN
        ALTER TABLE profiles 
        ADD COLUMN avatar_url TEXT;
        
        RAISE NOTICE '✅ avatar_url column added to profiles table';
    ELSE
        RAISE NOTICE 'ℹ️ avatar_url column already exists';
    END IF;
END $$;

-- Add comment
COMMENT ON COLUMN profiles.avatar_url IS 'URL of user profile picture stored in Supabase Storage';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_avatar_url 
ON profiles (avatar_url) 
WHERE avatar_url IS NOT NULL;
```

### 확인

```sql
-- 컬럼 확인
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name = 'avatar_url';

-- 프로필 확인
SELECT 
    id,
    handle,
    avatar_url,
    created_at
FROM profiles
LIMIT 5;
```

## Storage 설정 (이미 있으면 스킵)

### 1. Storage Bucket 확인

1. Supabase Dashboard → **Storage** 메뉴
2. `artworks` 버킷이 있는지 확인
3. 없으면 생성:
   - **Create Bucket** 클릭
   - Name: `artworks`
   - Public: ✅ (체크)
   - **Create bucket** 클릭

### 2. Storage Policy 설정

```sql
-- 사용자가 자신의 폴더에 업로드 가능
CREATE POLICY "Users can upload to own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'artworks' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 모든 사용자가 읽기 가능 (프로필 사진 표시용)
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'artworks');

-- 사용자가 자신의 파일 삭제 가능
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'artworks' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

## 사용 방법

### 1. 프로필 사진 변경

1. 앱 실행
2. **Profile** 탭 이동
3. **Settings** 버튼 클릭
4. **Edit Profile** 클릭
5. 프로필 사진 영역의 **📷 카메라 아이콘** 클릭
6. 이미지 선택 (갤러리에서)
7. 이미지 크롭 (1:1 비율)
8. 자동 업로드 및 저장 ✅

### 2. 프로필 사진 표시

- Profile 화면
- Edit Profile 화면
- Artwork Card (작품 목록)
- Chat 화면
- 댓글 영역

## 기술 스택

### Frontend
- **expo-image-picker**: 이미지 선택 및 크롭
- **React Native Image**: 이미지 표시
- **imageUploadService**: 업로드 로직

### Backend
- **Supabase Storage**: 이미지 파일 저장
- **Supabase Database**: URL 저장

### 이미지 처리
- **자동 크롭**: 1:1 비율
- **품질 조정**: 0.8 (80%)
- **파일명**: `{user_id}/avatar_{timestamp}_{random}.jpg`

## 권한

### iOS
- **Photo Library**: 갤러리 접근 권한 필요
- 권한 요청 자동 처리
- 거부 시 안내 메시지 표시

### Android
- **Read External Storage**: 갤러리 접근
- 권한 요청 자동 처리

## 파일 크기 제한

- **최대 크기**: 5MB (Supabase 기본값)
- **권장 크기**: 500KB 이하
- **자동 압축**: 품질 0.8 적용

## 지원 형식

- ✅ JPG/JPEG
- ✅ PNG
- ✅ WebP (일부 플랫폼)
- ❌ GIF (정지 이미지만)
- ❌ SVG

## 폴백 이미지

프로필 사진이 없을 경우:
- **Placeholder**: 사용자 닉네임 첫 글자
- **배경색**: Primary Color (`#EC4899`)
- **텍스트**: 흰색, 대문자

예시: `@john` → `J`

## 트러블슈팅

### 오류: "Permission Required"
**원인**: 갤러리 접근 권한 거부  
**해결**: 
1. iOS: Settings → Artyard → Photos → "All Photos" 선택
2. Android: Settings → Apps → Artyard → Permissions → Storage → Allow

### 오류: "Upload Failed"
**원인**: 네트워크 문제 또는 Storage Policy 오류  
**해결**:
1. 인터넷 연결 확인
2. Storage Policy 재확인
3. Supabase Dashboard에서 `artworks` 버킷 Public 설정 확인

### 이미지가 표시되지 않음
**원인**: URL이 잘못되었거나 Storage 접근 불가  
**해결**:
1. Supabase Storage에서 파일 존재 확인
2. Public 접근 설정 확인
3. URL 형식 확인: `https://[project].supabase.co/storage/v1/object/public/artworks/...`

### 업로드는 되지만 프로필에 반영 안 됨
**원인**: `profiles.avatar_url` 업데이트 실패  
**해결**:
```sql
-- 수동으로 업데이트
UPDATE profiles
SET avatar_url = 'YOUR_IMAGE_URL'
WHERE id = 'YOUR_USER_ID';
```

## 성능 최적화

### 1. 이미지 캐싱
- React Native Image 자동 캐싱
- 재방문 시 빠른 로딩

### 2. 압축
- 자동 품질 조정 (0.8)
- 파일 크기 최소화

### 3. CDN
- Supabase Storage CDN 활용
- 전 세계 빠른 접근

## 보안

### 1. 접근 제어
- 자신의 폴더만 업로드 가능
- RLS (Row Level Security) 적용

### 2. 파일 검증
- 이미지 파일만 허용
- 파일 크기 제한

### 3. URL 보안
- Public URL 사용
- JWT 토큰 필요 없음 (Public 버킷)

## 완료!

프로필 사진 기능이 모두 설정되었습니다! 🎉

### 체크리스트
- ✅ `profiles.avatar_url` 컬럼 추가
- ✅ Storage `artworks` 버킷 확인
- ✅ Storage Policy 설정
- ✅ 앱에서 이미지 업로드 테스트
- ✅ 프로필 화면에서 이미지 표시 확인

