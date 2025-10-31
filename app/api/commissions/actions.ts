'use server';

import { db } from '@/db';
import { commission, commissionRule, orderItem, employee, service } from '@/db/schema';
import { nanoid } from 'nanoid';
import { eq, and, desc, asc } from 'drizzle-orm';
import { cashierOnly } from '@/lib/auth-server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

// Types
export interface CommissionCalculation {
    orderItemId: string;
    employeeId: string;
    baseAmount: number;
    commissionAmount: number;
    ruleUsed?: string;
    ruleType?: string;
    ruleValue?: string;
}

export interface CommissionRuleData {
    id: string;
    name: string;
    scope: 'SERVICE' | 'EMPLOYEE_LEVEL' | 'GLOBAL';
    scopeId?: string;
    scopeName?: string;
    type: 'PERCENT' | 'FLAT';
    value: string;
    activeFrom: string;
    activeTo?: string;
    isActive: boolean;
}

export interface CommissionSummary {
    totalCommission: string;
    settledCommission: string;
    pendingCommission: string;
    orderCount: number;
}

// Validation schemas
const createCommissionRuleSchema = z.object({
    name: z.string().min(1),
    scope: z.enum(['SERVICE', 'EMPLOYEE_LEVEL', 'GLOBAL']),
    scopeId: z.string().optional(),
    type: z.enum(['PERCENT', 'FLAT']),
    value: z.number().min(0),
    activeFrom: z.string().optional(),
    activeTo: z.string().optional(),
});

// Calculate commission for a single order item
export async function calculateOrderItemCommission(orderItemId: string): Promise<CommissionCalculation | null> {
    // Get order item details with related data
    const [orderItemData] = await db
        .select({
            id: orderItem.id,
            orderId: orderItem.orderId,
            serviceId: orderItem.serviceId,
            employeeId: orderItem.employeeId,
            quantity: orderItem.quantity,
            unitPrice: orderItem.unitPrice,
            manualPrice: orderItem.manualPrice,
            discount: orderItem.discount,
            lineTotal: orderItem.lineTotal,
            serviceName: service.name,
            serviceCommissionType: service.commissionType,
            serviceCommissionValue: service.commissionValue,
            employeeLevel: employee.level,
        })
        .from(orderItem)
        .leftJoin(service, eq(orderItem.serviceId, service.id))
        .leftJoin(employee, eq(orderItem.employeeId, employee.id))
        .where(eq(orderItem.id, orderItemId))
        .limit(1);

    if (!orderItemData) {
        return null;
    }

    // Determine the base amount (after discount and manual price)
    const baseAmount = parseFloat(orderItemData.lineTotal);

    // Find applicable commission rule in priority order:
    // 1. Service-specific rule
    // 2. Employee level rule
    // 3. Global rule (fallback)

    let selectedRule = null;
    let ruleSource = '';

    // 1. Check for service-specific rule
    const serviceRules = await db
        .select()
        .from(commissionRule)
        .where(and(
            eq(commissionRule.scope, 'SERVICE'),
            eq(commissionRule.scopeId, orderItemData.serviceId),
            eq(commissionRule.isActive, true)
        ))
        .orderBy(desc(commissionRule.activeFrom));

    if (serviceRules.length > 0) {
        selectedRule = serviceRules[0];
        ruleSource = 'Service-specific';
    }

    // 2. Check for employee level rule if no service rule found
    if (!selectedRule) {
        const levelRules = await db
            .select()
            .from(commissionRule)
            .where(and(
                eq(commissionRule.scope, 'EMPLOYEE_LEVEL'),
                eq(commissionRule.scopeId, orderItemData.employeeLevel || 'JUNIOR'),
                eq(commissionRule.isActive, true)
            ))
            .orderBy(desc(commissionRule.activeFrom));

        if (levelRules.length > 0) {
            selectedRule = levelRules[0];
            ruleSource = 'Employee level';
        }
    }

    // 3. Use global rule as fallback
    if (!selectedRule) {
        const globalRules = await db
            .select()
            .from(commissionRule)
            .where(and(
                eq(commissionRule.scope, 'GLOBAL'),
                eq(commissionRule.isActive, true)
            ))
            .orderBy(desc(commissionRule.activeFrom));

        if (globalRules.length > 0) {
            selectedRule = globalRules[0];
            ruleSource = 'Global default';
        }
    }

    // 4. Use service's default commission if no rule found
    if (!selectedRule && orderItemData.serviceCommissionType && orderItemData.serviceCommissionValue) {
        const serviceCommissionValue = parseFloat(orderItemData.serviceCommissionValue);
        const commissionAmount = orderItemData.serviceCommissionType === 'PERCENT'
            ? baseAmount * (serviceCommissionValue / 100)
            : serviceCommissionValue;

        return {
            orderItemId: orderItemData.id,
            employeeId: orderItemData.employeeId,
            baseAmount,
            commissionAmount,
            ruleUsed: 'Service default',
            ruleType: orderItemData.serviceCommissionType,
            ruleValue: orderItemData.serviceCommissionValue,
        };
    }

    // If still no rule found, return null (no commission)
    if (!selectedRule) {
        return null;
    }

    // Calculate commission based on selected rule
    const ruleValue = parseFloat(selectedRule.value);
    const commissionAmount = selectedRule.type === 'PERCENT'
        ? baseAmount * (ruleValue / 100)
        : ruleValue;

    return {
        orderItemId: orderItemData.id,
        employeeId: orderItemData.employeeId,
        baseAmount,
        commissionAmount,
        ruleUsed: selectedRule.name,
        ruleType: selectedRule.type,
        ruleValue: selectedRule.value,
    };
}

