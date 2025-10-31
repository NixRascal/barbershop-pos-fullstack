import {
    pgTable,
    text,
    timestamp,
    boolean,
    integer,
    decimal,
    jsonb,
    primaryKey,
    index
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { user } from "./auth";

// Service Categories
export const serviceCategory = pgTable("service_category", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    order: integer("order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Services
export const service = pgTable("service", {
    id: text("id").primaryKey(),
    categoryId: text("category_id").notNull().references(() => serviceCategory.id),
    name: text("name").notNull(),
    code: text("code").notNull().unique(),
    basePrice: decimal("base_price", { precision: 10, scale: 2 }).notNull(),
    duration: integer("duration").notNull(), // in minutes
    commissionType: text("commission_type", { enum: ["PERCENT", "FLAT"] }).notNull().default("PERCENT"),
    commissionValue: decimal("commission_value", { precision: 5, scale: 2 }).notNull(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
    categoryIdx: index("service_category_idx").on(table.categoryId),
    codeIdx: index("service_code_idx").on(table.code),
}));

// Employee Levels
export const employeeLevel = {
    JUNIOR: "JUNIOR",
    SENIOR: "SENIOR",
    MASTER: "MASTER"
} as const;

// Employees
export const employee = pgTable("employee", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    code: text("code").notNull().unique(),
    level: text("level", { enum: ["JUNIOR", "SENIOR", "MASTER"] }).notNull().default("JUNIOR"),
    phone: text("phone"),
    isActive: boolean("is_active").notNull().default(true),
    joinedAt: timestamp("joined_at").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
    codeIdx: index("employee_code_idx").on(table.code),
    levelIdx: index("employee_level_idx").on(table.level),
}));

// Customer Types
export const customerType = {
    REGULAR: "REGULAR",
    MEMBER: "MEMBER",
    VIP: "VIP"
} as const;

// Customers
export const customer = pgTable("customer", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    phone: text("phone").notNull().unique(),
    notes: text("notes"),
    type: text("type", { enum: ["REGULAR", "MEMBER", "VIP"] }).notNull().default("REGULAR"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
    phoneIdx: index("customer_phone_idx").on(table.phone),
}));

