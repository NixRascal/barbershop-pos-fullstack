# Frontend Guideline Document for Barbershop POS

This document outlines the frontend setup for our Barbershop Point of Sale (POS) application. It covers the overall architecture, key design principles, styling approach, component structure, state management, routing, performance optimizations, testing strategies, and a final summary. Anyone reading this should have a clear, step-by-step understanding of how our frontend is built and maintained.

## 1. Frontend Architecture

### 1.1 Overview
- **Framework:** Next.js 15 (App Router) with Turbopack for fast builds and routes.
- **Language:** TypeScript for end-to-end type safety.
- **UI Library:** _shadcn/ui_, offering a set of accessible, customizable React components.
- **Styling:** Tailwind CSS v4 (utility-first CSS).
- **Authentication:** NextAuth.js (credential provider + session management).
- **Data Fetching & Mutations:** Next.js Server Actions for secure, server-side operations; API Routes for simple reads.

### 1.2 Scalability and Maintainability
- **Modular App Router:** Each domain (e.g., `/pos`, `/admin`, `/reports`, `/stakeholder`) lives in its own folder under `app/`, making it easy to add or update features without tangling code.
- **TypeScript Everywhere:** Shared types between components and server code reduce runtime errors and speed up refactoring.
- **Component Library:** Centralized `components/ui/` folder houses all reusable UI elements, ensuring consistency.
- **Middleware for Roles:** Next.js Middleware inspects sessions on each request, enforcing role-based access at the edge before rendering pages.

### 1.3 Performance
- **Turbopack:** Accelerates local development and production builds.
- **Server Actions:** Move heavy business logic off the client, reducing bundle size.
- **Tailwind JIT:** Generates only the CSS classes you use, keeping style sheets small.

## 2. Design Principles

### 2.1 Usability
- **Intuitive Layouts:** Cashiers see a service grid and cart, Admins see data tables and forms, Stakeholders see KPI cards and charts.
- **Clear Feedback:** Use toast notifications (`<Toaster />`) to confirm actions or show errors.

### 2.2 Accessibility
- **Keyboard Navigation:** All interactive elements (buttons, inputs, table rows) are focusable and have visible focus rings.
- **ARIA Labels:** Non-text controls include `aria-label` or `aria-describedby` for screen readers.
- **Contrast:** All text and UI elements meet WCAG AA contrast ratios.

### 2.3 Responsiveness
- **Mobile-First:** Layouts flex and stack naturally on small screens (e.g., POS grid collapses into a list).
- **Tailored Breakpoints:** Use Tailwind’s default breakpoints (`sm`, `md`, `lg`, `xl`) and adjust where needed.

## 3. Styling and Theming

### 3.1 Styling Approach
- **Utility-First CSS:** Tailwind CSS v4 lets us compose styles directly in class names for speed and consistency.
- **Component Tokens:** We wrap Tailwind classes in UI components (`<Button>`, `<Card>`) so that consumers never directly write raw classes.

### 3.2 Theming
- **Light & Dark Mode:** Configured via Tailwind’s `darkMode: 'class'`. A `ThemeContext` toggles a `dark` class on `<html>`.
- **CSS Variables:** Define primary/secondary colors at root for easy overrides in dark mode.

### 3.3 Visual Style
- **Style:** Flat, modern design—clean edges, minimal shadows, bold typography.
- **Glassmorphism Accents:** Subtle frosted-glass panels for modals (e.g., payment dialog).

### 3.4 Color Palette
- Primary: `#3B82F6` (blue-500)
- Secondary: `#F59E0B` (amber-500)
- Accent: `#EF4444` (red-500)
- Background Light: `#F9FAFB`
- Background Dark: `#111827`
- Surface (Cards, Modals): `#FFFFFF` / `#1F2937`
- Text Primary: `#111827` / `#F9FAFB`
- Error: `#DC2626`

### 3.5 Typography
- **Font Family:** Inter, sans-serif (imported via Google Fonts).
- **Headings:** 700 weight, `1.25rem`–`2rem`.
- **Body Text:** 400 weight, `1rem`.

