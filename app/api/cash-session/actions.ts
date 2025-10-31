'use server';

import { db } from '@/db';
import { cashSession, cashLedger, shift, user, order, payment } from '@/db/schema';
import { nanoid } from 'nanoid';
import { eq, and, desc, asc, sum } from 'drizzle-orm';
import { cashierOnly } from '@/lib/auth-server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

// Types
export interface CashSessionData {
    id: string;
    shiftId?: string;
    shiftName?: string;
    openedBy: string;
    openedByName: string;
    openedAt: string;
    closedBy?: string;
    closedByName?: string;
    closedAt?: string;
    openingAmount: string;
    countedCash?: string;
    expectedCash?: string;
    variance?: string;
    notes?: string;
    isActive: boolean;
}

export interface CashLedgerEntry {
    id: string;
    cashSessionId: string;
    type: 'IN' | 'OUT';
    reason: string;
    amount: string;
    createdBy: string;
    createdByName: string;
    createdAt: string;
}

export interface CashSessionSummary {
    totalSales: string;
    cashPayments: string;
    cashIn: string;
    cashOut: string;
    expectedCash: string;
}

// Validation schemas
const openCashSessionSchema = z.object({
    shiftId: z.string().optional(),
    openingAmount: z.number().min(0),
    notes: z.string().optional(),
});

const closeCashSessionSchema = z.object({
    sessionId: z.string(),
    countedCash: z.number().min(0),
    notes: z.string().optional(),
});

const cashLedgerSchema = z.object({
    cashSessionId: z.string(),
    type: z.enum(['IN', 'OUT']),
    reason: z.string().min(1),
    amount: z.number().min(0),
});

// Get active cash session for current user
export async function getActiveCashSession(): Promise<CashSessionData | null> {
    // This would typically get the current user from the session
    // For now, we'll get the most recent active session
    const [session] = await db
        .select({
            id: cashSession.id,
            shiftId: cashSession.shiftId,
            shiftName: shift.name,
            openedBy: cashSession.openedBy,
            openedByName: user.name,
            openedAt: cashSession.openedAt,
            closedBy: cashSession.closedBy,
            closedByName: closedByUser.name,
            closedAt: cashSession.closedAt,
            openingAmount: cashSession.openingAmount,
            countedCash: cashSession.countedCash,
            expectedCash: cashSession.expectedCash,
            variance: cashSession.variance,
            notes: cashSession.notes,
            isActive: cashSession.isActive,
        })
        .from(cashSession)
        .leftJoin(shift, eq(cashSession.shiftId, shift.id))
        .leftJoin(user, eq(cashSession.openedBy, user.id))
        .leftJoin(user.as('closedByUser'), eq(cashSession.closedBy, closedByUser.id))
        .where(eq(cashSession.isActive, true))
        .orderBy(desc(cashSession.openedAt))
        .limit(1);

    return session || null;
}

