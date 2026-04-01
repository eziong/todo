---
name: nextjs-patterns
description: "Next.js 15+ App Router patterns: file conventions, Server/Client Components, Server Actions, Middleware, data fetching, caching, intercepting routes, error handling, metadata. Use when working on Next.js projects."
user-invocable: false
---

# Next.js App Router Patterns

Next.js 15+ App Router 전용 패턴.
Server Components, Server Actions, Middleware, Caching, 파일 컨벤션.


## 1. File Conventions (파일 컨벤션)

### 라우트 파일

| 파일 | 용도 | Server/Client |
|------|------|--------------|
| `layout.tsx` | 공유 레이아웃 (리렌더 X) | Server (기본) |
| `page.tsx` | 라우트 UI | Server (기본) |
| `loading.tsx` | Suspense 로딩 UI | Server |
| `error.tsx` | Error Boundary | **Client (필수)** |
| `not-found.tsx` | 404 UI | Server |
| `template.tsx` | 매 네비게이션마다 리마운트 | Server |
| `default.tsx` | Parallel route 폴백 | Server |

### 디렉토리 구조 표준

```
app/
├── (marketing)/          # Route group (URL에 미반영)
│   ├── layout.tsx
│   ├── page.tsx          # / (홈)
│   └── about/page.tsx    # /about
├── (dashboard)/          # Route group
│   ├── layout.tsx        # 대시보드 전용 레이아웃
│   ├── page.tsx          # /dashboard
│   └── settings/page.tsx # /dashboard/settings
├── @modal/               # Parallel route slot
│   ├── default.tsx       # null 반환 (필수)
│   └── (.)post/[id]/     # Intercepting route
│       └── page.tsx
├── api/                  # Route Handlers
│   └── webhook/route.ts
├── layout.tsx            # Root layout
└── not-found.tsx         # Global 404
```

### Route Groups `(name)`
- URL에 영향 없이 라우트 그룹화
- 그룹별 다른 `layout.tsx` 적용 가능
- 인증/비인증 레이아웃 분리에 사용

```
app/
├── (auth)/           # 인증 페이지용 레이아웃 (심플)
│   ├── layout.tsx
│   ├── login/page.tsx
│   └── register/page.tsx
├── (main)/           # 메인 앱 레이아웃 (사이드바)
│   ├── layout.tsx
│   └── dashboard/page.tsx
```


## 2. Server Components vs Client Components

### 판단 기준

```
이 컴포넌트가 필요한 것은?

├─ useState, useEffect, useContext → Client ('use client')
├─ onClick, onChange, onSubmit 핸들러 → Client
├─ 브라우저 API (localStorage, window) → Client
├─ 데이터 fetch (DB, API) → Server (기본)
├─ 민감 정보 (API key, 환경변수) → Server
├─ 정적 UI (텍스트, 이미지, 레이아웃) → Server
└─ 큰 의존성 (날짜 라이브러리 등) → Server (번들 감소)
```

### 'use client' 경계 최소화 (CRITICAL)

```tsx
// ✅ 올바름 — 클라이언트 경계를 가능한 낮게
// app/page.tsx (Server Component)
import { SearchBar } from './search-bar'    // Client
import { ProductList } from './product-list' // Server

export default async function Page() {
  const products = await getProducts()  // 서버에서 직접 fetch
  return (
    <div>
      <SearchBar />                        {/* Client 경계 */}
      <ProductList products={products} />  {/* Server — 번들에 미포함 */}
    </div>
  )
}

// ❌ 잘못됨 — 페이지 전체를 Client로 만듦
'use client'  // 모든 하위 컴포넌트가 Client 번들에 포함
export default function Page() { ... }
```

### Server Component에서 Client Component로 데이터 전달

```tsx
// Server Component
export default async function Page() {
  const data = await fetchData()  // 서버에서 fetch

  // ✅ 직렬화 가능한 데이터를 props로 전달
  return <ClientComponent data={data} />
}

// ❌ 금지 — 함수, 클래스 인스턴스 등 직렬화 불가 props
return <ClientComponent onFetch={fetchData} />
```

