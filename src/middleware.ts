import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher(['/login(.*)', '/register(.*)', '/', '/api(.*)'])

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    '/((?!.*[.]+|_next).*)', // Semua route kecuali file dan _next
    '/', 
    '/api(.*)',
    '/dashboard(.*)'
  ],
}