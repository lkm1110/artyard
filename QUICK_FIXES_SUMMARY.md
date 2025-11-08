# 🔧 빠른 수정 요약

## ✅ **완료된 수정 (1-7)**

### 1-2. ✅ Artist Dashboard UI & 데이터
- **views_count → likes/comments로 변경** (컬럼 없음 에러 해결)
- **2x2 그리드 레이아웃**: ❤️ LIKES | 🛒 SALES | 💰 REVENUE | 👥 FOLLOWERS
- **Trends 설명 추가**: "Daily likes over the last 7 days"
- **Top 5 설명 추가**: "Ranked by likes + comments engagement"
- **Empty state 추가**: 작품 없을 때 안내 메시지

### 3. ✅ 팝업 둥글게 디자인
- `CustomAlert` borderRadius: 20
- 버튼 borderRadius: 12
- 그림자 효과 강화

### 5. ✅ Chat Option 취소 버튼
- 이미 존재 (Report User 팝업의 'Cancel' 버튼)

### 6. ✅ Leave Chat → Delete Chat
- "Leave Chat" → "Delete Chat"로 변경
- 채팅 메시지 + 채팅방 완전 삭제
- 확인 팝업: "This action cannot be undone"
- 성공 시 채팅 목록으로 복귀

### 7. ✅ 채팅 수정 후 갱신
- 이미 구현됨 (`handleEditMessage`에서 `queryClient.invalidateQueries`)

---

## ⏳ **수동 수정 필요 (8-11)**

### 8. Edition 필드 단순화

**파일**: `src/screens/ArtworkUploadScreen.tsx`

**현재 상태**: Edition 필드가 텍스트 입력

**제안 변경**:
```typescript
// 옵션 1: 라디오 버튼
<View style={styles.editionContainer}>
  <Text style={styles.label}>Edition Type *</Text>
  <View style={styles.radioGroup}>
    <TouchableOpacity onPress={() => updateField('edition', 'Original')}>
      <Text>⭕ Original</Text>
    </TouchableOpacity>
    <TouchableOpacity onPress={() => updateField('edition', 'Copy')}>
      <Text>⭕ Copy (Limited Edition)</Text>
    </TouchableOpacity>
  </View>
  {formData.edition === 'Copy' && (
    <TextInput
      placeholder="Number (e.g., 1/300)"
      value={formData.editionNumber}
      onChangeText={(val) => updateField('editionNumber', val)}
    />
  )}
</View>
```

**또는 간단하게**:
```typescript
// 옵션 2: Picker (드롭다운)
<Picker
  selectedValue={formData.edition}
  onValueChange={(value) => updateField('edition', value)}
>
  <Picker.Item label="Original" value="original" />
  <Picker.Item label="Limited Edition (e.g., 1/100)" value="limited" />
  <Picker.Item label="Open Edition" value="open" />
  <Picker.Item label="Copy/Replica" value="copy" />
</Picker>
```

---

### 9. Price MAX 1억 달러

**파일**: `src/screens/ArtworkUploadScreen.tsx`

**현재 제한**: 확인 필요

**수정 필요**:
```typescript
// validateForm 함수에서
const priceNum = parseFloat(formData.price);
if (priceNum <= 0) {
  newErrors.price = 'Price must be greater than 0';
} else if (priceNum > 100000000) { // 1억
  newErrors.price = 'Price cannot exceed $100,000,000';
}
```

---

### 10. 북마크/좋아요 최적화

**문제**: 반응 느림

**원인**: 
1. API 호출 후 데이터 새로고침 대기
2. Optimistic update 없음

**해결책**:
```typescript
// src/hooks/useArtworks.ts
export const useToggleArtworkLike = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: toggleArtworkLike,
    
    // ✅ Optimistic update
    onMutate: async (artworkId) => {
      await queryClient.cancelQueries({ queryKey: ['artworks'] });
      
      const previousData = queryClient.getQueryData(['artworks']);
      
      queryClient.setQueryData(['artworks'], (old: any) => {
        return old.map((artwork: any) => 
          artwork.id === artworkId 
            ? { ...artwork, is_liked: !artwork.is_liked, likes_count: artwork.likes_count + (artwork.is_liked ? -1 : 1) }
            : artwork
        );
      });
      
      return { previousData };
    },
    
    onError: (err, artworkId, context) => {
      queryClient.setQueryData(['artworks'], context.previousData);
    },
    
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['artworks'] });
    },
  });
};
```

