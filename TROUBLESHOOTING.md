# 🔧 **Metro Bundler 에러 해결 가이드**

---

## ❌ **에러 메시지**

```
GET http://localhost:8085/index.ts.bundle?platform=web&dev=true&hot=false&lazy=true&transform.engine=hermes&transform.routerRoot=app&unstable_transformProfile=hermes-stable net::ERR_ABORTED 500 (Internal Server Error)

Refused to execute script from '...' because its MIME type ('application/json') is not executable
```

---

## 🔍 **원인**

Metro bundler가 코드를 번들링하다가 500 에러 발생. 일반적인 원인:

1. ✅ **캐시 문제** (가장 흔함)
2. ✅ **새로 추가한 패키지 문제**
3. ✅ **node_modules 손상**
4. ❌ **코드 syntax 에러** (lint 통과했으므로 아님)

---

## ✅ **해결 방법**

### **Step 1: 모든 Node 프로세스 종료**

```bash
# Windows
taskkill /F /IM node.exe

# Mac/Linux
killall node
```

---

### **Step 2: 캐시 완전 삭제**

```bash
# Windows PowerShell
Remove-Item -Recurse -Force .expo -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force node_modules/.cache -ErrorAction SilentlyContinue

# Mac/Linux
rm -rf .expo
rm -rf node_modules/.cache
```

---

### **Step 3: Metro bundler 재시작 (캐시 클리어)**

```bash
npx expo start --clear
```

**또는**

```bash
npm start -- --reset-cache
```

---

### **Step 4: 안 되면 node_modules 재설치**

```bash
# 1. node_modules 삭제
Remove-Item -Recurse -Force node_modules

# 2. 재설치
npm install

# 3. 캐시 클리어 후 재시작
npx expo start --clear
```

---

## 🎯 **빠른 해결 (One-Liner)**

```bash
# Windows PowerShell
taskkill /F /IM node.exe; Remove-Item -Recurse -Force .expo -ErrorAction SilentlyContinue; npx expo start --clear
```

```bash
# Mac/Linux
killall node; rm -rf .expo; npx expo start --clear
```

---

## 📱 **웹에서 테스트 중이었다면?**

웹 브라우저 캐시도 삭제하세요:

```
Chrome: Ctrl + Shift + Delete
Safari: Cmd + Option + E
```

그리고 Hard Refresh:

```
Windows: Ctrl + F5
Mac: Cmd + Shift + R
```

---

## ✅ **해결 확인**

다음과 같은 메시지가 나오면 성공:

```
› Metro waiting on exp://...
› Scan the QR code above with Expo Go (Android) or the Camera app (iOS)

› Press a │ open Android
› Press i │ open iOS simulator
› Press w │ open web

› Press j │ open debugger
› Press r │ reload app
› Press m │ toggle menu
› Press o │ open project code in your editor

› Press ? │ show all commands
```

---

## 🐛 **그래도 안 되면?**

### **에러 로그 확인**

Metro bundler 터미널에서 정확한 에러 메시지를 확인하세요.

```
ERROR: ...
```

일반적인 에러들:

```yaml
1. "Cannot find module 'xxx'":
   → npm install 다시 실행

2. "Unexpected token":
   → 코드 syntax 에러
   → 최근 수정한 파일 확인

3. "Transform error":
   → babel 캐시 삭제
   → rm -rf node_modules/.cache/babel-loader

4. "Port already in use":
   → 다른 Metro bundler가 실행 중
   → taskkill /F /IM node.exe 실행
```

---

## 💡 **예방 방법**

### **1. 정기적인 캐시 삭제**

```bash
# 매일 첫 시작 시
npx expo start --clear
```

### **2. package.json 변경 후**

```bash
# 새 패키지 설치 후
npm install
npx expo start --clear
```

### **3. Git pull 후**

```bash
git pull
npm install
npx expo start --clear
```

---

## 🚀 **지금 실행할 명령어**

```bash
# 1. 모든 Node 종료
taskkill /F /IM node.exe

# 2. 캐시 삭제
Remove-Item -Recurse -Force .expo -ErrorAction SilentlyContinue

# 3. 재시작
npx expo start --clear

# 4. 웹 브라우저에서 w 누르기
```

---

**이제 작동할 것입니다!** 🎉