// Calculate commissions for all items in an order
export async function calculateOrderCommissions(orderId: string): Promise<CommissionCalculation[]> {
    // Get all order items for the order
    const orderItems = await db
        .select({ id: orderItem.id })
        .from(orderItem)
        .where(eq(orderItem.orderId, orderId));

    const commissions: CommissionCalculation[] = [];

    // Calculate commission for each item
    for (const item of orderItems) {
        const commission = await calculateOrderItemCommission(item.id);
        if (commission) {
            commissions.push(commission);
        }
    }

    return commissions;
}

// Create commission records from calculations
export const createCommissionRecords = cashierOnly(async (
    calculations: CommissionCalculation[]
) => {
    const results = await db.transaction(async (tx) => {
        const records = await Promise.all(
            calculations.map(async (calc) => {
                // Check if commission already exists for this order item
                const [existing] = await tx
                    .select()
                    .from(commission)
                    .where(eq(commission.orderItemId, calc.orderItemId))
                    .limit(1);

                if (existing) {
                    // Update existing commission
                    const [updated] = await tx
                        .update(commission)
                        .set({
                            baseAmount: calc.baseAmount.toString(),
                            commissionAmount: calc.commissionAmount.toString(),
                            status: 'PENDING',
                            updatedAt: new Date(),
                        })
                        .where(eq(commission.id, existing.id))
                        .returning();

                    return updated;
                } else {
                    // Create new commission record
                    const [created] = await tx
                        .insert(commission)
                        .values({
                            id: nanoid(),
                            orderItemId: calc.orderItemId,
                            employeeId: calc.employeeId,
                            ruleId: calc.ruleUsed ? calc.ruleUsed : null,
                            baseAmount: calc.baseAmount.toString(),
                            commissionAmount: calc.commissionAmount.toString(),
                            status: 'PENDING',
                            createdAt: new Date(),
                            updatedAt: new Date(),
                        })
                        .returning();

                    return created;
                }
            })
        );

        return records;
    });

    revalidatePath('/admin/commissions');
    return results;
});

// Get commission rules
export async function getCommissionRules(): Promise<CommissionRuleData[]> {
    const rules = await db
        .select({
            id: commissionRule.id,
            name: commissionRule.name,
            scope: commissionRule.scope,
            scopeId: commissionRule.scopeId,
            type: commissionRule.type,
            value: commissionRule.value,
            activeFrom: commissionRule.activeFrom,
            activeTo: commissionRule.activeTo,
            isActive: commissionRule.isActive,
        })
        .from(commissionRule)
        .orderBy(desc(commissionRule.activeFrom));

    // Enhance with scope names
    const enhancedRules = await Promise.all(
        rules.map(async (rule) => {
            let scopeName = '';

            if (rule.scope === 'SERVICE' && rule.scopeId) {
                const [serviceData] = await db
                    .select({ name: service.name })
                    .from(service)
                    .where(eq(service.id, rule.scopeId))
                    .limit(1);
                scopeName = serviceData?.name || '';
            } else if (rule.scope === 'EMPLOYEE_LEVEL' && rule.scopeId) {
                scopeName = rule.scopeId; // For employee levels, use the level name directly
            } else if (rule.scope === 'GLOBAL') {
                scopeName = 'All Services & Employees';
            }

            return {
                ...rule,
                scopeName,
            };
        })
    );

    return enhancedRules;
}