### Children 패턴 (Server Component를 Client 안에 넣기)

```tsx
// Client Component
'use client'
export function Modal({ children }) {
  const [open, setOpen] = useState(false)
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children}  {/* Server Component가 될 수 있음 */}
    </Dialog>
  )
}

// Server Component
export default async function Page() {
  return (
    <Modal>
      <ServerContent />  {/* 서버에서 렌더 → 클라이언트에 삽입 */}
    </Modal>
  )
}
```


## 3. Server Actions

### 기본 패턴

```tsx
// actions.ts
'use server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { postSchema } from '@/schemas/post'

export async function createPost(prevState: any, formData: FormData) {
  // 1. 인증 확인 (MANDATORY)
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  // 2. 입력 검증 (Zod)
  const rawData = {
    title: formData.get('title'),
    content: formData.get('content'),
  }

  const result = postSchema.safeParse(rawData)
  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors }
  }

  // 3. DB 작업
  await db.post.create({ data: result.data })

  // 4. 캐시 무효화 + 리다이렉트
  revalidatePath('/posts')
  redirect('/posts')
}
```

### useActionState

```tsx
'use client'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { createPost } from './actions'

export function PostForm() {
  const [state, formAction] = useActionState(createPost, null)

  return (
    <form action={formAction}>
      <Input name="title" />
      {state?.errors?.title && <p className="text-destructive">{state.errors.title[0]}</p>}

      <Textarea name="content" />
      {state?.errors?.content && <p className="text-destructive">{state.errors.content[0]}</p>}

      <SubmitButton />
    </form>
  )
}

// 별도 컴포넌트 (useFormStatus는 form의 자식이어야 함)
function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Saving...' : 'Save'}
    </Button>
  )
}
```

### useOptimistic

```tsx
'use client'
import { useOptimistic } from 'react'

export function TodoList({ todos, addTodo }) {
  const [optimisticTodos, addOptimisticTodo] = useOptimistic(
    todos,
    (state, newTodo: string) => [
      ...state,
      { id: `temp-${Date.now()}`, text: newTodo, pending: true },
    ]
  )

  async function formAction(formData: FormData) {
    const text = formData.get('text') as string
    addOptimisticTodo(text)     // 즉시 UI 반영
    await addTodo(text)         // 서버 액션 실행 → revalidate로 실제 데이터 교체
  }

  return (
    <form action={formAction}>
      <Input name="text" />
      <ul>
        {optimisticTodos.map(todo => (
          <li key={todo.id} className={todo.pending ? 'opacity-50' : ''}>
            {todo.text}
          </li>
        ))}
      </ul>
    </form>
  )
}
```

### Server Action 규칙
- `'use server'`는 파일 상단 또는 함수 내부에만 선언 가능
- **항상 인증 확인** — Server Action은 public POST 엔드포인트로 노출됨
- **항상 입력 검증** — FormData는 신뢰 불가 (클라이언트 조작 가능)
- `redirect()`는 try/catch 밖에서 호출 (내부적으로 throw 사용)
- `revalidatePath` / `revalidateTag`로 캐시 무효화


## 4. Middleware (인증 + 라우트 보호)

### Defense-in-Depth 패턴 (CRITICAL)

```
⚠️ Middleware만으로 인증 보호 금지 (CVE-2025-29927)
Middleware = 리다이렉트용 (UX)
Server Component / Server Action = 실제 인증 검증 (보안)
```

```ts
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const session = request.cookies.get('session')

  // 미인증 → 로그인 리다이렉트 (UX 목적)
  if (!session && request.nextUrl.pathname.startsWith('/dashboard')) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // 정적 파일 제외
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
```

```tsx
// app/dashboard/page.tsx — 실제 인증 검증 (MANDATORY)
import { auth } from '@/auth'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const session = await auth()
  if (!session) redirect('/login')  // 이중 보호

  const data = await getProtectedData(session.userId)
  return <Dashboard data={data} />
}
```

### 금지 사항
- Middleware에서만 인증 검증 금지 — 반드시 Server Component/Action에서도 검증
- Middleware에서 DB 접근 금지 — Edge Runtime은 Node.js API 제한적
- `matcher` 없이 모든 요청에 Middleware 실행 금지 — 성능 저하


