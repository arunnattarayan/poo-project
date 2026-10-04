import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

/**
 * Protects /admin/* :
 *  - refreshes the Supabase session cookie on every admin request
 *  - requires a logged-in user who is ALSO in the `admins` table (via is_admin() RPC)
 *  - sends already-authenticated admins away from /admin/login
 * RLS remains the real security boundary; this is the UX/routing layer.
 */
export async function middleware(request) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // getUser() validates the JWT with Supabase (getSession() would trust the cookie blindly).
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let isAdmin = false
  if (user) {
    const { data } = await supabase.rpc('is_admin')
    isAdmin = data === true
  }

  const { pathname, search } = request.nextUrl
  const isLoginPage = pathname === '/admin/login'

  // Redirect while preserving any refreshed auth cookies.
  const redirectTo = (url) => {
    const res = NextResponse.redirect(url)
    response.cookies.getAll().forEach((c) => res.cookies.set(c))
    return res
  }

  if (!isLoginPage && !isAdmin) {
    const url = new URL('/admin/login', request.url)
    url.searchParams.set('next', pathname + search)
    if (user) url.searchParams.set('error', 'not_admin')
    return redirectTo(url)
  }

  if (isLoginPage && isAdmin) {
    return redirectTo(new URL('/admin', request.url))
  }

  return response
}

export const config = {
  matcher: ['/admin', '/admin/:path*'],
}
