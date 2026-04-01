---
name: web-ui-patterns
description: "React web UI patterns: shadcn/ui, Radix Dialog/Toast, react-hook-form + Zod, DataTable, responsive layouts, dark mode (next-themes), Skeleton loading, accessibility, Framer Motion animations. Use when building React web UI."
user-invocable: false
---

# React Web UI Patterns

React 웹 앱 (Next.js, Vite SPA 등) 공통 UI 패턴.
shadcn/ui + Radix UI + Tailwind CSS 기준.


## 1. Dialog / Modal

### 표준: Radix Dialog (shadcn/ui)

```tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'

<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>{title}</DialogTitle>
      <DialogDescription>{description}</DialogDescription>
    </DialogHeader>
    {children}
    <DialogFooter>
      <DialogClose asChild>
        <Button variant="outline">Cancel</Button>
      </DialogClose>
      <Button onClick={onConfirm}>Confirm</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### 자동 제공되는 접근성
- Focus trap (Tab 키가 모달 내부에 갇힘)
- ESC로 닫기
- 외부 클릭으로 닫기
- aria-labelledby, aria-describedby 자동 연결
- 닫기 후 트리거 요소로 포커스 복원

### URL 동기화 모달 (Next.js)

```tsx
// 모달 상태를 URL에 반영 → 공유 가능, 뒤로가기로 닫기
'use client'
import { useSearchParams, useRouter } from 'next/navigation'

export function EditDialog() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const isOpen = searchParams.get('modal') === 'edit'

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) router.back()
      }}
    >
      <DialogContent>...</DialogContent>
    </Dialog>
  )
}
```

### 반응형 Dialog ↔ Drawer 전환

```tsx
// 데스크탑: Dialog (중앙 모달)
// 모바일: Drawer (하단 시트)
import { useMediaQuery } from '@/hooks/use-media-query'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Drawer, DrawerContent } from '@/components/ui/drawer'

export function ResponsiveModal({ children, ...props }) {
  const isDesktop = useMediaQuery('(min-width: 768px)')

  if (isDesktop) {
    return (
      <Dialog {...props}>
        <DialogContent>{children}</DialogContent>
      </Dialog>
    )
  }

  return (
    <Drawer {...props}>
      <DrawerContent>{children}</DrawerContent>
    </Drawer>
  )
}
```

### 금지 사항
- `window.confirm()` 사용 금지 — 커스텀 Dialog 사용
- 중첩 모달 금지 — 하나 닫고 다른 하나 열기 (또는 Sheet 안에 Dialog)
- `open` 상태 없이 uncontrolled 모달 사용 지양 — URL 연동 불가


## 2. Toast / Notification
> Toast vs Dialog 공통 원칙은 `frontend-conventions.md` §3에 정의.

### 표준: sonner (shadcn/ui 권장)

```tsx
// layout.tsx — 글로벌 Toaster 등록
import { Toaster } from '@/components/ui/sonner'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  )
}

// 사용
import { toast } from 'sonner'

toast.success('저장되었습니다')
toast.error('오류가 발생했습니다')
toast.loading('저장 중...')
toast.promise(saveData(), {
  loading: '저장 중...',
  success: '저장 완료',
  error: '저장 실패',
})
```

### Toast vs Alert Dialog 결정 기준

| 상황 | 컴포넌트 | 이유 |
|------|---------|------|
| 성공 피드백 | `toast.success()` | 비차단, 자동 사라짐 |
| 비차단 에러 | `toast.error()` | 사용자 작업 방해 X |
| 삭제 확인 | `AlertDialog` | 사용자 결정 필요 |
| 되돌리기 가능 삭제 | `toast()` + Undo 버튼 | 사후 취소 |
| 치명적 에러 | `AlertDialog` | 반드시 확인 필요 |

### Undo Toast 패턴

```tsx
toast('항목이 삭제되었습니다', {
  action: {
    label: 'Undo',
    onClick: () => restoreItem(id),
  },
  duration: 5000,
})
```

### 금지 사항
- `alert()` 사용 금지 — 네이티브 alert는 쓰레드 블로킹
- 구 shadcn toast 컴포넌트 사용 금지 — sonner로 대체됨


## 3. Form Patterns
> Form Validation 공통 원칙은 `frontend-conventions.md` §4에 정의.

### react-hook-form + Zod 표준 구조

```tsx
// 1. Schema 정의 (공유: 클라이언트 + 서버)
// schemas/user.ts
import { z } from 'zod'

