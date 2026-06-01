import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

function createClient() {
  const databaseUrl = process.env.DATABASE_URL;

  // Validate that DATABASE_URL uses a pooled connection for serverless environments.
  // Pooled connections prevent connection exhaustion on cold starts.
  if (databaseUrl) {
    const hasPooledConnection =
      databaseUrl.includes("-pooler") || // Neon pooler
      databaseUrl.includes(":6543"); // Supabase pooled port

    if (!hasPooledConnection) {
      console.warn(
        "[prisma] WARNING: DATABASE_URL does not appear to use a pooled connection. " +
          "Serverless environments (Vercel, etc.) may exhaust connections on cold starts. " +
          "Consider using Neon (-pooler suffix) or Supabase port 6543 instead of 5432."
      );
    }
  } else {
    throw new Error("[prisma] DATABASE_URL environment variable is not set");
  }

  const pool = new Pool({ connectionString: databaseUrl });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
