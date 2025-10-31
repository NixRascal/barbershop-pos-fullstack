# Security Guidelines for Barbershop POS Fullstack Application

## 1. Introduction
This document defines the security principles and best practices for the Barbershop POS application built on the CodeGuide Fullstack Starter. It ensures that every component—from authentication to infrastructure—is designed and implemented with security, resilience, and privacy in mind.

## 2. Security by Design & Core Principles
- **Embed security early:** Integrate threat modeling and design reviews from Day 1.
- **Least privilege:** Grant users, services, and components only the permissions they need.
- **Defense in depth:** Layer controls (e.g., network, application, data) so no single point of failure leads to a full compromise.
- **Fail securely:** Handle errors without leaking internal details or leaving data in an inconsistent state.
- **Keep security simple:** Favor clear, maintainable solutions over complexity.
- **Secure defaults:** Ship with the most restrictive settings; require explicit opt-in for relaxed behaviors.

## 3. Authentication & Role-Based Access Control (RBAC)
### 3.1. Authentication
- **NextAuth integration:** Replace Better Auth with NextAuth and configure providers (e.g., Credentials, OAuth) with secure callbacks.
- **Password storage:** Use bcrypt or Argon2 with a unique salt per user.
- **Strong password policy:** Enforce minimum length (≥ 12 chars), complexity, and expiration rules where applicable.
- **Multi-Factor Authentication (MFA):** Offer TOTP or push-based MFA for Admins and Stakeholders.

### 3.2. Session Management
- **Secure cookies:** Set `Secure`, `HttpOnly`, and `SameSite=Strict` on session cookies.
- **Session timeouts:** Enforce both idle (e.g., 15 minutes) and absolute (e.g., 8 hours) expiration.
- **Log out & revocation:** Provide endpoints to terminate sessions; invalidate JWTs or session IDs server-side.
- **Session fixation:** Regenerate session tokens on privilege elevation (e.g., login, role change).

### 3.3. Role-Based Access Control
- **Define roles & permissions:** Document capabilities for Cashier, Admin, and Stakeholder.
- **Next.js Middleware:** Enforce route-level protection in `middleware.ts` by checking session and role before page render or API call.
- **Server-side checks:** Every Server Action must re-validate the caller’s role and permissions before executing business logic.
- **Deny by default:** Return HTTP 403 for unauthorized attempts.

## 4. Input Handling & Processing
- **Validate all inputs:** Use Zod or Joi in Server Actions and API Routes to enforce type, length, and format constraints.
- **Prevent injection:** Parameterize database queries via Prisma; never concatenate user data into raw SQL.
- **Sanitize outputs:** On any page that renders user input (e.g., Service names, Employee notes), apply context-aware HTML escaping.
- **File uploads (if any):**
  - Restrict allowed MIME types and extensions.
  - Scan for malware and store outside the webroot.
  - Rename files to random identifiers to avoid path traversal.
- **Redirect validation:** Maintain an allow-list of URIs for any redirect endpoints.

## 5. Data Protection & Privacy
### 5.1. In Transit & At Rest
- **TLS enforcement:** Use HTTPS (TLS 1.2+) for all client–server and internal API communication; deploy HSTS with `max-age` ≥ 1 year.
- **Database encryption:** Enable disk-level encryption on PostgreSQL and use SSL/TLS for the client connection.

### 5.2. Sensitive Data Handling
- **Secrets management:** Store `DATABASE_URL`, NextAuth secrets, and third-party API keys in a secrets manager (e.g., Vault, AWS Secrets Manager) or encrypted environment variables.
- **Avoid hardcoding secrets:** Do not commit credentials to source control.
- **Minimal PII storage:** Only collect essential user data; purge or anonymize PII when no longer required.

### 5.3. Logging & Error Handling
- **Sanitize logs:** Strip or mask PII and sensitive tokens.
- **Generic error messages:** Do not reveal stack traces or internal paths to end users; log full details server-side.

## 6. API & Service Security
- **Rate limiting & throttling:** Implement global and per-endpoint limits (e.g., 100 requests/minute per IP) to mitigate abuse.
- **CORS policy:** Restrict to trusted origins (e.g., your admin console domain).
- **HTTP verbs:** Enforce GET for retrieval, POST for creation, PUT/PATCH for updates, DELETE for removals.
- **API versioning:** Prefix routes (e.g., `/api/v1/...`) to manage backward compatibility.
- **Minimal data exposure:** Return only the fields needed for each client view; avoid nested or excessive records.
- **CSRF protection:** Use anti-CSRF tokens (e.g., `next-auth` built-in or `csrf` package) for state-changing API calls.

## 7. Web Application Security Hygiene
- **Security headers:**
  - `Content-Security-Policy`: Restrict script, style, and frame sources.
  - `Strict-Transport-Security`: `max-age=31536000; includeSubDomains; preload`.
  - `X-Frame-Options`: `DENY` or `SAMEORIGIN`.
  - `X-Content-Type-Options`: `nosniff`.
  - `Referrer-Policy`: `no-referrer` or `strict-origin-when-cross-origin`.
- **Subresource Integrity (SRI):** Add integrity hashes for any CDN-hosted assets.
- **Client storage:** Avoid localStorage for sensitive tokens; rely on secure, HttpOnly cookies.
- **Disable debug in production:** Ensure `NODE_ENV === 'production'` disables detailed error overlays and logs.

## 8. Infrastructure & Configuration Management
- **Harden servers:**
  - Disable unused ports and services.
  - Remove default accounts and change all inventory credentials.
  - Enforce OS and container image updates on a scheduled cadence.
- **Docker best practices:**
  - Use minimal base images (e.g., `node:slim`).
  - Run processes as non-root users.
  - Scan images for CVEs with tools like Trivy.
- **Network segmentation:** Place the database on a private network; allow only the application server to connect.
- **TLS certificates:** Manage via ACME (Let’s Encrypt) or enterprise PKI; automate renewal.

## 9. Dependency Management
- **Vet dependencies:** Rely on well-maintained libraries; review vulnerability reports.
- **Lockfiles & reproducible builds:** Commit `package-lock.json` or `yarn.lock` and pin critical packages.
- **Automated vulnerability scanning:** Integrate SCA tools (e.g., GitHub Dependabot, Snyk) in CI.
- **Minimize footprint:** Remove unused packages; audit transitive dependencies.

## 10. Testing & CI/CD Security
- **Static analysis & linting:** Enforce ESLint, TypeScript strict mode, and Prettier to catch security anti-patterns.
- **Automated testing:**
  - Unit tests for Server Actions (e.g., commission engine, cash variance logic).
  - Integration tests for API endpoints (check auth, roles, data flow).
- **Secret scanning:** Block commits containing keys or credentials.
- **Pipeline security:**
  - Use least-privileged CI runners.
  - Store build secrets in encrypted vaults; never print them in logs.

## 11. Conclusion & Next Steps
By following these security guidelines, your Barbershop POS application will maintain confidentiality, integrity, and availability across all layers. Integrate these practices into your day-to-day development, code reviews, and release process. When introducing new features or dependencies, revisit this document to confirm continued compliance and adapt as new threats emerge.