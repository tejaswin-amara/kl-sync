import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const isDashboard = request.nextUrl.pathname.startsWith('/dashboard')
  
  if (isDashboard) {
    const sessionCookie = request.cookies.get('kl_erp_session')
    // If the user doesn't have the session cookie, redirect them to the login page
    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/dashboard'],
}