export const userSchema = z.object({
  email: z.string().email('올바른 이메일을 입력하세요'),
  name: z.string().min(2, '2자 이상 입력하세요').max(50),
  age: z.coerce.number().min(1).max(150).optional(),
})

export type UserFormData = z.infer<typeof userSchema>
```

```tsx
// 2. Form 컴포넌트
'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { userSchema, type UserFormData } from '@/schemas/user'

export function UserForm({ defaultValues, onSubmit }) {
  const form = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues,
    mode: 'onBlur',  // blur 시 검증 (타이핑 중 에러 방지)
  })

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input {...form.register('email')} />
        {form.formState.errors.email && (
          <p className="text-sm text-destructive">
            {form.formState.errors.email.message}
          </p>
        )}
      </div>

      <Button type="submit" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? 'Saving...' : 'Save'}
      </Button>
    </form>
  )
}
```

### Zod 스키마 공유 원칙
- **하나의 스키마 → 클라이언트 검증 + 서버 검증 모두 사용**
- 클라이언트: `zodResolver(schema)` → 실시간 폼 검증
- 서버: `schema.parse(data)` → Server Action/API Route 검증
- 스키마 파일은 `schemas/` 또는 `lib/validations/` 디렉토리에 분리

### 에러 표시 패턴
- **필드별 인라인 에러**: 각 입력 아래에 빨간 텍스트
- **폼 상단 에러 서머리**: 서버 에러 또는 여러 필드 에러 요약
- **Submit 버튼 비활성화**: `isSubmitting` 동안 중복 제출 방지

### 금지 사항
- Zod 없이 수동 validation 금지 — 클라이언트/서버 스키마 불일치 위험
- `onChange` 모드 사용 지양 — 매 타이핑마다 검증은 UX 저하, `onBlur` 권장
- Submit 버튼에 `disabled={!isValid}` 금지 — 사용자가 왜 비활성인지 모름, 제출 시 에러 표시가 더 나음


## 4. Table / DataGrid

### URL Search Params로 상태 관리

```tsx
// 정렬, 필터, 페이지를 URL에 동기화
// /users?sort=name&order=asc&page=2&status=active
'use client'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'

export function DataTable() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const sort = searchParams.get('sort') ?? 'createdAt'
  const order = searchParams.get('order') ?? 'desc'
  const page = Number(searchParams.get('page') ?? '1')

  function updateParams(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams)
    Object.entries(updates).forEach(([key, value]) => {
      if (value) params.set(key, value)
      else params.delete(key)
    })
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <Table>
      <TableHeader>
        <TableHead onClick={() => updateParams({ sort: 'name', order: order === 'asc' ? 'desc' : 'asc' })}>
          Name {sort === 'name' && (order === 'asc' ? '↑' : '↓')}
        </TableHead>
      </TableHeader>
      {/* rows */}
      <Pagination page={page} onPageChange={(p) => updateParams({ page: String(p) })} />
    </Table>
  )
}
```

### 핵심 원칙
- **테이블 상태 = URL**: 정렬, 필터, 페이지 모두 search params
- **공유 가능**: URL 복사 → 동일한 뷰
- **뒤로가기 동작**: 이전 필터/페이지로 자연스럽게 복원
- **서버 사이드 처리**: 정렬/필터/페이지네이션은 서버(API)에서 처리, 클라이언트는 params 전달만

### Bulk Actions 패턴

```tsx
const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

<TableHead>
  <Checkbox
    checked={selectedIds.size === data.length}
    onCheckedChange={(checked) =>
      setSelectedIds(checked ? new Set(data.map(d => d.id)) : new Set())
    }
  />
</TableHead>

