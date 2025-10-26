# 🔐 2Checkout 환경변수 설정 가이드

## ✅ **Product ID 확인 완료!**
```
Product ID: 52070072 ✅
```

---

## 📝 **1단계: .env 파일 생성/수정**

### 프로젝트 루트에 `.env` 파일을 열어서 아래 내용 추가:

```bash
# =====================================
# 2CHECKOUT 설정
# =====================================

# Merchant Code (Account Number)
# Dashboard → Setup → Integrations & API → API에서 확인
EXPO_PUBLIC_2CHECKOUT_ACCOUNT=여기에_Merchant_Code_입력

# Secret Key (Secret Word)  
# Dashboard → Setup → Integrations & API → API에서 확인
EXPO_PUBLIC_2CHECKOUT_SECRET_KEY=여기에_Secret_Key_입력

# Product ID (방금 만든 Product)
EXPO_PUBLIC_2CHECKOUT_PRODUCT_ID=52070072
```

---

## 🔑 **2단계: API Credentials 받기**

### 경로:
```
2Checkout Dashboard
→ Setup (왼쪽 메뉴)
→ Integrations & API
→ API 탭
```

### 받을 정보:

#### **Merchant Code (Account Number)**
```
형식: 숫자 10-12자리
예: 250622123456

.env에 입력:
EXPO_PUBLIC_2CHECKOUT_ACCOUNT=250622123456
```

#### **Secret Key (Secret Word)**
```
형식: 문자열 (대소문자, 숫자 혼합)
예: tA9rB2eL8s

.env에 입력:
EXPO_PUBLIC_2CHECKOUT_SECRET_KEY=tA9rB2eL8s
```

---

## 📋 **최종 .env 파일 예시**

```bash
# =====================================
# 2CHECKOUT 설정
# =====================================
EXPO_PUBLIC_2CHECKOUT_ACCOUNT=250622123456
EXPO_PUBLIC_2CHECKOUT_SECRET_KEY=tA9rB2eL8s
EXPO_PUBLIC_2CHECKOUT_PRODUCT_ID=52070072

# =====================================
# SUPABASE 설정 (기존 값 유지)
# =====================================
EXPO_PUBLIC_SUPABASE_URL=https://bkvycanciimgyftdtqpx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrdnljYW5jaWltZ3lmdGR0cXB4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ1MjcxMjUsImV4cCI6MjA1MDEwMzEyNX0.OXlpgEqVUo-1L0khEZE3-uy0d3K5KmJi55FlNVGTWis

# =====================================
# KAKAO 설정 (기존 값 유지)
# =====================================
EXPO_PUBLIC_KAKAO_APP_KEY=4d49bb1ab7c3308b68b8d4eb0e05ced3
```

---

## ⚠️ **주의사항**

### **Secret Key는 절대 공유 금지!**
```
❌ GitHub에 올리지 마세요
❌ 스크린샷 찍어서 공유 금지
❌ 메신저로 전송 금지

✅ .env 파일은 .gitignore에 포함됨
✅ 로컬에만 저장
✅ 팀원에게는 개별 전달
```

---

## 🚀 **다음 단계**

### .env 설정 완료 후:

1. ✅ Return URLs 설정
2. ✅ Payment Methods 활성화
3. ✅ 앱 재시작 (npm start)
4. ✅ 테스트!

---

## 📞 **API Credentials 못 찾겠으면**

### 스크린샷 찍어서 보여주세요:
```
Dashboard → Setup → Integrations & API
화면을 캡처해서 알려주시면
정확한 위치 안내해드릴게요! 😊
```