// Chairs
export const chair = pgTable("chair", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    location: text("location"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Shifts
export const shift = pgTable("shift", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    startTime: text("start_time").notNull(), // HH:mm format
    endTime: text("end_time").notNull(), // HH:mm format
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Cash Sessions
export const cashSession = pgTable("cash_session", {
    id: text("id").primaryKey(),
    shiftId: text("shift_id").references(() => shift.id),
    openedBy: text("opened_by").notNull().references(() => user.id),
    closedBy: text("closed_by").references(() => user.id),
    openedAt: timestamp("opened_at").defaultNow().notNull(),
    closedAt: timestamp("closed_at"),
    openingAmount: decimal("opening_amount", { precision: 10, scale: 2 }).notNull().default("0"),
    countedCash: decimal("counted_cash", { precision: 10, scale: 2 }),
    expectedCash: decimal("expected_cash", { precision: 10, scale: 2 }),
    variance: decimal("variance", { precision: 10, scale: 2 }),
    notes: text("notes"),
    isActive: boolean("is_active").notNull().default(true),
}, (table) => ({
    openedByIdx: index("cash_session_opened_by_idx").on(table.openedBy),
    openedAtIdx: index("cash_session_opened_at_idx").on(table.openedAt),
    isActiveIdx: index("cash_session_is_active_idx").on(table.isActive),
}));

// Cash Ledger
export const cashLedger = pgTable("cash_ledger", {
    id: text("id").primaryKey(),
    cashSessionId: text("cash_session_id").notNull().references(() => cashSession.id),
    type: text("type", { enum: ["IN", "OUT"] }).notNull(),
    reason: text("reason").notNull(),
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
    createdBy: text("created_by").notNull().references(() => user.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
    cashSessionIdx: index("cash_ledger_session_idx").on(table.cashSessionId),
    typeIdx: index("cash_ledger_type_idx").on(table.type),
    createdAtIdx: index("cash_ledger_created_at_idx").on(table.createdAt),
}));

// Order Status
export const orderStatus = {
    DRAFT: "DRAFT",
    PAID: "PAID",
    VOID: "VOID"
} as const;

// Orders
export const order = pgTable("order", {
    id: text("id").primaryKey(),
    orderNumber: text("order_number").notNull().unique(),
    customerId: text("customer_id").references(() => customer.id),
    status: text("status", { enum: ["DRAFT", "PAID", "VOID"] }).notNull().default("DRAFT"),
    subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull().default("0"),
    totalDiscount: decimal("total_discount", { precision: 10, scale: 2 }).notNull().default("0"),
    totalTax: decimal("total_tax", { precision: 10, scale: 2 }).notNull().default("0"),
    grandTotal: decimal("grand_total", { precision: 10, scale: 2 }).notNull().default("0"),
    totalPaid: decimal("total_paid", { precision: 10, scale: 2 }).notNull().default("0"),
    changeAmount: decimal("change_amount", { precision: 10, scale: 2 }).notNull().default("0"),
    notes: text("notes"),
    cashierId: text("cashier_id").notNull().references(() => user.id),
    cashSessionId: text("cash_session_id").references(() => cashSession.id),
    paidAt: timestamp("paid_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
    orderNumberIdx: index("order_order_number_idx").on(table.orderNumber),
    statusIdx: index("order_status_idx").on(table.status),
    cashierIdx: index("order_cashier_idx").on(table.cashierId),
    cashSessionIdx: index("order_cash_session_idx").on(table.cashSessionId),
    paidAtIdx: index("order_paid_at_idx").on(table.paidAt),
    createdAtIdx: index("order_created_at_idx").on(table.createdAt),
}));

// Order Items
export const orderItem = pgTable("order_item", {
    id: text("id").primaryKey(),
    orderId: text("order_id").notNull().references(() => order.id),
    serviceId: text("service_id").notNull().references(() => service.id),
    employeeId: text("employee_id").notNull().references(() => employee.id),
    chairId: text("chair_id").references(() => chair.id),
    personLabel: text("person_label"), // e.g., "Anak 1", "Anak 2"
    quantity: integer("quantity").notNull().default(1),
    unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
    manualPrice: decimal("manual_price", { precision: 10, scale: 2 }),
    adjustmentReason: text("adjustment_reason"),
    approvedBy: text("approved_by").references(() => user.id),
    discount: decimal("discount", { precision: 10, scale: 2 }).notNull().default("0"),
    lineTotal: decimal("line_total", { precision: 10, scale: 2 }).notNull(),
    startedAt: timestamp("started_at"),
    completedAt: timestamp("completed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
    orderIdx: index("order_item_order_idx").on(table.orderId),
    serviceIdx: index("order_item_service_idx").on(table.serviceId),
    employeeIdx: index("order_item_employee_idx").on(table.employeeId),
    chairIdx: index("order_item_chair_idx").on(table.chairId),
}));

// Payment Methods
export const paymentMethod = {
    CASH: "CASH",
    QRIS: "QRIS",
    DEBIT: "DEBIT",
    EWALLET: "EWALLET",
    TRANSFER: "TRANSFER"
} as const;

// Payments
export const payment = pgTable("payment", {
    id: text("id").primaryKey(),
    orderId: text("order_id").notNull().references(() => order.id),
    method: text("method", { enum: ["CASH", "QRIS", "DEBIT", "EWALLET", "TRANSFER"] }).notNull(),
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
    referenceNumber: text("reference_number"),
    receivedBy: text("received_by").notNull().references(() => user.id),
    paidAt: timestamp("paid_at").defaultNow().notNull(),
}, (table) => ({
    orderIdx: index("payment_order_idx").on(table.orderId),
    methodIdx: index("payment_method_idx").on(table.method),
    paidAtIdx: index("payment_paid_at_idx").on(table.paidAt),
}));

// Commission Rules
export const commissionRule = pgTable("commission_rule", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    scope: text("scope", { enum: ["SERVICE", "EMPLOYEE_LEVEL", "GLOBAL"] }).notNull(),
    scopeId: text("scope_id"), // service.id or employee level
    type: text("type", { enum: ["PERCENT", "FLAT"] }).notNull(),
    value: decimal("value", { precision: 5, scale: 2 }).notNull(),
    activeFrom: timestamp("active_from").defaultNow().notNull(),
    activeTo: timestamp("active_to"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
    scopeIdx: index("commission_rule_scope_idx").on(table.scope, table.scopeId),
    isActiveIdx: index("commission_rule_is_active_idx").on(table.isActive),
}));

// Commissions
export const commission = pgTable("commission", {
    id: text("id").primaryKey(),
    orderItemId: text("order_item_id").notNull().references(() => orderItem.id),
    employeeId: text("employee_id").notNull().references(() => employee.id),
    ruleId: text("rule_id").references(() => commissionRule.id),
    baseAmount: decimal("base_amount", { precision: 10, scale: 2 }).notNull(),
    commissionAmount: decimal("commission_amount", { precision: 10, scale: 2 }).notNull(),
    status: text("status", { enum: ["PENDING", "SETTLED"] }).notNull().default("PENDING"),
    settledAt: timestamp("settled_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
    orderItemIdx: index("commission_order_item_idx").on(table.orderItemId),
    employeeIdx: index("commission_employee_idx").on(table.employeeId),
    statusIdx: index("commission_status_idx").on(table.status),
    createdAtIdx: index("commission_created_at_idx").on(table.createdAt),
}));

// Activity Log
export const activityLog = pgTable("activity_log", {
    id: text("id").primaryKey(),
    userId: text("user_id").references(() => user.id),
    action: text("action").notNull(),
    subjectType: text("subject_type").notNull(),
    subjectId: text("subject_id").notNull(),
    metadata: jsonb("metadata"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
    userIdIdx: index("activity_log_user_idx").on(table.userId),
    actionIdx: index("activity_log_action_idx").on(table.action),
    subjectIdx: index("activity_log_subject_idx").on(table.subjectType, table.subjectId),
    createdAtIdx: index("activity_log_created_at_idx").on(table.createdAt),
}));

// Relations
export const serviceCategoryRelations = relations(serviceCategory, {
    services: many(service),
});

export const serviceRelations = relations(service, {
    category: one(serviceCategory, {
        fields: [service.categoryId],
        references: [serviceCategory.id],
    }),
    orderItems: many(orderItem),
});

export const employeeRelations = relations(employee, {
    orderItems: many(orderItem),
    commissions: many(commission),
});

export const customerRelations = relations(customer, {
    orders: many(order),
});

export const chairRelations = relations(chair, {
    orderItems: many(orderItem),
});

export const shiftRelations = relations(shift, {
    cashSessions: many(cashSession),
});

export const cashSessionRelations = relations(cashSession, {
    shift: one(shift, {
        fields: [cashSession.shiftId],
        references: [shift.id],
    }),
    openedByUser: one(user, {
        fields: [cashSession.openedBy],
        references: [user.id],
    }),
    closedByUser: one(user, {
        fields: [cashSession.closedBy],
        references: [user.id],
    }),
    cashLedgers: many(cashLedger),
    orders: many(order),
});

export const cashLedgerRelations = relations(cashLedger, {
    cashSession: one(cashSession, {
        fields: [cashLedger.cashSessionId],
        references: [cashSession.id],
    }),
    createdByUser: one(user, {
        fields: [cashLedger.createdBy],
        references: [user.id],
    }),
});

export const orderRelations = relations(order, {
    customer: one(customer, {
        fields: [order.customerId],
        references: [customer.id],
    }),
    cashier: one(user, {
        fields: [order.cashierId],
        references: [user.id],
    }),
    cashSession: one(cashSession, {
        fields: [order.cashSessionId],
        references: [cashSession.id],
    }),
    items: many(orderItem),
    payments: many(payment),
});

export const orderItemRelations = relations(orderItem, {
    order: one(order, {
        fields: [orderItem.orderId],
        references: [order.id],
    }),
    service: one(service, {
        fields: [orderItem.serviceId],
        references: [service.id],
    }),
    employee: one(employee, {
        fields: [orderItem.employeeId],
        references: [employee.id],
    }),
    chair: one(chair, {
        fields: [orderItem.chairId],
        references: [chair.id],
    }),
    approvedByUser: one(user, {
        fields: [orderItem.approvedBy],
        references: [user.id],
    }),
    commissions: many(commission),
});

export const paymentRelations = relations(payment, {
    order: one(order, {
        fields: [payment.orderId],
        references: [order.id],
    }),
    receivedByUser: one(user, {
        fields: [payment.receivedBy],
        references: [user.id],
    }),
});

export const commissionRuleRelations = relations(commissionRule, {
    commissions: many(commission),
});

export const commissionRelations = relations(commission, {
    orderItem: one(orderItem, {
        fields: [commission.orderItemId],
        references: [orderItem.id],
    }),
    employee: one(employee, {
        fields: [commission.employeeId],
        references: [employee.id],
    }),
    rule: one(commissionRule, {
        fields: [commission.ruleId],
        references: [commissionRule.id],
    }),
});

export const activityLogRelations = relations(activityLog, {
    user: one(user, {
        fields: [activityLog.userId],
        references: [user.id],
    }),
});