{selectedIds.size > 0 && (
  <div className="flex items-center gap-2">
    <span>{selectedIds.size}개 선택됨</span>
    <Button variant="destructive" onClick={() => bulkDelete([...selectedIds])}>
      삭제
    </Button>
  </div>
)}
```


## 5. Layout Patterns

### Sidebar + Content (Dashboard)

```tsx
export default function DashboardLayout({ children }) {
  return (
    <div className="flex h-screen">
      <Sidebar className="hidden md:flex w-64 shrink-0" />
      <main className="flex-1 overflow-auto">
        <MobileHeader className="md:hidden" />  {/* 모바일에서만 햄버거 */}
        {children}
      </main>
    </div>
  )
}
```

### Breadcrumbs

```tsx
// 계층 네비게이션 (모바일 앱에는 없는 웹 패턴)
<Breadcrumb>
  <BreadcrumbList>
    <BreadcrumbItem><BreadcrumbLink href="/">Home</BreadcrumbLink></BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem><BreadcrumbLink href="/trips">Trips</BreadcrumbLink></BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem><BreadcrumbPage>Tokyo 2025</BreadcrumbPage></BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>
```

### Command Palette (⌘K)

```tsx
'use client'
import { CommandDialog, CommandInput, CommandList, CommandItem, CommandGroup } from '@/components/ui/command'

export function CommandMenu() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen(prev => !prev)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="명령어 입력..." />
      <CommandList>
        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => router.push('/dashboard')}>Dashboard</CommandItem>
          <CommandItem onSelect={() => router.push('/settings')}>Settings</CommandItem>
        </CommandGroup>
        <CommandGroup heading="Actions">
          <CommandItem onSelect={() => setTheme('dark')}>Dark Mode</CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
```


## 6. Dark Mode

### next-themes + Tailwind CSS

```tsx
// providers.tsx
'use client'
import { ThemeProvider } from 'next-themes'

export function Providers({ children }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
    </ThemeProvider>
  )
}

// layout.tsx
<html lang="ko" suppressHydrationWarning>  {/* FOUC 방지 필수 */}
  <body>
    <Providers>{children}</Providers>
  </body>
</html>
```

### CSS Variables 시스템 (shadcn/ui)

```css
/* globals.css */
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    /* ... */
  }
  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --primary: 210 40% 98%;
    /* ... */
  }
}
```

### 테마 토글 컴포넌트

```tsx
'use client'
import { useTheme } from 'next-themes'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
      <Sun className="h-4 w-4 dark:hidden" />
      <Moon className="hidden h-4 w-4 dark:block" />
    </Button>
  )
}
```

### 핵심 규칙
- `<html>` 태그에 `suppressHydrationWarning` 필수 — SSR 불일치 방지
- 색상은 CSS 변수 사용 — 하드코딩 `bg-white dark:bg-gray-900` 지양
- `bg-background text-foreground` 시맨틱 클래스 사용
- FOUC(Flash of Unstyled Content) 방지: next-themes가 `<script>`로 초기 테마 주입


## 7. Loading States (3-Tier)

> 핵심 원칙 (Skeleton-First, Stale-While-Revalidate, Container 표준 패턴)은 `react-data-patterns.md` §7에 정의되어 있다.
> 이 섹션은 웹 전용 구현(shadcn Skeleton, loading.tsx, Suspense 스트리밍)을 다룬다.

### Tier 1: Skeleton (컴포넌트 레벨)

```tsx
import { Skeleton } from '@/components/ui/skeleton'

function CardSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-48 w-full rounded-xl" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  )
}
```

### Tier 2: loading.tsx (라우트 레벨, Next.js)

```tsx
// app/dashboard/loading.tsx — 자동 Suspense boundary
export default function Loading() {
  return (
    <div className="space-y-4 p-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}
```

### Tier 3: Suspense (스트리밍, Next.js)

```tsx
// 페이지 일부만 로딩 (나머지는 즉시 렌더)
export default function Dashboard() {
  return (
    <div>
      <Header />  {/* 즉시 렌더 */}
      <Suspense fallback={<ChartSkeleton />}>
        <SlowChart />  {/* 데이터 준비되면 스트리밍 */}
      </Suspense>
    </div>
  )
}
```

### 규칙
- 전체 페이지 스피너 금지 — Skeleton으로 레이아웃 유지
- `loading.tsx`는 라우트 전환용, `Suspense`는 컴포넌트 단위 스트리밍용
- 데이터가 빠르게 오는 경우 (< 200ms) skeleton 불필요 — 번쩍임 유발


## 8. Responsive Design

### Tailwind Breakpoint 규칙

```tsx
// Mobile-first: 기본 = 모바일, md: = 태블릿, lg: = 데스크탑
<div className="
  grid grid-cols-1     {/* 모바일: 1열 */}
  md:grid-cols-2       {/* 태블릿: 2열 */}
  lg:grid-cols-3       {/* 데스크탑: 3열 */}
  gap-4
">
```

### 반응형 컴포넌트 전환

| 데스크탑 | 모바일 | 패턴 |
|---------|--------|------|
| Dialog (중앙 모달) | Drawer (하단 시트) | `useMediaQuery` 분기 |
| Sidebar (고정) | Sheet (오버레이) | `hidden md:flex` + Sheet |
| Table | Card List | 별도 컴포넌트 렌더 |
| Hover tooltip | Long-press tooltip | Touch 이벤트 분기 |
| `⌘K` palette | 검색 페이지 | 별도 라우트 |

### useMediaQuery Hook

```tsx
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const media = window.matchMedia(query)
    setMatches(media.matches)
    const listener = (e: MediaQueryListEvent) => setMatches(e.matches)
    media.addEventListener('change', listener)
    return () => media.removeEventListener('change', listener)
  }, [query])

  return matches
}

