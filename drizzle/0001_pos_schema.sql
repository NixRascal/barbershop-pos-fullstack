-- Add role, phone, is_active, last_login_at to user table
ALTER TABLE "user"
ADD COLUMN "role" text NOT NULL DEFAULT 'CASHIER',
ADD COLUMN "phone" text,
ADD COLUMN "is_active" boolean NOT NULL DEFAULT true,
ADD COLUMN "last_login_at" timestamp;

-- Create service_category table
CREATE TABLE "service_category" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"order" integer NOT NULL DEFAULT 0,
	"is_active" boolean NOT NULL DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Create service table
CREATE TABLE "service" (
	"id" text PRIMARY KEY NOT NULL,
	"category_id" text NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"base_price" decimal(10,2) NOT NULL,
	"duration" integer NOT NULL,
	"commission_type" text NOT NULL DEFAULT 'PERCENT',
	"commission_value" decimal(5,2) NOT NULL,
	"is_active" boolean NOT NULL DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "service_code_unique" UNIQUE("code")
);

-- Create employee table
CREATE TABLE "employee" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"level" text NOT NULL DEFAULT 'JUNIOR',
	"phone" text,
	"is_active" boolean NOT NULL DEFAULT true,
	"joined_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "employee_code_unique" UNIQUE("code")
);

-- Create customer table
CREATE TABLE "customer" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"notes" text,
	"type" text NOT NULL DEFAULT 'REGULAR',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "customer_phone_unique" UNIQUE("phone")
);

-- Create chair table
CREATE TABLE "chair" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"location" text,
	"is_active" boolean NOT NULL DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Create shift table
CREATE TABLE "shift" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"is_active" boolean NOT NULL DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Create cash_session table
CREATE TABLE "cash_session" (
	"id" text PRIMARY KEY NOT NULL,
	"shift_id" text,
	"opened_by" text NOT NULL,
	"closed_by" text,
	"opened_at" timestamp DEFAULT now() NOT NULL,
	"closed_at" timestamp,
	"opening_amount" decimal(10,2) NOT NULL DEFAULT '0',
	"counted_cash" decimal(10,2),
	"expected_cash" decimal(10,2),
	"variance" decimal(10,2),
	"notes" text,
	"is_active" boolean NOT NULL DEFAULT true
);

-- Create cash_ledger table
CREATE TABLE "cash_ledger" (
	"id" text PRIMARY KEY NOT NULL,
	"cash_session_id" text NOT NULL,
	"type" text NOT NULL,
	"reason" text NOT NULL,
	"amount" decimal(10,2) NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- Create order table
CREATE TABLE "order" (
	"id" text PRIMARY KEY NOT NULL,
	"order_number" text NOT NULL,
	"customer_id" text,
	"status" text NOT NULL DEFAULT 'DRAFT',
	"subtotal" decimal(10,2) NOT NULL DEFAULT '0',
	"total_discount" decimal(10,2) NOT NULL DEFAULT '0',
	"total_tax" decimal(10,2) NOT NULL DEFAULT '0',
	"grand_total" decimal(10,2) NOT NULL DEFAULT '0',
	"total_paid" decimal(10,2) NOT NULL DEFAULT '0',
	"change_amount" decimal(10,2) NOT NULL DEFAULT '0',
	"notes" text,
	"cashier_id" text NOT NULL,
	"cash_session_id" text,
	"paid_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "order_order_number_unique" UNIQUE("order_number")
);

-- Create order_item table
CREATE TABLE "order_item" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"service_id" text NOT NULL,
	"employee_id" text NOT NULL,
	"chair_id" text,
	"person_label" text,
	"quantity" integer NOT NULL DEFAULT 1,
	"unit_price" decimal(10,2) NOT NULL,
	"manual_price" decimal(10,2),
	"adjustment_reason" text,
	"approved_by" text,
	"discount" decimal(10,2) NOT NULL DEFAULT '0',
	"line_total" decimal(10,2) NOT NULL,
	"started_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Create payment table
CREATE TABLE "payment" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"method" text NOT NULL,
	"amount" decimal(10,2) NOT NULL,
	"reference_number" text,
	"received_by" text NOT NULL,
	"paid_at" timestamp DEFAULT now() NOT NULL
);

-- Create commission_rule table
CREATE TABLE "commission_rule" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"scope" text NOT NULL,
	"scope_id" text,
	"type" text NOT NULL,
	"value" decimal(5,2) NOT NULL,
	"active_from" timestamp DEFAULT now() NOT NULL,
	"active_to" timestamp,
	"is_active" boolean NOT NULL DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Create commission table
