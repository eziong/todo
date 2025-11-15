# Google OAuth 설정 가이드

Next.js Todo 애플리케이션에 Google OAuth 인증을 설정하는 완전한 가이드입니다.

## 📋 목차

1. [Google Cloud Console 설정](#1-google-cloud-console-설정)
2. [Supabase 설정](#2-supabase-설정)
3. [프로젝트 환경 변수 설정](#3-프로젝트-환경-변수-설정)
4. [로컬 개발 환경 테스트](#4-로컬-개발-환경-테스트)
5. [프로덕션 배포 설정](#5-프로덕션-배포-설정)
6. [문제 해결](#6-문제-해결)

---

## 1. Google Cloud Console 설정

### 1.1 Google Cloud 프로젝트 생성

1. **Google Cloud Console 접속**
   - [Google Cloud Console](https://console.cloud.google.com/) 방문
   - Google 계정으로 로그인

2. **새 프로젝트 생성**
   ```
   1. 상단의 프로젝트 선택 드롭다운 클릭
   2. "새 프로젝트" 버튼 클릭
   3. 프로젝트 이름 입력: "Todo App"
   4. "만들기" 클릭
   ```

### 1.2 OAuth 동의 화면 설정

1. **OAuth 동의 화면으로 이동**
   ```
   좌측 메뉴 → APIs & Services → OAuth consent screen
   ```

2. **사용자 유형 선택**
   ```
   ✅ External (외부) 선택
   "만들기" 클릭
   ```

3. **OAuth 동의 화면 정보 입력**
   ```
   앱 이름: "Todo Application"
   사용자 지원 이메일: [본인 이메일]
   앱 로고: [선택사항]
   앱 도메인:
     - 애플리케이션 홈페이지: https://your-domain.com
     - 개인정보처리방침: https://your-domain.com/privacy
     - 서비스 약관: https://your-domain.com/terms
   승인된 도메인:
     - your-domain.com
     - localhost (개발용)
   개발자 연락처 정보: [본인 이메일]
   ```

4. **범위 설정**
   ```
   "범위 추가 또는 삭제" 클릭
   다음 범위 선택:
   ✅ .../auth/userinfo.email
   ✅ .../auth/userinfo.profile
   ✅ openid
   ```

5. **테스트 사용자 추가** (개발 중)
   ```
   "테스트 사용자" 섹션에서:
   - 본인 이메일 주소 추가
   - 팀원 이메일 주소 추가 (필요시)
   ```

### 1.3 OAuth 클라이언트 ID 생성

1. **사용자 인증 정보로 이동**
   ```
   좌측 메뉴 → APIs & Services → Credentials
   ```

2. **OAuth 클라이언트 ID 생성**
   ```
   "사용자 인증 정보 만들기" → "OAuth 클라이언트 ID" 클릭
   ```

3. **클라이언트 설정**
   ```
   애플리케이션 유형: "웹 애플리케이션" 선택
   이름: "Todo App Web Client"
   
   승인된 JavaScript 원본:
   - http://localhost:3000 (로컬 개발)
   - https://your-domain.com (프로덕션)
   
   승인된 리디렉션 URI:
   - http://localhost:54321/auth/v1/callback (Supabase 로컬)
   - https://your-project-ref.supabase.co/auth/v1/callback (Supabase)
   ```

4. **클라이언트 정보 저장**
   ```
   생성 완료 후 표시되는 정보를 안전하게 저장:
   - 클라이언트 ID: 123456789-abc...googleusercontent.com
   - 클라이언트 보안 비밀번호: GOCSPX-...
   ```

---

## 2. Supabase 설정

### 2.1 Supabase 프로젝트 설정

1. **Supabase Dashboard 접속**
   - [Supabase Dashboard](https://app.supabase.com/) 로그인
   - 해당 프로젝트 선택

2. **Authentication 설정**
   ```
   좌측 메뉴 → Authentication → Settings → Auth Providers
   ```

### 2.2 Google Provider 활성화

1. **Google 설정**
   ```
   Google 항목에서 "Enable" 토글 ON
   ```

2. **Google OAuth 정보 입력**
   ```
   Client ID: [Google Console에서 복사한 클라이언트 ID]
   Client Secret: [Google Console에서 복사한 클라이언트 보안 비밀번호]
   ```

3. **Redirect URL 확인**
   ```
   자동으로 생성되는 Redirect URL 복사:
   https://your-project-ref.supabase.co/auth/v1/callback
   
   ⚠️ 이 URL을 Google Cloud Console의 승인된 리디렉션 URI에 추가했는지 확인
   ```

### 2.3 Authentication 설정 조정

1. **Site URL 설정**
   ```
   Authentication → Settings → General
   
   Site URL: http://localhost:3000 (개발시)
            https://your-domain.com (프로덕션)
   ```

2. **Redirect URLs 설정**
   ```
   Additional Redirect URLs에 추가:
   - http://localhost:3000/auth/callback
   - https://your-domain.com/auth/callback
   ```

---

## 3. 프로젝트 환경 변수 설정

### 3.1 환경 변수 파일 생성

**`.env.local` 파일 생성/수정:**
```bash
# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Google OAuth (선택사항 - Supabase에서 처리)
GOOGLE_CLIENT_ID=123456789-abc...googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-...

# 앱 설정
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-key
```

### 3.2 환경 변수 값 찾기

**Supabase 값들:**
```
Supabase Dashboard → Settings → API

- URL: Project URL
- ANON KEY: Project API keys → anon → public
- SERVICE_ROLE_KEY: Project API keys → service_role
```

**NextAuth Secret 생성:**
```bash
# 터미널에서 실행
openssl rand -base64 32
```

### 3.3 .env 파일 보안

```bash
# .gitignore에 추가 (이미 있는지 확인)
.env.local
.env
.env*.local
```

---

## 4. 로컬 개발 환경 테스트

### 4.1 개발 서버 시작

```bash
npm run dev
```

### 4.2 Google 로그인 테스트

1. **로그인 페이지 접속**
   ```
   http://localhost:3000/login
   ```

2. **Google 로그인 버튼 클릭**
   - Google OAuth 동의 화면이 나타나야 함
   - 테스트 사용자로 추가한 계정으로 로그인

3. **로그인 성공 확인**
   ```
   성공시: 대시보드로 리디렉션
   실패시: 오류 메시지 확인
   ```

### 4.3 문제 해결 체크리스트

**로그인이 안 될 때:**
```
✅ Google Cloud Console에서 OAuth 동의 화면 설정 완료
✅ 클라이언트 ID와 시크릿이 정확히 입력됨
✅ 리디렉션 URI가 정확히 설정됨
✅ 테스트 사용자로 이메일이 추가됨
✅ Supabase에서 Google provider 활성화됨
✅ 환경 변수가 올바르게 설정됨
```

---

## 5. 프로덕션 배포 설정

### 5.1 프로덕션 도메인 설정

**Google Cloud Console에서:**
```
OAuth 클라이언트 ID → 웹 클라이언트 편집

승인된 JavaScript 원본에 추가:
- https://your-production-domain.com

승인된 리디렉션 URI에 추가:
- https://your-project-ref.supabase.co/auth/v1/callback
- https://your-production-domain.com/auth/callback
```

**Supabase에서:**
```
Authentication → Settings → General

Site URL 업데이트:
- https://your-production-domain.com

Additional Redirect URLs에 추가:
- https://your-production-domain.com/auth/callback
```

### 5.2 배포 플랫폼 환경 변수

**Vercel 예시:**
```bash
# Vercel Dashboard → Project → Settings → Environment Variables

NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
NEXTAUTH_URL=https://your-production-domain.com
NEXTAUTH_SECRET=your-production-nextauth-secret
```

### 5.3 OAuth 앱 검토 (프로덕션 출시 시)

**Google OAuth 앱 게시:**
```
Google Cloud Console → OAuth 동의 화면 → "앱 게시" 클릭

게시 전 요구사항:
✅ 개인정보처리방침 URL 유효
✅ 서비스 약관 URL 유효
✅ 홈페이지 URL 유효
✅ 앱 로고 업로드 (권장)
```

---

## 6. 문제 해결

### 6.1 일반적인 오류들

**1. "redirect_uri_mismatch" 오류**
```
원인: Google Console의 리디렉션 URI 설정 오류
해결: 
- Google Console에서 정확한 Supabase callback URL 추가
- http/https 프로토콜 확인
- 포트 번호 확인 (로컬: 3000)
```

**2. "access_denied" 오류**
```
원인: OAuth 동의 화면 설정 미완료 또는 테스트 사용자 미추가
해결:
- OAuth 동의 화면 완전히 설정
- 테스트 사용자에 이메일 추가
- 앱 상태를 "테스트" → "프로덕션"으로 변경 (필요시)
```

**3. Supabase 연결 오류**
```
원인: 환경 변수 설정 오류
해결:
- .env.local 파일의 Supabase URL과 키 확인
- Supabase 대시보드에서 최신 키 복사
- 서버 재시작
```

### 6.2 디버깅 방법

**브라우저 개발자 도구:**
```javascript
// Console에서 Supabase 클라이언트 확인
console.log(supabase.supabaseUrl)
console.log(supabase.supabaseKey)

// 인증 상태 확인
const { data: { user } } = await supabase.auth.getUser()
console.log(user)
```

**로그 확인:**
```bash
# 개발 서버 터미널에서 오류 로그 확인
npm run dev

# Supabase 대시보드에서 Auth 로그 확인
Authentication → Logs
```

### 6.3 테스트 체크리스트

**배포 전 최종 확인:**
```
✅ 로컬에서 Google 로그인 성공
✅ 프로덕션 도메인으로 리디렉션 URI 업데이트
✅ 환경 변수 프로덕션 값으로 설정
✅ OAuth 앱 게시 (필요시)
✅ HTTPS 인증서 설정
✅ 개인정보처리방침/서비스약관 페이지 작성
```

---

## 📞 지원 및 참고 자료

- [Supabase Auth 가이드](https://supabase.com/docs/guides/auth)
- [Google OAuth 2.0 문서](https://developers.google.com/identity/protocols/oauth2)
- [Next.js Authentication](https://nextjs.org/docs/authentication)

---

이 가이드를 따라하면 Google OAuth 인증이 완전히 설정됩니다! 🎉