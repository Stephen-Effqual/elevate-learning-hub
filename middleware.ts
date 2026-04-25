import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/login(.*)',
  '/api/auth(.*)',
  '/api/webhook(.*)',
])

// Routes that require a valid entitlement (access code or active subscription)
const isEntitledRoute = createRouteMatcher([
  '/chat(.*)',
  '/student(.*)',
  '/api/chat(.*)',
  '/api/session(.*)',
  '/api/files(.*)',
  '/api/feedback(.*)',
  '/api/usage(.*)',
  '/api/report(.*)',
])

const isAdminRoute = createRouteMatcher([
  '/admin(.*)',
  '/api/admin(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect()
  }

  const { userId, sessionClaims } = await auth()
  if (!userId) return

  // These come from the custom JWT template in Clerk dashboard → Configure → Sessions
  const role = sessionClaims?.role as string | undefined
  const accessUntil = sessionClaims?.accessUntil as string | undefined
  const subStatus = sessionClaims?.subscriptionStatus as string | undefined

  const hasAccess =
    ['active', 'trialing'].includes(subStatus ?? '') ||
    (accessUntil != null && new Date(accessUntil) > new Date())

  const isAdmin = role === 'admin'

  // Admins bypass the entitlement check entirely
  if (isEntitledRoute(req) && !hasAccess && !isAdmin) {
    return NextResponse.redirect(new URL('/redeem', req.url))
  }

  if (isAdminRoute(req) && !isAdmin) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }
})

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
}
