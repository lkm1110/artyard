# 📸 이미지 업로드 제한 설치 가이드

## ✅ 구현 완료

**파일**: `src/utils/imageValidator.ts`

**제한 사항**:
- ✅ 최대 크기: 20MB
- ✅ 최대 해상도: 4096 x 4096
- ✅ 최소 해상도: 600 x 600
- ✅ 허용 형식: JPEG, PNG, WebP
- ✅ 자동 압축: 5MB 이상 → 목표 3MB

---

## 🔧 ArtworkUploadScreen.tsx 수정

### 기존 pickImages 함수 교체

```typescript
// src/screens/ArtworkUploadScreen.tsx

// pickImages 함수 찾기
const pickImages = async () => {
  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 1.0, // ← 원본 품질로 변경 (압축은 검증 단계에서)
      selectionLimit: 5,
    });

    if (!result.canceled && result.assets) {
      const imageUris = result.assets.map((asset) => asset.uri);
      
      // ✅ 이미지 검증 및 압축 추가
      const { validateAndCompressImages } = await import('../utils/imageValidator');
      
      setIsUploading(true);
      
      const validation = await validateAndCompressImages(
        imageUris,
        (current, total) => {
          // 진행 상황 로깅
          console.log(`Processing ${current}/${total} images...`);
        }
      );
      
      setIsUploading(false);
      
      // 검증 실패 시
      if (!validation.valid) {
        Alert.alert(
          'Image Validation Failed',
          validation.errors.join('\n'),
          [{ text: 'OK' }]
        );
        return;
      }
      
      // 압축 통계 표시 (선택)
      if (validation.stats.compressedCount > 0) {
        const savedMB = (
          (validation.stats.totalOriginalSize - validation.stats.totalFinalSize) /
          (1024 * 1024)
        ).toFixed(1);
        
        console.log(
          `✅ ${validation.stats.compressedCount} images compressed, saved ${savedMB}MB`
        );
        
        // 사용자에게 알림 (선택)
        Alert.alert(
          '이미지 최적화 완료',
          `${validation.stats.compressedCount}개 이미지가 자동 압축되었습니다. (${savedMB}MB 절약)`,
          [{ text: 'OK' }]
        );
      }
      
      // 검증된 이미지 추가
      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, ...validation.uris].slice(0, 5),
      }));
    }
  } catch (error) {
    console.error('이미지 선택 오류:', error);
    setIsUploading(false);
    Alert.alert('오류', '이미지를 선택할 수 없습니다.');
  }
};
```

---

## 🎯 작동 방식

### 1. 사용자가 이미지 선택
```
사용자: 5개 이미지 선택 (각 15MB)
```

### 2. 자동 검증
```
✅ 크기 체크: 15MB < 20MB → OK
✅ 해상도 체크: 3000x2000 < 4096x4096 → OK
✅ 형식 체크: JPEG → OK
```

### 3. 자동 압축 (5MB 이상)
```
🗜️ 압축 중...
15MB → 2.8MB (품질: 0.5)
10MB → 2.9MB (품질: 0.7)
3MB → 3MB (압축 안 함)
```

### 4. 결과
```
✅ 5개 이미지 처리 완료
📉 총 60MB → 14MB (46MB 절약)
```

---

## 📊 압축 전략

| 원본 크기 | 압축 여부 | 목표 크기 | 품질 |
|----------|-----------|----------|------|
| < 5MB | 압축 안 함 | 원본 유지 | 1.0 |
| 5-10MB | 압축 | ~3MB | 0.6-0.7 |
| 10-20MB | 압축 | ~3MB | 0.3-0.5 |
| > 20MB | **거부** | - | - |

---

## 🔧 설정 변경

### 제한 값 조정

```typescript
// src/utils/imageValidator.ts

export const IMAGE_CONSTRAINTS: ImageConstraints = {
  maxSizeBytes: 20 * 1024 * 1024, // ← 20MB로 설정됨
  maxWidth: 4096,
  maxHeight: 4096,
  minWidth: 600,
  minHeight: 600,
  allowedFormats: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  autoCompressThreshold: 5 * 1024 * 1024, // 5MB 이상 압축
  targetCompressSize: 3 * 1024 * 1024, // 목표: 3MB
};
```

### 더 높은 품질 원하면

```typescript
// targetCompressSize를 높임
targetCompressSize: 5 * 1024 * 1024, // 목표: 5MB
```

### 더 공격적 압축 원하면

```typescript
// autoCompressThreshold를 낮춤
autoCompressThreshold: 2 * 1024 * 1024, // 2MB 이상 압축
targetCompressSize: 1.5 * 1024 * 1024, // 목표: 1.5MB
```

---

## 🚨 에러 메시지

### 크기 초과
```
❌ "Image too large (25.3MB). Maximum: 20MB"
→ 사용자에게 더 작은 이미지 사용 요청
```

### 해상도 초과
```
❌ "Resolution too high (5000x5000). Maximum: 4096x4096"
→ 자동으로 리사이즈하거나 거부
```

### 해상도 미달
```
❌ "Resolution too low (400x300). Minimum: 600x600"
→ 작품 사진으로 부적합
```

### 형식 오류
```
❌ "Invalid format. Allowed: JPEG, PNG, WebP"
→ GIF, BMP 등은 거부
```

---

## 💰 비용 절감 효과

### Before (제한 없음)
```
100명 사용자
× 평균 10개 작품
× 평균 5개 이미지
× 평균 15MB
= 75GB 스토리지
```

**Supabase 비용**: $25/월

### After (20MB + 압축)
```
100명 사용자
× 평균 10개 작품
× 평균 5개 이미지
× 평균 3MB (압축)
= 15GB 스토리지
```

**Supabase 비용**: $5/월

**절감**: $20/월 = $240/년 🎉

---

## 🎯 사용자 경험

### 압축 알림 (선택)
```typescript
// 압축되었음을 알림 (투명하게)
Alert.alert(
  '이미지 최적화 완료',
  `${count}개 이미지가 고품질로 최적화되었습니다.`,
  [{ text: 'OK' }]
);
```

### 조용한 압축 (추천)
```typescript
// 알림 없이 자동 압축 (로그만)
console.log(`✅ ${count} images optimized`);
```

---

## ✅ 체크리스트

```yaml
□ src/utils/imageValidator.ts 생성 완료
□ ArtworkUploadScreen.tsx의 pickImages 수정
□ 테스트:
  □ 20MB 이상 이미지 → 거부 확인
  □ 5MB 이상 이미지 → 자동 압축 확인
  □ 저해상도 이미지 → 거부 확인
  □ 형식 오류 → 거부 확인
```

---

**완료! 이제 스토리지 비용 걱정 없이 고품질 이미지를 받을 수 있습니다!** 🎉