## 4. Component Structure

### 4.1 Organization
- `components/ui/`: Base elements (Button, Input, Card, Table).
- `components/layout/`: App Shell, Sidebar, Navbar, Footer.
- `app/`: Route folders, each with its own page, layout, and nested components.

### 4.2 Reusability
- **Atomic Components:** Keep components small and focused (e.g., `<Badge>`, `<Avatar>`).
- **Composite Components:** Build complex UIs by composing smaller atoms (e.g., `<OrderCart>` uses `<CartItem>`, `<Button>`).
- **Props & Slots:** Use well-typed props to allow customization (e.g., color variants, sizes).

### 4.3 Benefits
- **Maintainability:** Changes in one UI component (like `<Button>`) propagate everywhere.
- **Consistency:** Shared look and feel across POS, Admin, and Stakeholder views.

## 5. State Management

### 5.1 Local State
- **React Hooks (`useState`, `useReducer`):** Manage ephemeral UI state (cart items, form inputs).

### 5.2 Global State
- **React Context API:** Share theme and authentication status across the app.
- **Server Actions & Data Fetching:** Business data (orders, services) is managed on the server. Client invalidates caches via built-in Next.js data-fetching utilities.

### 5.3 Why This Approach
- Reduces bundle size by not including a heavy state library.
- Keeps critical business data on the server for security and consistency.

## 6. Routing and Navigation

### 6.1 Routing with App Router
- **File-based Routing:** Each folder under `app/` corresponds to a route segment.
- **Layouts:** Shared layouts (`app/layout.tsx`) wrap pages with persistent UI (sidebar, top bar).

### 6.2 Role-Based Navigation
- **Sidebar Links:** Dynamically rendered based on the user’s role (Cashier, Admin, Stakeholder) read from session.
- **Middleware:** `middleware.ts` inspects every request, redirects unauthorized users to `/api/auth/signin`.

### 6.3 Link Components
- Use Next.js `<Link>` for internal navigation to enable prefetching and client-side transitions.

## 7. Performance Optimization

### 7.1 Code Splitting & Lazy Loading
- Dynamic imports (`next/dynamic`) for heavy components (charts, data tables) load only when needed.

### 7.2 Asset Optimization
- **SVG Icons:** Imported as React components, then tree-shaken.
- **Image Optimization:** Use Next.js `<Image>` for responsive, optimized image delivery.

### 7.3 Tailwind Purge
- Automatically removes unused CSS classes in production builds, keeping CSS footprint minimal.

### 7.4 Build Caching
- Turbopack caches dependencies and compiled modules for near-instant rebuilds.

## 8. Testing and Quality Assurance

### 8.1 Unit Testing
- **Vitest + Testing Library:** Test individual components and utility functions (e.g., commission calculators).

### 8.2 Integration Testing
- **React Testing Library:** Render pages with context providers, simulate user flows (adding items, checkout).

### 8.3 End-to-End Testing
- **Playwright:** Automate key user journeys—Cashier checkout, Admin CRUD flows, Stakeholder dashboard viewing.

### 8.4 Linting & Formatting
- **ESLint (with TypeScript plugin):** Enforce code style and catch errors early.
- **Prettier:** Auto-format code on save/commit.

### 8.5 Continuous Integration
- Run tests and linters on every pull request via GitHub Actions to ensure code quality before merging.

## 9. Conclusion and Overall Frontend Summary

This Frontend Guideline Document captures how our Barbershop POS is structured, from the foundation (Next.js, TypeScript, Tailwind) to the detailed UI components and testing processes. By following these guidelines, the team can:
- Build new features quickly using modular routes and reusable components.
- Maintain a consistent and accessible user experience across all roles.
- Ensure performance remains high with code splitting, optimized assets, and Turbopack.
- Keep code quality top-notch through automated tests, linting, and CI.

Together, these practices align with our project goals of scalability, maintainability, and a delightful user experience for Cashiers, Admins, and Stakeholders alike.