import { type NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  // Auth is handled client-side by AuthProvider (localStorage token)
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