// Get all cash sessions
export async function getCashSessions({
    page = 1,
    limit = 10,
    startDate,
    endDate,
}: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
} = {}) {
    const offset = (page - 1) * limit;

    let whereConditions = [];

    if (startDate) {
        whereConditions.push(cashSession.openedAt >= new Date(startDate));
    }

    if (endDate) {
        whereConditions.push(cashSession.openedAt <= new Date(endDate + 'T23:59:59'));
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    const [sessions, totalCount] = await Promise.all([
        db
            .select({
                id: cashSession.id,
                shiftId: cashSession.shiftId,
                shiftName: shift.name,
                openedBy: cashSession.openedBy,
                openedByName: user.name,
                openedAt: cashSession.openedAt,
                closedBy: cashSession.closedBy,
                closedByName: closedByUser.name,
                closedAt: cashSession.closedAt,
                openingAmount: cashSession.openingAmount,
                countedCash: cashSession.countedCash,
                expectedCash: cashSession.expectedCash,
                variance: cashSession.variance,
                notes: cashSession.notes,
                isActive: cashSession.isActive,
            })
            .from(cashSession)
            .leftJoin(shift, eq(cashSession.shiftId, shift.id))
            .leftJoin(user, eq(cashSession.openedBy, user.id))
            .leftJoin(user.as('closedByUser'), eq(cashSession.closedBy, closedByUser.id))
            .where(whereClause)
            .orderBy(desc(cashSession.openedAt))
            .limit(limit)
            .offset(offset),

        db.select({ count: db.fn.count(cashSession.id) }).from(cashSession).where(whereClause),
    ]);

    return {
        sessions,
        pagination: {
            page,
            limit,
            total: Number(totalCount[0]?.count) || 0,
            pages: Math.ceil((Number(totalCount[0]?.count) || 0) / limit),
        },
    };
}

// Get shifts
export async function getShifts() {
    return await db
        .select()
        .from(shift)
        .where(eq(shift.isActive, true))
        .orderBy(asc(shift.startTime));
}

// Open cash session
export const openCashSession = cashierOnly(async (data: {
    shiftId?: string;
    openingAmount: number;
    notes?: string;
}) => {
    const validatedData = openCashSessionSchema.parse(data);

    // Check if there's already an active session
    const activeSession = await getActiveCashSession();
    if (activeSession) {
        throw new Error('There is already an active cash session. Please close it first.');
    }

    const [newSession] = await db
        .insert(cashSession)
        .values({
            id: nanoid(),
            shiftId: validatedData.shiftId || null,
            openedBy: 'current-user-id', // This should come from the session
            openingAmount: validatedData.openingAmount.toString(),
            notes: validatedData.notes || null,
            openedAt: new Date(),
            isActive: true,
        })
        .returning();

    revalidatePath('/cash-session');
    return newSession;
});

// Close cash session
export const closeCashSession = cashierOnly(async (data: {
    sessionId: string;
    countedCash: number;
    notes?: string;
}) => {
    const validatedData = closeCashSessionSchema.parse(data);

    // Get session details
    const [sessionData] = await db
        .select()
        .from(cashSession)
        .where(eq(cashSession.id, validatedData.sessionId))
        .limit(1);

    if (!sessionData) {
        throw new Error('Cash session not found');
    }

    if (!sessionData.isActive) {
        throw new Error('Cash session is already closed');
    }

    // Calculate expected cash
    const summary = await calculateCashSessionSummary(validatedData.sessionId);
    const expectedCash = parseFloat(summary.expectedCash);
    const countedCashNum = validatedData.countedCash;
    const variance = countedCashNum - expectedCash;

    const [closedSession] = await db
        .update(cashSession)
        .set({
            closedBy: 'current-user-id', // This should come from the session
            closedAt: new Date(),
            countedCash: countedCashNum.toString(),
            expectedCash: expectedCash.toString(),
            variance: variance.toString(),
            notes: validatedData.notes || sessionData.notes,
            isActive: false,
            updatedAt: new Date(),
        })
        .where(eq(cashSession.id, validatedData.sessionId))
        .returning();

    revalidatePath('/cash-session');
    return closedSession;
});

// Calculate cash session summary
async function calculateCashSessionSummary(sessionId: string): Promise<CashSessionSummary> {
    // Get cash payments from orders
    const cashPaymentsResult = await db
        .select({ amount: sum(payment.amount) })
        .from(payment)
        .innerJoin(order, eq(payment.orderId, order.id))
        .where(and(
            eq(order.cashSessionId, sessionId),
            eq(payment.method, 'CASH')
        ));

    const cashPayments = parseFloat(cashPaymentsResult[0]?.amount || '0');

    // Get cash ledger entries
    const cashInResult = await db
        .select({ amount: sum(cashLedger.amount) })
        .from(cashLedger)
        .where(and(
            eq(cashLedger.cashSessionId, sessionId),
            eq(cashLedger.type, 'IN')
        ));

    const cashOutResult = await db
        .select({ amount: sum(cashLedger.amount) })
        .from(cashLedger)
        .where(and(
            eq(cashLedger.cashSessionId, sessionId),
            eq(cashLedger.type, 'OUT')
        ));

    const cashIn = parseFloat(cashInResult[0]?.amount || '0');
    const cashOut = parseFloat(cashOutResult[0]?.amount || '0');

    // Get session opening amount
    const [sessionData] = await db
        .select({ openingAmount: cashSession.openingAmount })
        .from(cashSession)
        .where(eq(cashSession.id, sessionId))
        .limit(1);

    const openingAmount = parseFloat(sessionData?.openingAmount || '0');

    const expectedCash = openingAmount + cashPayments + cashIn - cashOut;

    return {
        totalSales: cashPayments.toString(),
        cashPayments: cashPayments.toString(),
        cashIn: cashIn.toString(),
        cashOut: cashOut.toString(),
        expectedCash: expectedCash.toString(),
    };
}

// Get cash session summary
export async function getCashSessionSummary(sessionId: string): Promise<CashSessionSummary> {
    return await calculateCashSessionSummary(sessionId);
}

// Add cash ledger entry
export const addCashLedgerEntry = cashierOnly(async (data: {
    cashSessionId: string;
    type: 'IN' | 'OUT';
    reason: string;
    amount: number;
}) => {
    const validatedData = cashLedgerSchema.parse(data);

    // Verify cash session is active
    const [sessionData] = await db
        .select()
        .from(cashSession)
        .where(eq(cashSession.id, validatedData.cashSessionId))
        .limit(1);

    if (!sessionData) {
        throw new Error('Cash session not found');
    }

    if (!sessionData.isActive) {
        throw new Error('Cannot add entries to closed cash session');
    }

    const [ledgerEntry] = await db
        .insert(cashLedger)
        .values({
            id: nanoid(),
            cashSessionId: validatedData.cashSessionId,
            type: validatedData.type,
            reason: validatedData.reason,
            amount: validatedData.amount.toString(),
            createdBy: 'current-user-id', // This should come from the session
            createdAt: new Date(),
        })
        .returning();

    revalidatePath('/cash-session');
    return ledgerEntry;
});

// Get cash ledger entries for a session
export async function getCashLedgerEntries(sessionId: string): Promise<CashLedgerEntry[]> {
    const entries = await db
        .select({
            id: cashLedger.id,
            cashSessionId: cashLedger.cashSessionId,
            type: cashLedger.type,
            reason: cashLedger.reason,
            amount: cashLedger.amount,
            createdBy: cashLedger.createdBy,
            createdByName: user.name,
            createdAt: cashLedger.createdAt,
        })
        .from(cashLedger)
        .leftJoin(user, eq(cashLedger.createdBy, user.id))
        .where(eq(cashLedger.cashSessionId, sessionId))
        .orderBy(desc(cashLedger.createdAt));

    return entries;
}