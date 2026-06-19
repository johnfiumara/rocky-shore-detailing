import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

function createClient() {
  // Vercel's Supabase/Neon Marketplace integrations inject POSTGRES_PRISMA_URL
  // (Prisma-tuned pooled URL) and POSTGRES_URL. Prefer those when present so
  // the integration is the single source of truth; fall back to DATABASE_URL
  // for local dev and non-Vercel deploys.
  const databaseUrl =
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error(
      "[prisma] No database URL set (checked POSTGRES_PRISMA_URL, POSTGRES_URL, DATABASE_URL)"
    );
  }

  // Pooled-connection check: integration-supplied URLs are pre-pooled, so we
  // only nag when a user-set DATABASE_URL points at a direct connection.
  const hasPooledConnection =
    databaseUrl.includes("-pooler") || // Neon pooler
    databaseUrl.includes(".pooler.") || // Supabase pooler host
    databaseUrl.includes(":6543") || // Supabase pooled port
    databaseUrl.includes("pgbouncer=true"); // Explicit pgbouncer flag

  if (!hasPooledConnection) {
    console.warn(
      "[prisma] WARNING: database URL does not appear to use a pooled connection. " +
        "Serverless environments (Vercel, etc.) may exhaust connections on cold starts. " +
        "Use Neon (-pooler suffix) or Supabase pooler/port 6543 instead of 5432."
    );
  }

  const pool = new Pool({ connectionString: databaseUrl });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// Use a Proxy to lazily initialize the Prisma client only when it is actually accessed.
// This prevents build-time failures when DATABASE_URL is not set but code is being compiled or statically analyzed.
export const prisma = new Proxy<PrismaClient>({} as PrismaClient, {
  get(_target, prop) {
    if (!globalForPrisma.prisma) {
      globalForPrisma.prisma = createClient();
    }
    // Retrieve property from the real client, using the real client as receiver to avoid Proxy-related 'this' binding issues.
    const value = Reflect.get(globalForPrisma.prisma, prop, globalForPrisma.prisma);
    if (typeof value === "function") {
      return value.bind(globalForPrisma.prisma);
    }
    return value;
  },
});
