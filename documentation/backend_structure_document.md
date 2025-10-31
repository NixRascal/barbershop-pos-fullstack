# Backend Structure Document

This document explains the backend setup for the Barbershop POS system built on the CodeGuide Fullstack Starter. It covers the architecture, database, APIs, hosting, infrastructure, security, monitoring, and more. Anyone can follow this guide to understand how the backend works without needing a deep technical background.

## 1. Backend Architecture

We use a modern, modular approach to keep the backend easy to maintain, scale, and fast in production.

**Key design patterns and frameworks**:
- Server-side rendering and Server Actions: all business logic (checkout, commissions, cash sessions) runs on the server for security and consistency.
- REST-style API routes: simple, predictable URLs for data access and mutations.
- Role-based access control (RBAC): middleware and server checks ensure each user (Cashier, Admin, Stakeholder) only sees what they’re allowed to.
- Containerization with Docker: consistent development and testing environments across the team.

**How it supports core goals**:
- **Scalability**: Each part of the API is stateless and can be scaled horizontally (more server instances) behind a load balancer.
- **Maintainability**: Clear file structure (`app/api`, `lib`, `db`, `middleware`), plus TypeScript for end-to-end type safety, makes it easy to add features and fix bugs.
- **Performance**: Server Actions eliminate extra network hops by running logic close to the database, and edge caching (via the hosting provider) speeds up static assets.

## 2. Database Management

### Database technologies
- Type: Relational (SQL)
- System: PostgreSQL (version 14+)
- ORM: Prisma for type-safe database access and migrations

### Data storage and access
- **Structured tables** represent users, services, orders, sessions, and commissions.
- **Prisma Client** handles all queries and transactions, ensuring type safety.
- **Connection pooling** is configured so database connections are reused rather than re-opened for each request.
- **Migrations**: Prisma Migrate keeps track of schema changes in version control, making team workflows smooth.

### Data management best practices
- Back up the database nightly using automated scripts from the hosting provider.
- Store all credentials (database URL, API keys) in environment variables, never in code.
- Archive old sessions and logs periodically to keep tables lean and queries fast.

## 3. Database Schema

Below is the main schema in human-readable form, followed by SQL to create the tables if needed.

### Human-readable overview
- **User**: id, name, email, password hash, role (Cashier/Admin/Stakeholder), created_at
- **ServiceCategory**: id, name, description
- **Service**: id, name, price, duration, category_id
- **Order**: id, user_id, total_amount, created_at
- **OrderItem**: id, order_id, service_id, employee_id, quantity, line_total
- **Payment**: id, order_id, method (cash/card), amount, created_at
- **CommissionRule**: id, priority (service/level/global), threshold, percentage
- **Commission**: id, order_item_id, rule_id, amount
- **CashSession**: id, user_id, opened_at, closed_at, starting_balance, ending_balance, variance
- **CashLedger**: id, session_id, type (sale/open/close), amount, timestamp

### SQL schema (PostgreSQL)
```sql
CREATE TABLE "User" (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('Cashier','Admin','Stakeholder')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE ServiceCategory (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT
);

CREATE TABLE Service (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  duration INTEGER NOT NULL,
  category_id INTEGER REFERENCES ServiceCategory(id)
);

CREATE TABLE "Order" (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES "User"(id),
  total_amount NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE OrderItem (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES "Order"(id) ON DELETE CASCADE,
  service_id INTEGER REFERENCES Service(id),
  employee_id INTEGER REFERENCES "User"(id),
  quantity INTEGER NOT NULL,
  line_total NUMERIC(10,2) NOT NULL
);

CREATE TABLE Payment (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES "Order"(id) ON DELETE CASCADE,
  method TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE CommissionRule (
  id SERIAL PRIMARY KEY,
  priority TEXT NOT NULL,
  threshold NUMERIC(10,2),
  percentage NUMERIC(5,2) NOT NULL
);

CREATE TABLE Commission (
  id SERIAL PRIMARY KEY,
  order_item_id INTEGER REFERENCES OrderItem(id) ON DELETE CASCADE,
  rule_id INTEGER REFERENCES CommissionRule(id),
  amount NUMERIC(10,2) NOT NULL
);

CREATE TABLE CashSession (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES "User"(id),
  opened_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  closed_at TIMESTAMP WITH TIME ZONE,
  starting_balance NUMERIC(10,2) NOT NULL,
  ending_balance NUMERIC(10,2),
  variance NUMERIC(10,2)
);

CREATE TABLE CashLedger (
  id SERIAL PRIMARY KEY,
  session_id INTEGER REFERENCES CashSession(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```  