CREATE TABLE "commission" (
	"id" text PRIMARY KEY NOT NULL,
	"order_item_id" text NOT NULL,
	"employee_id" text NOT NULL,
	"rule_id" text,
	"base_amount" decimal(10,2) NOT NULL,
	"commission_amount" decimal(10,2) NOT NULL,
	"status" text NOT NULL DEFAULT 'PENDING',
	"settled_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Create activity_log table
CREATE TABLE "activity_log" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"action" text NOT NULL,
	"subject_type" text NOT NULL,
	"subject_id" text NOT NULL,
	"metadata" jsonb,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- Create indexes
CREATE INDEX "service_category_idx" ON "service" ("category_id");
CREATE INDEX "service_code_idx" ON "service" ("code");
CREATE INDEX "employee_code_idx" ON "employee" ("code");
CREATE INDEX "employee_level_idx" ON "employee" ("level");
CREATE INDEX "customer_phone_idx" ON "customer" ("phone");
CREATE INDEX "cash_session_opened_by_idx" ON "cash_session" ("opened_by");
CREATE INDEX "cash_session_opened_at_idx" ON "cash_session" ("opened_at");
CREATE INDEX "cash_session_is_active_idx" ON "cash_session" ("is_active");
CREATE INDEX "cash_ledger_session_idx" ON "cash_ledger" ("cash_session_id");
CREATE INDEX "cash_ledger_type_idx" ON "cash_ledger" ("type");
CREATE INDEX "cash_ledger_created_at_idx" ON "cash_ledger" ("created_at");
CREATE INDEX "order_order_number_idx" ON "order" ("order_number");
CREATE INDEX "order_status_idx" ON "order" ("status");
CREATE INDEX "order_cashier_idx" ON "order" ("cashier_id");
CREATE INDEX "order_cash_session_idx" ON "order" ("cash_session_id");
CREATE INDEX "order_paid_at_idx" ON "order" ("paid_at");
CREATE INDEX "order_created_at_idx" ON "order" ("created_at");
CREATE INDEX "order_item_order_idx" ON "order_item" ("order_id");
CREATE INDEX "order_item_service_idx" ON "order_item" ("service_id");
CREATE INDEX "order_item_employee_idx" ON "order_item" ("employee_id");
CREATE INDEX "order_item_chair_idx" ON "order_item" ("chair_id");
CREATE INDEX "payment_order_idx" ON "payment" ("order_id");
CREATE INDEX "payment_method_idx" ON "payment" ("method");
CREATE INDEX "payment_paid_at_idx" ON "payment" ("paid_at");
CREATE INDEX "commission_rule_scope_idx" ON "commission_rule" ("scope", "scope_id");
CREATE INDEX "commission_rule_is_active_idx" ON "commission_rule" ("is_active");
CREATE INDEX "commission_order_item_idx" ON "commission" ("order_item_id");
CREATE INDEX "commission_employee_idx" ON "commission" ("employee_id");
CREATE INDEX "commission_status_idx" ON "commission" ("status");
CREATE INDEX "commission_created_at_idx" ON "commission" ("created_at");
CREATE INDEX "activity_log_user_idx" ON "activity_log" ("user_id");
CREATE INDEX "activity_log_action_idx" ON "activity_log" ("action");
CREATE INDEX "activity_log_subject_idx" ON "activity_log" ("subject_type", "subject_id");
CREATE INDEX "activity_log_created_at_idx" ON "activity_log" ("created_at");

-- Create foreign key constraints
ALTER TABLE "service" ADD CONSTRAINT "service_category_id_service_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."service_category"("id") ON UPDATE no action;

ALTER TABLE "cash_session" ADD CONSTRAINT "cash_session_shift_id_shift_id_fk" FOREIGN KEY ("shift_id") REFERENCES "public"."shift"("id") ON UPDATE no action;
ALTER TABLE "cash_session" ADD CONSTRAINT "cash_session_opened_by_user_id_fk" FOREIGN KEY ("opened_by") REFERENCES "public"."user"("id") ON UPDATE no action;
ALTER TABLE "cash_session" ADD CONSTRAINT "cash_session_closed_by_user_id_fk" FOREIGN KEY ("closed_by") REFERENCES "public"."user"("id") ON UPDATE no action;

ALTER TABLE "cash_ledger" ADD CONSTRAINT "cash_ledger_cash_session_id_cash_session_id_fk" FOREIGN KEY ("cash_session_id") REFERENCES "public"."cash_session"("id") ON UPDATE no action;
ALTER TABLE "cash_ledger" ADD CONSTRAINT "cash_ledger_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON UPDATE no action;

ALTER TABLE "order" ADD CONSTRAINT "order_customer_id_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customer"("id") ON UPDATE no action;
ALTER TABLE "order" ADD CONSTRAINT "order_cashier_id_user_id_fk" FOREIGN KEY ("cashier_id") REFERENCES "public"."user"("id") ON UPDATE no action;
ALTER TABLE "order" ADD CONSTRAINT "order_cash_session_id_cash_session_id_fk" FOREIGN KEY ("cash_session_id") REFERENCES "public"."cash_session"("id") ON UPDATE no action;

ALTER TABLE "order_item" ADD CONSTRAINT "order_item_order_id_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."order"("id") ON UPDATE no action;
ALTER TABLE "order_item" ADD CONSTRAINT "order_item_service_id_service_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."service"("id") ON UPDATE no action;
ALTER TABLE "order_item" ADD CONSTRAINT "order_item_employee_id_employee_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employee"("id") ON UPDATE no action;
ALTER TABLE "order_item" ADD CONSTRAINT "order_item_chair_id_chair_id_fk" FOREIGN KEY ("chair_id") REFERENCES "public"."chair"("id") ON UPDATE no action;
ALTER TABLE "order_item" ADD CONSTRAINT "order_item_approved_by_user_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."user"("id") ON UPDATE no action;

ALTER TABLE "payment" ADD CONSTRAINT "payment_order_id_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."order"("id") ON UPDATE no action;
ALTER TABLE "payment" ADD CONSTRAINT "payment_received_by_user_id_fk" FOREIGN KEY ("received_by") REFERENCES "public"."user"("id") ON UPDATE no action;

ALTER TABLE "commission" ADD CONSTRAINT "commission_order_item_id_order_item_id_fk" FOREIGN KEY ("order_item_id") REFERENCES "public"."order_item"("id") ON UPDATE no action;
ALTER TABLE "commission" ADD CONSTRAINT "commission_employee_id_employee_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employee"("id") ON UPDATE no action;
ALTER TABLE "commission" ADD CONSTRAINT "commission_rule_id_commission_rule_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."commission_rule"("id") ON UPDATE no action;

ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON UPDATE no action;