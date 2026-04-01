# Deployment Guide

## Architecture

| Component | Platform | Region | URL |
|-----------|----------|--------|-----|
| Server (NestJS) | Google Cloud Run | asia-northeast3 | `https://command-server-549189599662.asia-northeast3.run.app` |
| Web (Next.js) | Google Cloud Run | asia-northeast3 | `https://command-web-549189599662.asia-northeast3.run.app` |
| Desktop (Electron) | GitHub Releases | N/A | `https://github.com/eziong/todo/releases` |

GCP Project: `todo-478322`

---

## Server (NestJS)

### Deploy
```bash
# 서버 폴더에서
cd server

# 프로덕션 환경변수와 함께 배포
gcloud run deploy command-server \
  --project todo-478322 \
  --source . \
  --region asia-northeast3 \
  --allow-unauthenticated \
  --min-instances 0 --max-instances 2 \
  --memory 512Mi --cpu 1 \
  --execution-environment gen2 \
  --set-env-vars "\
DATABASE_URL=postgresql://postgres.udgjjfkzpvqxqccotptb:jgq2AeFdBJMOsxzW@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres,\
SUPABASE_URL=https://udgjjfkzpvqxqccotptb.supabase.co,\
SUPABASE_JWT_SECRET=<JWT_SECRET>,\
GOOGLE_CLIENT_ID=<GOOGLE_CLIENT_ID>,\
GOOGLE_CLIENT_SECRET=<GOOGLE_CLIENT_SECRET>,\
GOOGLE_REDIRECT_URI=https://command-server-549189599662.asia-northeast3.run.app/api/google/callback,\
WEB_APP_URL=https://command-web-549189599662.asia-northeast3.run.app,\
NODE_ENV=production"
```

### Environment Variables

| Variable | Local (.env) | Production (Cloud Run) |
|----------|-------------|----------------------|
| DATABASE_URL | Supabase Pooler | Supabase Pooler (same) |
| SUPABASE_URL | `https://udgjjfkzpvqxqccotptb.supabase.co` | same |
| SUPABASE_JWT_SECRET | Supabase Dashboard > Settings > API | same |
| GOOGLE_CLIENT_ID | GCP Console | same |
| GOOGLE_CLIENT_SECRET | GCP Console | same |
| GOOGLE_REDIRECT_URI | `http://localhost:4000/api/google/callback` | `https://command-server-549189599662.../api/google/callback` |
| WEB_APP_URL | `http://localhost:3000` | `https://command-web-549189599662...` |
| PORT | 4000 | **설정 금지** (Cloud Run 예약 변수, 자동 8080) |
| NODE_ENV | 생략 | production |

> **주의**: `deploy:full` 스크립트는 로컬 `.env`를 그대로 사용하므로 localhost 값이 프로덕션에 반영됨. 프로덕션 배포 시 위 명령어를 직접 사용할 것.

### JWT 인증
- Supabase는 **ES256** (비대칭키) JWT를 사용
- 서버는 JWKS 엔드포인트(`SUPABASE_URL/auth/v1/.well-known/jwks.json`)로 검증
- `jwks-rsa` 패키지 사용 (캐싱 + rate limit 적용)

### Docker Build
- Multi-stage: node:22-alpine (builder → production)
- Prisma client는 빌드 시 생성
- 출력: `dist/main.js`

---

## Web (Next.js)

### Deploy
```bash
cd web
npm run deploy
# = gcloud run deploy command-web --source . --region asia-northeast3 --allow-unauthenticated --min-instances 0 --max-instances 2 --memory 512Mi --cpu 1
```

### Environment Variables
Web은 **Dockerfile에 하드코딩** (빌드 시 bake):

```dockerfile
ENV NEXT_PUBLIC_SUPABASE_URL=https://udgjjfkzpvqxqccotptb.supabase.co
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon_key>
ENV NEXT_PUBLIC_API_URL=https://command-server-549189599662.asia-northeast3.run.app
```

> `NEXT_PUBLIC_*` 변수는 빌드 시 클라이언트 코드에 포함됨. Cloud Run 환경변수로 설정해도 런타임에 반영되지 않음.

### Docker Build
- Multi-stage: deps → builder → production
- `output: 'standalone'` (next.config.mjs)
- 출력: `.next/standalone/server.js`

### Supabase Auth 설정
Supabase Dashboard > Authentication > URL Configuration:
- **Site URL**: `https://command-web-549189599662.asia-northeast3.run.app`
- **Redirect URLs**: `http://localhost:3000/**` (로컬 개발용)

---

## Desktop (Electron)

### 빌드 방법
GitHub Actions로 자동 빌드 (Mac + Windows 동시):

```bash
# 태그 push → 자동 빌드 + Release 생성
git tag v1.0.5
git push origin v1.0.5
```

수동 트리거: GitHub > Actions > "Build Desktop App" > Run workflow

### 빌드 결과물
| OS | 파일 | 위치 |
|----|------|------|
| macOS | `Command Center-{version}.dmg` | GitHub Releases |
| Windows | `Command Center Setup {version}.exe` | GitHub Releases |

### 버전 관리
- git 태그 버전(`v1.0.5`)이 자동으로 파일명에 반영
- `desktop/package.json`의 version은 CI에서 태그 기준으로 자동 동기화

### 구조
- Electron이 배포된 웹앱 URL을 WebView로 로드
- OAuth (Google, Supabase) URL은 앱 내부에서 처리
- F12로 DevTools 열기 가능
- 외부 링크만 시스템 브라우저로 열림

---

## Cloud Run 공통 설정

| 설정 | 값 |
|------|-----|
| Region | asia-northeast3 (Tokyo) |
| Min instances | 0 (scale-to-zero) |
| Max instances | 2 |
| Memory | 512Mi |
| CPU | 1 vCPU |
| Auth | Unauthenticated (공개) |

---

## 로컬 개발

```bash
# 서버 (port 4000)
cd server && npm run start:dev

# 웹 (port 3000)
cd web && npm run dev

# 데스크톱 (로컬 웹앱 연결)
cd desktop && COMMAND_CENTER_URL=http://localhost:3000 npm start
```

---

## Troubleshooting

### Cloud Run 배포 실패: PORT 환경변수
Cloud Run은 `PORT`가 예약 변수. `--set-env-vars`에 PORT 포함하면 실패.

### 401 Unauthorized
- Supabase JWT가 ES256 → 서버의 `jwt.strategy.ts`가 JWKS 방식인지 확인
- `SUPABASE_URL` 환경변수가 Cloud Run에 설정되어 있는지 확인

### OAuth 로그인 후 localhost로 리다이렉트
- Supabase Dashboard > Authentication > URL Configuration > **Site URL** 확인
- 배포 URL로 설정되어 있어야 함

### `--set-env-vars` vs `--update-env-vars`
- `--set-env-vars`: 기존 환경변수 **모두 삭제** 후 새로 설정
- `--update-env-vars`: 기존 유지 + 지정한 것만 추가/수정
- 환경변수 추가할 때는 반드시 `--update-env-vars` 사용