---

### 11. 공유 딥링크

**문제**: `https://artyard.app/artwork/123` 링크가 앱으로 안 열림

**해결책**: Universal Links (iOS) + App Links (Android)

**1단계: app.json 설정**
```json
{
  "expo": {
    "scheme": "artyard",
    "ios": {
      "associatedDomains": ["applinks:artyard.app"]
    },
    "android": {
      "intentFilters": [
        {
          "action": "VIEW",
          "autoVerify": true,
          "data": [
            {
              "scheme": "https",
              "host": "artyard.app",
              "pathPrefix": "/artwork"
            }
          ],
          "category": ["BROWSABLE", "DEFAULT"]
        }
      ]
    }
  }
}
```

**2단계: 웹사이트에 파일 추가**
```
https://artyard.app/.well-known/apple-app-site-association
https://artyard.app/.well-known/assetlinks.json
```

**3단계: 앱에서 딥링크 처리**
```typescript
// App.tsx
import * as Linking from 'expo-linking';

useEffect(() => {
  const handleDeepLink = (event: { url: string }) => {
    const { path, queryParams } = Linking.parse(event.url);
    
    if (path === 'artwork') {
      const artworkId = queryParams?.id || path.split('/')[1];
      navigation.navigate('ArtworkDetail', { artworkId });
    }
  };
  
  Linking.addEventListener('url', handleDeepLink);
  
  Linking.getInitialURL().then((url) => {
    if (url) {
      handleDeepLink({ url });
    }
  });
}, []);
```

**4단계: 공유 메시지 업데이트**
```typescript
// src/components/ArtworkFeed.tsx
const artworkUrl = `artyard://artwork/${artwork.id}`; // 앱 스킴
// 또는
const artworkUrl = `https://artyard.app/artwork/${artwork.id}`; // Universal Link
```

**참고**: artyard.app 도메인이 없다면:
- 임시로 앱 스킴만 사용: `artyard://artwork/123`
- 또는 Firebase Dynamic Links 사용
- 또는 GitHub Pages 활용: `https://lkm1110.github.io/artyard/artwork/123`

---

## 4. Report 어드민 화면

**TODO**: Admin Dashboard에 Reports 탭 추가

**파일**: `src/screens/admin/AdminDashboardScreen.tsx`

**추가 필요**:
```typescript
// 1. Reports 조회
const [reports, setReports] = useState([]);

const loadReports = async () => {
  const { data } = await supabase
    .from('reports')
    .select(`
      *,
      reporter:profiles!reports_reporter_id_fkey(handle),
      reported:profiles!reports_reported_id_fkey(handle)
    `)
    .order('created_at', { ascending: false });
  
  setReports(data || []);
};

// 2. UI에 Reports 섹션 추가
<View style={styles.section}>
  <Text style={styles.sectionTitle}>User Reports ({reports.length})</Text>
  {reports.map(report => (
    <View key={report.id} style={styles.reportCard}>
      <Text>{report.reporter.handle} reported {report.reported.handle}</Text>
      <Text>Reason: {report.reason}</Text>
      <Text>Context: {report.context}</Text>
      <Text>Status: {report.status}</Text>
      <Button title="Review" onPress={() => {/* 처리 로직 */}} />
    </View>
  ))}
</View>
```

---

## 🚀 **다음 단계**

1. ✅ SQL 실행: `database/fix-reports-table.sql`
2. ✅ 앱 재시작 및 Dashboard 테스트
3. ⏳ Edition 필드 수정 (수동)
4. ⏳ Price MAX 1억 설정 (수동)
5. ⏳ 북마크/좋아요 Optimistic Update (수동)
6. ⏳ 딥링크 설정 (도메인 필요)
7. ⏳ Admin Reports 화면 추가 (수동)

---

## 📝 **우선순위**

### HIGH
- ✅ Dashboard 데이터 에러 수정
- ✅ Delete Chat 기능
- ⏳ Edition 단순화
- ⏳ Price MAX

### MEDIUM
- ⏳ 북마크/좋아요 최적화
- ⏳ Admin Reports

### LOW
- ⏳ 딥링크 (도메인 없으면 나중에)

---

**현재 완료율**: 7/11 (64%)

**즉시 테스트 가능**: Dashboard, Chat Delete, 팝업 디자인

