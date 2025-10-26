# 🛡️ ArtYard 어드민 시스템 가이드

## 📋 목차
1. [어드민 시스템이 필요한 이유](#why)
2. [구현 방법 (3가지)](#implementation)
3. [필수 기능 목록](#features)
4. [DB 스키마](#database)
5. [빠른 시작 가이드](#quickstart)
6. [프로덕션 구현 예시](#production)

---

## 🎯 <a name="why"></a>어드민 시스템이 필요한 이유

### 플랫폼 운영을 위해 **반드시 필요**합니다!

```yaml
주요 관리 업무:
━━━━━━━━━━━━━━━━━━━━━━━━━
❌ 신고된 작품 검토 및 조치
❌ 부적절한 콘텐츠 삭제
❌ 악의적인 사용자 정지/차단
❌ 주문 분쟁 처리
❌ 환불 승인
❌ 플랫폼 통계 확인
❌ 수수료 정산 관리
❌ 사용자 문의 응대
━━━━━━━━━━━━━━━━━━━━━━━━━

법적 의무:
━━━━━━━━━━━━━━━━━━━━━━━━━
✅ 앱스토어 심사 (콘텐츠 관리 필수)
✅ 저작권 침해 신속 대응
✅ 불법 콘텐츠 삭제 의무
✅ 개인정보 관리
━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 🛠️ <a name="implementation"></a>구현 방법 (3가지)

### **방법 1: Supabase 대시보드 활용 (가장 빠름, 초기 단계 추천)**

#### ✅ 장점:
- 별도 개발 불필요
- 즉시 사용 가능
- SQL 쿼리로 모든 데이터 조회/수정
- 무료

#### ❌ 단점:
- 개발자용 UI (비개발자는 사용 어려움)
- 커스텀 기능 추가 불가
- 팀원과 Supabase 계정 공유 필요

#### 🚀 사용법:
```yaml
1. https://supabase.com/dashboard 접속
2. 프로젝트 선택
3. Table Editor → 원하는 테이블 선택
   - artworks: 작품 관리
   - profiles: 사용자 관리
   - reports: 신고 내역
   - transactions: 주문 내역
4. 직접 수정/삭제
```

#### 신고된 작품 확인 예시:
```sql
-- Supabase SQL Editor에서 실행
SELECT 
  r.id,
  r.created_at,
  r.reason,
  r.description,
  r.status,
  a.title as artwork_title,
  reporter.handle as reporter_name,
  target_user.handle as artwork_owner
FROM reports r
LEFT JOIN artworks a ON r.target_id = a.id
LEFT JOIN profiles reporter ON r.reporter_id = reporter.id
LEFT JOIN profiles target_user ON a.author_id = target_user.id
WHERE r.target_type = 'artwork'
AND r.status = 'pending'
ORDER BY r.created_at DESC;
```

---

### **방법 2: 기존 프로젝트에 어드민 화면 추가 (중간 단계)**

#### ✅ 장점:
- 동일 프로젝트 내에서 관리
- 웹/모바일 둘 다 접근 가능
- UI 커스텀 가능

#### ❌ 단점:
- 개발 시간 필요 (약 1-2주)
- 권한 관리 필요

#### 🚀 구현 단계:

**1단계: DB에 is_admin 필드 추가**
```sql
-- admin-schema.sql 파일 실행 (이미 생성됨!)
-- Supabase SQL Editor에서 실행
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- 본인 계정을 관리자로 설정
UPDATE profiles 
SET is_admin = true 
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'your-email@example.com'
);
```

**2단계: 어드민 대시보드 화면 생성**
```typescript
// src/screens/AdminDashboardScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../services/supabase';

export const AdminDashboardScreen = () => {
  const { user } = useAuthStore();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 권한 체크
    if (!user?.is_admin) {
      navigation.navigate('Home');
      return;
    }
    loadReports();
  }, [user]);

  const loadReports = async () => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select(`
          *,
          reporter:profiles!reports_reporter_id_fkey(handle),
          artwork:artworks(title, image_urls)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error('신고 목록 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveReport = async (reportId: string, action: 'approve' | 'reject') => {
    try {
      const { error } = await supabase
        .from('reports')
        .update({
          status: action === 'approve' ? 'resolved' : 'dismissed',
          resolved_by: user.id,
          resolved_at: new Date().toISOString(),
        })
        .eq('id', reportId);

      if (error) throw error;

      // 신고 승인 시 해당 작품 삭제
      if (action === 'approve') {
        const report = reports.find(r => r.id === reportId);
        if (report?.target_type === 'artwork') {
          await supabase
            .from('artworks')
            .delete()
            .eq('id', report.target_id);
        }
      }

      loadReports();
    } catch (error) {
      console.error('신고 처리 실패:', error);
    }
  };

  if (loading) {
    return <View><Text>로딩 중...</Text></View>;
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>어드민 대시보드</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>대기 중인 신고 ({reports.length})</Text>
        {reports.map((report) => (
          <View key={report.id} style={styles.reportCard}>
            <Text style={styles.reportReason}>{report.reason}</Text>
            <Text style={styles.reportDescription}>{report.description}</Text>
            <Text style={styles.reportMeta}>
              신고자: {report.reporter?.handle} | 대상: {report.artwork?.title}
            </Text>
            
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.button, styles.approveButton]}
                onPress={() => handleResolveReport(report.id, 'approve')}
              >
                <Text style={styles.buttonText}>승인 (삭제)</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.button, styles.rejectButton]}
                onPress={() => handleResolveReport(report.id, 'reject')}
              >
                <Text style={styles.buttonText}>기각</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  section: { marginBottom: 30 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  reportCard: { 
    backgroundColor: '#f5f5f5', 
    padding: 15, 
    borderRadius: 8, 
    marginBottom: 10 
  },
  reportReason: { fontSize: 16, fontWeight: 'bold', marginBottom: 5 },
  reportDescription: { fontSize: 14, color: '#666', marginBottom: 10 },
  reportMeta: { fontSize: 12, color: '#999', marginBottom: 10 },
  actions: { flexDirection: 'row', gap: 10 },
  button: { 
    flex: 1, 
    padding: 10, 
    borderRadius: 5, 
    alignItems: 'center' 
  },
  approveButton: { backgroundColor: '#ff4444' },
  rejectButton: { backgroundColor: '#888' },
  buttonText: { color: '#fff', fontWeight: 'bold' },
});
```

**3단계: 네비게이션 추가**
```typescript
// src/navigation/RootNavigator.tsx
// is_admin인 사용자만 접근 가능한 어드민 탭 추가

{user?.is_admin && (
  <Tab.Screen
    name="Admin"
    component={AdminDashboardScreen}
    options={{ tabBarIcon: () => <Text>🛡️</Text> }}
  />
)}
```

---

### **방법 3: 별도 어드민 웹 대시보드 (프로덕션 추천)**

#### ✅ 장점:
- 완전히 분리된 어드민 시스템
- 웹 전용으로 최적화
- 고급 기능 구현 가능
- 프로페셔널한 UI

#### ❌ 단점:
- 별도 프로젝트 개발 필요 (2-4주)
- 호스팅 필요

#### 🚀 추천 스택:
```yaml
프론트엔드:
  - Next.js (React 프레임워크)
  - Tailwind CSS (스타일링)
  - React Admin (어드민 UI 라이브러리)
  - Recharts (통계 차트)

백엔드:
  - Supabase (동일 DB 사용)
  - Edge Functions (API)

호스팅:
  - Vercel (무료)
```

#### 빠른 시작:
```bash
# 새 프로젝트 생성
npx create-next-app@latest artyard-admin

# 필요한 패키지 설치
cd artyard-admin
npm install @supabase/supabase-js react-admin recharts

# Supabase 연결 (.env.local)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

---

## 📋 <a name="features"></a>필수 기능 목록

### 1. 신고 관리 (Reports Management) ⭐ 최우선

```yaml
기능:
  - 신고 목록 조회 (대기/처리중/완료)
  - 신고 내용 상세 확인
  - 신고 승인 → 콘텐츠 삭제
  - 신고 기각 → 신고자에게 알림
  - 신고 통계 (일별/주별)

DB 테이블: reports
```

### 2. 콘텐츠 관리 (Content Management)

```yaml
기능:
  - 전체 작품 목록 조회
  - 작품 검색 (제목, 작가명, 태그)
  - 작품 강제 삭제
  - 작품 숨김 처리 (임시)
  - 작품 통계 (카테고리별, 가격대별)

DB 테이블: artworks
```

### 3. 사용자 관리 (User Management)

```yaml
기능:
  - 사용자 목록 조회
  - 사용자 검색 (이메일, 닉네임)
  - 사용자 정지 (일시/영구)
  - 사용자 차단 해제
  - 신고 이력 확인

DB 테이블: profiles, user_bans
```

### 4. 주문 관리 (Order Management)

```yaml
기능:
  - 전체 주문 조회
  - 주문 상태별 필터 (결제대기/완료/배송중/분쟁)
  - 분쟁 주문 처리
  - 환불 승인/거부
  - 배송 상태 업데이트

DB 테이블: transactions, transaction_items
```

### 5. 통계 대시보드 (Analytics Dashboard)

```yaml
기능:
  - 총 매출 (일별/주별/월별)
  - 플랫폼 수수료 수익
  - 신규 가입자 수
  - 활성 사용자 수 (DAU/MAU)
  - 인기 작품 TOP 10
  - 판매량 TOP 작가

DB 테이블: transactions, profiles, artworks
```

---

## 🗄️ <a name="database"></a>DB 스키마

### 이미 생성된 파일: `admin-schema.sql`

**주요 테이블:**

```sql
1. reports (신고)
   - id, reporter_id, target_type, target_id
   - reason, description, status
   - admin_notes, resolved_by, resolved_at

2. admin_actions (관리자 액션 로그)
   - id, admin_id, action_type
   - target_type, target_id, reason
   - metadata (JSON)

3. user_bans (사용자 정지)
   - id, user_id, banned_by
   - reason, ban_type, expires_at
```

---

## 🚀 <a name="quickstart"></a>빠른 시작 가이드 (5분 완성!)

### **Step 1: DB 스키마 설치**

```bash
# Supabase 대시보드 접속
https://supabase.com/dashboard

# SQL Editor → New Query
# admin-schema.sql 파일 내용 복사 & 실행
```

### **Step 2: 본인 계정을 관리자로 설정**

```sql
-- 본인 이메일로 변경!
UPDATE profiles 
SET is_admin = true 
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'your-email@example.com'
);
```

### **Step 3: Supabase 대시보드에서 관리 시작**

```yaml
신고 확인:
  → Table Editor → reports → status = 'pending' 필터

작품 삭제:
  → Table Editor → artworks → 해당 행 삭제

사용자 정지:
  → Table Editor → user_bans → 새 행 추가
```

---

## 🎨 <a name="production"></a>프로덕션 구현 예시 (React Admin)

### 완성된 어드민 대시보드 코드 예시:

```typescript
// pages/admin/index.tsx
import { Admin, Resource, ListGuesser } from 'react-admin';
import { supabaseDataProvider } from './supabaseDataProvider';

const App = () => (
  <Admin dataProvider={supabaseDataProvider}>
    <Resource name="reports" list={ReportList} edit={ReportEdit} />
    <Resource name="artworks" list={ArtworkList} />
    <Resource name="profiles" list={UserList} />
    <Resource name="transactions" list={OrderList} />
  </Admin>
);

// components/ReportList.tsx
const ReportList = () => (
  <List>
    <Datagrid rowClick="edit">
      <TextField source="id" />
      <TextField source="reason" label="신고 사유" />
      <TextField source="reporter.handle" label="신고자" />
      <DateField source="created_at" label="신고일" />
      <SelectField source="status" choices={[
        { id: 'pending', name: '대기' },
        { id: 'resolved', name: '완료' },
      ]} />
      <EditButton />
    </Datagrid>
  </List>
);

// components/ReportEdit.tsx
const ReportEdit = () => (
  <Edit>
    <SimpleForm>
      <TextInput source="reason" label="신고 사유" disabled />
      <TextInput source="description" label="상세 내용" multiline disabled />
      <SelectInput source="status" choices={[
        { id: 'pending', name: '대기' },
        { id: 'resolved', name: '승인 (삭제)' },
        { id: 'dismissed', name: '기각' },
      ]} />
      <TextInput source="admin_notes" label="관리자 메모" multiline />
    </SimpleForm>
  </Edit>
);
```

---

## 📊 주요 관리 쿼리 모음

### 1. 대기 중인 신고 조회
```sql
SELECT 
  r.*,
  reporter.handle as reporter_name,
  a.title as artwork_title
FROM reports r
LEFT JOIN profiles reporter ON r.reporter_id = reporter.id
LEFT JOIN artworks a ON r.target_id = a.id
WHERE r.status = 'pending'
ORDER BY r.created_at DESC;
```

### 2. 신고 많이 받은 사용자 조회
```sql
SELECT 
  p.handle,
  p.email,
  COUNT(r.id) as report_count
FROM profiles p
LEFT JOIN artworks a ON p.id = a.author_id
LEFT JOIN reports r ON a.id = r.target_id
WHERE r.target_type = 'artwork'
GROUP BY p.id
HAVING COUNT(r.id) >= 3
ORDER BY report_count DESC;
```

### 3. 오늘의 매출 통계
```sql
SELECT 
  COUNT(*) as order_count,
  SUM(total_amount) as total_revenue,
  SUM(platform_fee) as platform_revenue
FROM transactions
WHERE DATE(created_at) = CURRENT_DATE
AND status = 'completed';
```

### 4. 활성 사용자 수 (지난 7일)
```sql
SELECT COUNT(DISTINCT author_id) as active_users
FROM artworks
WHERE created_at >= NOW() - INTERVAL '7 days';
```

---

## 🔒 보안 주의사항

```yaml
필수 보안 조치:
━━━━━━━━━━━━━━━━━━━━━━━━━
✅ is_admin 필드는 직접 수정 금지
   → Supabase 대시보드에서만 설정

✅ RLS 정책 반드시 적용
   → admin-schema.sql에 이미 포함됨

✅ 관리자 계정 이메일/비밀번호 강력하게
   → 2FA (2단계 인증) 활성화 권장

✅ 관리자 액션은 모두 로그 기록
   → admin_actions 테이블 활용

✅ 프로덕션 환경에서는 별도 어드민 도메인
   → admin.artyard.com (HTTPS 필수)
━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 📞 추가 도움이 필요하면?

```yaml
어드민 시스템 구현 우선순위:
━━━━━━━━━━━━━━━━━━━━━━━━━
1️⃣ 즉시: Supabase 대시보드 사용
2️⃣ 1주 후: 기본 어드민 화면 추가
3️⃣ 1개월 후: 별도 어드민 웹 개발
━━━━━━━━━━━━━━━━━━━━━━━━━

추천 로드맵:
━━━━━━━━━━━━━━━━━━━━━━━━━
Week 1-2: Supabase로 수동 관리
Week 3-4: 신고 관리 화면 개발
Week 5-6: 통계 대시보드 개발
Week 7+: 별도 어드민 웹 시작
━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

**✅ 이제 admin-schema.sql 파일을 Supabase에서 실행하고, 본인 계정을 관리자로 설정하세요!**

