# 🔧 Admin 화면 Alert → Modal 마이그레이션 리스트

**목표**: 모든 Admin 화면에서 `Alert.alert` → `SuccessModal` / `ErrorModal` / `ConfirmModal` 통일

**총 개수**: 28개 (9개 파일)

---

## 📊 **파일별 Alert 사용 현황**

### 1. **UserManagementScreen.tsx** (2개)

| 번호 | 타입 | 현재 코드 | 변경 필요 |
|------|------|-----------|----------|
| 1 | Error | `Alert.alert('Error', 'Failed to load users')` | ✅ ErrorModal |
| 2 | Select | `Alert.alert('Select Ban Duration', ...)` | ⚠️ 유지 (Alert.prompt 대체 불가) |

**상태**:
- ✅ 이미 `ConfirmModal` 사용 중 (Ban 확인)
- ✅ 이미 `SuccessModal` 사용 중 (Ban 성공)
- ✅ 이미 `ErrorModal` 사용 중 (Ban 실패)

---

### 2. **ArtworkManagementScreen.tsx** (2개)

| 번호 | 타입 | 현재 코드 | 변경 필요 |
|------|------|-----------|----------|
| 1 | Success | `Alert.alert('Success', 'Artwork deleted and artist notified')` | ✅ SuccessModal |
| 2 | Error | `Alert.alert('Error', 'Failed to delete artwork')` | ✅ ErrorModal |

**상태**:
- ❌ 모달 컴포넌트 미사용

---

### 3. **AdminDashboardScreen.tsx** (3개)

| 번호 | 타입 | 현재 코드 | 변경 필요 |
|------|------|-----------|----------|
| 1 | Error | `Alert.alert('Access Denied', ...)` | ✅ ErrorModal |
| 2 | Error | `Alert.alert('Error', 'Failed to verify admin permissions')` | ✅ ErrorModal |
| 3 | Error | `Alert.alert('Error', 'Failed to load statistics')` | ✅ ErrorModal |

**상태**:
- ❌ 모달 컴포넌트 미사용

---

### 4. **ReportsManagementScreen.tsx** (5개)

| 번호 | 타입 | 현재 코드 | 변경 필요 |
|------|------|-----------|----------|
| 1 | Error | `Alert.alert('Error', 'Failed to load reports')` | ✅ ErrorModal |
| 2 | Warning | `Alert.alert('Warning', 'Report resolved but failed to delete artwork')` | ✅ ErrorModal |
| 3 | Success | `Alert.alert('Success', 'Report resolved/dismissed')` | ✅ SuccessModal |
| 4 | Error | `Alert.alert('Error', 'Failed to process report')` | ✅ ErrorModal |
| 5 | Confirm | `Alert.alert('Confirm Approval', 'This will delete...')` | ✅ ConfirmModal |

**상태**:
- ❌ 모달 컴포넌트 미사용

---

### 5. **SettlementManagementScreen.tsx** (6개)

| 번호 | 타입 | 현재 코드 | 변경 필요 |
|------|------|-----------|----------|
| 1 | Error | `Alert.alert('Error', 'Failed to load settlements')` | ✅ ErrorModal |
| 2 | Confirm | `Alert.alert('Approve Settlement', 'Are you sure...')` | ✅ ConfirmModal |
| 3 | Success | `Alert.alert('Success', 'Settlement approved successfully!')` | ✅ SuccessModal |
| 4 | Error | `Alert.alert('Error', 'Failed to approve settlement')` | ✅ ErrorModal |
| 5 | Success | `Alert.alert('Success', 'Settlement rejected')` | ✅ SuccessModal |
| 6 | Error | `Alert.alert('Error', 'Failed to reject settlement')` | ✅ ErrorModal |

**상태**:
- ❌ 모달 컴포넌트 미사용

---

### 6. **AdminManagementScreen.tsx** (7개) ⚠️ 가장 많음

| 번호 | 타입 | 현재 코드 | 변경 필요 |
|------|------|-----------|----------|
| 1 | Confirm | `Alert.alert('Add Administrator', 'Add "..." as admin?')` | ✅ ConfirmModal |
| 2 | Success | `Alert.alert('Success', 'added as administrator')` | ✅ SuccessModal |
| 3 | Error | `Alert.alert('Error', 'Failed to add administrator')` | ✅ ErrorModal |
| 4 | Notice | `Alert.alert('Notice', 'You cannot remove yourself')` | ✅ ErrorModal |
| 5 | Confirm | `Alert.alert('Remove Administrator', 'Remove "..." from admin?')` | ✅ ConfirmModal |
| 6 | Success | `Alert.alert('Success', 'removed from administrators')` | ✅ SuccessModal |
| 7 | Error | `Alert.alert('Error', 'Failed to remove administrator')` | ✅ ErrorModal |