## 5. Data Fetching + Caching

### fetch() 옵션

```tsx
// 기본: 캐시됨 (정적)
const data = await fetch('https://api.example.com/data')

// 시간 기반 재검증
const data = await fetch('https://api.example.com/data', {
  next: { revalidate: 60 },  // 60초마다
})

// 캐시 없음 (동적)
const data = await fetch('https://api.example.com/data', {
  cache: 'no-store',
})

// 태그 기반 재검증
const data = await fetch('https://api.example.com/data', {
  next: { tags: ['products'] },
})
```

### revalidatePath vs revalidateTag

| | revalidatePath | revalidateTag |
|-|---------------|---------------|
| 범위 | 특정 라우트/레이아웃 | 특정 태그가 붙은 fetch |
| 사용 시점 | 페이지 전체 새로고침 | 특정 데이터만 갱신 |
| 정밀도 | 낮음 (페이지 단위) | 높음 (데이터 단위) |

```tsx
// revalidatePath — 페이지 전체
revalidatePath('/posts')              // /posts 페이지
revalidatePath('/posts', 'layout')    // /posts 하위 전체

// revalidateTag — 특정 데이터
revalidateTag('posts')                // 'posts' 태그 fetch만
revalidateTag(`post-${id}`)           // 특정 게시물 fetch만
```

### TanStack Query + Server Components (하이브리드)

```tsx
// Server Component에서 prefetch → Client Component에서 사용
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query'

export default async function PostsPage() {
  const queryClient = new QueryClient()

  // 서버에서 데이터 미리 로드
  await queryClient.prefetchQuery({
    queryKey: ['posts'],
    queryFn: getPosts,
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PostList />  {/* Client Component — 캐시된 데이터 즉시 사용 */}
    </HydrationBoundary>
  )
}
```

### TanStack Query를 써야 하는 경우 vs Server Components만

| 상황 | 선택 |
|------|------|
| 정적 데이터 표시 | Server Components (fetch) |
| 검색/필터 (클라이언트 인터랙션) | TanStack Query |
| 무한 스크롤 | TanStack Query (useInfiniteQuery) |
| 낙관적 업데이트 | TanStack Query (useMutation) |
| 실시간 데이터 | TanStack Query (refetchInterval) |
| CRUD 폼 | Server Actions 또는 TanStack Query |


## 6. Intercepting Routes (모달 라우트)

### 패턴: 소프트 네비게이션 = 모달, 하드 네비게이션 = 전체 페이지

```
app/
├── @modal/
│   ├── default.tsx              # null 반환 (필수)
│   └── (.)post/[id]/
│       └── page.tsx             # 모달로 표시
├── post/[id]/
│   └── page.tsx                 # 전체 페이지로 표시
└── layout.tsx
```

```tsx
// app/layout.tsx
export default function Layout({
  children,
  modal,
}: {
  children: React.ReactNode
  modal: React.ReactNode
}) {
  return (
    <>
      {children}
      {modal}
    </>
  )
}

// app/@modal/default.tsx (필수 — 모달이 없을 때)
export default function Default() {
  return null
}

// app/@modal/(.)post/[id]/page.tsx
import { Dialog } from '@/components/ui/dialog'

export default function PostModal({ params }: { params: { id: string } }) {
  return (
    <Dialog defaultOpen>
      <DialogContent>
        <PostDetail id={params.id} />
      </DialogContent>
    </Dialog>
  )
}
```

### Intercepting Route 규칙
| 표기 | 의미 |
|------|------|
| `(.)` | 같은 레벨 |
| `(..)` | 한 레벨 위 |
| `(..)(..)` | 두 레벨 위 |
| `(...)` | root(app)에서 |

### 사용 사례
- 사진 피드 → 사진 클릭 → 모달 (Instagram 스타일)
- 리스트 → 아이템 클릭 → 사이드 패널/모달
- **URL 공유 가능**: `/post/123` 직접 접속 → 전체 페이지


