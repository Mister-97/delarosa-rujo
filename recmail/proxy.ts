import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function proxy(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request)
  const { pathname } = request.nextUrl

  // Protect dashboard and admin routes (disabled for dev preview)
  // if (!user && (pathname.startsWith('/dashboard') || pathname.startsWith('/admin'))) {
  //   const loginUrl = request.nextUrl.clone()
  //   loginUrl.pathname = '/login'
  //   return NextResponse.redirect(loginUrl)
  // }

  // Admin routes require admin status — checked in the admin layout server component
  // (proxy doesn't have service role access; admin check done server-side)

  return supabaseResponse
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
  ],
}
