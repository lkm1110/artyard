# 🌐 Artyard 웹 배포 가이드

## artyard.app 도메인에 웹 배포하기

---

## 🚀 방법 1: Vercel (가장 쉬움, 무료)

### 1단계: Vercel 설치 및 로그인

```bash
# Vercel CLI 설치
npm install -g vercel

# Vercel 로그인
vercel login
```

### 2단계: 웹 빌드

```bash
# Expo 웹 빌드
npx expo export:web

# dist 폴더에 웹 파일 생성됨
```

### 3단계: Vercel 배포

```bash
# 프로젝트 배포
vercel --prod

# 또는 GitHub 연동 후 자동 배포
```

### 4단계: artyard.app 도메인 연결

**Vercel Dashboard에서:**

1. https://vercel.com/dashboard 접속
2. 프로젝트 선택
3. **Settings** → **Domains** 클릭
4. **Add Domain** → `artyard.app` 입력
5. DNS 설정 안내가 나옴:

**도메인 등록업체(Namecheap, GoDaddy 등)에서:**

```
Type: A Record
Name: @
Value: 76.76.21.21 (Vercel IP)

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

6. DNS 전파 대기 (5분~24시간)
7. ✅ https://artyard.app 접속 가능!

---

## 🔧 방법 2: Netlify (무료)

### 1단계: Netlify 설치

```bash
npm install -g netlify-cli

# 로그인
netlify login
```

### 2단계: 배포

```bash
# 웹 빌드
npx expo export:web

# Netlify 배포
netlify deploy --prod --dir=dist
```

### 3단계: 도메인 연결

**Netlify Dashboard:**

1. https://app.netlify.com 접속
2. **Domain settings** → **Add custom domain**
3. `artyard.app` 입력
4. DNS 설정:

```
Type: A Record
Name: @
Value: 75.2.60.5 (Netlify IP)

Type: CNAME
Name: www
Value: [your-site].netlify.app
```

---

## ☁️ 방법 3: Cloudflare Pages (무료 + CDN)

### 1단계: GitHub Push

```bash
git add .
git commit -m "Web build ready"
git push origin main
```

### 2단계: Cloudflare Pages 설정

1. https://pages.cloudflare.com 접속
2. **Create a project** → GitHub 연동
3. **Build settings:**
   - Build command: `npx expo export:web`
   - Build output directory: `dist`
   - Root directory: `/`

4. **Environment variables:**
   - `EXPO_PUBLIC_SUPABASE_URL`: (현재 값)
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`: (현재 값)
   - 기타 EXPO_PUBLIC_* 변수들

5. **Deploy**

### 3단계: 도메인 연결

Cloudflare에서 도메인 관리 시 자동 연결!

```
artyard.app 이미 Cloudflare에 있으면:
→ Pages 프로젝트에서 "Custom domain" 클릭
→ artyard.app 선택
→ 자동 HTTPS 적용 ✅
```

---

## 🖥️ 방법 4: 자체 서버 (AWS, Google Cloud, Azure)

### AWS EC2 / Google Cloud Compute 예시:

```bash
# 1. 웹 빌드
npx expo export:web

# 2. 서버에 업로드
scp -r dist/* user@server:/var/www/artyard

# 3. Nginx 설정
sudo nano /etc/nginx/sites-available/artyard.app
```

**Nginx 설정 파일:**

```nginx
server {
    listen 80;
    server_name artyard.app www.artyard.app;

    # HTTPS로 리다이렉트
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name artyard.app www.artyard.app;

    # SSL 인증서 (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/artyard.app/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/artyard.app/privkey.pem;

    root /var/www/artyard;
    index index.html;

    # React Router 지원
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Static 파일 캐싱
    location /static/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Gzip 압축
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
}
```

```bash
# 4. Nginx 활성화
sudo ln -s /etc/nginx/sites-available/artyard.app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# 5. SSL 인증서 (Let's Encrypt)
sudo certbot --nginx -d artyard.app -d www.artyard.app
```

---

## 📋 배포 전 체크리스트

### 1. 환경 변수 확인

```bash
# .env.production 파일 생성 (선택)
EXPO_PUBLIC_SUPABASE_URL=https://bkvycanciimgyftdtqpx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
# ... 기타 필요한 변수
```

