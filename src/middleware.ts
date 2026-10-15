import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSessionEdge, ADMIN_COOKIE_NAME } from '@/lib/security/admin-edge';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only protect admin routes
  if (pathname.startsWith('/admin')) {
    // Exclude /admin/login from blocking
    if (pathname === '/admin/login') {
      const adminCookie = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
      if (adminCookie) {
        const isAuth = await verifyAdminSessionEdge(adminCookie);
        if (isAuth) {
          // Already logged in as sumitdevthakur@gmail.com -> redirect to admin dashboard
          return NextResponse.redirect(new URL('/admin', req.url));
        }
      }
      return NextResponse.next();
    }

    // Check for admin session cookie
    const adminCookie = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
    const isValidAdmin = await verifyAdminSessionEdge(adminCookie);

    if (!isValidAdmin) {
      // Check if user is a customer with an active customer session
      const customerCookie = req.cookies.get('ph_customer_session')?.value;
      if (customerCookie) {
        // Ordinary customer trying to hit admin -> show simple website (redirect to /)
        return NextResponse.redirect(new URL('/', req.url));
      }

      // Unauthenticated visitor -> redirect to admin login
      const loginUrl = new URL('/admin/login', req.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all admin paths:
     * - /admin
     * - /admin/:path*
     */
    '/admin/:path*',
  ],
};
