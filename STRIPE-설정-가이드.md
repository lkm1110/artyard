# 💳 Stripe 설정 완벽 가이드

## 🚀 **빠른 시작 (5분 완성!)**

---

## 1️⃣ **Stripe 계정 생성**

### **회원가입**
```
1. https://stripe.com 접속
2. "Start now" 또는 "Sign up" 클릭
3. 이메일 입력 → 비밀번호 설정
4. 이메일 인증 완료
```

**참고:** 테스트만 할 거면 사업자 등록 안 해도 됩니다!

---

## 2️⃣ **API 키 발급**

### **1. Dashboard 접속**
```
로그인 → Dashboard
```

### **2. API Keys 메뉴**
```
왼쪽 메뉴 → Developers → API keys
```

### **3. 키 복사**

#### **Publishable key (공개 키)**
```
pk_test_51abc123... 

이미 보이는 키 → 복사 버튼 클릭
```

#### **Secret key (비밀 키)**
```
sk_test_51abc123...

"Reveal test key" 버튼 클릭 → 복사
```

**⚠️ Secret key는 절대 공개하지 마세요!**

---

## 3️⃣ **환경변수 설정**

### **프로젝트 루트에 `.env` 파일 생성**

```bash
# 파일 생성
touch .env

# 또는 직접 만들기
# 프로젝트 폴더 → .env 파일 생성
```

### **`.env` 파일 내용**

```env
# Stripe API Keys
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_여기에_공개키_붙여넣기
STRIPE_SECRET_KEY=sk_test_여기에_비밀키_붙여넣기

# Supabase (기존)
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

**예시:**
```env
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51NxT8iJ3K9abc123XYZ
STRIPE_SECRET_KEY=sk_test_51NxT8iJ3K9abc123XYZ
```

---

## 4️⃣ **npm 패키지 설치**

### **터미널에서 실행**

```bash
npm install @stripe/stripe-react-native
```

**설치 시간:** 약 30초

---

## 5️⃣ **App.tsx 업데이트**

### **Stripe Provider 추가**

<function_calls>
<invoke name="read_file">
<parameter name="target_file">App.tsx
