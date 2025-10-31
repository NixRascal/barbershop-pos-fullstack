import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db"; // your drizzle instance
import { account, session, user, verification } from "@/db/schema/auth";
import { userRole } from "@/db/schema/auth";

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg", // or "mysql", "sqlite"
        schema: {
            user: user,
            account: account,
            session: session,
            verification: verification,
        }
    }),
    emailAndPassword: {
        enabled: true,
    },
    session: {
        expiresIn: 60 * 60 * 24 * 7, // 7 days
        updateAge: 60 * 60 * 24, // 1 day
        cookieCache: {
            enabled: true,
            maxAge: 5 * 60, // 5 minutes
        }
    },
    account: {
        accountLinking: {
            enabled: false,
        },
    },
    user: {
        additionalFields: {
            role: {
                type: "string",
                required: true,
                defaultValue: userRole.CASHIER,
                input: false,
            },
            phone: {
                type: "string",
                required: false,
                input: true,
            },
            isActive: {
                type: "boolean",
                required: true,
                defaultValue: true,
                input: false,
            },
        },
    },
    authRoutes: {
        signIn: "/sign-in",
        signUp: "/sign-up",
        signOut: "/sign-out",
    },
});