**상태**:
- ❌ 모달 컴포넌트 미사용 (모두 Alert.alert 사용)

---

### 7. **AuctionManagementScreen.tsx** (1개)

| 번호 | 타입 | 현재 코드 | 변경 필요 |
|------|------|-----------|----------|
| 1 | Error | `Alert.alert('Error', 'Failed to load data')` | ✅ ErrorModal |

**상태**:
- ❌ 모달 컴포넌트 미사용

---

### 8. **ChallengeManagementScreen.tsx** (1개)

| 번호 | 타입 | 현재 코드 | 변경 필요 |
|------|------|-----------|----------|
| 1 | Error | `Alert.alert('Error', 'Failed to load challenges')` | ✅ ErrorModal |

**상태**:
- ❌ 모달 컴포넌트 미사용

---

### 9. **RevenueDetailScreen.tsx** (1개)

| 번호 | 타입 | 현재 코드 | 변경 필요 |
|------|------|-----------|----------|
| 1 | Error | `Alert.alert('Error', 'Failed to load revenue data')` | ✅ ErrorModal |

**상태**:
- ❌ 모달 컴포넌트 미사용

---

## 📊 **타입별 통계**

| 모달 타입 | 개수 | 비율 |
|----------|------|------|
| **ErrorModal** | 14개 | 50% |
| **SuccessModal** | 4개 | 14% |
| **ConfirmModal** | 4개 | 14% |
| **유지 (Alert.prompt 등)** | 6개 | 21% |

---

## ✅ **작업 우선순위**

### **High Priority** (즉시 적용)
1. ✅ **AdminManagementScreen** (7개 → 가장 많음)
2. ✅ **SettlementManagementScreen** (6개)
3. ✅ **ReportsManagementScreen** (5개)

### **Medium Priority**
4. ✅ **AdminDashboardScreen** (3개)
5. ✅ **ArtworkManagementScreen** (2개)

### **Low Priority**
6. ✅ **UserManagementScreen** (1개만 변경 필요)
7. ✅ **AuctionManagementScreen** (1개)
8. ✅ **ChallengeManagementScreen** (1개)
9. ✅ **RevenueDetailScreen** (1개)

---

## 🛠️ **작업 내용**

### **각 파일에 추가할 것**:

```typescript
// 1. State 추가
const [successModalVisible, setSuccessModalVisible] = useState(false);
const [errorModalVisible, setErrorModalVisible] = useState(false);
const [confirmModalVisible, setConfirmModalVisible] = useState(false);
const [successMessage, setSuccessMessage] = useState({ title: '', message: '' });
const [errorMessage, setErrorMessage] = useState({ title: '', message: '' });

// 2. Import 추가
import { SuccessModal } from '../../components/SuccessModal';
import { ErrorModal } from '../../components/ErrorModal';
import { ConfirmModal } from '../../components/ConfirmModal';

// 3. JSX에 모달 추가
<SuccessModal
  visible={successModalVisible}
  title={successMessage.title}
  message={successMessage.message}
  onClose={() => setSuccessModalVisible(false)}
/>

<ErrorModal
  visible={errorModalVisible}
  title={errorMessage.title}
  message={errorMessage.message}
  onClose={() => setErrorModalVisible(false)}
/>

<ConfirmModal
  visible={confirmModalVisible}
  title="..."
  message="..."
  onConfirm={handleConfirm}
  onCancel={() => setConfirmModalVisible(false)}
/>
```

### **Alert.alert 교체 예시**:

```typescript
// Before ❌
Alert.alert('Success', 'Settlement approved successfully!');

// After ✅
setSuccessMessage({
  title: 'Success',
  message: 'Settlement approved successfully!',
});
setSuccessModalVisible(true);
```

---

## 🎯 **예상 효과**

### **Before** (현재):
- ❌ OS 기본 Alert 사용 (디자인 통일 안 됨)
- ❌ Android/iOS 스타일 다름
- ❌ 앱 디자인과 이질적

### **After** (변경 후):
- ✅ 앱 전체 디자인 통일
- ✅ 아름다운 커스텀 모달
- ✅ 일관된 UX
- ✅ 브랜드 아이덴티티 강화

---

## 📝 **작업 진행 방법**

### **옵션 1**: 한 번에 모두 변경 (권장)
- 소요 시간: 약 30-40분
- 커밋 1개로 일괄 적용

### **옵션 2**: 파일별로 순차 변경
- 우선순위 순서대로 진행
- 각 파일마다 테스트

---

**작업 시작할까요?** 🚀

