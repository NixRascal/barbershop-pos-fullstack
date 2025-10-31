'use server';

import { db } from '@/db';
import { service, serviceCategory, employee, order, orderItem, customer, chair, payment, cashSession } from '@/db/schema';
import { nanoid } from 'nanoid';
import { eq, and, desc, asc } from 'drizzle-orm';
import { cashierOnly } from '@/lib/auth-server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

// Import commission calculation
import { calculateOrderCommissions, createCommissionRecords } from '../commissions/actions';

// Types
export interface ServiceItem {
    id: string;
    name: string;
    code: string;
    basePrice: string;
    duration: number;
    categoryName: string;
    categoryId: string;
}

export interface Employee {
    id: string;
    name: string;
    code: string;
    level: string;
    isActive: boolean;
}

export interface Customer {
    id: string;
    name: string;
    phone: string;
    type: string;
}

export interface Chair {
    id: string;
    name: string;
    location: string;
    isActive: boolean;
}

export interface CartItem {
    id: string;
    serviceId: string;
    serviceName: string;
    serviceCode: string;
    unitPrice: number;
    manualPrice: number | null;
    adjustmentReason: string | null;
    quantity: number;
    discount: number;
    employeeId: string;
    employeeName: string;
    chairId: string | null;
    personLabel: string | null;
    lineTotal: number;
}

export interface OrderData {
    customerId?: string;
    items: CartItem[];
    notes?: string;
}

// Validation schemas
const createOrderSchema = z.object({
    customerId: z.string().optional(),
    items: z.array(z.object({
        serviceId: z.string(),
        employeeId: z.string(),
        chairId: z.string().optional(),
        personLabel: z.string().optional(),
        quantity: z.number().min(1),
        unitPrice: z.number().min(0),
        manualPrice: z.number().optional(),
        adjustmentReason: z.string().optional(),
        discount: z.number().min(0),
    })).min(1),
    notes: z.string().optional(),
});

// Get service categories
export async function getServiceCategories() {
    const categories = await db
        .select()
        .from(serviceCategory)
        .where(eq(serviceCategory.isActive, true))
        .orderBy(asc(serviceCategory.order));

    return categories;
}

// Get services by category
export async function getServicesByCategory(categoryId?: string) {
    const whereClause = categoryId
        ? and(eq(service.isActive, true), eq(service.categoryId, categoryId))
        : eq(service.isActive, true);

    const services = await db
        .select({
            id: service.id,
            name: service.name,
            code: service.code,
            basePrice: service.basePrice,
            duration: service.duration,
            categoryName: serviceCategory.name,
            categoryId: service.categoryId,
        })
        .from(service)
        .leftJoin(serviceCategory, eq(service.categoryId, serviceCategory.id))
        .where(whereClause)
        .orderBy(asc(service.name));

    return services;
}

// Get all active services
export async function getAllServices() {
    return await getServicesByCategory();
}

// Get active employees
export async function getActiveEmployees() {
    const employees = await db
        .select()
        .from(employee)
        .where(eq(employee.isActive, true))
        .orderBy(asc(employee.name));

    return employees;
}

// Get customers for search
export async function searchCustomers(query: string) {
    if (!query || query.length < 2) {
        return [];
    }

    const customers = await db
        .select()
        .from(customer)
        .where(and(
            eq(customer.isActive !== false ? true : true, true), // All customers are active for now
            // Simple search by name or phone
            // Note: In a real implementation, you'd want proper full-text search
        ))
        .orderBy(asc(customer.name))
        .limit(10);

    // Filter on client side for simplicity (in production, use proper SQL search)
    return customers.filter(c =>
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        c.phone.includes(query)
    );
}

// Get active chairs
export async function getActiveChairs() {
    const chairs = await db
        .select()
        .from(chair)
        .where(eq(chair.isActive, true))
        .orderBy(asc(chair.name));

    return chairs;
}