### 2. Supabase 설정

**Supabase Dashboard → Authentication → URL Configuration:**

```
Site URL: https://artyard.app
Redirect URLs:
- https://artyard.app
- https://artyard.app/*
- https://www.artyard.app
- https://www.artyard.app/*
```

### 3. OAuth 리다이렉트 URL 업데이트

**Google Cloud Console:**
- Authorized redirect URIs: `https://artyard.app/auth/callback`

**Apple Developer:**
- Return URLs: `https://artyard.app/auth/callback`

### 4. 2Checkout 설정

**2Checkout Dashboard → Return URLs:**
```
Success URL: https://artyard.app/payment-success
Cancel URL: https://artyard.app/payment-cancel
IPN URL: https://bkvycanciimgyftdtqpx.supabase.co/functions/v1/twocheckout-webhook
```

---

## 🎯 추천 배포 전략

### 단계 1: 테스트 배포 (Vercel)

```bash
# Vercel 무료 플랜으로 테스트
vercel

# → https://artyard-xxxx.vercel.app
# → 기능 테스트 완료 후 도메인 연결
```

### 단계 2: 프로덕션 배포

```bash
# artyard.app 도메인 연결
vercel --prod
vercel domains add artyard.app
```

### 단계 3: 모니터링 & 최적화

- **Analytics:** Vercel Analytics (무료)
- **Error Tracking:** Sentry
- **Performance:** Google Lighthouse

---

## 🚀 자동 배포 (CI/CD)

### GitHub Actions 설정:

`.github/workflows/deploy.yml` 생성:

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Build web
        run: npx expo export:web
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
          working-directory: ./
```

---

## 🔒 보안 설정

### 1. HTTPS 강제

Vercel/Netlify는 자동으로 HTTPS 적용

### 2. 환경 변수 보호

```bash
# .gitignore에 추가 (이미 되어 있음)
.env
.env.local
.env.production
```

### 3. CSP (Content Security Policy)

`vercel.json`에 이미 추가됨:
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block

---

## 📊 비용 비교

| 서비스 | 무료 플랜 | 유료 플랜 | 추천 |
|--------|----------|----------|------|
| **Vercel** | 100GB 대역폭/월 | $20/월 (Pro) | ⭐⭐⭐⭐⭐ |
| **Netlify** | 100GB 대역폭/월 | $19/월 (Pro) | ⭐⭐⭐⭐ |
| **Cloudflare Pages** | 무제한 대역폭 | $20/월 (추가 빌드) | ⭐⭐⭐⭐⭐ |
| **AWS S3 + CloudFront** | 50GB 무료 (1년) | 종량제 | ⭐⭐⭐ |
| **자체 서버** | $5/월 (VPS) | $10-100/월 | ⭐⭐ |

---

## 🎯 최종 추천

**초기 (MVP): Vercel**
- ✅ 무료
- ✅ 자동 HTTPS
- ✅ GitHub 연동
- ✅ 쉬운 도메인 연결

**성장 후: Cloudflare Pages**
- ✅ 무제한 대역폭
- ✅ 글로벌 CDN
- ✅ DDoS 보호
- ✅ artyard.app이 이미 Cloudflare에 있다면 최고!

---

## 📞 도움이 필요하면

- Vercel 가이드: https://vercel.com/docs
- Netlify 가이드: https://docs.netlify.com
- Cloudflare Pages: https://developers.cloudflare.com/pages

**문제 발생 시 확인 사항:**
1. DNS 전파 (https://dnschecker.org)
2. Supabase URL 설정
3. OAuth 리다이렉트 URL
4. CORS 설정

---

## ✅ 배포 완료 체크리스트

- [ ] 웹 빌드 성공 (`npx expo export:web`)
- [ ] Vercel/Netlify 배포 성공
- [ ] artyard.app 도메인 연결
- [ ] HTTPS 적용 확인
- [ ] 로그인/회원가입 테스트
- [ ] OAuth (Google/Apple) 테스트
- [ ] 작품 업로드 테스트
- [ ] 2Checkout 결제 테스트
- [ ] 모바일 반응형 확인
- [ ] Google Analytics 설치 (선택)

**배포 완료! 🎉**

