'use server';

import { db } from '@/db';
import { user } from '@/db/schema/auth';
import { nanoid } from 'nanoid';
import { eq, and, ilike } from 'drizzle-orm';
import { adminOnly } from '@/lib/auth-server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

// Validation schemas
const createUserSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email address'),
    role: z.enum(['CASHIER', 'ADMIN', 'STAKEHOLDER']),
    phone: z.string().optional(),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

const updateUserSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email address'),
    role: z.enum(['CASHIER', 'ADMIN', 'STAKEHOLDER']),
    phone: z.string().optional(),
    isActive: z.boolean(),
});

const changePasswordSchema = z.object({
    userId: z.string(),
    newPassword: z.string().min(6, 'Password must be at least 6 characters'),
});

// Types
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

// Get all users with pagination and filtering
export async function getUsers({
    page = 1,
    limit = 10,
    search = '',
    role = '',
}: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
} = {}) {
    const offset = (page - 1) * limit;

    const whereConditions = [];

    if (search) {
        whereConditions.push(
            ilike(user.name, `%${search}%`)
        );
    }

    if (role) {
        whereConditions.push(eq(user.role, role));
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    const [users, totalCount] = await Promise.all([
        db
            .select({
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone,
                isActive: user.isActive,
                emailVerified: user.emailVerified,
                createdAt: user.createdAt,
                lastLoginAt: user.lastLoginAt,
            })
            .from(user)
            .where(whereClause)
            .limit(limit)
            .offset(offset)
            .orderBy(user.createdAt),

        db.select({ count: db.fn.count(user.id) }).from(user).where(whereClause),
    ]);

    return {
        users,
        pagination: {
            page,
            limit,
            total: Number(totalCount[0]?.count) || 0,
            pages: Math.ceil((Number(totalCount[0]?.count) || 0) / limit),
        },
    };
}

// Get user by ID
export async function getUserById(id: string) {
    const foundUser = await db
        .select({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone,
            isActive: user.isActive,
            emailVerified: user.emailVerified,
            createdAt: user.createdAt,
            lastLoginAt: user.lastLoginAt,
        })
        .from(user)
        .where(eq(user.id, id))
        .limit(1);

    return foundUser[0] || null;
}

// Create new user
export const createUser = adminOnly(async (data: CreateUserInput) => {
    const validatedData = createUserSchema.parse(data);

    // Check if email already exists
    const existingUser = await db
        .select()
        .from(user)
        .where(eq(user.email, validatedData.email))
        .limit(1);

    if (existingUser.length > 0) {
        throw new Error('Email already exists');
    }

    // Create user with password
    const hashedPassword = await Bun.password.hash(validatedData.password);

    const [newUser] = await db
        .insert(user)
        .values({
            id: nanoid(),
            name: validatedData.name,
            email: validatedData.email,
            role: validatedData.role,
            phone: validatedData.phone || null,
            isActive: true,
            emailVerified: true,
        })
        .returning();

    // Store password in account table
    await db.insert(user._.relations.account).values({
        id: nanoid(),
        userId: newUser.id,
        providerId: 'credential',
        accountId: newUser.id,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
    });

    revalidatePath('/admin/users');
    return newUser;
});

// Update existing user
export const updateUser = adminOnly(async (id: string, data: UpdateUserInput) => {
    const validatedData = updateUserSchema.parse(data);

    // Check if email already exists for another user
    const existingUser = await db
        .select()
        .from(user)
        .where(and(eq(user.email, validatedData.email), eq(user.id, id)))
        .limit(1);

    if (existingUser.length === 0) {
        // Check if email exists for another user
        const emailExists = await db
            .select()
            .from(user)
            .where(and(eq(user.email, validatedData.email)))
            .limit(1);

        if (emailExists.length > 0) {
            throw new Error('Email already exists');
        }
    }

    const [updatedUser] = await db
        .update(user)
        .set({
            name: validatedData.name,
            email: validatedData.email,
            role: validatedData.role,
            phone: validatedData.phone || null,
            isActive: validatedData.isActive,
            updatedAt: new Date(),
        })
        .where(eq(user.id, id))
        .returning();

    if (!updatedUser) {
        throw new Error('User not found');
    }

    revalidatePath('/admin/users');
    return updatedUser;
});

// Delete user
export const deleteUser = adminOnly(async (id: string) => {
    const deletedUser = await db
        .delete(user)
        .where(eq(user.id, id))
        .returning();

    if (deletedUser.length === 0) {
        throw new Error('User not found');
    }

    revalidatePath('/admin/users');
    return deletedUser[0];
});

// Toggle user active status
export const toggleUserStatus = adminOnly(async (id: string) => {
    const existingUser = await db
        .select({ isActive: user.isActive })
        .from(user)
        .where(eq(user.id, id))
        .limit(1);

    if (!existingUser[0]) {
        throw new Error('User not found');
    }

    const [updatedUser] = await db
        .update(user)
        .set({
            isActive: !existingUser[0].isActive,
            updatedAt: new Date(),
        })
        .where(eq(user.id, id))
        .returning();

    revalidatePath('/admin/users');
    return updatedUser;
});

// Change user password
export const changeUserPassword = adminOnly(async (data: ChangePasswordInput) => {
    const validatedData = changePasswordSchema.parse(data);

    // Hash new password
    const hashedPassword = await Bun.password.hash(validatedData.newPassword);

    // Update password in account table
    await db
        .update(user._.relations.account)
        .set({
            password: hashedPassword,
            updatedAt: new Date(),
        })
        .where(eq(user._.relations.account.userId, validatedData.userId));

    return { success: true };
});