// 사용
const isDesktop = useMediaQuery('(min-width: 768px)')
```


## 9. Accessibility (접근성)

### 키보드 네비게이션 필수 규칙

| 키 | 동작 |
|----|------|
| `Tab` | 다음 포커스 가능 요소로 이동 |
| `Shift+Tab` | 이전 포커스 가능 요소로 이동 |
| `Enter` / `Space` | 버튼/링크 활성화 |
| `Escape` | 모달/드롭다운 닫기 |
| `Arrow Keys` | 메뉴/리스트 내 이동 |
| `Home` / `End` | 리스트 처음/끝으로 이동 |

### Focus Management

```tsx
// 모달 열기 → 모달 내부로 포커스 이동 (Radix 자동 처리)
// 모달 닫기 → 트리거 요소로 포커스 복원 (Radix 자동 처리)

// 수동 포커스 관리가 필요한 경우:
const inputRef = useRef<HTMLInputElement>(null)

useEffect(() => {
  if (isEditing) {
    inputRef.current?.focus()  // 편집 모드 진입 시 포커스
  }
}, [isEditing])
```

### Skip Link (본문 바로가기)

```tsx
// layout.tsx — 최상단에 배치
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-background focus:text-foreground"
>
  본문으로 바로가기
</a>

<main id="main-content">
  {children}
</main>
```

### Reduced Motion

```tsx
// 애니메이션 비활성화 존중
<div className="transition-transform duration-300 motion-reduce:transition-none">
  {/* content */}
</div>

// Framer Motion
<motion.div
  animate={{ opacity: 1, y: 0 }}
  transition={{
    duration: prefersReducedMotion ? 0 : 0.3,
  }}
/>
```

### 핵심 체크리스트
- [ ] 모든 인터랙티브 요소 키보드 접근 가능
- [ ] 이미지에 `alt` 텍스트 (장식용은 `alt=""`)
- [ ] 폼 입력에 `<Label>` 연결 (`htmlFor`)
- [ ] 색상만으로 정보 전달 금지 (아이콘/텍스트 병행)
- [ ] Focus visible 스타일 유지 (`outline` 제거 금지)
- [ ] `motion-reduce` 미디어 쿼리 존중


## 10. Animation (웹)

### Tailwind Transition (간단한 전환)

```tsx
// 호버, 포커스 등 간단한 전환
<Button className="transition-colors duration-200 hover:bg-primary/90">
  Click
</Button>

// 등장 애니메이션
<div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
  {content}
</div>
```

### Framer Motion (복잡한 애니메이션)

```tsx
import { motion, AnimatePresence } from 'framer-motion'

// 리스트 아이템 등장
{items.map((item, i) => (
  <motion.div
    key={item.id}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ delay: i * 0.05, duration: 0.2 }}
  >
    <Card item={item} />
  </motion.div>
))}

// 페이지 전환 (AnimatePresence)
<AnimatePresence mode="wait">
  <motion.div
    key={pathname}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
  >
    {children}
  </motion.div>
</AnimatePresence>
```

### 규칙
- 간단한 전환: Tailwind `transition-*` 사용
- 복잡한 애니메이션 (등장/퇴장, 레이아웃): Framer Motion 사용
- `prefers-reduced-motion` 항상 존중
- 애니메이션 duration: 150-300ms (너무 길면 느리게 느껴짐)