## 4. API Design and Endpoints

We follow a REST-style design using Next.js API routes and supplement key operations with Server Actions.

**General approach**:
- Read operations use GET requests, mutations use POST/PUT/DELETE.
- Server Actions handle critical multi-step transactions in a single secure call.

**Key endpoints**:

- **/api/auth/**  
  - Handles sign-in, sign-up, and token/session management (NextAuth or custom).

- **/api/users**  
  - GET /api/users: list all users (admin only).  
  - POST /api/users: create a new user (admin only).  
  - PUT /api/users/:id: update user details.  

- **/api/services**  
  - GET /api/services: list services.  
  - POST /api/services: add a service (admin).  
  - PUT /api/services/:id: edit a service.  
  - DELETE /api/services/:id: remove a service.

- **/api/orders**  
  - POST /api/orders/checkout: Server Action to create order, items, payment, commissions in one transaction.  
  - GET /api/orders/:id: fetch a single order and its items.

- **/api/cash-sessions**  
  - POST /api/cash-sessions/open: start a new session.  
  - POST /api/cash-sessions/close: end session, calculate variance, log ledger entries.  
  - GET /api/cash-sessions/:id/ledger: list ledger entries for a session.

- **/api/reports/**  
  - GET /api/reports/daily-sales?date=YYYY-MM-DD  
  - GET /api/reports/employee-performance?start=...&end=...  
  - GET /api/reports/commission-summary?start=...&end=...

## 5. Hosting Solutions

### Application hosting
- Platform: Vercel (built-in support for Next.js)
- Benefits: global CDN, automatic SSL, zero-config deployments, serverless scaling.

### Database hosting
- Platform: AWS RDS for PostgreSQL
- Benefits: automated backups, read replicas for scaling reads, point-in-time recovery.

### Cost and reliability
- Vercel offers a generous free tier, auto-scaling to handle traffic spikes.
- AWS RDS provides pay-as-you-go pricing and 99.95% SLA, ensuring uptime.

## 6. Infrastructure Components

- **Load Balancer**: Vercel’s edge network automatically distributes traffic across serverless instances.
- **CDN**: Vercel’s global caching of static assets and API responses for faster page loads worldwide.
- **Caching**: Optional Redis cache (e.g., AWS ElastiCache) for heavy read operations like reports.
- **Containerization**: Docker and docker-compose for local development, mirroring production dependencies.

These pieces work together to deliver fast, reliable responses while keeping the system easy to operate.

## 7. Security Measures

- **Authentication**: NextAuth (or custom) with encrypted JWT cookies and secure session storage.
- **Authorization**: Middleware checks on every request plus in-function role checks within Server Actions.
- **Encryption**: HTTPS/TLS for all traffic; data encryption at rest on RDS.
- **Environment Isolation**: Separate credentials for development, staging, and production stored in CI/CD secrets.
- **Input Validation**: All user inputs are validated and sanitized to prevent SQL injection and XSS.
- **Regular Audits**: Dependency vulnerability scanning and periodic security reviews.

## 8. Monitoring and Maintenance

- **Error tracking**: Sentry captures and alerts on backend exceptions.
- **Performance monitoring**: Vercel Analytics for response times; AWS CloudWatch for database metrics.
- **Logs**: Centralized logging (e.g., Logflare or AWS CloudWatch Logs) to trace API calls.
- **Database backups**: Automated nightly snapshots in RDS.
- **Health checks**: Scheduled synthetic requests to key endpoints, alerting on failures.
- **CI/CD**: Automated testing and migration runs on every push, ensuring code and schema stay in sync.

## 9. Conclusion and Overall Backend Summary

Our backend is built on a proven, full-stack foundation that:
- Uses Next.js API routes and Server Actions for secure, atomic business operations.
- Relies on PostgreSQL and Prisma for robust, type-safe data handling.
- Hosts on Vercel and AWS RDS to deliver global performance and high availability.
- Incorporates load balancing, caching, and CDN to optimize user experience.
- Enforces strong security through authentication, authorization, and encryption.
- Provides monitoring and maintenance practices that keep the system healthy and up to date.

This architecture meets the needs of Cashiers, Admins, and Stakeholders alike, offering a scalable, maintainable, and secure backend for your Barbershop POS system.