## 7. Error Handling (Next.js)

### error.tsx (라우트별 Error Boundary)

```tsx
// app/dashboard/error.tsx
'use client'  // 필수

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // 에러 리포팅 서비스에 전송
    reportError(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <h2 className="text-xl font-semibold">Something went wrong</h2>
      <p className="text-muted-foreground">{error.message}</p>
      <Button onClick={reset}>Try again</Button>
    </div>
  )
}
```

### global-error.tsx (Root Layout 에러)

```tsx
// app/global-error.tsx — Root layout이 에러일 때
'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body>
        <h2>Something went wrong!</h2>
        <button onClick={reset}>Try again</button>
      </body>
    </html>
  )
}
```

### Error Boundary 배치 전략

```
app/
├── error.tsx              # 전역 폴백
├── global-error.tsx       # Root layout 에러
├── dashboard/
│   ├── error.tsx          # 대시보드 전체 에러
│   ├── analytics/
│   │   └── error.tsx      # 분석 페이지만 에러
│   └── settings/
│       └── error.tsx      # 설정 페이지만 에러
```

### not-found.tsx

```tsx
// app/not-found.tsx
import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="text-muted-foreground">페이지를 찾을 수 없습니다</p>
      <Link href="/" className="text-primary underline">홈으로 돌아가기</Link>
    </div>
  )
}

// 프로그래밍적 404 트리거
import { notFound } from 'next/navigation'

export default async function PostPage({ params }) {
  const post = await getPost(params.id)
  if (!post) notFound()  // not-found.tsx 렌더
  return <Post post={post} />
}
```

### 규칙
- `error.tsx`는 반드시 `'use client'`
- `error.tsx`는 **같은 레벨의 `layout.tsx`** 에러는 잡지 못함 → 상위에 배치
- `global-error.tsx`는 `<html>`, `<body>` 태그 포함 필수
- 중요 섹션마다 `error.tsx` 배치 — 한 섹션 에러가 전체 앱을 다운시키지 않도록


## 8. Metadata + SEO

### 정적 Metadata

```tsx
// app/layout.tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    default: 'Pinny',
    template: '%s | Pinny',  // 하위 페이지: "Dashboard | Pinny"
  },
  description: '당신의 모든 여정을 지도 위에',
  openGraph: {
    title: 'Pinny',
    description: '당신의 모든 여정을 지도 위에',
    url: 'https://pinny.app',
    siteName: 'Pinny',
    locale: 'ko_KR',
    type: 'website',
  },
}
```

### 동적 Metadata

```tsx
// app/post/[id]/page.tsx
import type { Metadata } from 'next'

export async function generateMetadata({ params }): Promise<Metadata> {
  const post = await getPost(params.id)

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      images: [post.coverImage],
    },
  }
}
```

### 규칙
- Root layout에 `title.template` 설정 → 하위 페이지는 `title`만 설정
- 동적 페이지는 `generateMetadata` 사용
- `metadata`는 Server Component에서만 export 가능 (`'use client'` 파일 불가)


## 9. Environment Variables

### 접근 규칙

| 접두사 | 접근 가능 | 용도 |
|--------|----------|------|
| `NEXT_PUBLIC_` | 서버 + 클라이언트 | 공개 API URL, 분석 ID |
| (접두사 없음) | 서버만 | DB URL, API 시크릿, 토큰 |

```tsx
// ✅ Server Component / Server Action에서
const dbUrl = process.env.DATABASE_URL          // 서버 전용 변수
const apiKey = process.env.STRIPE_SECRET_KEY    // 서버 전용 변수

// ✅ Client Component에서
const analyticsId = process.env.NEXT_PUBLIC_ANALYTICS_ID  // 공개 변수

// ❌ Client Component에서 — undefined
const dbUrl = process.env.DATABASE_URL  // 클라이언트에서 접근 불가
```

### 금지 사항
- 시크릿 키에 `NEXT_PUBLIC_` 접두사 금지 — 클라이언트에 노출
- Client Component에서 서버 전용 변수 접근 시도 금지 — 항상 undefined
- `.env.local`을 git에 커밋 금지