// Create new order
export const createOrder = cashierOnly(async (orderData: OrderData) => {
    const validatedData = createOrderSchema.parse(orderData);

    // Generate order number
    const orderNumber = `ORD${Date.now().toString().slice(-8)}`;

    // Calculate totals
    const subtotal = validatedData.items.reduce((sum, item) => {
        const itemTotal = (item.manualPrice || item.unitPrice) * item.quantity;
        return sum + itemTotal;
    }, 0);

    const totalDiscount = validatedData.items.reduce((sum, item) => {
        return sum + item.discount;
    }, 0);

    const grandTotal = subtotal - totalDiscount;

    // Start transaction
    const result = await db.transaction(async (tx) => {
        // Create order
        const [newOrder] = await tx.insert(order).values({
            id: nanoid(),
            orderNumber,
            customerId: validatedData.customerId || null,
            status: 'DRAFT',
            subtotal: subtotal.toString(),
            totalDiscount: totalDiscount.toString(),
            totalTax: '0', // Tax calculation can be added later
            grandTotal: grandTotal.toString(),
            totalPaid: '0',
            changeAmount: '0',
            notes: validatedData.notes || null,
            // cashierId and cashSessionId will be set by middleware or passed in
        }).returning();

        // Create order items
        const orderItems = await Promise.all(
            validatedData.items.map(async (item) => {
                const lineTotal = ((item.manualPrice || item.unitPrice) * item.quantity) - item.discount;

                const [orderItem] = await tx.insert(orderItem).values({
                    id: nanoid(),
                    orderId: newOrder.id,
                    serviceId: item.serviceId,
                    employeeId: item.employeeId,
                    chairId: item.chairId || null,
                    personLabel: item.personLabel || null,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice.toString(),
                    manualPrice: item.manualPrice ? item.manualPrice.toString() : null,
                    adjustmentReason: item.adjustmentReason || null,
                    discount: item.discount.toString(),
                    lineTotal: lineTotal.toString(),
                    startedAt: new Date(),
                }).returning();

                return orderItem;
            })
        );

        return {
            order: newOrder,
            items: orderItems,
        };
    });

    revalidatePath('/pos');
    return result;
});

// Update order item
export const updateOrderItem = cashierOnly(async (
    orderItemId: string,
    updates: Partial<CartItem>
) => {
    const [updatedItem] = await db
        .update(orderItem)
        .set({
            ...updates,
            updatedAt: new Date(),
        })
        .where(eq(orderItem.id, orderItemId))
        .returning();

    if (!updatedItem) {
        throw new Error('Order item not found');
    }

    // Recalculate order totals
    await recalculateOrderTotals(updatedItem.orderId);

    revalidatePath('/pos');
    return updatedItem;
});

// Delete order item
export const deleteOrderItem = cashierOnly(async (orderItemId: string) => {
    // Get the order item first to get the order ID
    const [orderItemToDelete] = await db
        .select()
        .from(orderItem)
        .where(eq(orderItem.id, orderItemId))
        .limit(1);

    if (!orderItemToDelete) {
        throw new Error('Order item not found');
    }

    await db.delete(orderItem).where(eq(orderItem.id, orderItemId));

    // Recalculate order totals
    await recalculateOrderTotals(orderItemToDelete.orderId);

    revalidatePath('/pos');
    return { success: true };
});

// Helper function to recalculate order totals
async function recalculateOrderTotals(orderId: string) {
    const items = await db
        .select()
        .from(orderItem)
        .where(eq(orderItem.orderId, orderId));

    const subtotal = items.reduce((sum, item) => {
        return sum + parseFloat(item.lineTotal);
    }, 0);

    const totalDiscount = items.reduce((sum, item) => {
        return sum + parseFloat(item.discount);
    }, 0);

    const grandTotal = subtotal - totalDiscount;

    await db
        .update(order)
        .set({
            subtotal: subtotal.toString(),
            totalDiscount: totalDiscount.toString(),
            grandTotal: grandTotal.toString(),
            updatedAt: new Date(),
        })
        .where(eq(order.id, orderId));
}

// Get order by ID with items
export async function getOrderById(orderId: string) {
    const orderData = await db
        .select({
            id: order.id,
            orderNumber: order.orderNumber,
            customerId: order.customerId,
            customerName: customer.name,
            status: order.status,
            subtotal: order.subtotal,
            totalDiscount: order.totalDiscount,
            grandTotal: order.grandTotal,
            totalPaid: order.totalPaid,
            changeAmount: order.changeAmount,
            notes: order.notes,
            createdAt: order.createdAt,
        })
        .from(order)
        .leftJoin(customer, eq(order.customerId, customer.id))
        .where(eq(order.id, orderId))
        .limit(1);

    if (!orderData[0]) {
        return null;
    }

    const items = await db
        .select({
            id: orderItem.id,
            serviceId: orderItem.serviceId,
            serviceName: service.name,
            serviceCode: service.code,
            employeeId: orderItem.employeeId,
            employeeName: employee.name,
            chairId: orderItem.chairId,
            chairName: chair.name,
            personLabel: orderItem.personLabel,
            quantity: orderItem.quantity,
            unitPrice: orderItem.unitPrice,
            manualPrice: orderItem.manualPrice,
            adjustmentReason: orderItem.adjustmentReason,
            discount: orderItem.discount,
            lineTotal: orderItem.lineTotal,
            startedAt: orderItem.startedAt,
            completedAt: orderItem.completedAt,
        })
        .from(orderItem)
        .leftJoin(service, eq(orderItem.serviceId, service.id))
        .leftJoin(employee, eq(orderItem.employeeId, employee.id))
        .leftJoin(chair, eq(orderItem.chairId, chair.id))
        .where(eq(orderItem.orderId, orderId));

    return {
        ...orderData[0],
        items,
    };
}

