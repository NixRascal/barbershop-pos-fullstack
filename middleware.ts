import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';

// Define route protection rules
const publicRoutes = [
    '/',
    '/sign-in',
    '/sign-up',
    '/api/auth',
];

const adminRoutes = [
    '/admin',
    '/api/admin',
];

const stakeholderRoutes = [
    '/dashboard',
    '/api/dashboard',
];

const cashierRoutes = [
    '/pos',
    '/api/pos',
    '/cash-session',
    '/api/cash-session',
];

export default async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Check if route is public
    if (publicRoutes.some(route => pathname.startsWith(route))) {
        return NextResponse.next();
    }

    // Get session
    const session = await auth.api.getSession({
        headers: request.headers,
    });

    // If no session, redirect to sign-in
    if (!session || !session.user) {
        const url = new URL('/sign-in', request.url);
        url.searchParams.set('redirect', pathname);
        return NextResponse.redirect(url);
    }

    const userRole = session.user.role;
    const isActive = session.user.isActive;

    // Check if user is active
    if (isActive === false) {
        const url = new URL('/sign-in', request.url);
        url.searchParams.set('error', 'account_inactive');
        return NextResponse.redirect(url);
    }

    // Check admin routes
    if (adminRoutes.some(route => pathname.startsWith(route))) {
        if (userRole !== 'ADMIN') {
            return NextResponse.json(
                { error: 'Access denied. Admin role required.' },
                { status: 403 }
            );
        }
    }

    // Check stakeholder routes
    if (stakeholderRoutes.some(route => pathname.startsWith(route))) {
        if (userRole !== 'ADMIN' && userRole !== 'STAKEHOLDER') {
            return NextResponse.json(
                { error: 'Access denied. Admin or Stakeholder role required.' },
                { status: 403 }
            );
        }
    }

    // Check cashier routes
    if (cashierRoutes.some(route => pathname.startsWith(route))) {
        if (userRole !== 'ADMIN' && userRole !== 'CASHIER') {
            return NextResponse.json(
                { error: 'Access denied. Cashier or Admin role required.' },
                { status: 403 }
            );
        }
    }

    // Add user info to headers for downstream use
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', session.user.id);
    requestHeaders.set('x-user-role', userRole);

    return NextResponse.next({
        request: {
            headers: requestHeaders,
        },
    });
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};