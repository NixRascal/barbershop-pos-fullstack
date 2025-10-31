import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { headers } from 'next/headers';
import { userRole } from '@/db/schema/auth';

// Get current session with caching
export const getSession = cache(async () => {
    return await auth.api.getSession({
        headers: await headers(),
    });
});

// Get current user with role verification
export const getCurrentUser = cache(async () => {
    const session = await getSession();
    return session?.user || null;
});

// Role verification functions
export async function requireAuth() {
    const user = await getCurrentUser();

    if (!user) {
        redirect('/sign-in');
    }

    if (!user.isActive) {
        redirect('/sign-in?error=account_inactive');
    }

    return user;
}

export async function requireRole(requiredRole: keyof typeof userRole) {
    const user = await requireAuth();

    if (user.role !== requiredRole) {
        throw new Error(`Access denied. ${requiredRole} role required.`);
    }

    return user;
}

export async function requireAnyRole(roles: (keyof typeof userRole)[]) {
    const user = await requireAuth();

    if (!roles.includes(user.role as keyof typeof userRole)) {
        throw new Error(`Access denied. One of these roles required: ${roles.join(', ')}`);
    }

    return user;
}

export async function requireAdmin() {
    return await requireRole('ADMIN');
}

export async function requireCashier() {
    return await requireAnyRole(['CASHIER', 'ADMIN']);
}

export async function requireStakeholder() {
    return await requireAnyRole(['STAKEHOLDER', 'ADMIN']);
}

// Helper to get user from headers (for API routes)
export function getUserFromHeaders(headers: Headers) {
    const userId = headers.get('x-user-id');
    const userRole = headers.get('x-user-role');

    if (!userId || !userRole) {
        return null;
    }

    return { id: userId, role: userRole };
}

// Server action wrapper with role verification
export function withRoleVerification<T extends any[], R>(
    requiredRoles: (keyof typeof userRole)[],
    action: (...args: T) => Promise<R>
) {
    return async (...args: T): Promise<R> => {
        await requireAnyRole(requiredRoles);
        return await action(...args);
    };
}

// Server action wrapper for admins only
export function adminOnly<T extends any[], R>(
    action: (...args: T) => Promise<R>
) {
    return withRoleVerification(['ADMIN'], action);
}

// Server action wrapper for cashiers only
export function cashierOnly<T extends any[], R>(
    action: (...args: T) => Promise<R>
) {
    return withRoleVerification(['CASHIER', 'ADMIN'], action);
}

// Server action wrapper for stakeholders only
export function stakeholderOnly<T extends any[], R>(
    action: (...args: T) => Promise<R>
) {
    return withRoleVerification(['STAKEHOLDER', 'ADMIN'], action);
}