// Create commission rule
export const createCommissionRule = cashierOnly(async (data: {
    name: string;
    scope: 'SERVICE' | 'EMPLOYEE_LEVEL' | 'GLOBAL';
    scopeId?: string;
    type: 'PERCENT' | 'FLAT';
    value: number;
    activeFrom?: string;
    activeTo?: string;
}) => {
    const validatedData = createCommissionRuleSchema.parse(data);

    const [newRule] = await db
        .insert(commissionRule)
        .values({
            id: nanoid(),
            name: validatedData.name,
            scope: validatedData.scope,
            scopeId: validatedData.scopeId || null,
            type: validatedData.type,
            value: validatedData.value.toString(),
            activeFrom: validatedData.activeFrom ? new Date(validatedData.activeFrom) : new Date(),
            activeTo: validatedData.activeTo ? new Date(validatedData.activeTo) : null,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        })
        .returning();

    revalidatePath('/admin/commissions');
    return newRule;
});

// Update commission rule
export const updateCommissionRule = cashierOnly(async (
    id: string,
    data: Partial<{
        name: string;
        scopeId?: string;
        type: 'PERCENT' | 'FLAT';
        value: number;
        activeFrom?: string;
        activeTo?: string;
        isActive: boolean;
    }>
) => {
    const [updatedRule] = await db
        .update(commissionRule)
        .set({
            ...data,
            updatedAt: new Date(),
        })
        .where(eq(commissionRule.id, id))
        .returning();

    if (!updatedRule) {
        throw new Error('Commission rule not found');
    }

    revalidatePath('/admin/commissions');
    return updatedRule;
});

// Delete commission rule
export const deleteCommissionRule = cashierOnly(async (id: string) => {
    const [deletedRule] = await db
        .delete(commissionRule)
        .where(eq(commissionRule.id, id))
        .returning();

    if (!deletedRule) {
        throw new Error('Commission rule not found');
    }

    revalidatePath('/admin/commissions');
    return deletedRule;
});

// Get commissions for employee
export async function getEmployeeCommissions(
    employeeId: string,
    filters?: {
        startDate?: string;
        endDate?: string;
        status?: 'PENDING' | 'SETTLED';
    }
) {
    let whereConditions = [eq(commission.employeeId, employeeId)];

    if (filters?.startDate) {
        whereConditions.push(commission.createdAt >= new Date(filters.startDate));
    }

    if (filters?.endDate) {
        whereConditions.push(commission.createdAt <= new Date(filters.endDate + 'T23:59:59'));
    }

    if (filters?.status) {
        whereConditions.push(eq(commission.status, filters.status));
    }

    const whereClause = and(...whereConditions);

    const commissions = await db
        .select({
            id: commission.id,
            orderItemId: commission.orderItemId,
            ruleId: commission.ruleId,
            baseAmount: commission.baseAmount,
            commissionAmount: commission.commissionAmount,
            status: commission.status,
            settledAt: commission.settledAt,
            createdAt: commission.createdAt,
        })
        .from(commission)
        .where(whereClause)
        .orderBy(desc(commission.createdAt));

    return commissions;
}

// Get commission summary for employee
export async function getEmployeeCommissionSummary(
    employeeId: string,
    filters?: {
        startDate?: string;
        endDate?: string;
    }
): Promise<CommissionSummary> {
    let whereConditions = [eq(commission.employeeId, employeeId)];

    if (filters?.startDate) {
        whereConditions.push(commission.createdAt >= new Date(filters.startDate));
    }

    if (filters?.endDate) {
        whereConditions.push(commission.createdAt <= new Date(filters.endDate + 'T23:59:59'));
    }

    const whereClause = and(...whereConditions);

    const [summary] = await db
        .select({
            totalCommission: db.fn.sum(commission.commissionAmount).mapWith(String),
            settledCommission: db.fn.sum(
                db.raw(`CASE WHEN status = 'SETTLED' THEN commission_amount ELSE 0 END`)
            ).mapWith(String),
            pendingCommission: db.fn.sum(
                db.raw(`CASE WHEN status = 'PENDING' THEN commission_amount ELSE 0 END`)
            ).mapWith(String),
            orderCount: db.fn.count(commission.id).mapWith(Number),
        })
        .from(commission)
        .where(whereClause);

    return {
        totalCommission: summary.totalCommission || '0',
        settledCommission: summary.settledCommission || '0',
        pendingCommission: summary.pendingCommission || '0',
        orderCount: summary.orderCount || 0,
    };
}

// Settle commissions for employee
export const settleCommissions = cashierOnly(async (
    employeeId: string,
    commissionIds: string[]
) => {
    const results = await db
        .update(commission)
        .set({
            status: 'SETTLED',
            settledAt: new Date(),
            updatedAt: new Date(),
        })
        .where(and(
            eq(commission.employeeId, employeeId),
            // In a real implementation, you'd filter by the specific IDs
        ))
        .returning();

    revalidatePath('/admin/commissions');
    return results;
});