// Create customer
export const createCustomer = cashierOnly(async (customerData: {
    name: string;
    phone: string;
    type?: string;
    notes?: string;
}) => {
    const [newCustomer] = await db
        .insert(customer)
        .values({
            id: nanoid(),
            name: customerData.name,
            phone: customerData.phone,
            type: customerData.type || 'REGULAR',
            notes: customerData.notes || null,
        })
        .returning();

    return newCustomer;
});

// Payment processing
export interface PaymentData {
    orderId: string;
    method: 'CASH' | 'QRIS' | 'DEBIT' | 'EWALLET' | 'TRANSFER';
    amount: number;
    referenceNumber?: string;
}

export const processPayment = cashierOnly(async (paymentData: PaymentData) => {
    const { orderId, method, amount, referenceNumber } = paymentData;

    const result = await db.transaction(async (tx) => {
        // Get order details
        const [orderData] = await tx
            .select()
            .from(order)
            .where(eq(order.id, orderId))
            .limit(1);

        if (!orderData) {
            throw new Error('Order not found');
        }

        if (orderData.status === 'PAID') {
            throw new Error('Order is already paid');
        }

        const currentPaid = parseFloat(orderData.totalPaid);
        const grandTotal = parseFloat(orderData.grandTotal);
        const newTotalPaid = currentPaid + amount;
        const changeAmount = method === 'CASH' && newTotalPaid > grandTotal
            ? newTotalPaid - grandTotal
            : 0;

        // Create payment record
        const [paymentRecord] = await tx.insert(payment).values({
            id: nanoid(),
            orderId,
            method,
            amount: amount.toString(),
            referenceNumber: referenceNumber || null,
            paidAt: new Date(),
        }).returning();

        // Update order
        const [updatedOrder] = await tx
            .update(order)
            .set({
                totalPaid: newTotalPaid.toString(),
                changeAmount: changeAmount.toString(),
                status: newTotalPaid >= grandTotal ? 'PAID' : 'DRAFT',
                paidAt: newTotalPaid >= grandTotal ? new Date() : null,
                updatedAt: new Date(),
            })
            .where(eq(order.id, orderId))
            .returning();

        // Update order items completion time if fully paid
        if (newTotalPaid >= grandTotal) {
            await tx
                .update(orderItem)
                .set({
                    completedAt: new Date(),
                })
                .where(eq(orderItem.orderId, orderId));

            // Calculate commissions for this order (outside of transaction to avoid conflicts)
            // This will be handled after the transaction completes
        }

        return {
            order: updatedOrder,
            payment: paymentRecord,
            isFullyPaid: newTotalPaid >= grandTotal,
            changeAmount,
        };
    });

    // Calculate commissions if order is fully paid
    if (result.isFullyPaid) {
        try {
            const commissionCalculations = await calculateOrderCommissions(orderId);
            if (commissionCalculations.length > 0) {
                await createCommissionRecords(commissionCalculations);
            }
        } catch (error) {
            // Log error but don't fail the payment
            console.error('Failed to calculate commissions:', error);
        }
    }

    revalidatePath('/pos');
    return result;
});

// Complete order (set status to PAID)
export const completeOrder = cashierOnly(async (orderId: string) => {
    const [updatedOrder] = await db
        .update(order)
        .set({
            status: 'PAID',
            paidAt: new Date(),
            updatedAt: new Date(),
        })
        .where(eq(order.id, orderId))
        .returning();

    if (!updatedOrder) {
        throw new Error('Order not found');
    }

    // Update order items completion time
    await db
        .update(orderItem)
        .set({
            completedAt: new Date(),
        })
        .where(eq(orderItem.orderId, orderId));

    revalidatePath('/pos');
    return updatedOrder;
});