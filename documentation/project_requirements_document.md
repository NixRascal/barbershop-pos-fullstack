# Barbershop POS System – Project Requirements Document

## 1. Project Overview

This web application is a modern Point-of-Sale (POS) system tailored for a barbershop. It provides cashiers with an intuitive interface to select services, assemble orders, assign staff, and complete checkouts. Administrators can manage core data like services, categories, and employee profiles. Stakeholders get a high-level dashboard showing daily sales and cash session summaries.

Built on a full-stack starter, this product solves the pain of manual logbooks and fragmented spreadsheets. It centralizes transactions and business data in real time, reduces errors in checkout and reporting, and empowers decision-makers with up-to-date insights. Success will be measured by timely, accurate order processing, smooth master-data management, and clear, reliable analytics for stakeholders.

## 2. In-Scope vs. Out-of-Scope

**In-Scope (MVP Features)**
- User authentication & role-based access (Cashier, Admin, Stakeholder)
- Cashier POS interface:
  - Service selection grid
  - Multi-item cart and employee assignment
  - Open/close cash session with variance calculation
  - Atomic checkout (create Order, OrderItems, Payment)
- Admin management panel:
  - CRUD for Services, Service Categories, Employees
  - User account overview and role assignment
- Stakeholder dashboard:
  - Daily sales totals
  - Number of orders processed
  - Cash session summaries
- Data persistence in PostgreSQL via Prisma ORM
- Containerized development environment (Docker + docker-compose)

**Out-of-Scope (Later Phases)**
- Multi-method payment support (cards, digital wallets)
- Complex commission engine and rule management
- Price-override workflows with approval routing
- Advanced visual charts and interactive graphs
- Mobile or offline modes
- Third-party integrations (accounting, booking platforms)

## 3. User Flow

When a Cashier arrives, they log in via the sign-in page. They land on a role-specific dashboard showing a grid of available services. Clicking on a service card adds it to a cart sidebar, where they can adjust quantities and assign an employee to each item. When ready, the Cashier clicks “Checkout,” and a server-side transaction records the order and payment, then resets the cart for the next customer.

An Admin logs in and sees a sidebar with links for Master Data. Selecting “Services” opens a table view where they can add, edit, or delete service entries. Similar pages exist for service categories and employees. A Stakeholder logs in to a read-only dashboard that displays KPI cards for daily sales, order count, and cash session performance. They can revisit past days to track trends.

## 4. Core Features

- **Authentication & RBAC**: Secure sign-up, sign-in, session management. Middleware enforces role checks on protected routes.
- **Cashier POS Interface**: Service grid, real-time cart, employee assignment, open/close cash session, atomic checkout server action.
- **Admin Panel**: Data tables for Services, Categories, and Employees; inline editing; CRUD forms; bulk import/export placeholders.
- **Stakeholder Dashboard**: Read-only KPI cards for sales, orders, and cash sessions; date filters.
- **Database Schema**: Tables for User, Service, ServiceCategory, Employee, Order, OrderItem, CashSession, Payment.
- **API Layer**: Next.js API Routes for data fetches; Server Actions for secure data mutations.

## 5. Tech Stack & Tools

- Frontend: Next.js 15 (App Router with Turbopack), React, TypeScript
- UI Components: shadcn/ui, Tailwind CSS v4
- Authentication: NextAuth (Credentials provider)
- Backend Logic: Next.js Server Actions & API Routes
- Database: PostgreSQL (containerized via Docker)
- ORM: Prisma (type-safe schema and migrations)
- Containerization: Docker & docker-compose
- Testing (future): Vitest for unit tests
- IDE Support: VS Code, recommending extensions like Prisma, Tailwind CSS IntelliSense

## 6. Non-Functional Requirements

- **Performance**: POS page renders in &lt;200ms; cart updates &lt;100ms.
- **Scalability**: Supports at least 10 concurrent cashier sessions without lag.
- **Security**: HTTPS only; secure, HTTP-only cookies; environment variables for secrets; least-privilege DB roles.
- **Usability**: Responsive design for tablets and desktops; clear error messages and toasts for feedback.
- **Compliance**: GDPR-ready for user data; audit logs for financial transactions.

## 7. Constraints & Assumptions

- Reliable internet connection; no offline mode.
- PostgreSQL 13+ available via Docker; Prisma supports migrations.
- NextAuth Credentials provider suffices for internal users.
- All service names and employee IDs are unique.
- Data volume is moderate (hundreds of orders per day) for MVP.

## 8. Known Issues & Potential Pitfalls

- **Concurrent Transactions**: Simultaneous checkouts may conflict—use DB transactions and row-level locking.
- **Timezone Handling**: Closing cash sessions across midnight may skew daily summaries—standardize on a single timezone.
- **API Rate Limits**: Serverless function cold starts—consider caching strategies or moving heavy logic to the server.
- **Data Migrations**: Schema changes require careful migration scripts—use Prisma migrate dev in CI.
- **Role-Check Gaps**: Always reverify roles in Server Actions, not just in middleware, to avoid privilege escalation.

---

This document is the definitive blueprint for the Barbershop POS MVP. Every subsequent technical design (frontend guidelines, backend structure, file organization) should reference these requirements to ensure consistency and completeness.